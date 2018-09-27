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
    apiClanLeaderboardCall(data => {
      if (data.ErrorCode !== 1) {
        return callback(data.Message);
      }

      return callback("This method isn't ready yet.");
    });
  },

  clanRewardProgress: callback => {
    apiClanWeeklyRewardStateCall(data => {
      console.log(data);
      if (data.ErrorCode !== 1) {
        return callback(data.Message);
      } else {
        var milestones = data.Response.rewards[0].entries;
        var milestoneHash = data.Response.milestoneHash;
        var rewardCategoryHash = data.Response.rewards[0].rewardCategoryHash;
        apiMilestoneDefinitionCall(milestoneHash, data => {
          console.log(data);
          if (data.ErrorCode !== 1) {
            return callback(data.Message);
          }

          var definitions = data.Response.rewards[rewardCategoryHash].rewardEntries;
          var embed = new Discord.RichEmbed()
            .setTitle("Clan Weekly Reward Progress")
            .setDescription("Rewards earned by clan activity.")
            .setColor(3447003);

          milestones.forEach(milestone => {
            var definition = definitions[milestone.rewardEntryHash];
            var identifier = definition.rewardEntryIdentifier === "pvp" ? "PvP"
                           : definition.rewardEntryIdentifier.replace(/^\w/, c => c.toUpperCase());
            var earnedStatus = (milestone.earned ? ":ballot_box_with_check: " : ":x: ")
                             + definition.displayProperties.description;

            embed.addField(identifier, earnedStatus);
          });

          return callback({embed: embed});
        });
      }
    });
  },

  clanStats: callback => {
    apiAggregateClanStatsCall(data => {
      if (data.ErrorCode !== 1) {
        return callback(data.Message);
      }

      if (data.Response.length === 0) {
        return callback("Unable to find clan stats.");
      }

      var stats = {};
      data.Response.forEach(stat => {
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
          message += statId.replace(/^lb/g, "").replace(/([A-Z])/g, " $1").trim() + ": "
                  + stats[gamemodeId][statId] + "\n";
        }

        embed.addField(gamemode, message);
      }

      return callback({embed: embed});
    });
  },

  events: callback => {
    apiEventsCall(data => {
      if (data.length === 0) {
        return callback("There are currently no events active (to my knowledge).");
      } else {
        data.forEach(event => {
          if (typeof event === 'string') {
            callback(event);
          } else {
            var img = "https://www.bungie.net" + event.image;
            apiEventDetailsCall(event.type, event.id, data => {
              var re = new RegExp('(.*?)<.*<a href="(.*?)"');
              var description = re.exec(data.eventContent.about);
              var embed = new Discord.RichEmbed()
                .setTitle(data.title)
                .setColor(3447003)
                .setThumbnail(img)
                .addField("Tips", data.eventContent.tips.join('\n\n'));
              if (description) {
                embed.setDescription(description[1] ? description[1] : description[0])
                  .setURL(description[2]);
              } else {
                embed.setDescription(data.eventContent.about);
              }
              callback({embed: embed});
            });
          }
        });
      }
    });
  },

  newUpdate: callback => {
    var noUpdates = "Huh, I wasn't able to find any updates. Something's not right...";
    apiUpdatesCall(data => {
      if (data.ErrorCode !== 1) {
        return callback(data.Message);
      } else if (!data.Response.results || data.Response.results.length === 0) {
        return callback(noUpdates);
      }

      var updates = data.Response.results;
      var numOfUpdates = updates.length;
      var update;

      for (var i = 0; i < numOfUpdates; i++) {
        // Update type: 7
        //if (updates[i].displayName.includes("Destiny 2")) {
        if (updates[i].entityType === 7) {
          update = updates[i];
          break;
        }

        // No update found (wow!)
        if (i === numOfUpdates) {
          return callback(noUpdates);
        }
      }

      // Check against current version. If bot reset, assume no update happened.
      if (currentVersion === '' || currentVersion === update.identifier) {
        currentVersion = update.identifier;
        return callback(null);
      } else {
        currentVersion = update.identifier;
        apiUpdateDetailsCall(update.entityType, update.identifier, data => {
          if (data.ErrorCode !== 1) {
            return callback(data.Message);
          } else {
            var article = data.Response.news.article;
            var details = {
              title: update.displayName,
              tagline: update.tagline,
              date: article.creationDate,
              content: article.properties.Content,
              image: "https://www.bungie.net" + update.image,
              url: "https://www.bungie.net" + update.link
            };
            var embed = makeUpdateEmbed(details);
            return callback({content: "@here Destiny 2 has just been updated!", embed: embed});
          }
        });
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
  apiCall("/Destiny2/Stats/AggregateClanStats/" + clanId + "/", "GET", data => {
    return callback(data);
  });
}

function apiClanLeaderboardCall(callback) {
  apiCall("/Destiny2/Stats/Leaderboards/Clans/" + clanId + "/", "GET", data => {
    return callback(data);
  });
}

function apiClanWeeklyRewardStateCall(callback) {
  apiCall("/Destiny2/Clan/" + clanId + "/WeeklyRewardState/", "GET", data => {
    return callback(data);
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

function apiMilestoneDefinitionCall(milestoneHash, callback) {
  apiCall("/Destiny2/Manifest/DestinyMilestoneDefinition/" + milestoneHash + "/", "GET", data => {
    return callback(data);
  });
}

function apiUpdatesCall(callback) {
  apiCall("/Trending/Categories/Updates/0/", "GET", data => {
    return callback(data);
  });
}

function apiUpdateDetailsCall(type, id, callback) {
  apiCall("/Trending/Details/" + type + "/" + id + "/", "GET", data => {
    return callback(data);
  });
}

function makeUpdateEmbed(update) {
  // Create an embed with a link to the update's bungie.net article
  var embed = new Discord.RichEmbed()
    .setTitle(update.title ? update.title : "Destiny 2 update.")
    .setDescription(update.tagline)
    .setColor(3447003)
    .setImage(update.image)
    .setURL(update.url)
    .addField("Destiny 2 has been updated!", "Visit the link for more details.");
  return embed;
}