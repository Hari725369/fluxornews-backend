const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (we'll upload to Cloudinary from memory)
const storage = multer.memoryStorage();

// File filter - only accept images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, JPG, PNG, WebP) are allowed!'));
    }
};

// Upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 3 * 1024 * 1024, // 3MB max file size
    },
    fileFilter: fileFilter,
});

module.exports = upload;
