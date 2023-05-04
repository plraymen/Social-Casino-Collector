var utils = require("./utils.js");
var imageSearch = require("./imageSearch.js");
const {keyboard, Key, mouse, screen, Point, Region} = require("@nut-tree/nut-js");

/**
 * Collects from Chumba casino
 * @returns True on success, False on error
 */
async function collectChumba(browser, config, results) {
    results.chumba = {
        collectSuccess: false,
    };

    // Go to Chumba's homepage
    var page = await browser.newPage("https://www.chumbacasino.com/");
    await browser.bringToFront(page);

    // Check if we are already logged in if not log in
    var loginButton = await browser.findElement(page, "//*[contains(text(),'Login')]");
    if (loginButton != null) {
        await browser.clickElement(page, loginButton);
        await utils.sleep(2000);

        await standardLogin(browser, page, config, results, "chumba");
        await browser.waitForLoad(page, 7500);
        await closeSavePasswordPopup(browser, page);
        await utils.sleep(500);
    }

    await standardClaim(browser, page, "//button[contains(text(), 'CLAIM')]", "chumba", results);

    // Click top left to close any adverting popups
    await utils.clickAt(0, 120);

    // Check how many sweeps coins we currently have
    var totalSC = await browser.evaluate(page, function () {
        var scs = document.querySelectorAll("#top-hud__currency-bar__sweeps-currency-amount")[0].innerText.substr(3);

        return scs;
    });

    results.chumba.totalValueLocked = totalSC;

    // Wait a few seconds so we don't appear quite so much like a bot
    await utils.sleep(5000 + Math.random() * 5000);
    browser.closePage(page);

    if (results.chumba.collectSuccess) {
        return true;
    } else {
        return false;
    }
}

/**
 * Collects from pulsz casino
 * @returns True on success, False on error
 */
async function collectPulsz(browser, config, results) {
    results.pulsz = {
        collectSuccess: false,
    };

    // Go to Pulsz's homepage
    var page = await browser.newPage("https://www.pulsz.com/home");
    await browser.bringToFront(page);

    // Check if we are already logged in if not log in
    var loginButton = await browser.findElement(page, "//*[contains(text(),'Login')]");
    if (loginButton != null) {
        await browser.clickElement(page, loginButton);
        await utils.sleep(2000);

        await standardLogin(browser, page, config, results, "pulsz");
        await browser.waitForLoad(page, 7500);
        await closeSavePasswordPopup(browser, page);
        await utils.sleep(500);
    }

    // Wait for content on page to load (very lazy solution)
    await utils.sleep(5000);

    // Make claim
    await standardClaim(browser, page, "//button[contains(text(), 'Claim bonus now')]", "pulsz", results);

    // Check how many sweeps coins we currently have
    var totalSC = await browser.evaluate(page, function () {
        var headerString = document.querySelector("header").innerText;
        var scs = null;

        // Search for SC then return value after
        for (var i = 0; i < headerString.length - 1; i++) {
            if (headerString[i] == "S" && headerString[i+1] == "C") {
                scs = headerString.substring(i+2)
            }
        }

        scs = parseFloat(scs);

        return scs;
    });

    results.pulsz.totalValueLocked = totalSC;

    // Wait a few seconds so we don't appear like a bot
    await utils.sleep(5000 + Math.random() * 5000);
    browser.closePage(page);

    // Return success status
    if (results.pulsz.collectSuccess) {
        return true;
    } else {
        return false;
    }

}

/**
 * Collects from fortuneCoin casino
 * @returns True on success, False on error
 */
