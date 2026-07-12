/* eslint-disable @typescript-eslint/no-explicit-any */
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import cron from "node-cron";
import path from "path";
import qs from "qs";
import { envVars } from "./app/config/env.js";
import { auth } from "./app/lib/auth.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";
import { AppointmentService } from "./app/module/appointment/appointment.service.js";
import { PaymentController } from "./app/module/payment/payment.controller.js";
import { IndexRoutes } from "./app/routes/index.js";

const app: Application = express();
app.set("query parser", (str: string) => qs.parse(str));

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));

// 1. Secure HTTP Headers using helmet
app.use(helmet());

// 2. Stripe Webhook route requires raw body parsing
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  PaymentController.handleStripeWebhookEvent,
);

// 3. Configure CORS policy dynamically based on environment
const allowedOrigins = [
  envVars.FRONTEND_URL,
  envVars.BETTER_AUTH_URL,
];

if (envVars.NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:3000", "http://localhost:5000");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 4. Rate limiting for auth routes to prevent brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (15 mins)
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts, please try again after 15 minutes",
});

app.use("/api/v1/auth", authRateLimiter);

app.use("/api/auth", toNodeHandler(auth));

// Middleware to parse JSON bodies and URL-encoded form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Cron schedule cancel unpaid appointments
cron.schedule("*/25 * * * *", async () => {
  try {
    console.log("Running cron job to cancel unpaid appointments...");
    await AppointmentService.cancelUnpaidAppointments();
  } catch (error: any) {
    console.error(
      "Error occurred while canceling unpaid appointments:",
      error.message,
    );
  }
});

app.use("/api/v1", IndexRoutes);

// Basic route (health status returning 200 OK)
app.get("/", async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
