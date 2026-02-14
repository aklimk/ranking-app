import { pool } from "../database.js";
import { Router } from "express";
import type { Request, Response } from "express";
import { wrapHandler } from "../tools.js";

export const deleteRouter = Router();

const DELETE_ALL_DATA_QUERY = `
  TRUNCATE song, matchup, song_stats RESTART IDENTITY CASCADE;
`;

// End point to delete all data in all tables.
deleteRouter.get("/all", wrapHandler(async (_req: Request, res: Response) => {
  await pool.query(DELETE_ALL_DATA_QUERY);
  res.status(201).json({ ok: true });
}, "Could not delete data."));
