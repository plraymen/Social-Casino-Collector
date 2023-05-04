var utils = require("./utils.js");
const puppeteer = require("puppeteer-extra");
const spawn = require('child_process').spawn;
const {keyboard, Key, mouse, straightTo, Point, Button, screen, Region} = require("@nut-tree/nut-js");
var fs = require("fs");

class Browser {
    browser;
    profile;
    type;

    /**
     * Creates a browser instance. Need to call init() afterwards
     * @param {String} profile The name of the browser profile to use 
     * @param {*} type  Edge | Chrome | Opera - defaults to Edge
     */
    constructor(profile, type) {
        this.profile = profile;
        this.type = type;
        this.pageHeight = 768;
        this.pageWidth = 1366;
        this.browserToolbarOffset = 71;
    }

    async init(findToolbarOffset) {
        // TODO close other open versions of edge
        // Default to Edge
        if (!this.type) {
            this.type = "Edge";
        }
    
        // Make sure a proper type argument was given
        if (this.type != "Edge" && this.type != "Chrome" && this.type != "Opera") {
            return false;
        }

        var open;
        // Loads up the browser based on type provided
        if (this.type == "Edge") {
            open = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", ['--disable-session-crashed-bubble', '--remote-debugging-port=9222', `${(this.profile) ? `--profile-directory='${(this.profile)}'` : ""}`, "--start-maximized", "--silent-debugger-extension-api"]);
        } else if (this.type == "Chrome") {
            open = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ['--disable-features=ChromeRenderProcess', '--disable-session-crashed-bubble', '--remote-debugging-port=9222', `${(this.profile) ? `--profile-directory='${(this.profile)}'` : ""}`, "--start-maximized", "---silent-debugger-extension-api"]);
        }

        // Repeatedly attempt to connect to browser
        var connected = false;
        while (!connected) {
            // TODO handle cases where it cannot connect at all
            await utils.sleep(500);
            try {
                var browserURL = 'http://127.0.0.1:9222';
                this.browser = await puppeteer.connect({browserURL});
                connected = true;
            } catch (err) {
                connected = false;
            }
        }

        if (findToolbarOffset) {
            var page = await this.newPage("https://blackscreen.app/");
            await utils.sleep(100);


            var imgData = await screen.grabRegion(new Region(2, 0, 1, 250));
            var pixelData = imgData.data.toJSON();
            var counter = 0;
            var blackFound = false;
            while (!blackFound && counter < 250) {
                var pixelLocation = (counter) * 4
                var currentPixel = pixelData.data.slice(pixelLocation, pixelLocation + 4);

                if (currentPixel.toString() == [0,0,0,255].toString()) {
                    blackFound = true;
                    this.browserToolbarOffset = counter;
                    console.log("Toolbar Offset: " + this.browserToolbarOffset);
                }
                counter++;
            }

            if (!blackFound) {
                console.log("Unable to callibrate toolbar offset");
            }
        }
        
        if (connected) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Opens a new page and goes to the URL if one is supplied
     * @param {string} url 
     * @returns The new page object that is created
     */
    async newPage(url) {
        var page = await this.browser.newPage();

        if (this.pageHeight && this.pageWidth) {
            await page.setViewport({height: this.pageHeight, width: this.pageWidth})
        }

        if (url) {
            await page.goto(url, {waitUntil: 'load'});
        }

        return page;
    }

