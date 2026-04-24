import express from "express";
import multer from "multer";

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".").filter(Boolean).slice(1).join(".");
    cb(null, Date.now() + "." + ext);
  },
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * /api/file:
 *   post:
 *     summary: Upload a file
 *     description: Uploads a single file and returns its publicly accessible URL
 *     tags: [File]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: Public URL of the uploaded file
 *                   example: "http://localhost:3000/public/1713456789.jpg"
 *       400:
 *         description: No file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No file uploaded"
 */
router.post("/", upload.single("file"), function (req, res) {
  if (!req.file) {
    res.status(400).send({ message: "No file uploaded" });
    return;
  }
  const base =
    "http://" + process.env.DOMAIN_BASE + ":" + process.env.PORT + "/";
  const filePath = req.file.path.replace(/\\/g, "/");
  console.log("router.post(/file: " + base + filePath);
  res.status(200).send({ url: base + filePath });
});

export default router;
