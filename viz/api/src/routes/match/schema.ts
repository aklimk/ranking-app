import { z } from "zod";

export const MatchInSchema = z.object({
  winning_song: z.number().finite().int().nonnegative(),
  losing_song: z.number().finite().int().nonnegative(),
  winning_song_rating: z.number().finite(),
  losing_song_rating: z.number().finite(),
}).strict();
