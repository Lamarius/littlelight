/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

// TODO: turn callbacks to promises

var Discord = require('discord.js');
var https = require('https');
var querystring = require('querystring');
var util = require('util');
var config = require('./config.js');

var apiKey = config.apiKey;
var clanId = config.clanId;

var currentVersion = '';

module.exports = {
  clanLeaderboards: callback => {
    apiClanLeaderboardCall(result => {
      return callback(result);
    });
  },

  clanRewardProgress: callback => {
    apiClanWeeklyRewardStateCall(result => {
      // Format result into a nice little embed
      var nightfall, trials, raid, pvp;
      result.milestone.forEach(entry => {
        if (result.definition[entry.rewardEntryHash].rewardEntryIdentifier === 'nightfall') {
          nightfall = (entry.earned ? ":ballot_box_with_check: " : ":x: ") 
                    + result.definition[entry.rewardEntryHash].displayProperties.description;
        } else if (result.definition[entry.rewardEntryHash].rewardEntryIdentifier === 'trials') {
          trials = (entry.earned ? ":ballot_box_with_check: " : ":x: ") 
                 + result.definition[entry.rewardEntryHash].displayProperties.description;
        } else if (result.definition[entry.rewardEntryHash].rewardEntryIdentifier === 'raid') {
          raid = (entry.earned ? ":ballot_box_with_check: " : ":x: ") 
               + result.definition[entry.rewardEntryHash].displayProperties.description;
        } else if (result.definition[entry.rewardEntryHash].rewardEntryIdentifier === 'pvp') {
          pvp = (entry.earned ? ":ballot_box_with_check: " : ":x: ") 
              + result.definition[entry.rewardEntryHash].displayProperties.description;
        }
      });

      var embed = {
        color: 3447003,
        title: "Clan Weekly Reward Progress",
        description: "Rewards earned by clan activity.",
        fields: [{
          name: "Nightfall",
          value: nightfall
        },
        {
          name: "Trials",
          value: trials
        },
        {
          name: "Raid",
          value: raid
        },
        {
          name: "PvP",
          value: pvp
        }]
      };
      return callback({embed: embed});
    });
  },

  events: callback => {
    apiEventsCall(result => {
      if (result.length === 0) {
        return callback("There are currently no events active (to my knowledge)");
      } else {
        result.forEach(event => {
          if (typeof event === 'string') {
            callback(event);
          } else {
            var img = "https://www.bungie.net" + event.image;
            apiEventDetailsCall(event.type, event.id, result => {
              var re = new RegExp('(.*?)<.*<a href="(.*?)"');
              var description = re.exec(result.eventContent.about);
              var embed = new Discord.RichEmbed()
                .setTitle(result.title)
                .setColor(3447003)
                .setThumbnail(img)
                .addField("Tips", result.eventContent.tips.join('\n\n'));
              if (description) {
                embed.setDescription(description[1] ? description[1] : description[0])
                     .setURL(description[2])
              } else {
                embed.setDescription(result.eventContent.about);
              }
              callback({embed: embed});
            });
          }
        });
      }
    });
  },

  newUpdate: callback => {
    apiUpdatesCall(update => {
      if (update.length !== 0 && typeof update !== 'string') {
        if (currentVersion === update.identifier) {
          currentVersion = update.identifier;
          return callback(null);
        } else if (currentVersion !== update.identifier) {
          currentVersion = update.identifier;
          apiUpdateDetailsCall(update.entityType, update.identifier, result => {
            if (typeof result === 'string') {
              console.log(result);
              return callback(null);
            } else {
              var details = {
                date: result.creationDate,
                content: result.properties.Content,
                image: "https://www.bungie.net" + result.properties.FrontPageBanner,
                url: "https://www.bungie.net" + update.link
              };
              var embed = getEmbedFromHTML(details);
              return callback({content: "@here Destiny 2 has just been updated!", embed: embed});
            }            
          });
        }
      }
    });
  }
}

