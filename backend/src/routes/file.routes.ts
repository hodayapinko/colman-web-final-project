import express from "express";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname
      .split(".")
      .filter(Boolean)
      .slice(1)
      .join(".");
    cb(null, Date.now() + "." + ext);
  },
});

const upload = multer({ storage: storage });

router.post("/", upload.single("file"), function (req, res) {
  if (!req.file) {
    res.status(400).send({ message: "No file uploaded" });
    return;
  }
  const base = "http://" + process.env.DOMAIN_BASE + ":" + process.env.PORT + "/";
  const filePath = req.file.path.replace(/\\/g, "/");
  console.log("router.post(/file: " + base + filePath);
  res.status(200).send({ url: base + filePath });
});

export default router;
