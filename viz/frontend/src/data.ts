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
  const songInfoArray = songInfoArraySchema.parse([
    {"id":0,"path":"null","title":"1 Overworld Day","extension":".flac"},
    {"id":1,"path":"null","title":"02 Eerie","extension":".flac"},
    {"id":2,"path":"null","title":"03 Overworld Night","extension":".flac"},
    {"id":3,"path":"null","title":"04 Title Screen","extension":".flac"},
    {"id":4,"path":"null","title":"05 Underground","extension":".flac"},
    {"id":5,"path":"null","title":"06 Boss 1","extension":".flac"},
    {"id":6,"path":"null","title":"07 Jungle","extension":".flac"},
    {"id":7,"path":"null","title":"08 Corruption","extension":".flac"},
    {"id":8,"path":"null","title":"09 Underground Corruption","extension":".flac"},
    {"id":9,"path":"null","title":"10 The Hallow","extension":".flac"},
    {"id":10,"path":"null","title":"11 Boss 2","extension":".flac"},
    {"id":11,"path":"null","title":"12 Underground Hallow","extension":".flac"},
    {"id":12,"path":"null","title":"13 Boss 3","extension":".flac"}
  ]);
  let songInfoMap: SongInfoMap = new Map;
  for (let songInfo of songInfoArray) {
    songInfoMap.set(
      songInfo.id, [songInfo.path, songInfo.title, songInfo.extension]
    );
  }

  const songStatsArray = songStatsArraySchema.parse([
    {"id":1,"matchup_id":null,"song_id":0,"rating":0,"rank":1},
    {"id":2,"matchup_id":null,"song_id":1,"rating":0,"rank":2},
    {"id":3,"matchup_id":null,"song_id":2,"rating":0,"rank":3},
    {"id":4,"matchup_id":null,"song_id":3,"rating":0,"rank":4},
    {"id":5,"matchup_id":null,"song_id":4,"rating":0,"rank":5},
    {"id":6,"matchup_id":null,"song_id":5,"rating":0,"rank":6},
    {"id":7,"matchup_id":null,"song_id":6,"rating":0,"rank":7},
    {"id":8,"matchup_id":null,"song_id":7,"rating":0,"rank":8},
    {"id":9,"matchup_id":null,"song_id":8,"rating":0,"rank":9},
    {"id":10,"matchup_id":null,"song_id":9,"rating":0,"rank":10},
    {"id":11,"matchup_id":null,"song_id":10,"rating":0,"rank":11},
    {"id":12,"matchup_id":null,"song_id":11,"rating":0,"rank":12},
    {"id":13,"matchup_id":null,"song_id":12,"rating":0,"rank":13},
    {"id":14,"matchup_id":null,"song_id":13,"rating":0,"rank":14},
    {"id":15,"matchup_id":1,"song_id":4,"rating":3.4376853,"rank":1},
    {"id":16,"matchup_id":1,"song_id":0,"rating":0,"rank":2},
    {"id":17,"matchup_id":1,"song_id":1,"rating":0,"rank":3},
    {"id":18,"matchup_id":1,"song_id":2,"rating":0,"rank":4},
    {"id":19,"matchup_id":1,"song_id":3,"rating":0,"rank":5},
    {"id":20,"matchup_id":1,"song_id":5,"rating":0,"rank":6},
    {"id":21,"matchup_id":1,"song_id":6,"rating":0,"rank":7},
    {"id":22,"matchup_id":1,"song_id":7,"rating":0,"rank":8},
    {"id":23,"matchup_id":1,"song_id":8,"rating":0,"rank":9},
    {"id":24,"matchup_id":1,"song_id":9,"rating":0,"rank":10},
    {"id":25,"matchup_id":1,"song_id":10,"rating":0,"rank":11},
    {"id":26,"matchup_id":1,"song_id":12,"rating":0,"rank":12},
    {"id":27,"matchup_id":1,"song_id":13,"rating":0,"rank":13},
    {"id":28,"matchup_id":1,"song_id":11,"rating":-1.8330938,"rank":14},
    {"id":29,"matchup_id":2,"song_id":4,"rating":3.4376853,"rank":1},
    {"id":30,"matchup_id":2,"song_id":9,"rating":3.4376853,"rank":2},
    {"id":31,"matchup_id":2,"song_id":0,"rating":0,"rank":3},
    {"id":32,"matchup_id":2,"song_id":1,"rating":0,"rank":4},
    {"id":33,"matchup_id":2,"song_id":2,"rating":0,"rank":5},
    {"id":34,"matchup_id":2,"song_id":3,"rating":0,"rank":6},
    {"id":35,"matchup_id":2,"song_id":5,"rating":0,"rank":7},
    {"id":36,"matchup_id":2,"song_id":6,"rating":0,"rank":8},
    {"id":37,"matchup_id":2,"song_id":7,"rating":0,"rank":9},
    {"id":38,"matchup_id":2,"song_id":8,"rating":0,"rank":10},
    {"id":39,"matchup_id":2,"song_id":10,"rating":0,"rank":11},
    {"id":40,"matchup_id":2,"song_id":12,"rating":0,"rank":12},
    {"id":41,"matchup_id":2,"song_id":11,"rating":-1.8330938,"rank":13},
    {"id":42,"matchup_id":2,"song_id":13,"rating":-1.8330938,"rank":14},
    {"id":43,"matchup_id":3,"song_id":8,"rating":3.7643864,"rank":1},
    {"id":44,"matchup_id":3,"song_id":9,"rating":3.4376853,"rank":2},
    {"id":45,"matchup_id":3,"song_id":4,"rating":1.4077797,"rank":3},
    {"id":46,"matchup_id":3,"song_id":0,"rating":0,"rank":4},
    {"id":47,"matchup_id":3,"song_id":1,"rating":0,"rank":5},
    {"id":48,"matchup_id":3,"song_id":2,"rating":0,"rank":6},
    {"id":49,"matchup_id":3,"song_id":3,"rating":0,"rank":7},
    {"id":50,"matchup_id":3,"song_id":5,"rating":0,"rank":8},
    {"id":51,"matchup_id":3,"song_id":6,"rating":0,"rank":9},
    {"id":52,"matchup_id":3,"song_id":7,"rating":0,"rank":10},
    {"id":53,"matchup_id":3,"song_id":10,"rating":0,"rank":11},
    {"id":54,"matchup_id":3,"song_id":12,"rating":0,"rank":12},
    {"id":55,"matchup_id":3,"song_id":11,"rating":-1.8330938,"rank":13},
    {"id":56,"matchup_id":3,"song_id":13,"rating":-1.8330938,"rank":14},
    {"id":57,"matchup_id":4,"song_id":8,"rating":3.7643864,"rank":1},
    {"id":58,"matchup_id":4,"song_id":1,"rating":3.551664,"rank":2},
    {"id":59,"matchup_id":4,"song_id":9,"rating":3.4376853,"rank":3},
    {"id":60,"matchup_id":4,"song_id":0,"rating":0,"rank":4},
    {"id":61,"matchup_id":4,"song_id":2,"rating":0,"rank":5},
    {"id":62,"matchup_id":4,"song_id":3,"rating":0,"rank":6},
    {"id":63,"matchup_id":4,"song_id":5,"rating":0,"rank":7},
    {"id":64,"matchup_id":4,"song_id":6,"rating":0,"rank":8},
    {"id":65,"matchup_id":4,"song_id":7,"rating":0,"rank":9},
    {"id":66,"matchup_id":4,"song_id":10,"rating":0,"rank":10},
    {"id":67,"matchup_id":4,"song_id":12,"rating":0,"rank":11},
    {"id":68,"matchup_id":4,"song_id":4,"rating":-0.2927136,"rank":12},
    {"id":69,"matchup_id":4,"song_id":11,"rating":-1.8330938,"rank":13},
    {"id":70,"matchup_id":4,"song_id":13,"rating":-1.8330938,"rank":14}
  ]);
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
  const matchResultArray = matchResultArraySchema.parse([
    {"id":1,"winner_id":4,"loser_id":11},
    {"id":2,"winner_id":9,"loser_id":13},
    {"id":3,"winner_id":8,"loser_id":4},
    {"id":4,"winner_id":1,"loser_id":4}
  ]);
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
