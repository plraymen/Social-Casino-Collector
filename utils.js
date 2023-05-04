var input = require("./utils/input.js");

/**
 * Sleeps ms milliseconds
 */
async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// Sleep
exports.sleep = sleep;

// Input
exports.pasteString = input.pasteString;
exports.inputString = input.inputString;
exports.clearString = input.clearString;
exports.clickAt = input.clickAt;
exports.click = input.click;
exports.moveTo = input.moveTo;