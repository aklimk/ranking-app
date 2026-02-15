import { useState, useEffect } from "react";
import { getData, songStatsKey, unwrap } from "../../data";
import type { MatchResultMap, SongInfoMap, SongStatsMap } from "../../data";
import { ScrubberBar } from "../ScrubberBar";
import { Leaderboard } from "../Leaderboard";
import { PHASE } from "../../types";

export function App(): React.JSX.Element {
  const [data, setData] = useState<[
    SongInfoMap, SongStatsMap, number, MatchResultMap
  ]>([new Map, new Map, 0, new Map]);
  const [matchIndex, setMatchIndex] = useState<number>(0);
  const [prevMatchIndex, setPrevMatchIndex] = useState<number>(0);
  const [maxMatchIndex, setMaxMatchIndex] = useState<number>(0);
  const [phase, setPhase] = useState<PHASE>(PHASE.REORDER_PHASE);
  const [songIds, setSongIds] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getData();
      setData(data);
      setMaxMatchIndex(data[2]);
      setSongIds(Array.from(data[0].keys()));
    })();
  }, []);

  useEffect(() => {
    if (matchIndex === prevMatchIndex && matchIndex !== 0) {
      let songIds = Array.from(data[0].keys());
      songIds.sort((id1, id2) => {
        let rating1: number;
        let rating2: number;
        if (phase == PHASE.REORDER_PHASE) {
          rating1 = unwrap(data[1].get(songStatsKey(matchIndex, id1))?.[0]);
          rating2 = unwrap(data[1].get(songStatsKey(matchIndex, id2))?.[0]);
        } else {
          rating1 = unwrap(data[1].get(songStatsKey(matchIndex - 1, id1))?.[0]);
          rating2 = unwrap(data[1].get(songStatsKey(matchIndex - 1, id2))?.[0]);
        }
        return rating2 - rating1;
      });
      setSongIds(songIds);
    }
  }, [phase]);

  useEffect(() => {
    setPrevMatchIndex(matchIndex)
  }, [matchIndex]);

  if (maxMatchIndex === 0) {
    return <p>LOADING...</p>
  }
  return (
    <body>
      <div className="app">
        <ScrubberBar
          matchIndex={matchIndex}
          setMatchIndex={setMatchIndex}
          maxMatchIndex={maxMatchIndex}
          phase={phase}
          setPhase={setPhase}
        />
        <Leaderboard
          phase={phase}
          winner_id={(data[3].get(matchIndex) ?? [0, 0])[0]}
          loser_id={(data[3].get(matchIndex) ?? [0, 0])[1]}
          songIds={songIds}
          songInfoMap={data[0]}
          songStatsMap={data[1]}
          matchIndex={matchIndex}
        />
      </div>
    </body>
  );
}
