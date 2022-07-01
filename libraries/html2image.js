const html2image = require("node-image-from-html");
const browserHandler = new html2image.BrowserHandler({
    concurrency: 5,
    disableJavascript: true
})

browserHandler.start().then(() => {
    console.log("Browser Started.")
})

const meta = {
    name: "render",
    route: "images",
    description: "Upon POST request with valid HTML, it will render it to an image and return the base64 for it.",
    methods: ["post"],
    dependencies: ["node-html-to-image"]
}
    
const executor = async (req, res, next) => {
    const content = req.body.toString("utf8");
    try {
        const buf = await browserHandler.render(content, {
            selector: "#entry",
            omitBackground: true
        });
        res.setHeader("Content-Type", "image/png");
        res.send(buf);
    } catch (e) {
        console.log(e)
        res.status(500).send("Error rendering HTML.")
    }
}

module.exports = {
    meta,
    executor
}