async function collectFortuneCoin(browser, config, results) {
    results.fortuneCoin = {
        collectSuccess: false,
    };

    // Go to Fortune Coins's homepage
    var page = await browser.newPage("https://www.fortunecoins.com/lobby");
    await browser.bringToFront(page);
    await utils.sleep(5000);

    // Check if we are already logged in if not log in
    var loginButton = await browser.findElement(page, "//*[contains(text(),'Log In')]");
    if (loginButton != null) {
        await browser.clickElement(page, loginButton);
        await utils.sleep(2000);

        await standardLogin(browser, page, config, results, "fortuneCoin");
        await browser.waitForLoad(page, 7500);
        await closeSavePasswordPopup(browser, page);
        await utils.sleep(500);
    }

    // Wait for content on page to load (very lazy solution)
    await utils.sleep(5000);

    // Make claim
    var popupToClose = await browser.findElement(page, ".closePopupButton");
    if (popupToClose) {
        await browser.clickElement(page, popupToClose);
        await utils.sleep(1000);

        popupToClose = await browser.findElement(page, ".closePopupButton");
        
        if (popupToClose) {
            await browser.clickElement(page, popupToClose);
            await utils.sleep(1000);
        }

        popupToClose = await browser.findElement(page, ".closePopupButton");
        
        if (popupToClose) {
            await browser.clickElement(page, popupToClose);
            await utils.sleep(1000);
        }
    }
    var claimButton = await browser.findElement(page, "//button[contains(@class, 'freeCoins')]");
    if (claimButton) {
        await browser.clickElement(page, claimButton);
        await utils.sleep(1000);

        var collectButton = await browser.findElement(page, "//button[contains(text(), 'COLLECT')]");
        if (collectButton) {
            await browser.clickElement(page, collectButton);
            await utils.sleep(1000);
            results.fortuneCoin.collectSuccess = true;
        }
    }
    
    // Check how many sweeps coins we currently have
    var totalSC = await browser.evaluate(page, function () {
        var scs = document.querySelectorAll(".FCButtonText>.textDecimals")[1].innerText;

        scs = parseInt(scs);

        return scs;
    });

    results.fortuneCoin.totalValueLocked = totalSC * 0.01;

    // Wait a few seconds so we don't appear like a bot
    await utils.sleep(5000 + Math.random() * 5000);
    browser.closePage(page);

    // Return success status
    if (results.fortuneCoin.collectSuccess) {
        return true;
    } else {
        return false;
    }

}

/**
 * Collects from luckyland slots casino
 * @returns True on success, False on error
 */
async function collectLuckyland(browser, config, results) {
    results.luckyland = {
        collectSuccess: false,
    };

    var page = await browser.newPage("https://luckylandslots.com/loader")

    await utils.sleep(20000);

    var boundingBox = await browser.findElement(page, "#lls-main-canvas");
    boundingBox.height = Math.floor(boundingBox.height);
    boundingBox.width = Math.floor(boundingBox.width);

    var maxHeight = (await screen.height() - 1);
    var maxWidth = (await screen.width()) - 1;

    var regionX = boundingBox.x;
    var regionY = boundingBox.y + browser.getToolbarOffset();
    var regionWidth = Math.min(boundingBox.width, maxWidth - boundingBox.x);
    var regionHeight = Math.min(boundingBox.height, maxHeight - boundingBox.y - browser.getToolbarOffset());

    var printImg = await screen.captureRegion("luckylandcapture.png", new Region(regionX, regionY, regionWidth, regionHeight));

    // Check to see if we are already logged in
    var needLogin = await imageSearch.matchImage("./images/luckylandLogin.png", "./luckylandcapture.png", 10);
    if (needLogin) {
        var buttonPosition = needLogin;

        await utils.moveTo(buttonPosition.x + boundingBox.x + 10, buttonPosition.y + boundingBox.y + 5 + browser.getToolbarOffset())
        await utils.sleep(100);
        await utils.click();
        await utils.sleep(1000);

        var logins = config.logins.luckyLand || config.logins.standard;

        await utils.inputString(logins[0]);
        await utils.sleep(1000);
        await keyboard.pressKey(Key.Tab);
        await keyboard.releaseKey(Key.Tab);
        await utils.sleep(100);
        await utils.inputString(logins[1]);
        await utils.sleep(100);
        await keyboard.pressKey(Key.Enter);
        await keyboard.releaseKey(Key.Enter);
        await utils.sleep(4000);

        // Need to reset luckyland capture
        printImg = await screen.captureRegion("luckylandcapture.png", new Region(regionX, regionY, regionWidth, regionHeight));
    } 


    await utils.sleep(1000);
    var todayButton = await imageSearch.matchImage("./images/todayButton.png", "./luckylandcapture.png");
    var collectButton = await imageSearch.matchImage("./images/todayButton.png", "./luckylandcapture.png");

    if (todayButton || collectButton) {
        var buttonPosition = todayButton || collectButton;

        await utils.moveTo(buttonPosition.x + boundingBox.x + 10, buttonPosition.y + boundingBox.y + 5 + browser.getToolbarOffset())
        await utils.sleep(100);
        await utils.click();

        results.luckyland.collectSuccess = true;
    } else {
        results.luckyland.collectSuccess = false;
    }

    await utils.sleep(4000 + Math.random() * 3000); 

    return;
}

