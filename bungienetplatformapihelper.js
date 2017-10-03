/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var https = require('https');
var querystring = require('querystring');

const apiKey = "92c2d53d688d4513830a695b8e2d5393";
const clanId = 1286254

module.exports = {
  getclanstats: function () {

  },

  testCall: function (callback) {
    apiTestCall(function(result) {
      return callback(result);
    });
  }
}

function apiTestCall(callback) {
  var headers = {
    "X-API-Key": apiKey
  };

  var options = {
    host: "www.bungie.net",
    port: 443,
    path: "/d1/platform/Destiny/Manifest/InventoryItem/1274330687/",
    method: "GET",
    headers: headers
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    let body = ""
    res.on('data', function(data) {
      body += data;
    });
    res.on("end", function() {
      body = JSON.parse(body);
      console.log(body.Response.data.inventoryItem.itemName);
      return callback(body.Response.data.inventoryItem.itemName);
    });
  });

  req.end();
  req.on('error', function(err) {
    console.error(e);
  });
}