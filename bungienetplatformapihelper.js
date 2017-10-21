/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

// TODO: turn callbacks to promises

const Discord = require('discord.js');
const https = require('https');
const querystring = require('querystring');
const util = require('util');

const apiKey = "92c2d53d688d4513830a695b8e2d5393";
const clanId = 1286254
const membershipType = 2;
const myMembershipId = "4611686018428555102";

module.exports = {
  clanLeaderboards: (callback) => {
    apiClanLeaderboardCall((result) => {
      return callback(result);
    });
  },

  clanRewardProgress: (callback) => {
    apiClanWeeklyRewardStateCall((result) => {
      // Format result into a nice little embed
      var nightfall, trials, raid, pvp;
      result.milestone.forEach((entry) => {
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

  events: (callback) => {
    apiEventsCall((result) => {
      if (result.length === 0) {
        return callback("There are currently no events active (to my knowledge)");
      } else {
        result.forEach((event) => {
          if (typeof event === 'string') {
            callback(event);
          } else {
            var img = "https://www.bungie.net" + event.image;
            apiEventDetailsCall(event.type, event.id, (result) => {
              var re = new RegExp('(.*?)<.*<a href="(.*?)"');
              var description = re.exec(result.eventContent.about);
              var embed = new Discord.RichEmbed()
                .setTitle(result.title)
                .setColor(3447003)
                .setThumbnail(img)
                .setDescription(description[1] ? description[1] : description[0])
                .setURL(description[2])
                .addField("Tips", result.eventContent.tips.join('\n\n'));

              callback({embed: embed});
            });
          }
        });
      }
    });
  },

  updates: (callback) => {
    apiUpdatesCall(false, (result) => {
      if (result.length === 0) {
        return callback("There are no updates... wait what? There was a day one update! What the heck!?");
      } else {
        updatesRemaining = result.length;
        updates = [];
        result.forEach((update) => {
          if (typeof update === 'string') {
            callback(event);
          } else {
            apiUpdateDetailsCall(update.entityType, update.identifier, (result) => {
              updates.push({
                date: result.creationDate, 
                content: result.properties.Content, 
                image: "https://www.bungie.net" + result.properties.FrontPageBanner, 
                url: "https://www.bungie.net" + update.link
              });

              updatesRemaining--;
              if (updatesRemaining <= 0) {
                updates.sort((a, b) => {
                  return new Date(b.date) - new Date(a.date);
                });

                updates.forEach((update) => {
                  var embed = getEmbedFromHTML(update);
                  return callback({embed: embed});
                });
              }
            });
          }
        });
      }
    });
  },

  lastUpdate: (callback) => {
    apiUpdatesCall(true, (result) => {

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
    path: path,
    method: method,
    headers: headers
  }

  var req = https.request(options, (res) => {
    res.setEncoding('utf8');
    let body = "";

    res.on('data', (data) => {
      body += data;
    });

    res.on('end', () => {
      body = JSON.parse(body);
      return callback(body);
    });
  });

  req.end();
  req.on('error', (err) => {
    return callback(err);
  });
}

function apiClanLeaderboardCall(callback) {
  apiCall("/Platform/Destiny2/Stats/Leaderboards/Clans/" + clanId + "/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    return callback("This method isn't ready yet.");
  });
}

function apiClanWeeklyRewardStateCall(callback) {
  var clanMilestone;
  apiCall("/Platform/Destiny2/Clan/" + clanId + "/WeeklyRewardState/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    clanMilestone = data.Response;
    var definition;
    apiCall("/Platform/Destiny2/Manifest/DestinyMilestoneDefinition/" + clanMilestone.milestoneHash + "/", "GET", (data) => {
      if (data.ErrorCode != 1) {
        return callback(data.Message);
      }
      definition = data.Response;
      return callback({milestone: clanMilestone.rewards[0].entries, definition: definition.rewards[clanMilestone.rewards[0].rewardCategoryHash].rewardEntries});
    });
  });
}

function apiEventsCall(callback) {
  apiCall("/Platform/Trending/Categories/LiveEvents/0/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      events = [];
      data.Response.results.forEach((event) => {
        if (event.displayName.indexOf("Iron") === 0) {
          events.push({type: event.entityType, id: event.identifier, image: event.image});
        }
      });
      return callback(events);
    }
  });
}

function apiEventDetailsCall(type, id, callback) {
  apiCall("/Platform/Trending/Details/" + type + "/" + id + "/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      return callback(data.Response.destinyRitual);
    }
  })
}

function apiUpdatesCall(onlyLatest, callback) {
  apiCall("/Platform/Trending/Categories/Updates/0/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      if (onlyLatest) {
        return callback(data.Response.results[0]);
      } else {
        var results = data.Response.results;
        var length = data.Response.results.length
        var updates = [];
        for (i = 0; i < length; i++) {
          updates.push(results[i]);
          if (results[i].displayName.indexOf("Update") !== -1) {
            break;
          }
        }
        return callback(updates);
      }
    }
  });
}

function apiUpdateDetailsCall(type, id, callback) {
  apiCall("/Platform/Trending/Details/" + type + "/" + id + "/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      return callback(data.Response.news.article);
    }
  });
}

function getEmbedFromHTML(update) {
  var fields = update.content
    .replace(/<span.*?>/g, "<big>")
    .replace(/<\/span>/g, "</big>")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s<\/i>/g, "</i> ")
    .replace(/>\s</g, "><")
    .replace(/<\/?blockquote.*?>|(<\/?div.*?>|(<big>(<b><br><\/b>|<br>)<\/big>|(<\/?span.*?>|(<br>|<\/big><\/b><b><big>))))/g, "")
    .split("<big>");

  var embed = new Discord.RichEmbed()
    .setTitle(fields[0].replace(/<\/?.*?>/g, ""))
    .setColor(3447003)
    .setImage(update.image)
    .setURL(update.url);

  for (i = 1; i < fields.length; i++) {
    var field = fields[i].split("</big>");
    var title = field[0].replace(/<\/?.*?>/g, "");
    var value = "";
    var values = field[1].replace(/<b><\/b>|(^<\/b>|(<b>$|<\/li>))/g, "").split("<li>");

    var indentLength = -1;
    values.forEach((bulletPoint) => {
      if (bulletPoint.endsWith("<ul>")) {
        indentLength++;
      } else if (bulletPoint.endsWith("</ul>")) {
        indentLength--;
      }

      bulletPoint = bulletPoint.replace(/<\/?ul>/g, "").replace(/<\/?i>/g, "*").replace(/<\/?b>/g, "**");

      if (bulletPoint.length === 0) {
        return;
      } else if (bulletPoint.startsWith("***")) {
        value = value + bulletPoint + "\n";
      } else if (bulletPoint.endsWith("***")) {
        bulletPoint = bulletPoint.split("***");
        value = value + "•  " + bulletPoint[0] + "\n***" + bulletPoint[1] + "***" + "\n";
        indentLength--;
      } else {
        value = value + "•  " + bulletPoint + "\n";
      }

      for (k = 0; k < indentLength; k++) {
        value = value + "\t";
      }
    });

    value = value.replace(/(^•\s\s\/n|\/n$)/g, "");
    embed.addField(title, value);
  }

  return embed;
}