/**
 * Collects from wow vegas casino
 * @returns True on success, False on error
 */
async function collectWowVegas(browser, config, results) {
    results.wowVegas = {
        collectSuccess: false,
    };

    // Go to Wow Vegas's homepage
    var page = await browser.newPage("https://www.wowvegas.com/login");
    await browser.bringToFront(page);

    await utils.sleep(2500);

    await standardLogin(browser, page, config, results, "wowVegas");
    await utils.sleep(2500);
    await closeSavePasswordPopup(browser, page);

    // Collect
    await browser.goto(page, "https://www.wowvegas.com/promotions");
    await utils.sleep(4000 + Math.random(2000));
    await browser.goto(page, "https://www.wowvegas.com/promotions/daily-login-bonus");
    await utils.sleep(4000 + Math.random(2000));
    await browser.goto(page, "https://www.wowvegas.com/lobby?claimBonus=DAILY");

    results.wowVegas.collectSuccess = true;

    await utils.sleep(5000);

    // Check how many sweeps coins we currently have
    var totalSC = await browser.evaluate(page, function () {
        var scs = document.querySelector(".currency.currency--real").innerText;

        scs = parseFloat(scs);

        return scs;
    });

    results.wowVegas.totalValueLocked = totalSC;

    // Wait a few seconds so we don't appear like a bot
    await utils.sleep(5000 + Math.random() * 5000);
    browser.closePage(page);

    // Return success status
    if (results.wowVegas.collectSuccess) {
        return true;
    } else {
        return false;
    }

}

/**
 * Collects from stake casino
 * @returns True on success, False on error
 */
async function collectStake(browser, config, results) {
    results.stake = {
        collectSuccess: false,
    };

    // Go to Stake's homepage
    var page = await browser.newPage("https://stake.us/");
    await browser.bringToFront(page);
    await utils.sleep(2500);

    // Check if we are already logged in if not log in
    var loginButton = await browser.findElement(page, "//*[contains(text(),'Login')]");
    if (loginButton != null) {
        await browser.clickElement(page, loginButton);
        await utils.sleep(2000);

        await standardLogin(browser, page, config, results, "chumba");
        await browser.waitForLoad(page, 7500);
        await utils.sleep(500);
    }

    await standardLogin(browser, page, config, results, "stake");
    await utils.sleep(2500);

    results.wowVegas.collectSuccess = true;

    await utils.sleep(5000);

    // Check how many sweeps coins we currently have
    var totalSC = await browser.evaluate(page, function () {
        var scs = document.querySelector(".currency.currency--real").innerText;

        scs = parseFloat(scs);

        return scs;
    });

    results.wowVegas.totalValueLocked = totalSC;

    // Wait a few seconds so we don't appear like a bot
    await utils.sleep(5000 + Math.random() * 5000);
    browser.closePage(page);

    // Return success status
    if (results.wowVegas.collectSuccess) {
        return true;
    } else {
        return false;
    }

}

