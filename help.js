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
        .addField("events", "Using my top level security clearance to the tower's network, I'm able " +
                            "to access... a calendar! By using this command, I can tell you about " +
                            "any events that might be going on, such as 'Iron Banner' or a 'Faction Rally'.")
        .addField("updates", "Thanks to all the scan patrols, I'm able to keep a log of any changes " +
                             "that happen to our world. By using this command, I can relay those " +
                             "change logs back to you. An optional parameter may be used to... limit " + 
                             "my excessive recitation of such reports. You may type ``!ll help updates`` " +
                             "to learn more.");
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
                             "Seriously... she needs a life.");
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
                        "Poor Florida... By default, using this command will list the last major change, " +
                        "as well as all minor changes that followed. his command has an optional parameter " +
                        "to further limit this list, however.")
        .addField("*Optional* [Number]", "By adding a number to the end of this command, you can limit " +
                  "the number of reports I list by that number. For instance, ``!ll updates 1`` will " +
                  "display the very latest change only.");
    } else {
      return "I'm sorry, but I have no information on that topic.";
    }
    return {embed: embed};
  }
}