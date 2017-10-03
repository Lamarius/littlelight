/*
  A bot for my Destiny 2 discord server
 */

// Import modules
const Discord = require('discord.js');
const schedule = require('node-schedule-tz');
const bungienetplatform = require('./bungienetplatformapihelper.js');

// Create an instance of a Discord client
const client = new Discord.Client();

// The bot token
const token = 'MzU4NjU4MDI1NjAwNDUwNTYw.DJ7qkg.-sbS4JC2e0rvwsubuKm1bYxdQZA';

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
  console.log('Little-light ready to fight!');
  var rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = 5;
  rule.hour = 9;
  rule.minute = 0;
  rule.tz = 'America/Chicago' // Central time

  var j = schedule.scheduleJob(rule, function() {
    client.channels.find('id', '358655605084258304').send('@here Xur is up! You can find him at https://xur.party/');
  });
});

// Create an event listener for messages
client.on('message', message => {
  // If the message is "test"
  if (message.content === '!ll test') {
    // Get test api call
    bungienetplatform.testCall(function(result) {
      message.channel.send(result);
    });
  } else if (message.content === '!ll clan leaderboards') {
    bungienetplatform.clanleaderboards(function(result) {
      message.channel.send(result);
    })
  }
});

// Log our bot in
client.login(token);