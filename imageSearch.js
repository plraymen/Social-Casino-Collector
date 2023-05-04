var fs = require("fs");
var jimp = require("jimp");
/**
 * Finds the first x, y position of the findImage in the baseImage
 * @param {*} findImage 
 * @param {*} baseImage 
 * @returns False if image not found | {x, y, height, width} if image is found
 */
async function matchImage(findImage, baseImage, precision) {
    if (!precision) {
        precision = 30;
    }

    var findImage = await loadImage(findImage);
    var baseImage = await loadImage(baseImage);

    var edgeRight = Math.floor(findImage.bitmap.width * 1);
    var edgeBottom = Math.floor(findImage.bitmap.height * 1);

    // i = x; j = y
    // Don't need to check near the right and bottom edges
    for (var i = 0; i < baseImage.bitmap.width - edgeRight; i++) {
        for (var j = 0; j < baseImage.bitmap.height - edgeBottom; j++) {
            var currentPixel = jimp.intToRGBA(baseImage.getPixelColour(i, j));
            var found = await searchPixel(i, j, findImage, baseImage, precision);

            if (found) {
                return {
                    x: i,
                    y: j,
                    width: findImage.bitmap.width,
                    height: findImage.bitmap.height,
                }
            }
        }
    }

    return false;
}

async function searchPixel(i, j, findImage, baseImage, precision) {
    var findAverage = {r: 0, g: 0, b: 0};
    var baseAverage = {r: 0, g: 0, b: 0};
    var pixelCounter = 0;
    // k = x, l = y
    // (var i = 0; i < baseImage.bitmap.width - edgeRight; i++) {
    // (var j = 0; j < baseImage.bitmap.height - edgeBottom; j++) {
    for (var k = 0; k < findImage.bitmap.width; k++) {
        for (var l = 0; l < findImage.bitmap.height; l++) {
            pixelCounter += 1;
            var findCurrentPixel = jimp.intToRGBA(findImage.getPixelColour(k, l));
            var baseCurrentPixel = jimp.intToRGBA(baseImage.getPixelColour(i+k, j+l));

            findAverage.r += findCurrentPixel.r;
            findAverage.g += findCurrentPixel.g;
            findAverage.b += findCurrentPixel.b;

            baseAverage.r += baseCurrentPixel.r;
            baseAverage.g += baseCurrentPixel.g;
            baseAverage.b += baseCurrentPixel.b;

            // Only check averages every 4th pixel
            if (l % 4 == 3) {
                var averageDifferences = {r: 0, g: 0, b: 0}

                averageDifferences.r = Math.abs((findAverage.r - baseAverage.r) / pixelCounter);
                averageDifferences.g = Math.abs((findAverage.g - baseAverage.g) / pixelCounter);
                averageDifferences.b = Math.abs((findAverage.b - baseAverage.b) / pixelCounter);

                //console.log(j, "x:" + k + ", y: " + l, averageDifferences, findCurrentPixel, baseCurrentPixel);

                if (averageDifferences.r > precision || averageDifferences.g > precision || averageDifferences.b > precision) {
                    return false;
                }
            }
        }
    }

    return true;
}

async function loadImage(path) {
    var temp;
    const promises = async temp => {
      try {
            const image = await jimp.read(path);
            return image;
        } catch (message) {
            return console.error(message);
        }
    };
  
    return await promises();
}

async function init() {

    var printer = await matchImage("./images/passwordPopup.png", "screenCapture.png");
    console.log(printer);
}

//init();

exports.matchImage = matchImage;