    async waitForLoad(page, timeout) {
        if (!timeout) {
            timeout = 10000;
        }

        try {
            await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: timeout    
           });
        } catch {
            console.log("waitForLoad timeout error");
        }

        return true;
    }

    /**
     * Navigates the given page to the given URL
     * @param {Page} page 
     * @param {String} url 
     */
    async goto(page, url) {
        try {
            await page.goto(url, {waitUntil: 'networkidle2'});
        } catch {
            console.log("Page going to URL: " + url + " failed");
            return false;
        }

        return true;
    }

    /**
     * Returns the URL of the given page
     * @param {Page} page 
     */
    async getURL(page) {
        var url = await page.url();

        return url;
    }

    /**
     * Closes the given page
     * @param {Page} page 
     */
    async closePage(page) {
        await page.close();

        return;
    }

    /**
     * Closes all pages, except for a new tab. If a page is passed, will leave that page open
     * @param {*} page 
     */
    async closeAll(page) {
        if (!page) {
            page = await this.newPage();
        }

        var pages = await this.browser.pages();

        for (var i = 0; i < pages.length; i++) {
            if (pages[i] != page) {
                pages[i].close();
            }
        }
        
        return page;
    }

    /**
     * Brings the given page into focus
     * @param {*} page 
     */
    async bringToFront(page) {
        await page.bringToFront();

        return;
    }
    
    /**
     * Finds the element on the given page. Also tags the element with a uuid for future use.
     * @param {*} page The page to find the element on
     * @param {*} xpath Xpath string, query selector, or element object to return
     * @param {*} options Optional parameters
     * @returns The element, or null if not found
     */
    async findElement(page, xpath, options) {
        if (!options) {
            options = {};
        }

        if (!options.tries) options.tries = 5;
        if (options.visible === undefined) options.visible = true;
        
        var found = false;


        // Try twice a second to find the element
        for (var i = 0; i < options.tries * 2; i++) {
            if (found) {
                continue;
            }

            // Start eval
            var result = await page.evaluate(function (xpath, options) {
                var result = {};

                var element;

                // Execute if input is an xpath
                if (typeof xpath == "string" && xpath.substring(0, 2) == "//") {
                    if (!options.visible) {
                        element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    }
                    if (options.visible) {
                        	// First get all matching elements into an array
                        var results = [];
                        var xpathResult = document.evaluate(
                            xpath, 
                            document,
                            null,
                            XPathResult.ORDERED_NODE_ITERATOR_TYPE,
                            null
                            );
                        var node;

                        while ((node = xpathResult.iterateNext()) != null) {
                            results.push(node);
                        }

                        // Loop through and return the first visible element
                        var found = false;
                        for (var i = 0; i < results.length; i++) {
                            if (found) {continue}

                            var visible = true;

                            if (results[i].getBoundingClientRect().x == 0 && results[i].getBoundingClientRect().y == 0) {
                                visible = false;
                            }

                            if (results[i].getBoundingClientRect().height == 0 || results[i].getBoundingClientRect().width == 0) {
                                visible = false;
                            }

                            // Stop searching if none of the above checks thought that the element was invisible
                            if (visible) {
                                found = true;
                                element = results[i];
                            }
                        }
                    }
                }
                // Execute if input is an element object
                else if (typeof xpath == "object") {
                    var element = document.querySelector("*[data-uid='" + xpath.uid + "']");
                }
                // Otherwise assume that a query selector was passed in
                else {
                    var element = document.querySelector(xpath);
                }

                if (element == null) {
                    return null;
                }

                // Give the element a random id if it does not already have one
                var random = Math.random().toString().substr(2);
                var id = "id" + random;
                if (!element.getAttribute("data-uid")) {
                    element.setAttribute("data-uid", id);
                } else {
                    id = element.getAttribute("data-uid");
                }

                result.string = element.outerHTML;
                result.x = element.getBoundingClientRect().left;
                result.y = element.getBoundingClientRect().top;
                result.height = element.getBoundingClientRect().height;
                result.width = element.getBoundingClientRect().width;
                result.uid = id;

                return JSON.stringify(result);
            }, xpath, options);
            // End of eval

            // Exit loop if found, wait if element is not found.
            if (result != null) {
                found = true;
            } else {
                await utils.sleep(500);
            }
        }

        if (!result) {
            return result;
        }
        return JSON.parse(result);
    }

    /**
     * Finds and clicks on the center of the given element
     * @param {*} page The page to find the element on.
     * @param {*} xpath Xpath string, query selector, or element object to return
     * @param {*} options 
     */
    async clickElement(page, xpath, options) {
        // Bring the page to the fore
        this.bringToFront(page);

        // Wait a brief period of time for element motion, and maybe help with bot detection
        await utils.sleep(200 + Math.random() * 200);

        // Default options
        if (!options) options = {};
        if (options.offset === undefined) options.offset = true;

        // Finds elements position
        var element = await this.findElement(page, xpath, options);

        // Return null if the element was not found.
        if (element == null) {
            return null;
        }
        
        // Find center positioning
        var centerX = element.x + element.width / 2;
        var centerY = element.y + element.height / 2;

        if (options.offset) {
            // 10 pixel offset potential for x, 5 for y
            centerX += 10 - Math.floor(Math.random() * 20);
            centerY += 5 - Math.floor(Math.random() * 10);
        }

        // Scroll if need be
        var scrolled = false;
        var scrollOffset = 0;

        // Scroll the page if need be
        if (centerY >= this.pageHeight) {
            scrollOffset = Math.round(360 + Math.random() * 80);
            await this.scroll(page, centerY - scrollOffset);
            scrolled = true;
        }

        // Move the mouse to hover over the element
        mouse.config.mouseSpeed = 600;
        if (scrolled) {
            await mouse.move(straightTo(new Point(centerX, scrollOffset + this.browserToolbarOffset)));
            //robot.moveMouseSmooth(centerX, scrollOffset + this.browserToolbarOffset, 1.99);
        } else {
            await mouse.move(straightTo(new Point(centerX, centerY + this.browserToolbarOffset)));
            //robot.moveMouseSmooth(centerX, centerY + this.browserToolbarOffset, 1.99);
        }

        // Click and wait a second for the moveMouseSmooth delay to happen
        //robot.mouseClick();
        await mouse.click(Button.LEFT);

        await utils.sleep(250);

        return element;
    }

    /**
     * Solves the recaptcha on the given page. Does need page focus
     * @param {*} page Given Page
     * @param {*} boundingBox Bounding box of recaptcha, if empty will try to find.
     * @returns True if successfully solved, false otherwise
     */
    async solveRecaptcha(page, boundingBox) {
        await utils.sleep(2000);

        // Move Mouse to corner where it will not interfear with colors on hover
        await mouse.move(straightTo(new Point(18, 84)));

        // checkbox (x, y) position will be top left of the box.
        var greyColor = [193, 193, 193, 255];
        var whiteColor = [255, 255, 255, 255];
        var checkboxX;
        var checkboxY;

        var found = false;

        // If no bounding box was supplied look for one.
        if (!boundingBox) {
            boundingBox = await this.findElement(page, ".g-recaptcha");
            if (!boundingBox) {
                return null;
            }
        }
        
        // Round off the numbers
        boundingBox.x = Math.floor(boundingBox.x);
        boundingBox.y = Math.floor(boundingBox.y);
        boundingBox.width = Math.floor(boundingBox.width);
        boundingBox.height = Math.floor(boundingBox.height);

        var imgData = await screen.grabRegion(new Region(boundingBox.x, boundingBox.y + this.browserToolbarOffset, boundingBox.width, boundingBox.height));
        var printImg = await screen.captureRegion("local.png", new Region(boundingBox.x, boundingBox.y + this.browserToolbarOffset, boundingBox.width, boundingBox.height));
        var pixelData = imgData.data.toJSON();

        // Loop through and check the retreived pixel data
        // i = y, j = x
        var greyCount = 0;
        for (var i = 0; i < boundingBox.height; i++) {
            // -5 Offset to account for white color searching
            for (var j = 0; j < boundingBox.width-5; j++) {
                if (found) {
                    continue;
                }

                var pixelLocation = (i * boundingBox.width + j) * 4
                var currentPixel = pixelData.data.slice(pixelLocation, pixelLocation + 4);

                // Look for grey color, then if there is a white color 5 pixels over
                if (currentPixel.toString() == greyColor.toString()) {
                    greyCount++;
                    // Checking for white 5 pixels over
                    var whiteLocation = pixelLocation + (4 * 5);
                    var whitePixel = pixelData.data.slice(whiteLocation, whiteLocation + 4);

                    if (whitePixel.toString() == whiteColor.toString()) {
                        found = true;
                        // Set checkbox location relative to boundingBox.
                        checkboxX = j + boundingBox.x;
                        checkboxY = i + boundingBox.y + this.browserToolbarOffset;
                    }
                }
            }
        }

        // Return an error if we can't find the Captcha checkbox
        if (!found) {
            return false;
        }

        // Click the checkbox (with a bit of an offset)
        await mouse.move(straightTo(new Point(checkboxX + 10 + Math.floor((Math.random() * 10)), checkboxY + 10 + Math.floor((Math.random() * 10)))));
        await mouse.click(Button.LEFT);

        // Store the current history
        var historyKey = await page.evaluate(function () {
            return navigation.currentEntry.key;
        });

        // Wait for the Captcha to be solved
        // Check if it grecaptcha object has a length
        // Also check if current history in the same as before (detecting navigation change)
        // Wait at most 150 seconds
        
        var recaptchaFinished = false;
        for (var i = 0; i < 180; i++) {
            if (recaptchaFinished) {
                continue;
            }

            var greResponse;
            var navigationChange;

            try {
                navigationChange = await page.evaluate(function (historyKey) {
                    return (historyKey != navigation.currentEntry.key);
                }, historyKey);

                greResponse = await page.evaluate(function () {
                    return grecaptcha && grecaptcha.getResponse().length !== 0;
                });
            } catch {
                console.log("Suppressing error in recaptcha detection")
            }

            if (greResponse || navigationChange) {
                recaptchaFinished = true;
            }

            // If not found wait a second
            await utils.sleep(1000);
        }
        
       

        // return true if recaptcha solved. False if not able to
        if (recaptchaFinished) {
            return true;
        } else {
            return false;
        }
    }

    /*
    async findLuckylandCollect(page) {
        var boundingBox = await this.findElement(page, "#lls-main-canvas");
        
        console.log(boundingBox.width);
        boundingBox.height = Math.floor(boundingBox.height);
        boundingBox.width = Math.floor(boundingBox.width);

        var maxHeight = (await screen.height() - 1);
        var maxWidth = (await screen.width()) - 1;

        var regionX = boundingBox.x;
        var regionY = boundingBox.y + this.browserToolbarOffset;
        var regionWidth = Math.min(boundingBox.width, maxWidth - boundingBox.x);
        var regionHeight = Math.min(boundingBox.height, maxHeight - boundingBox.y - this.browserToolbarOffset);

        var imgData = await screen.grabRegion(new Region(regionX, regionY, regionWidth, regionHeight));
        var printImg = await screen.captureRegion("local.png", new Region(regionX, regionY, regionWidth, regionHeight));
        var pixelData = imgData.data.toJSON();

        var whiteMatch = [255, 255, 255, 255];
        var minBlue = 170;

        fs.writeFile("testBuffer.txt", pixelData.data.toString(), function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 

        // Loop through and check the retreived pixel data
        // i = y, j = x
        var found = false;
        var pixels = "";
        for (var i = 0; i < boundingBox.height; i++) {
            for (var j = 0; j < boundingBox.width; j++) {
                if (found) {continue;}

                var pixelLocation = (i * boundingBox.width + j) * 4
                var currentPixel = pixelData.data.slice(pixelLocation, pixelLocation + 4);

                pixels += currentPixel.toString() + "\n";

                // Check for a white pixel with high blue saturation next to it
                if (currentPixel.toString() == whiteMatch.toString()) {
                    var leftPixelLocation = pixelLocation - ((5) * 4);
                    var leftPixel = pixelData.data.slice(leftPixelLocation, leftPixelLocation + 4);
                    var blueValue = leftPixel[0];
                    var greenValue = leftPixel[1];

                    var downPixelLocation = leftPixelLocation + (boundingBox.width * 5 * 4);
                    var leftPixel = pixelData.data.slice(downPixelLocation, downPixelLocation + 4);
                    var downValue = leftPixel[0];
                    var dgValue = leftPixel[1];

                    if (blueValue > minBlue && downValue > minBlue && blueValue < 200 && downValue < 200 && greenValue < 100) {
                        found = true;

                        var pointX = j;
                        var pointY = i;
    
                        console.log(pointX);
                        console.log(pointY);

                        await mouse.move(straightTo(new Point(pointX + boundingBox.x, pointY + boundingBox.y + this.browserToolbarOffset)));
                    }


                }
            }
        }

        fs.writeFile("text.txt", pixels, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        }); 
        
    }
    */
    
    /**
     * Calls and returns puppeteer evaluate function on the given page
     * @param {*} page 
     * @param {*} funct 
     * @param {*} args 
     * @returns 
     */
    async evaluate(page, funct, args) {
        var result = await page.evaluate(funct);
        return result;
    }

    // TODO try to get input scrolling instead
    /**
     * Scrolls the page to specified Y position
     * @param {page} page Puppeteer page
     * @param {integer} scrollY Scrolls to the page  
     */
    async scroll(page, scrollY) {
        await page.evaluate(function (scrollY) {
            window.scrollTo(0, scrollY);
    
            return true;
        }, scrollY);
    
        await sleep(200);
        return true;
    }

    /**
     * Searches for and close browser popups such as the restore session popup
     */
    async closeBrowserPopups() {

    }

    /**
     * Allows for changing the global settings of this browser object
     * @param {Object} settings pageHeight, pageWidth
     */
    async settings(settings) {
        if (settings.pageHeight) {
            this.pageHeight = settings.pageHeight;
        }
        if (settings.pageWidth) {
            this.pageWidth = settings.pageWidth;
        }
        if (settings.browserToolbarOffset) {
            this.browserToolbarOffset = settings.browserToolbarOffset;
        }

        return true;
    }

    getToolbarOffset() {
        return this.browserToolbarOffset;
    }

    /**
     * Calls puppeteer function to close the current browser associated with this object
     */
    async close() {
        await this.browser.close();
        return true;;
    }
}

exports.Browser = Browser;