import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { invitesRouter } from "./routes/invites.js";

async function bootstrap() {
  await mongoose.connect(env.MONGODB_URI);

  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/invites", invitesRouter);

  app.use((_req, res) => {
    res.status(404).send("Not found");
  });

  app.listen(env.PORT, () => {
    console.log(`Backend is running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
