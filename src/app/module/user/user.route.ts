import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { UserController } from "./user.controller.js";
import { createDoctorZodSchema } from "./user.validation.js";

const router = Router();

router.post(
  "/create-doctor",

  //     (req: Request, res: Response, next: NextFunction) => {

  //     const parsedResult = createDoctorZodSchema.safeParse(req.body);

  //     if (!parsedResult.success) {
  //         next(parsedResult.error)
  //     }

  //     //sanitizing the data
  //     req.body = parsedResult.data;

  //     next()

  // },

  validateRequest(createDoctorZodSchema),

  UserController.createDoctor,
);

router.post(
  "/create-admin",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  UserController.createAdmin,
);

export const UserRoutes = router;
