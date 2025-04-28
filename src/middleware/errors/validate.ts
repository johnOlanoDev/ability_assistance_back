import {Request, Response, NextFunction} from "express";
import {validationResult} from "express-validator";
import {AppError} from "./AppError";


export const validate = (req: Request, _res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map((error => error.msg))
        throw new AppError(messages.join(", "), 400);
    }
    next();
}