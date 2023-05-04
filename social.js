var utils = require("./utils.js");
var configs = require("./config.js");
var browse = require("./browser.js");
var collecter = require("./collect.js");
var exec = require('child_process').exec;
var fs = require("fs");
var path = require("path");
var logger = require("./log.js");
var imageSearch = require("./imageSearch.js");
const {keyboard, Key, mouse, screen, Point, Region} = require("@nut-tree/nut-js");

async function init() {
    var config = configs.loadConfig();
    var results = {
        general: {
            messages: [],
        }
    };

    if (config.forever) {
        console.log("Forever flag set. Will collect daily randomly between the time of: " + config.collectionTime[0] + ", and " + config.collectionTime[1]);
        console.log("Press control+c or close this window to stop the bot");
        foreverStart(config);

        await utils.sleep(1000000);
    } else {
        standardStart(config);
    }
}

async function foreverStart(config) {
    await foreverTick(config);
}

async function foreverTick(config) {
    var collectedToday = false;
    var collectionTime;
    
    // parse out config collection times into minutes
    var startMinutes = 0;
    var startTime = config.collectionTime[0].split(":");
    startMinutes += parseInt(startTime[0]) * 60;
    startMinutes += parseInt(startTime[1]);

    var endMinutes = 0;
    var endTime = config.collectionTime[1].split(":");
    endMinutes += parseInt(endTime[0]) * 60;
    endMinutes += parseInt(endTime[1]);

    collectionTime = await setCollectionTime(startMinutes, endMinutes);
    console.log("Setting today's collection time");
    console.log("Collection time will be at: " + Math.floor(collectionTime / 60) + ":" + collectionTime % 60 + " today (military time)");

    while (true) {
        var date = new Date();
        var minutes = date.getMinutes() + 60 * date.getHours();

        if (minutes == collectionTime && !collectedToday) {
            console.log("Collecting Now");
            standardStart();
            collectedToday = true;
            collectionTime = await setCollectionTime(startMinutes, endMinutes);
            console.log("Setting tomorrow's collection time");
            console.log("Collection time will be at: " + Math.floor(collectionTime / 60) + ":" + collectionTime % 60 + " tomorrow (military time)");
        }

        if (minutes > endMinutes) {
            collectedToday = false;
        }
        
        await utils.sleep(1000);
    }
}

async function setCollectionTime(startMinutes, endMinutes) {
   return Math.round((Math.random() * (endMinutes - startMinutes)) + startMinutes);
}

async function standardStart(config) {
    if (!config) {
        config = configs.loadConfig();
    }
    var results = {
        general: {
            messages: [],
        }
    };

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
    await utils.sleep(2500);
    
    // Start a new browser with settings from the config
    var browser = new browse.Browser(config.browserProfile || "", config.browserType);
    await browser.init(true);
    await utils.sleep(1500);

    await crashFix(browser);
    await utils.sleep(1000);

    return browser;
}

async function crashFix(browser) {
    var screenWidth = await screen.width();
    var screenHeight = await screen.height();
    var printImg = await screen.captureRegion("screenCapture.png", new Region(0, 0, screenWidth - 1, screenHeight - 1));
    
    var restoreLocation = await imageSearch.matchImage("./images/restore.png", "./screenCapture.png", 5);

    if (restoreLocation) {
        await utils.clickAt(restoreLocation.x + 6, restoreLocation.y + 3);
        await utils.sleep(500);
        await browser.closeAll();
    }
    
    return;
}

init();