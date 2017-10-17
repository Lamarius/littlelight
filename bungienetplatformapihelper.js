/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

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
            apiEventDetailsCall(event.type, event.id, (result) => {
              var endOfDesc = result.eventContent.about.indexOf('<');
              var description = endOfDesc === -1 ? result.eventContent.about : result.eventContent.about.substring(0, endOfDesc);
              var embed = {
                color: 3447003,
                title: result.title,
                description: description,
                fields: [{
                  name: "Tips",
                  value: result.eventContent.tips.join('\n')
                }]
              }
              callback({embed: embed});
            });
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
          events.push({type: event.entityType, id: event.identifier});
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