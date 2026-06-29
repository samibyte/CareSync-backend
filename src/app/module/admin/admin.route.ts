import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { AdminController } from "./admin.controller.js";
import { updateAdminZodSchema } from "./admin.validation.js";

const router = Router();

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAllAdmins,
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getAdminById,
);
router.patch(
  "/:id",
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(updateAdminZodSchema),
  AdminController.updateAdmin,
);
router.delete("/:id", checkAuth(Role.SUPER_ADMIN), AdminController.deleteAdmin);

export const AdminRoutes = router;
