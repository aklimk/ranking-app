import type React from "react";
import { useEffect, useState } from "react";
import { z } from "zod";

const songStatsSchema = z.object({
  id: z.number(),
  matchup_id: z.number().nullable(),
  song_id: z.number(),
  rating: z.number(),
  rank: z.number()
});
const songStatsArraySchema = z.array(songStatsSchema);

const songInfoSchema = z.object({
  id: z.number(),
  path: z.string(),
  title: z.string(),
  extension: z.string()
});
const songInfoArraySchema = z.array(songInfoSchema);

async function getData() {
  const res1 = await fetch("/api/song/all");
  if (!res1.ok) {
    throw new Error("Failed to load.");
  }
  const songInfoArray = songInfoArraySchema.parse(await res1.json());
  let songInfoMap = new Map<number, [string, string, string]>;
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
  let songStatsMap = new Map<[number | null, number], [number, number]>;
  for (let songStats of songStatsArray) {
    songStatsMap.set([
      songStats.matchup_id, songStats.song_id], [songStats.rating, songStats.rank]
    );
  }

  let output = "";
  for (let [[match_id, song_id], [rating, rank]] of songStatsMap) {
    const songInfo = songInfoMap.get(song_id);
    if (songInfo === undefined) {
      throw Error("Undefined get.");
    }
    output += songInfo[1] + "\n";
    output += "match: " + match_id + "\n";
    output += "rating: " + rating + " rank: " + rank;
    output += "\n\n";
  }

  return output;
}

export function App(): React.JSX.Element {
  const [data, setData] = useState<string>("");
  useEffect(() => {
    getData().then(setData);
  }, []);
  return <p style={{ whiteSpace: "pre-line" }}>{data}</p>;
}
