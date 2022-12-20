import { Resolver } from "./managers/resolver.js";
import express from "express";
import cors from "cors";
import { Logger } from "./managers/logger.js";

import fs from "fs";
import https from "https";

const privateKey = fs.readFileSync("./certs/private.key.pem", "utf8");
const certificate = fs.readFileSync("./certs/domain.cert.pem", "utf8");
const ca = fs.readFileSync("./certs/intermediate.cert.pem", "utf8");

const server = express();

server.use(Logger.middleware);
server.use(express.raw({ type: "*/*", limit: "1mb" }));
server.use(express.json({ limit: "1mb" }));
server.use(cors());

new Resolver(server);

server.listen(80, () => {
    Logger.log("Server started on port 80!", "green");
})

server.get("/upload", (req, res) => {
    // Send ./web/upload.html
    // It's back one directory from __dirname
    res.sendFile(__dirname + "/../web/upload.html");
})

https.createServer({
    key: privateKey,
    cert: certificate
}, server).listen(443, () => {
    Logger.log("Server started on port 443!", "green");
})