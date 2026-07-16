import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync.js";
import { sendResponse } from "../../shared/sendResponse.js";
import { PrescriptionService } from "./prescription.service.js";

const createPrescription = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.createPrescription(
    req.user!,
    req.body,
  );
  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    message: "Prescription created successfully",
    data: result,
  });
});

const getPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.getPrescriptions(req.user!);
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Prescriptions fetched successfully",
    data: result,
  });
});

const getMyPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.getMyPrescriptions(req.user!);
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "My prescriptions fetched successfully",
    data: result,
  });
});

const getMyIssuedPrescriptions = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.getMyIssuedPrescriptions(req.user!);
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Issued prescriptions fetched successfully",
    data: result,
  });
});

const getPrescriptionById = catchAsync(async (req: Request, res: Response) => {
  const result = await PrescriptionService.getPrescriptionById(
    req.user!,
    req.params.id as string,
  );
  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    message: "Prescription fetched successfully",
    data: result,
  });
});

export const PrescriptionController = {
  createPrescription,
  getPrescriptions,
  getMyPrescriptions,
  getMyIssuedPrescriptions,
  getPrescriptionById,
};
