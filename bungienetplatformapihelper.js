/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

var https = require('https');
var querystring = require('querystring');

const apiKey = "92c2d53d688d4513830a695b8e2d5393";
const clanId = 1286254

module.exports = {
  clanleaderboards: function (callback) {
    apiClanLeaderboardCall(function(result) {
      return callback(result);
    });
  },

  testCall: function (callback) {
    apiTestCall(function(result) {
      return callback(result);
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
  apiCall("/Platform/Destiny2/Stats/Leaderboards/Clans/1286254/", "GET", function(data) {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    return callback("This method isn't ready yet.");
  });
}

function apiTestCall(callback) {
  apiCall("/d1/platform/Destiny/Manifest/InventoryItem/1274330687/", "GET", function(data) {
    if (data.ErrorCode != 1) {
      return callback(data.Message);
    }
    return callback(data.Response.data.inventoryItem.itemName);
  });
}