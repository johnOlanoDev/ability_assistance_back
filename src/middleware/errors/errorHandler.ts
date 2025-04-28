import {NextFunction, Request, Response} from "express";
import {AppError} from "./AppError";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {


    interface ErrorResponse {
        success: boolean,
        message: string;
        error?: string;
        details?: unknown;
    }

    const response: ErrorResponse = {
        success: false,
        message: err.message
    };

    if (process.env.NODE_ENV !== 'production') {
        response['error'] = err.stack;
        response['details'] = err;
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json(response);
    }

    // Errores no controllable
    console.error(`[${new Date().toISOString()}] Error:`, {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });


    res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: err.message
    })


}

