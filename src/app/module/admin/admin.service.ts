import status from "http-status";
import { Prisma } from "../../../generated/prisma/client.js";
import { Role, UserStatus } from "../../../generated/prisma/enums.js";
import AppError from "../../errorHelpers/AppError.js";
import { IRequestUser } from "../../interfaces/requestUser.interface.js";
import { prisma } from "../../lib/prisma.js";
import { IUpdateAdminPayload } from "./admin.interface.js";

const getAllAdmins = async () => {
  const admins = await prisma.admin.findMany({
    include: {
      user: true,
    },
  });
  return admins;
};

const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findUnique({
    where: {
      id,
    },
    include: {
      user: true,
    },
  });
  return admin;
};

const updateAdmin = async (id: string, payload: IUpdateAdminPayload, user: IRequestUser) => {
  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  // Prevent ADMIN from editing a SUPER_ADMIN record
  const targetUser = await prisma.user.findUnique({
    where: { id: isAdminExist.userId },
  });

  if (targetUser?.role === Role.SUPER_ADMIN && user.role !== Role.SUPER_ADMIN) {
    throw new AppError(status.FORBIDDEN, "Only SUPER_ADMIN can modify a SUPER_ADMIN record");
  }

  const { admin } = payload;

  const updatedAdmin = await prisma.admin.update({
    where: {
      id,
    },
    data: {
      ...admin,
    },
  });

  return updatedAdmin;
};

const deleteAdmin = async (id: string, user: IRequestUser) => {
  const isAdminExist = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  if (!isAdminExist) {
    throw new AppError(status.NOT_FOUND, "Admin Or Super Admin not found");
  }

  if (isAdminExist.userId === user.userId) {
    throw new AppError(status.BAD_REQUEST, "You cannot delete yourself");
  }

  // Prevent ADMIN from deleting a SUPER_ADMIN record
  const targetUser = await prisma.user.findUnique({
    where: { id: isAdminExist.userId },
  });

  if (targetUser?.role === Role.SUPER_ADMIN && user.role !== Role.SUPER_ADMIN) {
    throw new AppError(status.FORBIDDEN, "Only SUPER_ADMIN can delete a SUPER_ADMIN record");
  }

  const result = await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      await tx.admin.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: isAdminExist.userId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          status: UserStatus.DELETED,
        },
      });

      await tx.session.deleteMany({
        where: { userId: isAdminExist.userId },
      });

      await tx.account.deleteMany({
        where: { userId: isAdminExist.userId },
      });

      const admin = await getAdminById(id);

      return admin;
    },
  );

  return result;
};

export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
