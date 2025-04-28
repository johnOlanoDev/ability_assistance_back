import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '@/middleware/errors/AppError';
import streamifier from 'streamifier';
import { injectable } from 'tsyringe';


@injectable()
export class CloudinaryService {
    
  async uploadBuffer(fileBuffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(new AppError(`Error al subir imagen a Cloudinary: ${error.message}`, 500));
          return resolve(result?.public_id || '');
        }
      );
      
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo de Cloudinary:', error);
      throw new AppError('Error eliminando archivo de Cloudinary', 500);
    }
  }

  getImageUrl(publicId: string, transformations = {}): string {
    return cloudinary.url(publicId, transformations);
  }
}
