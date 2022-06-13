import express, { Request, Response, NextFunction } from "express";

import * as fs from "fs";
import { Logger } from "./logger.js";
import crypto from "crypto";

export interface Library {
    executor: (req: Request, res: Response, next: NextFunction) => void;
    meta: LibraryMeta
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
        this.watch();
        this.bind(this.server);

        // Use our main routes
        this.server.post("/load", this.dynLoad);
        this.server.get("/")
    }

    public load() {
        if (!fs.existsSync("./libraries"))
            fs.mkdirSync("./libraries");

        // For each .js file in the libraries folder, load it.
        for (const libFile of fs.readdirSync("./libraries").filter(f => f.endsWith(".js"))) {
            const contents = fs.readFileSync(`./libraries/${libFile}`, "utf8");
            try {
                const library: Library = eval(contents);
                this.libraries.push(library);
            } catch (e) {
                Logger.log(`Failed to load library ${libFile}`, "red");
            }
        }
    }

    public bind(server: express.Router) {
        for (const library of this.libraries) {
            // server.use(library.meta.route, library.executor);
            let route = `/api/${library.meta.route}/${library.meta.name}`;
            for (const method of library.meta.methods) {
                (server as any)[method.toLowerCase()](route, library.executor);
                Logger.log(`Bound ${library.meta.name}\n\t| Methods: ${library.meta.methods.join(", ")}\n\t| Route: ${route}`, "green")
            }
        }
    }

    public watch() {
        if (!this.watcher) {
            this.watcher = fs.watch("./libraries", { recursive: true }, (eventType, filename) => {
                if (filename.endsWith(".js")) {
                    Logger.log(`${filename} changed. Reloading...`, "yellow");
                    this.load();
                }
            });
        } else {
            Logger.log("Already watching libraries.", "yellow");
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
}