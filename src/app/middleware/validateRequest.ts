import { NextFunction, Request, Response } from "express";
import status from "http-status";
import z from "zod";
import AppError from "../errorHelpers/AppError.js";

export const validateRequest = (zodSchema: z.ZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      try {
        req.body = JSON.parse(req.body.data);
      } catch {
        return next(
          new AppError(status.BAD_REQUEST, "Invalid JSON in request body"),
        );
      }
    }

    const parsedResult = zodSchema.safeParse(req.body);

    if (!parsedResult.success) {
      return next(parsedResult.error);
    }

    // Sanitize the body to only contain schema-validated fields
    req.body = parsedResult.data;

    next();
  };
};
