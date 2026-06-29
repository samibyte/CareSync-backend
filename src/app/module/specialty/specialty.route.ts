import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { multerUpload } from "../../config/multer.config.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { SpecialtyController } from "./specialty.controller.js";
import { SpecialtyValidation } from "./specialty.validation.js";

const router = Router();

router.post(
  "/",
  // checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  multerUpload.single("file"),
  validateRequest(SpecialtyValidation.createSpecialtyZodSchema),
  SpecialtyController.createSpecialty,
);
router.get("/", SpecialtyController.getAllSpecialties);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  SpecialtyController.deleteSpecialty,
);

export const SpecialtyRoutes = router;
