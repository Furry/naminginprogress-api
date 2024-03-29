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

    // Print headers
    console.log(req.headers);

    // File Name
    const name = req.headers["x-file-name"] ? req.headers["x-file-name"].replace(/\.[^/.]+$/, "") : "file";

    // File Type
    const type = req.headers["x-file-type"] ?
        req.headers["x-file-type"].replace(/image\//, "") :
        req.headers["x-file-name"] ? req.headers["x-file-name"].split(".").pop() : mime.extension(req.headers["content-type"]);


    const domains = (req.headers["domains"] || "http://naminginprogress.com").split(",");
    let domain = domains[Math.floor(Math.random() * domains.length)];

    // If it starts with http:// or https://, remove it.
    if (domain.startsWith("http://") || domain.startsWith("https://")) {
        domain = domain.substring(domain.indexOf("//") + 2);
    }

    // Save the file in "/files/" + name + "." + type"
    const id = genId();

    // Check if it's a image type.
    let newPath;
    let label;
    if (!["png", "jpg", "jpeg", "gif", "webp"].includes(type)) {
        label = `${id}-${name}.${type}`;
        newPath = path.join(__dirname, `../../static/uploads/${label}`);
    } else {
        label = `${id}.${type}`;
        newPath = path.join(__dirname, `../../static/uploads/${label}`);
    }

    console.log("uploading to", newPath);
    fs.writeFileSync(newPath, data);

    res.json({
        at: Date.now(),
        url: `http://${domain}/s/${label}`
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
        limit: "50gb",
        type: "*/*"
    }))

    return router;
}

module.exports = {
    meta,
    executor,
    router: router()
}