import { Resolver } from "./managers/resolver.js";
import express from "express";
import { Logger } from "./managers/logger.js";

import fs from "fs";
import https from "https";

const privateKey = fs.readFileSync("./certs/private.key.pem", "utf8");
const certificate = fs.readFileSync("./certs/domain.cert.pem", "utf8");

const server = express();

server.use(Logger.middleware);

new Resolver(server);

server.listen(80, () => {
    Logger.log("Server started on port 80!", "green");
})

https.createServer({
    key: privateKey,
    cert: certificate
}, server).listen(443, () => {
    Logger.log("Server started on port 443!", "green");
})