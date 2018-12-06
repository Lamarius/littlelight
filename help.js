const Discord = require('discord.js');

module.exports = {
  getHelp: (topic) => {
    var embed = new Discord.RichEmbed().setColor(3447003)
    if (!topic) {
      embed.setTitle("little-light general help")
        .setDescription("I am little-light, and I am this discord's ghost. My purpose is to assist " +
                        "in guiding the guardians who call this discord home. I have a multitude of " +
                        "commands that you may use, and I am programmed to remind guardians of when " +
                        "certain events occur, as well as important changes to our world. If you would " +
                        "like to know more about a specific command, you may type ``!ll help <command>`` " +
                        "and I will do my best to describe it, as well as list any parameters that " +
                        "command requires. My current commands are as follows:")
        .addField("clan", "The clan command allows me to access information regarding your clan. " +
                          "A parameter is required to use this command. Current parameters are " +
                          "``rewards`` and ``leaderboards``. Use ``!ll help clan`` to learn more.")
        .addField("ep", "Rasputin has decided to share information regarding the current escalation " +
                        "protocol. You can use this command to access it, if you so desire.")
        .addField("events", "Using my top level security clearance to the tower's network, I'm able " +
                            "to access... a calendar! By using this command, I can tell you about " +
                            "any events that might be going on, such as 'Iron Banner' or a 'Faction Rally'.")
        .addField("updates", "Thanks to all the scan patrols, I'm able to keep a log of any changes " +
                             "that happen to our world. By using this command, I can relay those " +
                             "change logs back to you. You may type ``!ll help updates`` " +
                             "to learn more.")
        .addField("xur", "My will is not my own... *ahem*, I mean, get information regarding the current " +
                         "wares and whereabouts of this agent of the nine.");
    } else if (topic === 'clan') {
      embed.setTitle("little-light clan help")
        .setDescription("Never talk to Hawthorn again... until she's ready to give you something. " +
                        "The clan command is used to gather intelligence regarding the clan and its " +
                        "members. One of the following parameters is required to use this command:")
        .addField("leaderboards", "**ACCESS DENIED!** I'm sorry, guardian, but I am unable to obtain " +
                                  "any information regarding your clan's leaderboards. (Currently " +
                                  "unimplemented in the Destiny 2 api.)")
        .addField("rewards", "See what deeds your clan has achieved that Hawthorn deems so incredibly " +
                             "amazing that literally everyone in your clan deserves a reward for! " +
                             "Seriously... she needs a life.")
        .addField("stats", "See aggregated clan stats for various types of missions. For as much as she " +
                           "says she cares, not even Hawthorn can tell you all of this.");
    } else if (topic === 'ep') {
      embed.setTitle("little-light ep help")
        .setDescription("Access Rasputin's information regarding the current escalation protocol. " +
                        "Use this command to view what sort of creature we're up against, as well " +
                        "as what rewards Rasputin is offering.");
    } else if (topic === 'events') {
      embed.setTitle("little-light events help")
        .setDescription("See what events the tower is holding. I guess when guardians are nearly " +
                        "wiped out, it's nice to celebrate a little bit... by killing things... or " +
                        "killing each other... There are no parameters for this command.");
    } else if (topic === 'updates') {
      embed.setTitle("little-light updates help")
        .setDescription("By analyzing the information recorded in scan patrols, I'm able give a " +
                        "detailed report of the changes to our world. I've left out the parts " +
                        "regarding tectonic shifts and what happened to Florida after the golden age. " +
                        "Poor Florida...");
    } else if (topic === 'xur') {
       embed.setTitle("little-light xur help")
        .setDescription("By analyzing the reports of other guardians, I am able to get a reading on " +
                        "Xur's current location, as well as the items he has in stock.");
    } else {
      return "I'm sorry, but I have no information on that topic.";
    }
    return {embed: embed};
  }
}