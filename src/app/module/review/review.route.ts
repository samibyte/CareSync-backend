import { Router } from "express";
import { Role } from "../../../generated/prisma/enums.js";
import { checkAuth } from "../../middleware/checkAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { ReviewController } from "./review.controller.js";
import { ReviewValidation } from "./review.validation.js";

const router = Router();

// Create a review (Patient only)
router.post(
  "/",
  checkAuth(Role.PATIENT),
  validateRequest(ReviewValidation.createReviewZodSchema),
  ReviewController.createReview,
);

// Admin/all roles: role-filtered list
router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  ReviewController.getReviews,
);

// Patient: view reviews they have submitted
router.get(
  "/my-reviews",
  checkAuth(Role.PATIENT),
  ReviewController.getMyReviews,
);

// Doctor: view reviews they have received
router.get(
  "/my-received",
  checkAuth(Role.DOCTOR),
  ReviewController.getMyReceivedReviews,
);

// Public: all reviews for a specific doctor (doctor profile pages, no auth needed)
router.get(
  "/doctor/:doctorId",
  ReviewController.getReviewsByDoctor,
);

// Any role: get single review by ID (ownership enforced in service)
router.get(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.DOCTOR, Role.PATIENT),
  ReviewController.getReviewById,
);

export const ReviewRoutes = router;
