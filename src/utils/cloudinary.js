//the most crazyy thing about this file is we can reuse it in any project which involves file uploading and stuffs...
//this comment is just for editing and segregating the git commit history

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // Clean up local file safely
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return response;
  } catch (error) {
    // Cleanup even on failure
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    console.error("Cloudinary upload error:", error.message);
    return null;
  }
};
const deleteFromCloudinary = async (fileUrl) => {
    try {
        // Extract public_id from Cloudinary URL
        const urlParts = fileUrl.split('/');
        const fileWithExtension = urlParts[urlParts.length - 1];
        const publicId = fileWithExtension.split('.')[0];
        
        // Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: fileUrl.includes('video') ? 'video' : 'image'
        });
        
        return result;
    } catch (error) {
        console.log("Error deleting from cloudinary:", error);
        return null;
    }
};

export { uploadOnCloudinary,deleteFromCloudinary };
