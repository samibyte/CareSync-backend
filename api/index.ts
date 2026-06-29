import app from "../src/app";
import { seedSuperAdmin } from "../src/app/utils/seed";
import { Request, Response } from "express";

let initialized = false;

export default async function handler(req: Request, res: Response) {
  if (!initialized) {
    initialized = true;
    await seedSuperAdmin();
  }

  return app(req, res);
}