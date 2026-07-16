import { z } from "zod";

const createPrescriptionZodSchema = z.object({
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
    followUpDate: z.string({
      message: "Follow up date is required",
    }),
    instructions: z.string({
      message: "Instructions are required",
    }),
  }),
});

export const PrescriptionValidation = {
  createPrescriptionZodSchema,
};
