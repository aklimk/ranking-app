import { Router } from "express";
import type { Request, Response } from "express";
import { wrapHandler } from "../../tools.js";
import { SongsInSchema } from "./schema.js";
import { pool } from "../../database.js";
import {
  GET_ALL_SONGS_QUERY,
  SAVE_SONGS_QUERY,
  CREATE_INITIAL_SONG_STATS_QUERY
} from "./queries.js";
export const songRouter = Router();

songRouter.get("/all", wrapHandler(async (_req: Request, res: Response) => {
  const rows = (await pool.query(GET_ALL_SONGS_QUERY)).rows;
  res.json(rows);
}, "Could not send songs."));


songRouter.post("/all", wrapHandler(async (req: Request, res: Response) => {
  const parsed = SongsInSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "invalid payload",
      issues: parsed.error.issues
    });
  }

  const songs = parsed.data;
  songs.sort((song1, song2) => (song1.starting_rating - song2.starting_rating));
  const ids = songs.map(s => s.id);
  const paths = songs.map(s => s.path);
  const titles = songs.map(s => s.title);
  const exts = songs.map(s => s.extension);
  const ratings = songs.map(s => s.starting_rating);
  const ranks = songs.map((_, index) => index + 1);

  await pool.query(SAVE_SONGS_QUERY, [ids, paths, titles, exts]);
  await pool.query(CREATE_INITIAL_SONG_STATS_QUERY, [ids, ratings, ranks])
  res.status(201).json({ ok: true });
}, "Could not save songs."));
