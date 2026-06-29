import { Request, Response } from "express";
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { UserService } from "./user.service.js";

const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await UserService.createDoctor(payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Doctor registered successfully",
    data: result,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await UserService.createAdmin(payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Admin registered successfully",
    data: result,
  });
});

export const UserController = {
  createDoctor,
  createAdmin,
};
