var fs = require("fs");

async function buildLog(results, config) {
    var logString = "";

    logString += "Collection Statuses:"

    // Log Collection status for each casino
    for (key in config.collect) {
        // Print name
        var nameString = key;
        while (nameString.length < 12) {nameString += " "}
        

        logString += "\n\t" + nameString[0].toUpperCase() + nameString.slice(1) + ": ";

        if (config.collect[key]) {
            if (!results[key]) {
                logString += "Error";
            } else {
                logString += (results[key].collectSuccess) ? "Success" : "Failure";
                if (results[key].totalValueLocked) {
                    logString += ", TLV - $" + (results[key].totalValueLocked);
                }
            }
        } else {
            logString += "Not configured to collect";
        }
    }

    logString += "\n\n\nAdditional Messages:"

    // Log any additional messages if there were any
    if (results.general && results.general.messages) {
        for (var i = 0; i < results.general.messages.length; i++) {
            logString += "\n" + results.general.message[0];
        }
    } else {
        logString += " None";
    }

    var epochDate = new Date();
    var date = (epochDate.getMonth() + 1) + '-' + epochDate.getDate() + '-' +  epochDate.getFullYear();

    fs.writeFileSync('./logs/' + date + '.txt', logString);

    return;
}

exports.buildLog = buildLog;