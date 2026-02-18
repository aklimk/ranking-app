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

const matchResultSchema = z.object({
  id: z.number(),
  winner_id: z.number(),
  loser_id: z.number()
});
const matchResultArraySchema = z.array(matchResultSchema);
export type MatchResultSchema = z.infer<typeof matchResultSchema>;
export type MatchResultArraySchema = z.infer<typeof matchResultArraySchema>;

export type SongInfoMap = Map<
  SongInfo["id"],
  [SongInfo["path"], SongInfo["title"], SongInfo["extension"]]
>;
export type SongStatsMap = Map<
  string,
  [SongStats["rating"], SongStats["rank"]]
>;
export type MatchResultMap = Map<
  number, [number, number]
 >;

export async function getData():
  Promise<[SongInfoMap, SongStatsMap, number, MatchResultMap]>
{
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
  let maxMatchIndex = 0;
  for (let songStats of songStatsArray) {
    songStatsMap.set(
      songStatsKey(songStats.matchup_id ?? 0, songStats.song_id),
      [songStats.rating, songStats.rank]
    );
    maxMatchIndex = Math.max(maxMatchIndex, songStats.matchup_id ?? 0);
  }

  let matchResults: MatchResultMap = new Map;
  const res2 = await fetch("/api/match/all");
  if (!res2.ok) {
    throw new Error("Failed to load.");
  }
  const matchResultArray = matchResultArraySchema.parse(await res2.json());
  for (let matchResult of matchResultArray) {
    matchResults.set(matchResult.id, [matchResult.winner_id, matchResult.loser_id]);
  }
  return [songInfoMap, songStatsMap, maxMatchIndex, matchResults]
}

export function songStatsKey(matchup_id: number, song_id: number) {
  return matchup_id.toString() + ":" + song_id.toString();
}

export function unwrap<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error("UNWRAP FAILED.");
  }
  return value;
}
