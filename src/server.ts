import app from "./app.js";
import { seedSuperAdmin } from "./app/utils/seed.js";

const bootstrap = async () => {
  await seedSuperAdmin();

  app.listen(process.env.PORT, () => {
    console.log(`Server running on ${process.env.PORT}`);
  });
};

bootstrap();

export default app;