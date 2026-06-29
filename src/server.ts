import app from "./app.js";
import { seedSuperAdmin } from "./app/utils/seed.js";

const bootstrap = async () => {
  await seedSuperAdmin();

  app.listen(process.env.PORT, () => {
    console.log(`Server running on ${process.env.PORT}`);
  });
};

if (process.env.NODE_ENV === "development") {
  bootstrap();
}

export default app;