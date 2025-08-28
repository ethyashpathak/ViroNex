//the most crazyy thing about this file is we can reuse it in any project which involves file uploading and stuffs...
//this comment is just for editing and segregating the git commit history

import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
     api_key: process.env.CLOUDINARY_API_KEY, 
     api_secret: process.env.CLOUDINARY_API_SECRET 
});

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with details from env file..
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // If the file path is missing, don't bother trying to upload.
    if (!localFilePath) return null;

    // Upload the file to Cloudinary. The "auto" resource_type tells
    // Cloudinary to automatically detect the file type (image, video, etc.).
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // The file has been uploaded successfully.
    // Now, we can remove the temporary file from our local server,very important step!!!!
    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
    // An error occurred during the upload process.
    // We should still remove the local file as a cleanup operation,pretty damn obvious!
    fs.unlinkSync(localFilePath);
    
    // self-explanatory!...
    return null;
  }
};

export { uploadOnCloudinary };