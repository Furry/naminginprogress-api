const meta = {
    name: "transparency",
    route: "proxies",
    description: "Upon GET request, it returns the incoming request's IP address, and determines the transparency from the request's headers.",
    methods: ["GET"],
    dependencies: []
}

function intersect(a, b) {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    return Array.from(intersection);
}

const executor = (req, res, next) => {
    const ip = req.ip || (req.connection.remoteAddress || req.socket.remoteAddress);
    let anonymity;
    if (intersect(Object.keys(req.headers).map(x => x.toLowerCase()), ["x-forwarded-for", "x-real-ip", "via", "x-forwarded-for", "x-proxy-id", "from", "proxy-connection", "proxy-authorization"]).length == 0) {
        anonymity = "elite";
    } else if (!JSON.stringify(req.headers).includes(ip)) {
        anonymity = "anonymous";
    } else {
        anonymity = "transparent";
    }

    res.json({
        at: Date.now(),
        level: anonymity,
    });
}

module.exports = {
    meta,
    executor
}