import { healthRouter } from "./health.js";
import { songRouter } from "./song/index.js";
import { matchRouter } from "./match/index.js";
import { deleteRouter } from "./delete.js";
import { songStatsRouter } from "./songstats/index.js";
import { Router } from "express";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/song", songRouter);
apiRouter.use("/match", matchRouter);
apiRouter.use("/delete", deleteRouter)
apiRouter.use("/songstats", songStatsRouter);