function apiCall(path, method, callback) {
  var headers = {
    "X-API-Key": apiKey
  };

  var options = {
    host: "www.bungie.net",
    port: 443,
    path: "/Platform" + path,
    method: method,
    headers: headers
  }

  var req = https.request(options, res => {
    res.setEncoding('utf8');
    let body = "";

    res.on('data', data => {
      body += data;
    });

    res.on('end', () => {
      body = JSON.parse(body);
      return callback(body);
    });
  });

  req.end();
  req.on('error', err => {
    return callback(err);
  });
}

function apiClanLeaderboardCall(callback) {
  apiCall("/Destiny2/Stats/Leaderboards/Clans/" + clanId + "/", "GET", data => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    return callback("This method isn't ready yet.");
  });
}

function apiClanWeeklyRewardStateCall(callback) {
  var clanMilestone;
  apiCall("/Destiny2/Clan/" + clanId + "/WeeklyRewardState/", "GET", data => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    clanMilestone = data.Response;
    var definition;
    apiCall("/Destiny2/Manifest/DestinyMilestoneDefinition/" + clanMilestone.milestoneHash + "/", "GET", data => {
      if (data.ErrorCode != 1) {
        return callback(data.Message);
      }
      definition = data.Response;
      return callback({milestone: clanMilestone.rewards[0].entries, definition: definition.rewards[clanMilestone.rewards[0].rewardCategoryHash].rewardEntries});
    });
  });
}

// TODO: Implement the "Celebrate with [faction]" events, a sample is as follows:
// {
//   "Response": {
//     "identifier": "364880304",
//     "entityType": 3,
//     "destinyRitual": {
//       "image": "/img/destiny_content/pgcr/conceptual_faction_rally.jpg",
//       "title": "Celebrate with New Monarchy",
//       "subtitle": "To celebrate, New Monarchy offers Guardians a Legendary Weapon.",
//       "dateStart": "2017-11-14T09:00:00Z",
//       "dateEnd": "2017-11-21T09:00:00Z",
//       "milestoneDetails": {
//         "milestoneHash": 364880304,
//         "availableQuests": [
//           {
//             "questItemHash": 1433383514
//           }
//         ],
//         "vendorHashes": [
//           3819664660
//         ],
//         "vendors": [
//           {
//             "vendorHash": 3819664660,
//             "previewItemHash": 2276266837
//           }
//         ],
//         "startDate": "2017-11-14T09:00:00Z",
//         "endDate": "2017-11-21T09:00:00Z"
//       }
//     }
//   },
//   "ErrorCode": 1,
//   "ThrottleSeconds": 0,
//   "ErrorStatus": "Success",
//   "Message": "Ok",
//   "MessageData": {}
// }
function apiEventsCall(callback) {
  apiCall("/Trending/Categories/LiveEvents/0/", "GET", data => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      events = [];
      data.Response.results.forEach(event => {
        if (event.displayName.indexOf("Iron Banner") === 0 || 
            event.displayName.indexOf("Faction Rally") === 0 ||
            event.displayName.indexOf("Clarion Call") === 0) {
          events.push({type: event.entityType, id: event.identifier, image: event.image});
        }
      });
      return callback(events);
    }
  });
}

function apiEventDetailsCall(type, id, callback) {
  apiCall("/Trending/Details/" + type + "/" + id + "/", "GET", data => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      return callback(data.Response.destinyRitual);
    }
  })
}

function apiUpdatesCall(callback) {
  apiCall("/Trending/Categories/Updates/0/", "GET", data => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      var results = data.Response.results;
      var length = data.Response.results.length
      var update;

      for (i = 0; i < length; i++) {
        if (results[i].displayName.includes("Destiny 2")) {
          update = results[i];
          break;
        }
      }

      return callback(update);
    }
  });
}

function apiUpdateDetailsCall(type, id, callback) {
  apiCall("/Trending/Details/" + type + "/" + id + "/", "GET", data => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      return callback(data.Response.news.article);
    }
  });
}

function getEmbedFromHTML(update) {
  // Create an embed with a link to the update's bungie.net article
  var embed = new Discord.RichEmbed()
    .setTitle(update.title ? update.title : "Destiny 2 update.")
    .setColor(3447003)
    .setImage(update.image)
    .setURL(update.url)
    .addField("Destiny 2 has been updated!", "Visit the link for more details.");
  return embed;
}