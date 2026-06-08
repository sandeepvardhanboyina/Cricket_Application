const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Fallback when cloudinary is not configured - store as base64 data URL
const uploadToCloudinary = (buffer, folder = 'cricket-hub') => {
  return new Promise((resolve, reject) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      return resolve(base64);
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

module.exports = { uploadToCloudinary };
