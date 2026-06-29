import { Router } from "express";
import { AdminRoutes } from "../module/admin/admin.route.js";
import { AppointmentRoutes } from "../module/appointment/appointment.route.js";
import { AuthRoutes } from "../module/auth/auth.route.js";
import { DoctorRoutes } from "../module/doctor/doctor.route.js";
import { DoctorScheduleRoutes } from "../module/doctorSchedule/doctorSchedule.route.js";
import { scheduleRoutes } from "../module/schedule/schedule.route.js";
import { SpecialtyRoutes } from "../module/specialty/specialty.route.js";
import { UserRoutes } from "../module/user/user.route.js";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/specialties", SpecialtyRoutes);
router.use("/users", UserRoutes);
router.use("/doctors", DoctorRoutes);
router.use("/admins", AdminRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/doctor-schedules", DoctorScheduleRoutes);
router.use("/appointments", AppointmentRoutes);

export const IndexRoutes = router;
