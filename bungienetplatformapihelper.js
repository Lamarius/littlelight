/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

// TODO: turn callbacks to promises

var Discord = require('discord.js');
var https = require('https');
var querystring = require('querystring');
var util = require('util');

var apiKey = "92c2d53d688d4513830a695b8e2d5393";
var clanId = 1286254

var currentVersion = '';

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

  updates: (numOfUpdates, callback) => {
    if (numOfUpdates < 1) {
      numOfUpdates = null;
    }

    apiUpdatesCall(numOfUpdates, (result) => {
      if (result.length === 0) {
        return callback("There are no updates... wait what? There was a day one update! What the heck!?");
      } else {
        updatesRemaining = result.length;
        updates = [];
        result.forEach((update) => {
          if (typeof update === 'string') {
            updatesRemaining--;
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

  newUpdate: (callback) => {
    apiUpdatesCall(1, (result) => {
      update = result[0];
      if (update.length !== 0 && typeof update !== 'string') {
        if (currentVersion === '' || currentVersion === update.identifier) {
          currentVersion = update.identifier;
          return callback(null);
        } else if (currentVersion !== update.identifier) {
          currentVersion = update.identifier;
          apiUpdateDetailsCall(update.entityType, update.identifier, (result) => {
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
  apiCall("/Destiny2/Stats/Leaderboards/Clans/" + clanId + "/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    return callback("This method isn't ready yet.");
  });
}

function apiClanWeeklyRewardStateCall(callback) {
  var clanMilestone;
  apiCall("/Destiny2/Clan/" + clanId + "/WeeklyRewardState/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    clanMilestone = data.Response;
    var definition;
    apiCall("/Destiny2/Manifest/DestinyMilestoneDefinition/" + clanMilestone.milestoneHash + "/", "GET", (data) => {
      if (data.ErrorCode != 1) {
        return callback(data.Message);
      }
      definition = data.Response;
      return callback({milestone: clanMilestone.rewards[0].entries, definition: definition.rewards[clanMilestone.rewards[0].rewardCategoryHash].rewardEntries});
    });
  });
}

function apiEventsCall(callback) {
  apiCall("/Trending/Categories/LiveEvents/0/", "GET", (data) => {
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
  apiCall("/Trending/Details/" + type + "/" + id + "/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      return callback(data.Response.destinyRitual);
    }
  })
}

function apiUpdatesCall(numOfUpdates, callback) {
  apiCall("/Trending/Categories/Updates/0/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      var results = data.Response.results;
      var length = data.Response.results.length
      var updates = [];

      if (numOfUpdates && !isNaN(numOfUpdates)) {
        for (i = 0; i < numOfUpdates; i++) {
          if (results[i].displayName.includes("Destiny 2")) {
            updates.push(results[i]);
          } else {
            break;
          }
        }
        return callback(updates);
      } else {
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
  apiCall("/Trending/Details/" + type + "/" + id + "/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      return callback(data.Response.news.article);
    }
  });
}

function getEmbedFromHTML(update) {
  // This was fun... No, really, it was *suuuuper* fun...
  // We're removing all tags we don't care about, reformatting some of the tags that screw us up 
  // later, replacing ampersand code with the actual characters, and splitting the content up by
  // <big> tags to get all of the fields
  var fields = update.content
    .replace(/<span.*?>/g, "<big>")
    .replace(/<\/span>/g, "</big>")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s<\/i>/g, "</i> ")
    .replace(/>\s</g, "><")
    .replace(/<\/?blockquote.*?>|<\/?div.*?>|<big>(<b><br><\/b>|<br>)<\/big>|<\/?span.*?>|<br>|<\/big><\/b><b><big>|<a.*?>|<\/a>/g, "")
    .split("<big>");

  var embed = new Discord.RichEmbed()
    .setTitle(fields[0].replace(/<\/?.*?>/g, ""))
    .setColor(3447003)
    .setImage(update.image)
    .setURL(update.url);

  // Basically doing the same thing we did initially, but on a per field basis
  for (i = 1; i < fields.length; i++) {
    var field = fields[i].split("</big>");
    var title = field[0].replace(/<\/?.*?>/g, "");
    var value = "";
    if (field.length === 1) console.log(fields);
    var bulletPoints = field[1].replace(/<b><\/b>|^<\/b>|<b>$|<\/li>/g, "").split("<li>");
    var indentLength = -1;

    bulletPoints.forEach((bulletPoint) => {
      if (bulletPoint.endsWith("<ul>")) {
        indentLength++;
      } else if (bulletPoint.endsWith("</ul>")) {
        indentLength--;
      }

      bulletPoint = bulletPoint.replace(/<\/?ul>/g, "").replace(/<\/?i>/g, "*").replace(/<\/?b>/g, "**");

      if (bulletPoint.length === 0) {
        // Sometimes, after formatting, we get an empty bullet point, so just ignore it
        return;
      } else if (bulletPoint.startsWith("***")) {
        // Sometimes our bullet point's subheaders are bolded and italicized instead of starting 
        // with a bullet, so we do that instead
        value += bulletPoint + "\n";
      } else if (bulletPoint.endsWith("***")) {
        // Sometimes, when the next subheader is bolded and italicized, it ends up on the end of the
        // previous bullet point instead of being its own bullet point, let's fix that
        bulletPoint = bulletPoint.split("***");
        value += "•  " + bulletPoint[0] + "\n***" + bulletPoint[1] + "***" + "\n";
        indentLength--;
      } else {
        // Most of the time it's this
        value += "•  " + bulletPoint + "\n";
      }

      // Add a tab for each level the patch notes are indented
      for (j = 0; j < indentLength; j++) {
        value += "\t";
      }
    });

    // Embed field values will begin with an empty bullet point and end with a new line, trim those
    value = value.replace(/(^•\s\s\/n|\/n$)/g, "");
    embed.addField(title, value);
  }

  return embed;
}