import express from "express";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api", apiRouter);
  return app;
}
