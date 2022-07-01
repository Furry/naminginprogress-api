const fetch = require("node-fetch");;
const fs = require("fs");

const meta = {
    name: "change.org",
    route: "random",
    description: "Get the amount of petitions signed on change.org entry petition.",
    methods: ["GET"],
    dependencies: []
}

function cleanString(input) {
    var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127) {
            output += input.charAt(i);
        }
    }
    return output;
}

const cache = {};
const executor = async (req, res, next) => {
    let body;
    try {
        body = JSON.parse(req.body);
    } catch (_) { return res.send("Invalid Body. Please send a JSON object."); }

    if (!body.petition) {
        return res.send("Invalid Body. Please send a JSON object with a petition key.");
    }

    // If last cached is less than a minute ago, return the cached value.
    if (cache[body.petition] && cache[body.petition].lastCached > Date.now() - 60000) {
        return res.send(cache[body.petition].value);
    } else {
        try {
            const req = await fetch(`https://chng.it/${body.petition}`);
            const text = await req.text();
            const results = /({\"details\":\s?{.+\]\}\}\}\})/.exec(text);
            if (results == null) {
                return res.send("Could not find or process this petition.");
            }

            console.log(cleanString(results[1]))
            const data = JSON.parse(cleanString(results[1]));

            cache[body.petition] = {
                value: data,
                lastCached: Date.now()
            }
            return res.send(data);
        } catch (_) {
            return res.send("Could not find or process this petition.");
        }
    }
}

module.exports = {
    meta,
    executor
}