/**
 * Collects from every casino specified in the config.json file
 */
async function collectAll(browser, config, results) {
    if (config.collect.chumba) {
        try {
            await collectChumba(browser, config, results);
        } catch {
            console.log("Error Collecting from Chumba Casino");
            results.chumba = false;
        }
    }

    if (config.collect.pulsz) {
        try {
            await collectPulsz(browser, config, results);
        } catch {
            console.log("Error Collecting from Pulsz Casino");
            results.pulsz = false;
        }
    }

    if (config.collect.fortuneCoin) {
        try {
            await collectFortuneCoin(browser, config, results);
        } catch {
            console.log("Error Collecting from Fortune Coins Casino");
            results.fortuneCoin = false;
        }
    }

    if (config.collect.wowVegas) {
        try {
            await collectWowVegas(browser, config, results);
        } catch {
            console.log("Error Collecting from Wow Vegas");
            results.wowVegas = false;
        }
    }

    if (config.collect.luckyland) {
        try {
            await collectLuckyland(browser, config, results);
        } catch (err) {
            console.log("Error Collecting from Luckyland Casino");

            results.general.messages.push(err);
            
            results.luckyland = false;
        }
    }

    if (config.collect.stake) {
        console.log("Sorry stake.us is not supported at this time")
    }
}

async function standardLogin(browser, page, config, results, site) {
    // Use site login or standard if not provided
    var username = (config.logins[site]) ? (config.logins[site][0]) : (config.logins["standard"][0]);
    var password = (config.logins[site]) ? (config.logins[site][1]) : (config.logins["standard"][1]);

    // Find username field
    var usernameField = await browser.clickElement(page, "//input[contains(@name,'Email')] | //input[contains(@id,'email')] | //input[contains(@name,'email')] | //input[contains(@type,'email')]");
    await utils.sleep(100);

    // Clear any autofills then input username
    await utils.clearString();
    await utils.sleep(100);
    await utils.inputString(username);

    // We hate saved passwords popup, yes we do.
    await utils.clickAt(usernameField.x-10, usernameField.y);
    await utils.sleep(200);

    // Find password field
    await browser.clickElement(page, "//input[contains(@id,'password')] | //input[contains(@name,'password')] | //input[contains(@name,'Password')] | //input[contains(@type,'password')]");
    await utils.sleep(100);

    // Clear any autofills then input password
    await utils.clearString();
    await utils.sleep(100);
    await utils.inputString(password);

    // Enter doesn't work for wow vegas
    if (site == "wowVegas") {
        // Click login button
        var loginButton = await browser.findElement(page, "//*[contains(text(),'Log In')]");
        if (loginButton != null) {
            await browser.clickElement(page, loginButton);
            await utils.sleep(2000);
    
            await browser.waitForLoad(page, 7500);
            await utils.sleep(500);
        }
    } else {
        // Simulate enter press
        await keyboard.pressKey(Key.Enter);
        await keyboard.releaseKey(Key.Enter);
    }


    return;
}

async function standardClaim(browser, page, buttonText, site, results) {
    // Click the claim button on the site
    var claimButton = await browser.findElement(page, buttonText);
    if (claimButton != null) {
        await browser.clickElement(page, claimButton);
        await utils.sleep(1000);

        results[site].collectSuccess = true;
    }
}

async function closeSavePasswordPopup(browser, page) {
    await utils.sleep(3000);

    var screenWidth = await screen.width();
    var screenHeight = await screen.height();
    var printImg = await screen.captureRegion("screenCapture.png", new Region(0, 0, screenWidth - 1, screenHeight - 1));
    
    var savePasswordPopup = await imageSearch.matchImage("./images/passwordPopup.png", "./screenCapture.png", 15);

    if (savePasswordPopup) {
        await utils.clickAt(savePasswordPopup.x + savePasswordPopup.width - 12, savePasswordPopup.y + 10);
        await utils.sleep(1000);
    }

    return;
}

exports.collectAll = collectAll;