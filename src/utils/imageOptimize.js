const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Optimize and save image locally
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Subfolder name (e.g., 'news-articles', 'logos')
 * @returns {Promise<string>} - Local file URL
 */
const optimizeAndSaveLocally = async (buffer, folder = 'articles') => {
    try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, '../../uploads', folder);
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join(uploadsDir, filename);

        // Optimize image with sharp - convert to WebP
        await sharp(buffer)
            .resize(1200, 800, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toFile(filepath);

        // Return URL path (served by Express static middleware)
        return `/uploads/${folder}/${filename}`;
    } catch (error) {
        console.error('Error optimizing/saving image:', error);
        throw new Error('Image optimization failed');
    }
};

module.exports = { optimizeAndSaveLocally };
