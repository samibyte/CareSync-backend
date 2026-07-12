import z from "zod";
import { AppointmentStatus } from "../../../generated/prisma/enums.js";

export const changeAppointmentStatusZodSchema = z.object({
  status: z.nativeEnum(AppointmentStatus, {
    message: "Invalid appointment status",
  }),
});
