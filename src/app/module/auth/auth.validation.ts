import z from "zod";

export const AuthValidation = {
  registerPatient: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name must be at most 60 characters"),
    email: z.email("Invalid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be at most 100 characters"),
  }),

  login: z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),

  verifyEmail: z.object({
    email: z.email("Invalid email address"),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 characters")
      .regex(/^\d{6}$/, "OTP must be 6 digits"),
  }),

  forgetPassword: z.object({
    email: z.email("Invalid email address"),
  }),

  resetPassword: z.object({
    email: z.email("Invalid email address"),
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 characters")
      .regex(/^\d{6}$/, "OTP must be 6 digits"),
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be at most 100 characters"),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters")
      .max(100, "New password must be at most 100 characters"),
  }),
};
