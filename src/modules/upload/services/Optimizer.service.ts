// modules/upload/services/optimizer.service.ts
import sharp from 'sharp';
import { injectable } from 'tsyringe';

@injectable()
export class OptimizerService {
    async processImage(file: Express.Multer.File) {
        const optimizedBuffer = await sharp(file.path)
            .webp({ quality: 70 })
            .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();

        return {
            ...file,
            buffer: optimizedBuffer,
            mimetype: 'image/webp'
        };
    }
}