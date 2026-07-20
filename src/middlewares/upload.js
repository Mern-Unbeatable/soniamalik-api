import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir, { recursive: true });
}

const createStorage = (folderName = "services") => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadsDir = path.join(__dirname, `../../uploads/${folderName}`);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "_");
      cb(null, sanitizedName + "-" + uniqueSuffix + ext);
    },
  });
};

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

// Create multer instance for a specific folder
const createUpload = (folderName = "services") => {
  return multer({
    storage: createStorage(folderName),
    limits: {
      fileSize: 50 * 1024 * 1024,
    },
    fileFilter: fileFilter,
  });
};

// Middleware to handle single image upload
export const uploadSingleImage = (
  fieldName = "image",
  folderName = "services",
) => {
  return (req, res, next) => {
    const upload = createUpload(folderName);
    const singleUpload = upload.single(fieldName);

    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 10MB",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (req.file) {
        req.body[fieldName] = `${config.backendUrl}/uploads/${folderName}/${req.file.filename}`;
      }

      next();
    });
  };
};

// Middleware to handle multiple images for a single field (array)
export const uploadMultipleImages = (
  fieldName = "images",
  maxCount = 10,
  folderName = "services",
) => {
  return (req, res, next) => {
    const upload = createUpload(folderName);
    const multipleUpload = upload.array(fieldName, maxCount);

    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 10MB",
          });
        }
        if (err.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum is ${maxCount}`,
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (req.files && req.files.length > 0) {
        req.body[fieldName] = req.files.map(
          (file) => `${config.backendUrl}/uploads/${folderName}/${file.filename}`,
        );
      }

      next();
    });
  };
};

// Middleware to handle multiple different image fields for homepage sections
export const uploadHomepageImages = (folderName = "homepage") => {
  return (req, res, next) => {
    const upload = createUpload(folderName);

    const imageFields = [
      { name: "image", maxCount: 1 },
      { name: "aboutImages", maxCount: 10 },
      { name: "sportsProviderImg", maxCount: 1 },
      { name: "supportImg", maxCount: 1 },
      { name: "brandImg", maxCount: 1 },

      { name: "founderImage", maxCount: 1 }
    ];

    upload.fields(imageFields)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (req.files) {

        if (req.files.image?.[0]) {
          req.body.image =
            `${config.backendUrl}/uploads/${folderName}/${req.files.image[0].filename}`;
        }

        if (req.files.aboutImages?.length) {
          req.body.aboutImages = req.files.aboutImages.map(
            file =>
              `${config.backendUrl}/uploads/${folderName}/${file.filename}`
          );
        }

        if (req.files.sportsProviderImg?.[0]) {
          req.body.sportsProviderImg =
            `${config.backendUrl}/uploads/${folderName}/${req.files.sportsProviderImg[0].filename}`;
        }

        if (req.files.supportImg?.[0]) {
          req.body.supportImg =
            `${config.backendUrl}/uploads/${folderName}/${req.files.supportImg[0].filename}`;
        }

        if (req.files.brandImg?.[0]) {
          req.body.brandImg =
            `${config.backendUrl}/uploads/${folderName}/${req.files.brandImg[0].filename}`;
        }


        if (req.files.founderImage?.[0]) {
          req.body.founderImage =
            `${config.backendUrl}/uploads/${folderName}/${req.files.founderImage[0].filename}`;
        }
      }

      next();
    });
  };
};

export default createUpload;