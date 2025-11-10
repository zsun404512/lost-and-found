import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// file storage
const storage = multer.diskStorage({
    // save file to uploads folder
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    // create filename to avoid conflicts
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

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

// initialize upload middleware
const upload = multer({
    storage: storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// upload route
router.post(
    '/',
    // only logged in users can upload images
    protect,
    upload.single('image'),
    (req, res) => {
        // success upload will have file info
        if (req.file) {
            const imagePath = `/${req.file.path.replace(/\\/g, '/')}`;
            res.status(201).json({
                message: 'Image uploaded successfully',
                image: imagePath
            });
        } else {
            res.status(404).json({ message: 'No file provided or invalid file type' });
        }
    },
    // error handler for multer
    (err, req, res, next) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ message: err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    }
);

export default router;