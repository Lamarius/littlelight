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
  var channel = message.channel;

  if (message.content === '!ll clan rewards') {
    // Get clan weekly reward progress
    bungienetplatform.clanRewardProgress(function(result) {
      sendMessage(channel, {embed: result});
    });
  } else if (message.content === '!ll clan leaderboards') {
    // Get clan leaderboards (currently unavailable)
    bungienetplatform.clanLeaderboards(function(result) {
      sendMessage(channel, result);
    });
  }
});

function sendMessage(channel, content, options) {
  if (!content && !options) {
    console.log('Ignoring empty message.');
    return;
  }
  channel.send(content, options)
    .then(message => message.embeds.length > 0
          ? console.log(`Sent embedded message regarding ${message.embeds[0].title}`)
          : console.log(`Sent message: ${message.content}`));
}

// Log our bot in
client.login(token);