/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

const https = require('https');
const querystring = require('querystring');
const util = require('util');

const apiKey = "92c2d53d688d4513830a695b8e2d5393";
const clanId = 1286254

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
    apiPublicMilestonesCall((result) => {
      console.log(util.inspect(result, false, null));
      for (var milestone in result) {
        if (result.hasOwnProperty(milestone)) {
          apiPublicMilestoneContentCall(milestone, (result) => {
            // 3205009061: milestoneHash of first faction rally, might be same hash for later rallies
            if (result && result.about.includes('Faction Rally')) {
              var endOfDesc = result.about.indexOf('<');
              var description = result.about.substring(0, endOfDesc !== -1 ? endOfDesc : result.about.length);
              var embed = {
                color: 3447003,
                title: "Faction Rallies Are Live!",
                url: "https://www.bungie.net/en/Help/Article/46312",
                description: description,
                fields: [{
                  name: "Tips",
                  value: result.tips.join('\n')
                }]
              };
              return callback({embed: embed});
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

function apiPublicMilestonesCall(callback) {
  apiCall("/Platform/Destiny2/Milestones/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    return callback(data.Response);
  });
}

function apiPublicMilestoneContentCall(milestone, callback) {
  apiCall("/Platform/Destiny2/Milestones/" + milestone + "/Content/", "GET", (data) => {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    if (data.Response) {
      console.log(milestone + ": " + data.Response.about);
    } else {
      console.log(milestone + ": " + undefined);
    }
    return callback(data.Response);
  });
}