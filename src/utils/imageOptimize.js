const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

/**
 * Optimize and upload image (Cloudinary in Prod, Local fallback in Dev)
 * @param {Buffer} buffer - Image buffer from multer
 * @param {string} folder - Folder name
 * @returns {Promise<string>} - Image URL
 */
const optimizeAndSaveLocally = async (buffer, folder = 'articles') => {
    try {
        // 1. Optimize with Sharp
        const optimizedBuffer = await sharp(buffer)
            .resize(1200, 800, {
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 85 })
            .toBuffer();

        // 2. CHECK ENVIRONMENT: Use Cloudinary if in Production OR if credentials exist
        const useCloudinary = process.env.NODE_ENV === 'production' ||
            (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'demo');

        if (useCloudinary) {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: `news-project/${folder}`,
                        resource_type: 'image',
                        format: 'webp',
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary Upload Error:', error);
                            return reject(new Error('Cloudinary upload failed'));
                        }
                        resolve(result.secure_url);
                    }
                );
                Readable.from(optimizedBuffer).pipe(uploadStream);
            });
        } else {
            // 3. FALLBACK: Save Locally (Development only)
            const uploadsDir = path.join(__dirname, '../../uploads', folder);
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            const filename = `image-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
            const filepath = path.join(uploadsDir, filename);

            // Write buffer to file
            await fs.promises.writeFile(filepath, optimizedBuffer);

            // Return local URL
            return `/uploads/${folder}/${filename}`;
        }

    } catch (error) {
        console.error('Error optimizing/uploading image:', error);
        throw new Error('Image handling failed');
    }
};

module.exports = { optimizeAndSaveLocally };
