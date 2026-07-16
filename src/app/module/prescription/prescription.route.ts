import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { PrescriptionController } from "./prescription.controller.js";
import { PrescriptionValidation } from "./prescription.validation.js";

const router = Router();

// Create a prescription (Doctor only)
router.post(
  "/",
  checkAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
  PrescriptionController.createPrescription,
);

// Admin/Super-admin: get all prescriptions (role-filtered internally)
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  PrescriptionController.getPrescriptions,
);

// Patient: view their own received prescriptions
router.get(
  "/my-prescriptions",
  checkAuth(Role.PATIENT),
  PrescriptionController.getMyPrescriptions,
);

// Doctor: view prescriptions they have issued
router.get(
  "/my-issued",
  checkAuth(Role.DOCTOR),
  PrescriptionController.getMyIssuedPrescriptions,
);

// Any role: get a single prescription by ID (with ownership validation in service)
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  PrescriptionController.getPrescriptionById,
);

export const PrescriptionRoutes = router;
