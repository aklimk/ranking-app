import { z } from "zod";

const SongInSchema = z.object({
  id: z.number().finite().int().nonnegative(),
  path: z.string().min(1),
  title: z.string().min(1),
  extension: z.string().min(1),
  starting_rating: z.number().finite(),
}).strict();
export const SongsInSchema = z.array(SongInSchema);
