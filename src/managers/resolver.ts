import express, { Request, Response, NextFunction, Router } from "express";

import * as fs from "fs";
import { Logger } from "./logger.js";
import crypto from "crypto";
import nodedir from "node-dir";

export interface Library {
    executor: (req: Request, res: Response, next: NextFunction) => void;
    meta: LibraryMeta,
    router?: Router
}

export interface LibraryMeta {
    name: string,
    route: string,
    description: string,
    dependencies: string[],
    methods: string[]
}

export class Resolver {
    private libraries: Library[] = [];
    private watcher: fs.FSWatcher | null = null;
    private hash = "9bb66c680e4d76fa34577eb0ff6327ff29811dec8956e828ae3e456c6dba5258";
    private server: express.Express;

    constructor(_server: express.Express) {
        this.server = _server;
        this.load();

        // Use our main routes
        this.bindDefaults();
    }

    public load() {
        if (!fs.existsSync("./libraries"))
            fs.mkdirSync("./libraries");

        // Use a file walker to collect every single file in the libraries directory.
        nodedir.files("./libraries", (err, files) => {
            for (const file of files) {
                if (file.endsWith(".js")) {
                    // Load the file.

                    try {
                        const library: Library = eval(fs.readFileSync(file, "utf8"));
                        this.libraries.push(library);
                    } catch (e) {
                        Logger.log(`Failed to load library ${file} with error ${e}`, "red");
                    }
                }
            }

            // Bind the libraries.
            this.bind(this.server);
        })
    }

    public bind(server: express.Router) {
        for (const library of this.libraries) {
            // server.use(library.meta.route, library.executor);
            let route = `/api/${library.meta.route}/${library.meta.name}`;
            let handler = library.router || server;

            for (const method of library.meta.methods) {
                (handler as any)[method.toLowerCase()](route, library.executor);
                Logger.log(`Bound ${library.meta.name}\n\t| Methods: ${library.meta.methods.join(", ")}\n\t| Route: ${route}`, "green")
            }

            if (library.router) {
                server.use("/", library.router);
            }
        }
    }

    public dynLoad(req: Request, res: Response, next: NextFunction) {
        // insure the authorization header hash matches the stored hash.
        let calculatedHash = crypto.createHash("sha256").update(req.headers.authorization ? req.headers.authorization : "N/A").digest("hex");
        if (req.headers["authorization"] !== this.hash && calculatedHash !== this.hash) {
            res.status(401).send("Unauthorized");
            return;
        }

        if (!req.body) {
            res.status(400).send("No body");
            return;
        }

        // Evaluate the request body.
        const evalbody = eval(req.body);
        if (evalbody.name && evalbody.route && evalbody.description && evalbody.dependencies && evalbody.methods && evalbody.executor) {
            const result = evalbody as Library;
            // Create the library file.
            const libraryFile = `./libraries/${result.meta.name}.js`;
            fs.writeFileSync(libraryFile, req.body);

            // Load the library.
            this.load();
            // Bind the library.
            this.bind(this.server);
        }
    }

    private bindDefaults() {
        this.server.post("/load", this.dynLoad);

        this.server.get("/s/:id", (req, res) => {
            // Send the file in the ./static directory.
            res.sendFile(req.params.id, { root: "./static/uploads" });
        })

        this.server.get("/", (req, res) => {
            res.redirect("https://discord.gg/tamVs2Ujrf")
        })
    }
}