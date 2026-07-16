import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { ReviewService } from "./review.service.js";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(
    req.user!,
    req.body,
  );
  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviews(req.user!);
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Reviews fetched successfully",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getReviews,
};
