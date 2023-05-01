var utils = require("./utils.js");
var configs = require("./config.js");
var browse = require("./browser.js");
var collecter = require("./collect.js");
var exec = require('child_process').exec;
var fs = require("fs");
var path = require("path");
var logger = require("./log.js");

async function init() {
    var config = configs.loadConfig();
    var results = {};

    // Load up the browser
    var browser = await startBrowser(config, results);

    // Collect from each site one by one
    var collect = await collecter.collectAll(browser, config, results);

    // Write daily logs
    if (config.dailyLog) {
        await logger.buildLog(results, config);
        await utils.sleep(5000);
    }

    // Clean up
    await browser.close();
    console.log("Finished collecting. Details in log file.");

    exit(1);

    return;
}

async function startBrowser(config, results) {
    // Kills current browser
    var browserToKill = (config.browserType == "Edge") ? "msedge" : "chrome";
    exec('powershell -command "Get-Process ' + browserToKill + ' | ForEach-Object { $_.CloseMainWindow() | Out-Null}"', function(err,sysout,syserr) {
        if (err && err.code != 1) {
            console.log(err);
        }
    });

    await utils.sleep(4000);

    var browserCrashFix = new browse.Browser(config.browserProfile || "", config.browserType);
    await browserCrashFix.init();
    var fronter = await browserCrashFix.newPage("https://www.bing.com");
    await browserCrashFix.newPage("https://www.google.com/");
    await browserCrashFix.newPage("https://www.bing.com");
    fronter.bringToFront();
    await utils.sleep(2000);

    browserToKill = (config.browserType == "Edge") ? "msedge" : "chrome";
    exec('powershell -command "Get-Process ' + browserToKill + ' | ForEach-Object { $_.CloseMainWindow() | Out-Null}"', function(err,sysout,syserr) {
        if (err && err.code != 1) {
            console.log(err);
        }
    });
    
    console.log("Double starting to prevent browser popups");
    await utils.sleep(2500);
    browserCrashFix.close();
    await utils.sleep(2500);

    // Need to update crash value in profile preferences if user or bot has forced closed a browser
    //await crashFix(config, results);
    //await utils.sleep(100);

    // Start a new browser with settings from the config
    var browser = new browse.Browser(config.browserProfile || "", config.browserType);
    await browser.init(true);
    await utils.sleep(1500);

    console.log("Browser Started");

    return browser;
}

async function crashFix(config, results) {
    var preferencePath = "";

    //console.log(process.env.LOCALAPPDATA);
    if (config.browserType == "Chrome" && !config.browserProfile) {
        preferencePath = path.join(process.env.LOCALAPPDATA + "/Google/Chrome/User Data/ Profile 1/Preferences")
    } else if (config.browserType == "Edge" && !config.browserProfile) {
        preferencePath = path.join(process.env.LOCALAPPDATA + "/Microsoft/Edge/User Data/Default/Preferences") 
    }

    try {
        var preferenceFile = fs.readFileSync(preferencePath).toString();

        var preferences = JSON.parse(preferenceFile);
        preferences.profile.exit_type = 'none';

        var preferenceWrite = JSON.stringify(preferences);

        fs.writeFileSync(preferencePath, preferenceWrite);
    } catch (err) {
        //console.log(err);

        if (!results.general) {results.general = {}}
        if (!results.general.messages) {results.general.messages = []};

        results.general.messages.push("Error setting profile exit_type to none, bot may not work if the browser was open before the bot started")
    }


    return;
}

init();