const clipboardy = import('clipboardy');
const {keyboard, Key, mouse, screen, Point, straightTo, Button} = require("@nut-tree/nut-js");

/**
 * Inputs string to clipboard, then simulates pressing crtl+v
 */
async function pasteString(string) {
    // Really weird hack needed to get clipboardy library to work.
    var clip = (await clipboardy).default;

    clip.writeSync(string);

    await keyboard.pressKey(Key.LeftControl, Key.V);
    await keyboard.releaseKey(Key.LeftControl, Key.V);

    return;
}


var inputTimes = [
    [0,192,268,318,396,625,714,782,1091,1333,1410,1488,1864,1924,2091,2297],
    [0,137,207,401,465,585,647,841,975,1070,1094,1182,1301,1312,1375],
    [0,158,282,351,408,609,663,732,901,1033,1170,1234,1433,1531,2437,2455],
    [0,195,246,414,448,670,761,1117,1556,1630,1636,1733,1841,1869,1954],
    [0,166,245,310,356,554,632,697,960,1074,1190,1253,1453,1506,1635,1712],
    [0,322,438,668,770,909,1008,1282,1635,1711,1807,1921,2023,2101,2169],
    [0,297,369,580,686,792,908,1149,1546,1616,1702,1786,1934,2011,2073],
    [0,140,200,377,459,559,646,830,962,1062,1091,1230,1371,1396,1474],
    [0,192,234,435,491,609,681,891,1248,1321,1379,1482,1575,1612,1699],
    [0,240,325,536,597,765,850,1080,1871,1955,2018,2099,2197,2270,2330]
]

/**
 * Simulates human input of the given string
 * TODO fix keyups and keydowns
 * @param {String} string 
 */
async function inputString(string) {
    // Choose a random input time
    var timing = inputTimes[Math.floor(Math.random() * inputTimes.length)]
    // Extend input time if needed
    if (string.length > timing.length) {
        for (var i = timing.length; i < string.length; i++) {
            timing[i] = timing[i - 1] + Math.floor(Math.random() * 80 + 40);
        }
    }

    var lastTime = 0;
    keyboard.config.autoDelayMs = 0;

    // Input the time
    for (var i = 0; i < string.length; i++) {
        const MATCH_REGEX = /[ABCDEFGHIJKLMNOPQRSTUVWXYZ~!@#\$%\^&*()_+{}|:"<>?]/;

        await keyboard.type(string[i].toString());
        await sleep((timing[i] - lastTime)/3);
        await sleep((timing[i] - lastTime)/3);

        lastTime = timing[i];
    }

    return true;
}

/**
 * Presses control-A + backspace to clear the current data
 */
async function clearString() {
    keyboard.config.autoDelayMs = 0;

    await keyboard.pressKey(Key.LeftControl, Key.A);
    await keyboard.pressKey(Key.Backspace);
    await keyboard.releaseKey(Key.Backspace);
    await keyboard.releaseKey(Key.LeftControl, Key.A);

    return true;
}

/**
 * Clicks at the specified X, Y cords on the screen
 */
async function clickAt(x, y) {
    await mouse.move(straightTo(new Point(x, y)));
    await mouse.click(Button.LEFT);

    return true;
}
/**
 * Clicks the left mouse button
 */
async function click() {
    await mouse.click(Button.LEFT);

    return true;
}
/**
 * Moves mouse to the specified X, Y cords on the screen
 */
async function moveTo(x, y) {
    await mouse.move(straightTo(new Point(x, y)));

    return true;
}

/**
 * Sleeps ms milliseconds
 */
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

exports.pasteString = pasteString;
exports.inputString = inputString;
exports.clearString = clearString;
exports.clickAt = clickAt;
exports.click = click;
exports.moveTo = moveTo;