var fs = require("fs");
var jsonMinify = require("jsonminify");

/**
 * Synchronously loads and parses json config
 * @returns {Object} Config file
 */
function loadConfig() {
    // Load config and convert to string
    var configFile = fs.readFileSync("./config.json").toString();

    // Remove comments from JSON
    configFile = JSON.minify(configFile);

    // Parse and return
    config = JSON.parse(configFile);
    return config;
}

exports.loadConfig = loadConfig;