import status from "http-status";
import { v7 as uuidv7 } from "uuid";
import type { Prisma } from "../../../generated/prisma/client.js";
import { PaymentStatus, Role } from "../../../generated/prisma/enums.js";
import { envVars } from "../../config/env.js";
import { stripe } from "../../config/stripe.config.js";
import AppError from "../../errorHelpers/AppError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { AppointmentStatus } from "./../../../generated/prisma/enums.js";
import { IBookAppointmentPayload } from "./appointment.interface.js";

const bookAppointment = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const appointmentData = await tx.appointment.create({
        data: {
          doctorId: payload.doctorId,
          patientId: patientData.id,
          scheduleId: doctorSchedule.scheduleId,
          videoCallingId,
        },
      });

      await tx.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: payload.doctorId,
            scheduleId: payload.scheduleId,
          },
        },
        data: {
          isBooked: true,
        },
      });

      const transactionId = String(uuidv7());

      const paymentData = await tx.payment.create({
        data: {
          appointmentId: appointmentData.id,
          amount: doctorData.appointmentFee,
          transactionId,
        },
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "bdt",
              product_data: {
                name: `Appointment with Dr. ${doctorData.name}`,
              },
              unit_amount: doctorData.appointmentFee * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          appointmentId: appointmentData.id,
          paymentId: paymentData.id,
        },
        success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success`,
        cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments`,
      });

      return {
        appointmentData,
        paymentData,
        paymentUrl: session.url,
      };
    },
  );

  return {
    appointment: result.appointmentData,
    payment: result.paymentData,
    paymentUrl: result.paymentUrl,
  };
};

const getMyAppointments = async (user: IRequestUser) => {
  let appointments = [];

  if (user?.role === Role.PATIENT) {
    const patientData = await prisma.patient.findUnique({
      where: {
        email: user?.email,
      },
    });

    if (!patientData) {
      throw new AppError(status.NOT_FOUND, "Patient profile not found");
    }

    appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (user?.role === Role.DOCTOR) {
    const doctorData = await prisma.doctor.findUnique({
      where: {
        email: user?.email,
      },
    });

    if (!doctorData) {
      throw new AppError(status.NOT_FOUND, "Doctor profile not found");
    }

    appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  } else {
    throw new AppError(status.BAD_REQUEST, "Invalid user role");
  }

  return appointments;
};

const changeAppointmentStatus = async (
  appointmentId: string,
  appointmentStatus: AppointmentStatus,
  user: IRequestUser,
) => {
  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
    },
    include: {
      doctor: true,
    },
  });

  if (user?.role === Role.DOCTOR) {
    if (user?.email !== appointmentData.doctor.email) {
      throw new AppError(status.BAD_REQUEST, "This is not your appointment");
    }
  }

  return await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: appointmentStatus,
    },
  });
};

const getMySingleAppointment = async (
  appointmentId: string,
  user: IRequestUser,
) => {
  let appointment;

  if (user?.role === Role.PATIENT) {
    const patientData = await prisma.patient.findUnique({
      where: {
        email: user?.email,
      },
    });

    if (!patientData) {
      throw new AppError(status.NOT_FOUND, "Patient profile not found");
    }

    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: patientData.id,
      },
      include: {
        doctor: true,
        schedule: true,
      },
    });
  } else if (user?.role === Role.DOCTOR) {
    const doctorData = await prisma.doctor.findUnique({
      where: {
        email: user?.email,
      },
    });

    if (!doctorData) {
      throw new AppError(status.NOT_FOUND, "Doctor profile not found");
    }

    appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        doctorId: doctorData.id,
      },
      include: {
        patient: true,
        schedule: true,
      },
    });
  }

  if (!appointment) {
    throw new AppError(status.NOT_FOUND, "Appointment not found");
  }

  return appointment;
};

const getAllAppointments = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const appointments = await prisma.appointment.findMany({
    skip,
    take: limit,
    include: {
      doctor: true,
      patient: true,
      schedule: true,
    },
  });
  return appointments;
};

