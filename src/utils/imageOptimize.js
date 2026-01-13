const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const { Readable } = require('stream');

/**
 * Optimize and upload image to Cloudinary
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<string>} - Cloudinary secure URL
 */
const optimizeAndSaveLocally = async (buffer, folder = 'articles') => {
    try {
        // 1. Optimize with Sharp first (optional, but good for consistent resizing before upload)
        const optimizedBuffer = await sharp(buffer)
            .resize(1200, 800, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toBuffer();

        // 2. Upload to Cloudinary
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `news-project/${folder}`, // Organized in a main folder
                    resource_type: 'image',
                    format: 'webp', // Ensure it's stored as webp
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary Upload Error:', error);
                        return reject(new Error('Cloudinary upload failed'));
                    }
                    resolve(result.secure_url);
                }
            );

            // Convert buffer to stream and pipe to Cloudinary
            Readable.from(optimizedBuffer).pipe(uploadStream);
        });

    } catch (error) {
        console.error('Error optimizing/uploading image:', error);
        throw new Error('Image handling failed');
    }
};

module.exports = { optimizeAndSaveLocally };
