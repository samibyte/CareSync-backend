/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import { deleteFileFromCloudinary } from "../config/cloudinary.config.js";
import { envVars } from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";
import { handleZodError } from "../errorHelpers/handleZodError.js";
import {
  TErrorResponse,
  TErrorSources,
} from "../interfaces/error.interface.js";

// Synchronous error handler — Express requires a 4-arg signature.
// Cloudinary cleanup is fire-and-forget to avoid blocking the response.
export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (envVars.NODE_ENV === "development") {
    console.log("Error from Global Error Handler", err);
  }

  if (req.file) {
    deleteFileFromCloudinary(req.file.path).catch((e) =>
      console.error("Cloudinary cleanup failed:", e),
    );
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const imageUrls = req.files.map((file) => file.path);
    Promise.all(imageUrls.map((url) => deleteFileFromCloudinary(url))).catch(
      (e) => console.error("Cloudinary cleanup failed:", e),
    );
  }

  let errorSources: TErrorSources[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Internal Server Error";
  let stack: string | undefined = undefined;

  if (err instanceof z.ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode as number;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = err.message;
    stack = err.stack;
    errorSources = [
      {
        path: "",
        message: err.message,
      },
    ];
  }

  // Only expose internals in development
  const errorResponse: TErrorResponse = {
    success: false,
    message: message,
    errorSources,
    error: envVars.NODE_ENV === "development" ? err : undefined,
    stack: envVars.NODE_ENV === "development" ? stack : undefined,
  };

  res.status(statusCode).json(errorResponse);
};
