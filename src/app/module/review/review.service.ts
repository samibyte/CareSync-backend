import status from "http-status";
import { Prisma } from "../../../generated/prisma/client.js";
import { Role } from "../../../generated/prisma/enums.js";
import AppError from "../../errorHelpers/AppError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { ICreateReviewPayload } from "./review.interface.js";

const createReview = async (user: IRequestUser, payload: ICreateReviewPayload) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: { email: user.email },
  });

  if (patientData.id !== payload.patientId) {
    throw new AppError(status.FORBIDDEN, "You cannot submit a review on behalf of another patient");
  }

  // Ensure appointment is COMPLETED and belongs to correct patient/doctor
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: payload.appointmentId },
  });

  if (appointment.patientId !== payload.patientId || appointment.doctorId !== payload.doctorId) {
    throw new AppError(status.BAD_REQUEST, "Appointment metadata mismatch (incorrect Patient or Doctor ID)");
  }

  if (appointment.status !== "COMPLETED") {
    throw new AppError(status.BAD_REQUEST, "Cannot review an incomplete appointment");
  }

  // Ensure review doesn't already exist for this appointment
  const existingReview = await prisma.review.findUnique({
    where: { appointmentId: payload.appointmentId },
  });

  if (existingReview) {
    throw new AppError(status.BAD_REQUEST, "You have already reviewed this appointment");
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Create the review
    const review = await tx.review.create({
      data: {
        appointmentId: payload.appointmentId,
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        rating: payload.rating,
        comment: payload.comment,
      },
      include: {
        doctor: true,
        patient: true,
        appointment: true,
      },
    });

    // 2. Recalculate average rating for the doctor
    const doctorReviews = await tx.review.findMany({
      where: { doctorId: payload.doctorId },
    });

    const totalRatings = doctorReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings / doctorReviews.length;

    await tx.doctor.update({
      where: { id: payload.doctorId },
      data: {
        averageRating,
      },
    });

    return review;
  });

  return result;
};

const getReviews = async (user: IRequestUser) => {
  const whereConditions: Prisma.ReviewWhereInput = {};

  if (user?.role === Role.DOCTOR) {
    const doctorData = await prisma.doctor.findUnique({
      where: { email: user.email },
    });
    if (!doctorData) {
      throw new AppError(status.NOT_FOUND, "Doctor profile not found");
    }
    whereConditions.doctorId = doctorData.id;
  } else if (user?.role === Role.PATIENT) {
    const patientData = await prisma.patient.findUnique({
      where: { email: user.email },
    });
    if (!patientData) {
      throw new AppError(status.NOT_FOUND, "Patient profile not found");
    }
    whereConditions.patientId = patientData.id;
  } else if (user?.role !== Role.ADMIN && user?.role !== Role.SUPER_ADMIN) {
    throw new AppError(status.FORBIDDEN, "Access forbidden for this role");
  }

  const result = await prisma.review.findMany({
    where: whereConditions,
    include: {
      doctor: true,
      patient: true,
      appointment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

export const ReviewService = {
  createReview,
  getReviews,
};
