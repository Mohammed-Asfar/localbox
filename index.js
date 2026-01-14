const express = require("express");
const fs = require("fs-extra");
const mime = require("mime-types");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static("public"));

const STORAGE = "/mnt/storage";


const CATEGORIES = {
    images: ["image/"],
    documents: ["application/pdf", "text/", "application/msword"],
    archives: ["application/zip", "application/x-rar", "application/x-7z"],
    videos: ["video/"]
};

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/hooks", async (req, res) => {
    try {
        const uploadedPath = req.body.Upload.Storage.Path;
        const fileName = path.basename(uploadedPath);
        const mimeType = mime.lookup(uploadedPath) || "";

        let target = "others";
        for (const [folder, types] of Object.entries(CATEGORIES)) {
            if (types.some(t => mimeType.startsWith(t))) {
                target = folder;
                break;
            }
        }

        await fs.move(uploadedPath, path.join(STORAGE, target, fileName));
        console.log(`✔ ${fileName} → ${target}`);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

app.get("/files", async (req, res) => {
    const result = {};
    for (const dir of await fs.readdir(STORAGE)) {
        if (dir === "tmp") continue;
        result[dir] = await fs.readdir(path.join(STORAGE, dir));
    }
    res.json(result);
});

app.listen(4000, () => {
    console.log("LocalBox running at http://localhost:4000");
});
