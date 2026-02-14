import { pool } from "../database.js";
import { Router } from "express";
import type { Request, Response } from "express";
import { wrapHandler } from "../tools.js";

export const healthRouter = Router();

healthRouter.get("/", wrapHandler(async (_req: Request, res: Response) => {
  // { ok: 1 } if healthy.
  const rows = (await pool.query("SELECT 1 AS ok")).rows;
  res.json(rows);
}, "Database unreachable."));
