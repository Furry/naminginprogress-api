import { Request, Response, NextFunction } from "express";
import "colors";

export class Logger {
    public static log(message: string, color: string = "white") {
        console.log(`[${new Date().toLocaleTimeString()}] ${(message as any)[color]}`);
    }

    public static middleware(req: Request, res: Response, next: NextFunction) {
        Logger.log(`${req.method} ${req.url}\n\t| Agent: ${req.headers["user-agent"]}\n\t| Address: ${req.ip}`, "blue");
        next();
    }
}