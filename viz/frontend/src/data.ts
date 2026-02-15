import { z } from "zod";

const songStatsSchema = z.object({
  id: z.number(),
  matchup_id: z.number().nullable(),
  song_id: z.number(),
  rating: z.number(),
  rank: z.number()
});
const songStatsArraySchema = z.array(songStatsSchema);
export type SongStats = z.infer<typeof songStatsSchema>;
export type SongStatsArray = z.infer<typeof songStatsArraySchema>;

const songInfoSchema = z.object({
  id: z.number(),
  path: z.string(),
  title: z.string(),
  extension: z.string()
});
const songInfoArraySchema = z.array(songInfoSchema);
export type SongInfo = z.infer<typeof songInfoSchema>;
export type SongInfoArray = z.infer<typeof songInfoArraySchema>;


export type SongInfoMap = Map<
  SongInfo["id"],
  [SongInfo["path"], SongInfo["title"], SongInfo["extension"]]
>;
export type SongStatsMap = Map<
  [SongStats["matchup_id"], SongStats["song_id"]],
  [SongStats["rating"], SongStats["rank"]]
>;

export async function getData(): Promise<[SongInfoMap, SongStatsMap]> {
  const res1 = await fetch("/api/song/all");
  if (!res1.ok) {
    throw new Error("Failed to load.");
  }
  const songInfoArray = songInfoArraySchema.parse(await res1.json());
  let songInfoMap: SongInfoMap = new Map;
  for (let songInfo of songInfoArray) {
    songInfoMap.set(
      songInfo.id, [songInfo.path, songInfo.title, songInfo.extension]
    );
  }

  const res = await fetch("/api/songstats/all");
  if (!res.ok) {
    throw new Error("Failed to load.");
  }
  const songStatsArray = songStatsArraySchema.parse(await res.json());
  let songStatsMap: SongStatsMap = new Map;
  for (let songStats of songStatsArray) {
    songStatsMap.set([
      songStats.matchup_id, songStats.song_id], [songStats.rating, songStats.rank]
    );
  }

  return [songInfoMap, songStatsMap]
}
