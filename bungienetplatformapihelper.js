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
const destinyActivityModeTypes = {
  0: "None",
  2: "Story",
  3: "Strike",
  4: "Raid",
  5: "All PvP",
  6: "Patrol",
  7: "All PvE",
  10: "Control",
  12: "Clash",
  15: "Crimson Doubles",
  16: "Nightfall",
  17: "Heroic Nightfall",
  18: "All Strikes",
  19: "Iron Banner",
  25: "All Mayhem",
  31: "Supremacy",
  32: "All Private Matches",
  37: "Survival",
  38: "Countdown",
  39: "Trials of the Nine",
  40: "Social",
  41: "Trials Countdown",
  42: "Trials Survival",
  43: "Iron Banner Control",
  44: "Iron Banner Clash",
  45: "Iron Banner Supremacy",
  46: "Scored Nightfall",
  47: "Scored Heroic Nightfall",
  48: "Rumble",
  49: "All Doubles",
  50: "Doubles",
  51: "Private Matches Clash",
  52: "Private Matches Control",
  53: "Private Matches Supremacy",
  54: "Private Matches Countdown",
  55: "Private Matches Survival",
  56: "Private Matches Mayhem",
  57: "Private Matches Rumble",
  58: "Heroic Adventure",
  59: "Showdown",
  60: "Lockdown",
  61: "Scorched",
  62: "Team Scorched"
};

var currentVersion = '';

module.exports = {
  clanLeaderboards: callback => {
    apiClanLeaderboardCall(result => {
      return callback(result);
    });
  },

  clanRewardProgress: callback => {
    apiClanWeeklyRewardStateCall(result => {
      var embed = new Discord.RichEmbed()
        .setTitle("Clan Weekly Reward Progress")
        .setDescription("Rewards earned by clan activity.")
        .setColor(3447003);

      result.milestone.forEach(entry => {
        var identifier = result.definition[entry.rewardEntryHash].rewardEntryIdentifier === 'pvp' ? "PvP"
                       : result.definition[entry.rewardEntryHash].rewardEntryIdentifier.replace(/^\w/, c => c.toUpperCase());

        var earnedStatus = (entry.earned ? ":ballot_box_with_check: " : ":x: ")
                         + result.definition[entry.rewardEntryHash].displayProperties.description;

        embed.addField(identifier, earnedStatus);
      });
      
      return callback({embed: embed});
    });
  },

  clanStats: callback => {
    apiAggregateClanStatsCall(response => {
      if (response.ErrorCode !== 1) {
        return callback(response.Message);
      }

      if (response.Response.length === 0) {
        return callback("Unable to find clan stats.");
      }

      var stats = {};
      response.Response.forEach(stat => {
        if (stats[stat.mode] === undefined) stats[stat.mode] = {};
        stats[stat.mode][stat.statId] = stat.value.basic.displayValue; 
      });

      var embed = new Discord.RichEmbed()
        .setTitle("Clan stats (beta)")
        .setDescription("This api callback is currently in beta, so some weird stuff might happen.")
        .setColor(3447003);
      for (var gamemodeId in stats) {
        var gamemode = destinyActivityModeTypes[gamemodeId];
        var message = "";
        for (var statId in stats[gamemodeId]) {
          message += statId.replace(/^lb/g, "").replace(/([A-Z])/g, " $1").trim() + ": " + stats[gamemodeId][statId] + "\n";
        }

        embed.addField(gamemode, message);
      }
      return callback({embed: embed});
    });
  },

  events: callback => {
    apiEventsCall(result => {
      if (result.length === 0) {
        return callback("There are currently no events active (to my knowledge).");
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
                  .setURL(description[2]);
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
        if (currentVersion === '' || currentVersion === update.identifier) {
          currentVersion = update.identifier;
          return callback(null);
        } else if (currentVersion !== update.identifier) {
          currentVersion = update.identifier;
          apiUpdateDetailsCall(update.entityType, update.identifier, result => {
            if (typeof result === 'string') {
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

function apiAggregateClanStatsCall(callback) {
  apiCall("/Destiny2/Stats/AggregateClanStats/" + clanId + "/", "GET", response => {
    return callback(response);
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
  });
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