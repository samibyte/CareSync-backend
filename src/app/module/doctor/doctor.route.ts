import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { DoctorController } from "./doctor.controller.js";
import { updateDoctorZodSchema } from "./doctor.validation.js";

const router = Router();

router.get(
  "/",
  // checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.getAllDoctors,
);
router.get(
  "/:id",
  DoctorController.getDoctorById,
);
router.get(
  "/admin/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.getDoctorByIdAdmin,
);
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(updateDoctorZodSchema),
  DoctorController.updateDoctor,
);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  DoctorController.deleteDoctor,
);

export const DoctorRoutes = router;
