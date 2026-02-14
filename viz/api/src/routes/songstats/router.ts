import { Router } from "express";
import type { Request, Response } from "express";
import { wrapHandler } from "../../tools.js";
import { pool } from "../../database.js";
import { GET_ALL_SONG_STATS } from "./queries.js";
export const songStatsRouter = Router();


songStatsRouter.get("/all", wrapHandler(async (_req: Request, res: Response) => {
  const rows = (await pool.query(GET_ALL_SONG_STATS)).rows;
  res.json(rows);
}, "Could not send matches."));
