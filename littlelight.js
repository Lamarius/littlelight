/*
  A bot for my Destiny 2 discord server
 */

// Import modules
var Discord = require('discord.js');
var schedule = require('node-schedule-tz');
var bungienetplatform = require('./bungienetplatformapihelper.js');
var help = require('./help.js');
var config = require('./config.js');

// Create an instance of a Discord client
var client = new Discord.Client();

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
  console.log('Little-light ready to fight!');
  var xurRecurrenceRule = new schedule.RecurrenceRule();
  xurRecurrenceRule.dayOfWeek = 5;
  xurRecurrenceRule.hour = 9;
  xurRecurrenceRule.minute = 0;
  xurRecurrenceRule.tz = 'America/Chicago' // Central time

  // Annouce Xur every Friday at 9 am Central
  // TODO: Re-enable when there is a suitable way to find Xur's location and wares again
  // var xurSchedule = schedule.scheduleJob(xurRecurrenceRule, () => {
  //   sendMessage(client.channels.find('id', '358655605084258304'), '@here Xur is up! You can find him at https://xur.party/');
  // });

  // Check every 2 hours to see if the game has updated
  var updateSchedule = schedule.scheduleJob('0 */2 * * *', () => {
    bungienetplatform.newUpdate(result => {
      if (result !== null) {
        sendMessage(client.channels.find('id', '358655605084258304'), result.content, result.embed);
      }
    });
  });

  // Set bot to show help command
  client.user.setGame('!ll help');
});

// Create an event listener for messages
client.on('message', message => {
  var rgx = /^(!ll)\s*(.*)/g;
  var match = rgx.exec(message.content);
  var channel = message.channel;

  if (match && match.length > 1 ) {
    var params = match[2].split(/\s+/g);
    if (params[0] === 'clan') {
      // Clan commands
      if (params[1] === 'rewards') {
        // Get clan weekly reward progress
        bungienetplatform.clanRewardProgress(result => {
          sendMessage(channel, result);
        });
      } else if (params[1] === 'leaderboards') {
        // Get clan leaderboards (currently unavailable)
        bungienetplatform.clanLeaderboards(result => {
          sendMessage(channel, result);
        });
      } else if (params[1] === 'stats') {
        // Get clan aggregate stats (beta)
        bungienetplatform.clanStats(result => {
          sendMessage(channel, result);
        });
      }
    } else if (params[0] === 'events') {
      // Get currently active events
      bungienetplatform.events(result => {
        sendMessage(channel, result);
      });
    } else if (params[0] === 'ep') {
      bungienetplatform.escalationProtocol().then(result => {
        sendMessage(channel, result.embed);
      });
    } else if (params[0] === 'updates') {
      // Send link to https://www.bungie.net/en/News/Index?tag=news-updates
      sendMessage(channel, "Updates can be found at https://www.bungie.net/en/News/Index?tag=news-updates");
    } else if (params[0] === 'help') {
      // Get help
      sendMessage(channel, help.getHelp(params[1]));
    } else if (params[0] === 'xur') {
      // Get xur's last/current location
      bungienetplatform.xur(false, result => {
        sendMessage(channel, result);
      });
    }
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
client.login(config.token);