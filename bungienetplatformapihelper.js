/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

var https = require('https');
var querystring = require('querystring');

const apiKey = "92c2d53d688d4513830a695b8e2d5393";
const clanId = 1286254

module.exports = {
  clanLeaderboards: function (callback) {
    apiClanLeaderboardCall(function(result) {
      return callback(result);
    });
  },

  clanRewardProgress: function (callback) {
    apiClanWeeklyRewardStateCall(function(result) {
      // Format result into a nice little embed
      var nightfall, trials, raid, pvp;
      result.milestone.forEach(function(entry) {
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

      var embed = {};
      embed.color = 3447003;
      embed.title = "Clan Weekly Reward Progress";
      embed.description = "Rewards earned by clan activity.";
      embed.fields = [{
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
      }];
      return callback(embed);
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

  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    let body = "";

    res.on('data', function(data) {
      body += data;
    });

    res.on('end', function() {
      body = JSON.parse(body);
      return callback(body);
    });
  });

  req.end();
  req.on('error', function(err) {
    return callback(err);
  });
}

function apiClanLeaderboardCall(callback) {
  apiCall("/Platform/Destiny2/Stats/Leaderboards/Clans/" + clanId + "/", "GET", function(data) {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    return callback("This method isn't ready yet.");
  });
}

function apiClanWeeklyRewardStateCall(callback) {
  var clanMilestone;
  apiCall("/Platform/Destiny2/Clan/" + clanId + "/WeeklyRewardState/", "GET", function(data) {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    clanMilestone = data.Response;
    var definition;
    apiCall("/Platform/Destiny2/Manifest/DestinyMilestoneDefinition/" + clanMilestone.milestoneHash + "/", "GET", function(data) {
      if (data.ErrorCode != 1) {
        return callback(data.Message);
      }
      definition = data.Response;
      return callback({milestone: clanMilestone.rewards[0].entries, definition: definition.rewards[clanMilestone.rewards[0].rewardCategoryHash].rewardEntries});
    });
  });
}