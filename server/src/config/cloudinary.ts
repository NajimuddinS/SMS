import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Check if Cloudinary credentials are set and not the default placeholder values
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_SECRET !== 'your_api_secret'
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary initialized successfully.');
} else {
  console.log('Cloudinary environment variables not configured. Falling back to local storage.');
}

export interface UploadResult {
  url: string;
  publicId: string;
}

/**
 * Uploads a photo buffer to Cloudinary, or saves it locally if Cloudinary is not configured.
 */
export const uploadPhoto = async (
  fileBuffer: Buffer,
  originalName: string
): Promise<UploadResult> => {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'student_management_system',
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error('Upload failed with empty result.'));
          }
        }
      );
      uploadStream.end(fileBuffer);
    });
  } else {
    // Local fallback
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const ext = path.extname(originalName) || '.jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, fileBuffer);

    // Return the relative endpoint URL
    const url = `/uploads/${filename}`;
    return {
      url,
      publicId: filename,
    };
  }
};

/**
 * Deletes a photo from Cloudinary, or deletes the local file if Cloudinary was not used.
 */
export const deletePhoto = async (publicId: string): Promise<void> => {
  if (!publicId) return;

  // Cloudinary public IDs for our folder usually start with "student_management_system"
  if (isCloudinaryConfigured && publicId.includes('student_management_system')) {
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted photo from Cloudinary: ${publicId}`);
    } catch (error) {
      console.error(`Failed to delete photo from Cloudinary: ${publicId}`, error);
    }
  } else {
    // Local fallback
    const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');
    const filePath = path.join(uploadDir, publicId);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Deleted local photo: ${publicId}`);
      } catch (error) {
        console.error(`Failed to delete local file: ${filePath}`, error);
      }
    }
  }
};
