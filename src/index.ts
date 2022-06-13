import { Resolver } from "./managers/resolver.js";
import express from "express";
import { Logger } from "./managers/logger.js";

const server = express();

server.use(Logger.middleware);
server.listen(80, () => {
    new Resolver(server);
    Logger.log("Server started!", "green");
})