import { Router } from "express";
import type { Request, Response } from "express";
import { MatchInSchema } from "./schema.js";
import { wrapHandler } from "../../tools.js";
import { pool } from "../../database.js";
import {
  GET_ALL_MATCHES_QUERY,
  SAVE_MATCH_QUERY,
  SAVE_SONG_STATS_QUERY,
  SAVE_SECOND_SONG_STATS_QUERY
} from "./queries.js";
export const matchRouter = Router();

matchRouter.get("/all", wrapHandler(async (_req: Request, res: Response) => {
  const rows = (await pool.query(GET_ALL_MATCHES_QUERY)).rows;
  res.json(rows);
}, "Could not send matches."));

matchRouter.post("/one", wrapHandler(async (req: Request, res: Response) => {
  const parsed = MatchInSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
        error: "invalid payload",
        issues: parsed.error.issues
    });
  }
  const match = parsed.data;
  const match_id: number = (await pool.query(
    SAVE_MATCH_QUERY,
    [match.winning_song, match.losing_song]
  )).rows[0].id;
  if (match_id === 1) {
    await pool.query(
      SAVE_SECOND_SONG_STATS_QUERY,
      [
        match.winning_song, match.losing_song,
        match.winning_song_rating, match.losing_song_rating
      ]
    );
  } else {
    await pool.query(
      SAVE_SONG_STATS_QUERY,
      [
        match_id, match.winning_song, match.losing_song,
        match.winning_song_rating, match.losing_song_rating
      ]
    );
  }
  res.status(201).json({ ok: true });
}, "Could not save match."));
