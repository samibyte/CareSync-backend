import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { ScheduleController } from "./schedule.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { ScheduleValidation } from "./schedule.validation.js";

const router = Router();

router.post(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ScheduleValidation.createScheduleZodSchema),
  ScheduleController.createSchedule,
);
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR),
  ScheduleController.getAllSchedules,
);
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR),
  ScheduleController.getScheduleById,
);
router.patch(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(ScheduleValidation.updateScheduleZodSchema),
  ScheduleController.updateSchedule,
);
router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ScheduleController.deleteSchedule,
);

export const scheduleRoutes = router;
