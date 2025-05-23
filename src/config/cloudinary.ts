// core/cloudinary/config.ts
import { v2 as cloudinary } from 'cloudinary';

export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}


export const getImageUrl = (publicId: string, options: Record<string, any> = {}) => {
  return cloudinary.url(publicId, {
    secure: true,
    fetch_format: "auto",
    ...options
  })
}