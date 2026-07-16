import { z } from "zod";

const createReviewZodSchema = z.object({
  body: z.object({
    appointmentId: z.string({
      message: "Appointment ID is required",
    }),
    patientId: z.string({
      message: "Patient ID is required",
    }),
    doctorId: z.string({
      message: "Doctor ID is required",
    }),
    rating: z.number({
      message: "Rating is required",
    }).min(1).max(5),
    comment: z.string().optional(),
  }),
});

export const ReviewValidation = {
  createReviewZodSchema,
};
