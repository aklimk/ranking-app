import express from "express";
import { forceEnvVar } from "./tools.js";
import { apiRouter } from "./routes/index.js";

// ExpressJS initialization.
const app = express();
const port = parseInt(forceEnvVar(process.env["PORT"]));
app.use(express.json({ limit: "1mb" }));
app.use("/api", apiRouter);

// Start web server and bind to `port`.
app.listen(port, () => console.log(`API listening on :${port}`));
