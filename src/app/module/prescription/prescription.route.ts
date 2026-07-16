import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { PrescriptionController } from "./prescription.controller.js";
import { PrescriptionValidation } from "./prescription.validation.js";

const router = Router();

router.post(
  "/",
  checkAuth(Role.DOCTOR),
  validateRequest(PrescriptionValidation.createPrescriptionZodSchema),
  PrescriptionController.createPrescription,
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  PrescriptionController.getPrescriptions,
);

export const PrescriptionRoutes = router;
