/*
 A helper class for the bungieplatformapi for Destiny 2 api calls
 */

const apiKey = "92c2d53d688d4513830a695b8e2d5393";
const clanId = 1286254

module.exports = {
  getclanstats: function () {

  },

  testCall: function () {
    apiTestCall();
  }
}

function apiTestCall() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "https://www.bungie.net/platform/Destiny/Manifest/InventoryItem/1274330687/", true);
  xhr.setRequestHeader("X-API-Key", apiKey);

  xhr.onreadystatechanged = function() {
    if (this.readyState === 4 && this.status === 200) {
      var json = JSON.parse(this.responseText);
      console.log(json.Response.data.inventoryItem.itemName); // Gjallarhorn
    }
  }

  xhr.send();
}