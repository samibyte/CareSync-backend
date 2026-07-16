import { Prisma } from "../../../generated/prisma/client.js";
import status from "http-status";
import { Role } from "../../../generated/prisma/enums.js";
import AppError from "../../errorHelpers/AppError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { ICreatePrescriptionPayload } from "./prescription.interface.js";

const createPrescription = async (
  user: IRequestUser,
  payload: ICreatePrescriptionPayload,
) => {
  // Validate doctor role and credentials
  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: { email: user.email },
  });

  if (doctorData.id !== payload.doctorId) {
    throw new AppError(status.FORBIDDEN, "You cannot issue a prescription as another doctor");
  }

  // Ensure appointment exists, belongs to doctor & patient, and is COMPLETED
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: { id: payload.appointmentId },
  });

  if (appointment.doctorId !== payload.doctorId || appointment.patientId !== payload.patientId) {
    throw new AppError(status.BAD_REQUEST, "Appointment metadata mismatch (incorrect Doctor or Patient ID)");
  }

  if (appointment.status !== "COMPLETED") {
    throw new AppError(status.BAD_REQUEST, "Cannot issue prescription for an incomplete appointment");
  }

  // Create prescription
  const prescription = await prisma.prescription.create({
    data: {
      appointmentId: payload.appointmentId,
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      followUpDate: new Date(payload.followUpDate),
      instructions: payload.instructions,
    },
    include: {
      doctor: true,
      patient: true,
      appointment: true,
    },
  });

  return prescription;
};

const getPrescriptions = async (user: IRequestUser) => {
  const whereConditions: Prisma.PrescriptionWhereInput = {};

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

  const result = await prisma.prescription.findMany({
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

// Patient: view their own received prescriptions
const getMyPrescriptions = async (user: IRequestUser) => {
  const patientData = await prisma.patient.findUnique({
    where: { email: user.email },
  });

  if (!patientData) {
    throw new AppError(status.NOT_FOUND, "Patient profile not found");
  }

  const result = await prisma.prescription.findMany({
    where: { patientId: patientData.id },
    include: {
      doctor: {
        include: {
          specialties: {
            include: { specialty: true },
          },
        },
      },
      appointment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

// Doctor: view prescriptions they have issued
const getMyIssuedPrescriptions = async (user: IRequestUser) => {
  const doctorData = await prisma.doctor.findUnique({
    where: { email: user.email },
  });

  if (!doctorData) {
    throw new AppError(status.NOT_FOUND, "Doctor profile not found");
  }

  const result = await prisma.prescription.findMany({
    where: { doctorId: doctorData.id },
    include: {
      patient: true,
      appointment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return result;
};

// Any authenticated role: get a single prescription by ID (with ownership check)
const getPrescriptionById = async (user: IRequestUser, prescriptionId: string) => {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      doctor: true,
      patient: true,
      appointment: true,
    },
  });

  if (!prescription) {
    throw new AppError(status.NOT_FOUND, "Prescription not found");
  }

  // Admins can view any prescription
  if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
    return prescription;
  }

  // Patients can only view their own prescriptions
  if (user.role === Role.PATIENT) {
    const patientData = await prisma.patient.findUnique({
      where: { email: user.email },
    });
    if (!patientData || prescription.patientId !== patientData.id) {
      throw new AppError(status.FORBIDDEN, "You are not authorized to view this prescription");
    }
    return prescription;
  }

  // Doctors can only view prescriptions they issued
  if (user.role === Role.DOCTOR) {
    const doctorData = await prisma.doctor.findUnique({
      where: { email: user.email },
    });
    if (!doctorData || prescription.doctorId !== doctorData.id) {
      throw new AppError(status.FORBIDDEN, "You are not authorized to view this prescription");
    }
    return prescription;
  }

  throw new AppError(status.FORBIDDEN, "Access forbidden for this role");
};

export const PrescriptionService = {
  createPrescription,
  getPrescriptions,
  getMyPrescriptions,
  getMyIssuedPrescriptions,
  getPrescriptionById,
};
