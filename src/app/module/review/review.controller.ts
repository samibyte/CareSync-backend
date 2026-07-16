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

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getMyReviews(req.user!);
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "My reviews fetched successfully",
    data: result,
  });
});

const getMyReceivedReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getMyReceivedReviews(req.user!);
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Received reviews fetched successfully",
    data: result,
  });
});

const getReviewsByDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewsByDoctor(req.params.doctorId as string);
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Doctor reviews fetched successfully",
    data: result,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getReviewById(
    req.user!,
    req.params.id as string,
  );
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Review fetched successfully",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getReviews,
  getMyReviews,
  getMyReceivedReviews,
  getReviewsByDoctor,
  getReviewById,
};
