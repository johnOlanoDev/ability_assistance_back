import { Request } from "express";
import multer from "multer";

const storage = multer.memoryStorage(); // Almacena el archivo en memoria como Buffer


const fileFilter = (req:Request, file:Express.Multer.File, cb:multer.FileFilterCallback) => {

    if(!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new Error('Solo se permiten imagenes'));
    }

    if(!file.mimetype.startsWith('image/')) {
        return cb(new Error('Solo se permiten imagenes'));
    }

    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 2 // 2MB
    }
});

export const uploadlogo = upload.single('logo'); // nombre del campo en el formulario
export const uploadAvatar = upload.single('avatarUrl')