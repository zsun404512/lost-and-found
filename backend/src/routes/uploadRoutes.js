import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import sharp from 'sharp';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';
import Image from '../models/imageModel.js';

const router = express.Router();

// file types to accept
function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Images only! (jpg, jpeg, png)'), false);
    }
}

// use in-memory storage so we can persist bytes directly to MongoDB
const storage = multer.memoryStorage();

// initialize upload middleware
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// upload route
router.post(
  '/',
  // only logged in users can upload images
  protect,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        return res
          .status(500)
          .json({ message: 'Database not connected; cannot store image.' });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ message: 'No file provided or invalid file type' });
      }
      const MAX_SIZE_BYTES = 400 * 1024;
      const TARGET_SIZE_BYTES = 200 * 1024;

      const SUPPORTED_FORMATS_MESSAGE = 'Supported formats: JPG, JPEG, PNG.';

      const metadata = await sharp(req.file.buffer).metadata();

      if (!metadata.format || !['jpeg', 'png'].includes(metadata.format)) {
        return res.status(400).json({
          message: `Unsupported image format. ${SUPPORTED_FORMATS_MESSAGE}`,
        });
      }
      const originalSize = req.file.buffer.length;

      // If the original upload is already within the target, do not
      // recompress it. This allows very small images (e.g. 10KB) to remain
      // effectively unchanged and avoids lowering quality unnecessarily.
      if (originalSize <= TARGET_SIZE_BYTES) {
        const imageDoc = await Image.create({
          data: req.file.buffer,
          contentType: req.file.mimetype || 'image/jpeg',
          owner: req.user.userId,
        });

        return res.status(201).json({
          message: 'Image uploaded successfully',
          imageId: imageDoc._id,
        });
      }

      

      const maxWidth =
        metadata.width && metadata.width > 1600 ? 1600 : metadata.width;

      const qualities = [90, 80, 70, 60, 50, 40];

      let bestBuffer = null;
      let bestDiff = Number.POSITIVE_INFINITY;

      // Try JPEG qualities in descending order, stopping early at the first
      // result under the target, while enforcing a hard cap.
      for (const quality of qualities) {
        const transformer = sharp(req.file.buffer)
          .resize({
            width: maxWidth,
            height: maxWidth,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality });

        const buffer = await transformer.toBuffer();
        const size = buffer.length;

        if (size <= MAX_SIZE_BYTES) {
          const diff = Math.abs(size - TARGET_SIZE_BYTES);
          if (diff < bestDiff) {
            bestDiff = diff;
            bestBuffer = buffer;
          }

          // As soon as we get under the target at a given quality, we
          // stop probing lower qualities.
          if (size < TARGET_SIZE_BYTES) {
            break;
          }
        }
      }

      if (!bestBuffer) {
        return res.status(400).json({
          message:
            'Please upload a smaller image.',
        });
      }

      const imageDoc = await Image.create({
        data: bestBuffer,
        contentType: 'image/jpeg',
        owner: req.user.userId,
      });

      return res.status(201).json({
        message: 'Image uploaded successfully',
        imageId: imageDoc._id,
      });
    } catch (err) {
      return next(err);
    }
  },
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    return next();
  },
);

export default router;