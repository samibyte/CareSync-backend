import { Role } from "../../generated/prisma/enums.js";

export interface IRequestUser {
  userId: string;
  role: Role;
  email: string;
}
