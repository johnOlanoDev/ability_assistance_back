/* // modules/upload/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { UploadService } from '../services/upload.service';

@injectable()
export class UploadController {
    constructor(
        @inject('UploadService') private uploadService: UploadService
    ) {}

    async handleUpload(req: Request, res: Response) {
        try {
            const file = req.file!;
            const folder = req.body.folder || 'default';

            const result = await this.uploadService.uploadImage(file, folder);
            res.json({ url: result });

        } catch (error: any) {
            this.handleError(error, res);
        }
    }

    private handleError(error: any, res: Response) {
        const cloudinaryError = error.error?.http_code;

        if (cloudinaryError === 413 || cloudinaryError === 409) {
            return res.status(507).json({
                code: 'STORAGE_LIMIT_EXCEEDED',
                message: 'El almacenamiento está lleno, elimine archivos antiguos'
            });
        }

        res.status(500).json({
            code: 'UPLOAD_FAILED',
            message: 'Error al procesar el archivo'
        });
    }
} */