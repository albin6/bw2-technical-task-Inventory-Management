import multer from "multer";

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
