/* import {inject, injectable} from 'tsyringe';
import {CloudinaryService} from './cloudinary.service';
import {OptimizerService} from "./Optimizer.service";

@injectable()
export class UploadService {
    constructor(
        @inject('CloudinaryService') private cloudinary: CloudinaryService,
        @inject('OptimizerService') private optimizer: OptimizerService
    ) {
    }

    async uploadImage(file: Express.Multer.File, folder: string) {
        const optimizedFile = await this.optimizer.processImage(file);

        return this.cloudinary.upload(optimizedFile, folder);
    }
} */