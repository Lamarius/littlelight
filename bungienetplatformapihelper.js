/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

// TODO: turn callbacks to promises

var Discord = require('discord.js');
var https = require('https');
var Parser = require('rss-parser');
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
      if (data.ErrorCode !== 1) {
        return callback(data.Message);
      } else {
        var milestones = data.Response.rewards[0].entries;
        var milestoneHash = data.Response.milestoneHash;
        var rewardCategoryHash = data.Response.rewards[0].rewardCategoryHash;
        apiMilestoneDefinitionCall(milestoneHash, data => {
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
            var earnedStatus = (milestone.earned ? ":white_check_mark: " : ":x: ")
                             + definition.displayProperties.description;

            embed.addField(identifier, earnedStatus);
          });

          return callback({ embed: embed });
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

      return callback({ embed: embed });
    });
  },

  escalationProtocol: () => {
    return new Promise((resolve, reject) => {
      var epInfo = [
        {
          shotgun: true,
          smg: true,
          sniper: true,
          boss: "Naksud, The Famine",
          hint: "Golgoroths more attractive cousin. DPS fight. Weak points on stomach and back. Heals if Cursed Thrall explode in his " +
                "area so be mindful of these spawning and rushing to help it.\nTips of this is to make use of Tethers in the Pool at " +
                "the back (Towards the Portal of the Public Event) and also just to the left of the rock in front of the boss to catch " +
                "the Thrall before they get to him. Also consider launching Grenades / AoE type abilities to prevent them from a clear " +
                "shot at healing the boss or at least weaken them for easy clean up."
        },
        {
          shotgun: true,
          smg: true,
          sniper: true,
          boss: "Bok Litur, Hunger of Xol",
          hint: "Warpriest's biggest fan boy. DPS fight. No added mechanics to him besides he likes to run around a lot. Waves of adds " +
                "come to help distract you. Rinse them and focus the Boss. Using the Spires rock can easily help for cover against this " +
                "one.\nBe aware of 'Battery Acolytes'. These enemies drop orbs of light when they are killed."
        },
        {
          shotgun: true,
          smg: false,
          sniper: false,
          boss: "Nur Abath, Crest of Xol",
          hint: "Shielded Ogre. DPS and Shield mechanic. Adds Spawn (Witches, Knights, Ogres) which can help shield the Ogre making him " +
                "invincible until they are cleared. Good add clearance can help focus more attention on Boss DPS. Methodically going " +
                "from one to the other as a focus can help."
        },
        {
          shotgun: false,
          smg: true,
          sniper: false,
          boss: "Kathok, Roar of Xol",
          hint: "Giant Acolyte. DPS Fight and Shield mechanic. Swords are required to take down his shield which will spawn around the " +
                "area. Make sure to ready your DPS for when the team takes the shield down. Many waves of adds can join the party. Heavy " +
                "weapons and DPS Combos such as Tractor Cannon / Melting point to working in rotation can help level the boss."
        },
        {
          shotgun: false,
          smg: false,
          sniper: true,
          boss: "Damkath, The Mask",
          hint: "Ogre with a nasty Bee Sting on his back. DPS Fight. Mass spawns of Ogres and adds to help distract from the target. " +
                "Weak point is the bulge on his back."
        }
      ];
      var date = new Date();
      var weekStart = new Date(new Date().setDate(date.getDate() - (date.getDay() - 2) % 7));
      var weekEnd = new Date(new Date(weekStart).setDate(weekStart.getDate() + 6));
      var todaysEP = epInfo[Math.floor(weekStart.valueOf() / (1000 * 60 * 60 * 24 * 7)) % 5];

      var embed = new Discord.RichEmbed()
        .setTitle("Escalation Protocol")
        .setDescription(weekStart.toDateString() + " - " + weekEnd.toDateString())
        .setColor(3447003)
        .addField("Boss", todaysEP.boss)
        .addField("Available Drops", (todaysEP.shotgun ? ":white_check_mark:" : ":x:") +
                                     " [IKELOS_SG_v1.0.1](https://db.destinytracker.com/d2/en/items/1887808042-ikelossgv101)\n" +
                                     (todaysEP.smg ? ":white_check_mark:" : ":x:") +
                                     " [IKELOS_SMG_v1.0.1](https://db.destinytracker.com/d2/en/items/1723472487-ikelossmgv101)\n" +
                                     (todaysEP.sniper ? ":white_check_mark:" : ":x:") +
                                     " [IKELOS_SR_v1.0.1](https://db.destinytracker.com/d2/en/items/847450546-ikelossrv101)")
        .addField("Tips", todaysEP.hint);

      resolve({ embed: embed });
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
              callback({ embed: embed });
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

      for (var update of data.Response.results) {
        if (update.entityType === 7) {
          if (currentVersion === '' || currentVersion === update.identifier) {
            currentVersion = update.identifier;
            return callback(null);
          } else {
            currentVersion = update.identifier;
            var details = {
              title: update.displayName,
              tagline: update.tagline,
              date: update.creationDate,
              image: "https://www.bungie.net" + update.image,
              url: "https://www.bungie.net" + update.link
            };
            var embed = makeUpdateEmbed(details);
            return callback({ content: "@here Destiny 2 has just been updated!", embed: embed });
          }
        }
      }
    });
  },

  xur: (newOnly, callback) => {
    var xurQuotes = [
      "The heliosheath is not the only door into the system.",
      "You have fought everything else that entered this realm. Will you fight a planet?.",
      "The dust has commingled, the Nine is forever changed.",
      "There is a door in the woods. It is opening.",
      "Do not be afraid. The Nine wish to be kind to you.",
      "Do not fear me. That is not why I am here.",
      "Do not be alarmed. I know no reason to cause you harm.",
      "The Nine’s eye is still watching.",
      "You will not find the Nine that way, but they will find you.",
      "If you are here, it means the Nine are not done with you yet.",
      "The Nine see your valour.",
      "Do not go looking for the Nine. They will come to you.",
      "They want to know about you. It is an honour.",
      "I am here for a reason. I just… cannot remember it.",
      "I bring a message from the Nine.",
      "I have a message for you from the Nine, but I forget it.",
      "I do mean to explain, but every time I try, I lose the thread.",
      "One day, you will understand, Warlock.",
      "I have explained it the best that I can.",
      "I am trying to give you answers, Warlock. Believe me.",
      "What happens when every cell is dead?.",
      "You made the adaptations necessary to further organic life.",
      "Your cells can be more than cells.",
      "It is my fate to help you. This I know.",
      "I think you have terrible need of my gifts.",
      "These are from the Nine.",
      "The Nine show you these.",
      "I bring gifts of the Nine. Gifts you sorely need.",
      "Perhaps this is why the Nine sent me here.",
      "I come bearing help.",
      "My will is not my own. Is yours?",
      "Yours is a lonely existence.",
      "Is it your will to return?",
      "To do what you say, is to speak in a language of pure meaning.",
      "You face the strongest enemies in the system, and you still live? Interesting.",
      "I returned to the Tower to find it empty.",
      "The Traveler's song echoes on.",
      "I may be here when you return.",
      "If you had died your final death, it would have been the will of the Nine and therefore right. But… I'm glad you didn't.",
      "I hope to be here again.",
      "I cannot promise I will be here when you return… if you return."
    ];

    // getXurFeed().then(data => {
    //   if (!data.items || data.items.length === 0) {
    //     return callback("I was unable to find any information on xur.");
    //   }

    //   var xurInfo = data.items[0];
    //   var xurDate = new Date(xurInfo.pubDate);
    //   var xurContent = xurInfo.content.replace(/(\s|\\n)+/g, ' ');
    //   if (!newOnly || (xurDate.getDate() === new Date().getDate() && xurContent.contains("<ul>"))) {
    //     var quote = xurQuotes[Math.floor(Math.random() * xurQuotes.length)];
    //     var embed = new Discord.RichEmbed()
    //       .setTitle("Xur: " + xurDate.toDateString())
    //       .setDescription(quote)
    //       .setColor(0x2E7AC7)
    //       //.setImage(update.image)
    //       .setURL("https://www.findxur.com");

    //     // Get Xur's location and items (if known)
    //     if (xurContent.includes("<ul>")) {
    //       // Get location description and image. First match gets description, second match gets image url.
    //       var locationPattern = /<p>(Xur is .*)<\/p>\s<a href="([^\s]*)"/;
    //       var locationInfo = locationPattern.exec(xurContent);
    //       embed.addField("Location", "[" + locationInfo[1] + "](" + locationInfo[2] + ")");
    //       // Gets item information. First match gets the item url, second match gets the item name, third match gets the item type.
    //       var items = /(?:(?:<p>)?\s?<li>\s?(?:<p>)?\s?<a href="([^\s]*)">([\w\s-’]*)<\/a>\s([\[\]\w\s]*)\s?(?:<\/p>)?\s?<\/li>)/g;
    //       while ((itemInfo = items.exec(xurContent)) !== null) {
    //         embed.addField(itemInfo[2] + " " + itemInfo[3], "[Item stats](" + itemInfo[1] + ")");
    //       }
    //     } else {
    //       embed.addField("Info unavailable", "Xur's current wares and whereabouts are still unknown");
    //     }
    //     return callback({ embed: embed });
    //   }
    //   return callback(null);
    // });
    // The RSS feed was taken down. Will explore this function again at a later date, maybe when xur starts selling new stuff again.
    var quote = xurQuotes[Math.floor(Math.random() * xurQuotes.length)];
    var embed = new Discord.RichEmbed()
      .setTitle("Xur")
      .setDescription(quote)
      .setColor(0x2E7AC7)
      .setURL("https://www.findxur.com")
      .addField("Info unavailable", "The nine have denied me access to their wares. You'll have to access it manually.");

    return callback({ embed: embed });
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

async function getXurFeed() {
  var parser = new Parser();
  //parser.parseURL('https://discussions.ftw.in/c/destiny/find-xur.rss').then(feed => { return callback(feed); });
  return await parser.parseURL('https://discussions.ftw.in/c/destiny/find-xur.rss')
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