const bookAppointmentWithPayLater = async (
  payload: IBookAppointmentPayload,
  user: IRequestUser,
) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const doctorData = await prisma.doctor.findUniqueOrThrow({
    where: {
      id: payload.doctorId,
      isDeleted: false,
    },
  });

  const scheduleData = await prisma.schedule.findUniqueOrThrow({
    where: {
      id: payload.scheduleId,
    },
  });

  const doctorSchedule = await prisma.doctorSchedules.findUniqueOrThrow({
    where: {
      doctorId_scheduleId: {
        doctorId: doctorData.id,
        scheduleId: scheduleData.id,
      },
    },
  });

  const videoCallingId = String(uuidv7());

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const appointmentData = await tx.appointment.create({
        data: {
          doctorId: payload.doctorId,
          patientId: patientData.id,
          scheduleId: doctorSchedule.scheduleId,
          videoCallingId,
        },
      });

      await tx.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: payload.doctorId,
            scheduleId: payload.scheduleId,
          },
        },
        data: {
          isBooked: true,
        },
      });

      const transactionId = String(uuidv7());

      const paymentData = await tx.payment.create({
        data: {
          appointmentId: appointmentData.id,
          amount: doctorData.appointmentFee,
          transactionId,
        },
      });

      return {
        appointment: appointmentData,
        payment: paymentData,
      };
    },
  );

  return result;
};

const initiatePayment = async (appointmentId: string, user: IRequestUser) => {
  const patientData = await prisma.patient.findUniqueOrThrow({
    where: {
      email: user.email,
    },
  });

  const appointmentData = await prisma.appointment.findUniqueOrThrow({
    where: {
      id: appointmentId,
      patientId: patientData.id,
    },
    include: {
      doctor: true,
      payment: true,
    },
  });

  if (!appointmentData.payment) {
    throw new AppError(
      status.NOT_FOUND,
      "Payment data not found for this appointment",
    );
  }

  if (appointmentData.payment.status === PaymentStatus.PAID) {
    throw new AppError(
      status.BAD_REQUEST,
      "Payment already completed for this appointment",
    );
  }

  if (appointmentData.status === AppointmentStatus.CANCELED) {
    throw new AppError(status.BAD_REQUEST, "Appointment is canceled");
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "bdt",
          product_data: {
            name: `Appointment with Dr. ${appointmentData.doctor.name}`,
          },
          unit_amount: appointmentData.doctor.appointmentFee * 100,
        },
        quantity: 1,
      },
    ],
    metadata: {
      appointmentId: appointmentData.id,
      paymentId: appointmentData.payment.id,
    },
    success_url: `${envVars.FRONTEND_URL}/dashboard/payment/payment-success?appointment_id=${appointmentData.id}&payment_id=${appointmentData.payment.id}`,
    cancel_url: `${envVars.FRONTEND_URL}/dashboard/appointments?error=payment_cancelled`,
  });

  return {
    paymentUrl: session.url,
  };
};

const cancelUnpaidAppointments = async () => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const unpaidAppointments = await prisma.appointment.findMany({
    where: {
      createdAt: {
        lte: thirtyMinutesAgo,
      },
      paymentStatus: PaymentStatus.UNPAID,
      status: AppointmentStatus.SCHEDULED,
    },
  });

  if (unpaidAppointments.length === 0) return;

  const appointmentIdsToCancel = unpaidAppointments.map((app) => app.id);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Cancel appointments in bulk
    await tx.appointment.updateMany({
      where: {
        id: {
          in: appointmentIdsToCancel,
        },
      },
      data: {
        status: AppointmentStatus.CANCELED,
      },
    });

    // Delete pending payments in bulk
    await tx.payment.deleteMany({
      where: {
        appointmentId: {
          in: appointmentIdsToCancel,
        },
      },
    });

    // Bulk release doctor schedules (we construct update statements or handle updates)
    // Unfortunately updateMany does not support multi-condition matching easily in Prisma
    // without composite key updates, but we can do a loop of single updates inside transaction
    // which is transactional, but to optimize, we execute it.
    for (const unpaidAppointment of unpaidAppointments) {
      await tx.doctorSchedules.update({
        where: {
          doctorId_scheduleId: {
            doctorId: unpaidAppointment.doctorId,
            scheduleId: unpaidAppointment.scheduleId,
          },
        },
        data: {
          isBooked: false,
        },
      });
    }
  });
};

export const AppointmentService = {
  bookAppointment,
  getMyAppointments,
  changeAppointmentStatus,
  getMySingleAppointment,
  getAllAppointments,
  bookAppointmentWithPayLater,
  initiatePayment,
  cancelUnpaidAppointments,
};
