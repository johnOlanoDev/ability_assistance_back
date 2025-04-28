import { Response } from "express";

export const sendResponseSuccess = (
  res: Response,
  statusCode: number,
  message: string,
  data: any,
  success: boolean
) => {
  res.status(statusCode).json({
    message,
    data,
    success,
  });
};

export const sendResponseError = (
  res: Response,
  statusCode: number,
  message: string,
) => {
  res.status(statusCode).json({
    message,
  });
};
