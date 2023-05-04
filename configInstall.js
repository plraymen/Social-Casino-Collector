var fs = require("fs");
var utils = require("./utils.js");

const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

// Usage inside aync function do not need closure demo only
(async() => {
  try {
    var config = {
        "browserType": "Chrome",
        "broswerProfile": false,

        "debugLevel": "all",
        "dailyLog": true,
        "autoGamble": false,

        "forever": false,
        "collectionTime": ["12:00", "13:00"],

        "collect": {
            "chumba": true,
            "pulsz": true,
            "fortuneCoin": true,
            "luckyland": false,
        },

        "logins": {
            "standard": ["default@default.com", "badPassword14"],
            "chumba": false,
            "pulsz": false,
            "fortuneCoin": false,
            "luckyLand": false,
            "wowVegas": false,
            "stake": false
        }
    }

    console.log("This bot use your chrome browser by default");
    var browserProfile = await prompt("Do you have a specific browser profile you would like to use (No will default to your default browser profile)? (Y/N) ");
    var browserProfileResult = ynParse(browserProfile);

    if (browserProfileResult) {
        console.log("\nWhat is the name of the user profile folder you would like to use?");
        console.log("If the folder does not exist it will be created when the bot is ran");
        var profileName = await prompt("Profile: ");

        config.broswerProfile = profileName;
    } else {
        console.log("Okay using default chrome profile")
    }

    var dailyLogs = await prompt("\nThis bot will write a daily report in ./logs/dd-mm-yyyy.txt. If this acceptable? (Y/N) ")
    var dailyLogsResult = ynParse(dailyLogs);

    if (!dailyLogs) {config.dailyLog = false;}

    console.log("\nBy default this bot will only collect when it is ran.");
    console.log("If you enable this feature the bot will continue to run after starting and will collect daily.");
    var forever = await prompt("\nWould you like to turn daily auto collecting on? (Y/N) ");
    var foreverResult = ynParse(forever);

    if (foreverResult) {
        config.forever = true;

        console.log("\nDaily autocollect is turn on. You will need to start the bot once to start it running in the background");
        console.log("and make sure that this command prompt / powershell window does not close");

        console.log("\nSince autocollect is on this bot will collect during a random military time in an interval you specify");
        console.log("For example if you specify the bot should collect between 12:00 and 14:00 the bot will collect daily at a random time between the times of 12:00 PM and 2:00 PM");
        var startTime = await prompt("What is the earliest time you would like the bot to be able to collect in military time? (hh:mm) ");
        config.collectionTime[0] = startTime;

        var endTime = await prompt("What is the latest time you would like the bot to be able to collect in military time? (hh:mm) ");
        config.collectionTime[1] = endTime;

        console.log("\nThe bot is set to collect between the time of " + startTime + " and " + endTime + " daily when running");
    } else {
        config.forever = false;
    }

    console.log("\nNow enter which casinos you have accounts set up in");
    console.log("Remember you can change these values in the config.json file later if you create a new account or just want to change the bot's settings");

    for (var casino in config.collect) {
        var hasCasino = await prompt("\nDo you have an account with " + casino + "? (Y/N) ");
        var hasCasinoResult = ynParse(hasCasino);

        if (hasCasinoResult) {
            config.collect[casino] = true;
        } else {
            config.collect[casino] = false;
        }
    }

    config.collect.wowVegas = false;
    config.collect.globalPoker = false;
    config.collect.stake = false;

    console.log("\nLastly you will need to input your logins for these casinos");

    var standardEmailPassword = await prompt("\nDo you have a standard email and password that you used for all casino sites? (Y/N) ")
    var standardEmailResult = ynParse(standardEmailPassword);

    if (standardEmailResult) {
        var email = await prompt("\nPlease enter standard email: ");
        var password = await prompt("\nPlease enter standard password: ");

        config.logins.standard = [email, password];
    } else {
        for (var casino in config.collect) {
            if (!config.collect[casino]) {
                continue;
            }
    
            var email = await prompt("\nPlease enter email for " + casino + ": ");
            var password = await prompt("\nPlease enter password for " + casino + ": ");
    
            config.logins[casino] = [email, password];
        } 
    }

    var toWrite = JSON.stringify(config);
    fs.writeFileSync('config.json', toWrite);

    await utils.sleep(1000);

    console.log("\n\nconfig.json updated. You can now run the bot with the run.bat file, or by node social.js in the command line")

    rl.close();
  } catch (e) {
    console.error("Unable to prompt", e);
  }
})();

function ynParse(input) {
    if (input == "Y" || input == "y" || input == "yes" || input == "Yes") {
        return true;
    }

    return false
}