const express = require("express");
const mime = require("mime-types");
const path = require("path");
const fs = require("fs");

const meta = {
    name: "upload",
    route: "files",
    description: "Upon POST request with a file, it will upload it to the server and return the URL for it.",
    methods: ["post"],
    dependencies: ["body-parser", "mime-types"]
}

const executor = async (req, res, next) => {
    // Binary Data
    const data = Buffer.from(req.body);

    // File Name
    const name = req.headers["x-file-name"];
    // File Type
    const type = req.headers["x-file-type"] || mime.extension(req.headers["content-type"]);

    const domains = (req.headers["domains"] || "http://naminginprogress.com").split(",");
    const domain = domains[Math.floor(Math.random() * domains.length)];
    // Save the file in "/files/" + name + "." + type"
    const id = genId();

    const newPath = path.join(__dirname, `../../static/uploads/${id}.${type}`);
    fs.writeFileSync(newPath, data);

    res.json({
        at: Date.now(),
        url: `http://${domain}/s/${id}.${type}`
    });
}

const genId = () => {
    // Generate a 6 character long base64 string.
    return Buffer.from(
        Math.random()
            .toString(36)
            .substring(2, 8))
        .toString("base64")
        .substring(0, 6);
}

const router = () => {
    const router = express.Router();

    router.use(require("body-parser").raw({
        limit: "50mb",
        type: "*/*"
    }))

    return router;
}

const getFileType = (bytes) => {

}

module.exports = {
    meta,
    executor,
    router: router()
}