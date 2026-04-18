const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - The file buffer from multer
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (e.g. 'petverse/pets')
 * @param {string} [options.resourceType] - Resource type ('image' or 'raw')
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: options.folder || 'petverse',
            resource_type: options.resourceType || 'image',
            transformation: options.transformation || [
                { quality: 'auto', fetch_format: 'auto' }
            ]
        };

        const stream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        );

        stream.end(buffer);
    });
};

/**
 * Upload multiple file buffers to Cloudinary
 * @param {Array<{buffer: Buffer, mimetype: string}>} files - Array of multer files
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Array<{url: string, publicId: string}>>}
 */
const uploadMultipleToCloudinary = async (files, folder) => {
    const uploads = files.map(file =>
        uploadToCloudinary(file.buffer, { folder })
    );
    return Promise.all(uploads);
};

/**
 * Delete a file from Cloudinary by public ID
 * @param {string} publicId
 * @returns {Promise}
 */
const deleteFromCloudinary = async (publicId) => {
    return cloudinary.uploader.destroy(publicId);
};

/**
 * Delete multiple files from Cloudinary
 * @param {string[]} publicIds
 * @returns {Promise}
 */
const deleteMultipleFromCloudinary = async (publicIds) => {
    if (!publicIds || publicIds.length === 0) return;
    return cloudinary.api.delete_resources(publicIds);
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    deleteFromCloudinary,
    deleteMultipleFromCloudinary
};
