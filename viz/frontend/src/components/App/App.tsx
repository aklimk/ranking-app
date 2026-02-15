import { useState, useEffect } from "react";
import { getData } from "../../data";
import type { SongInfoMap, SongStatsMap } from "../../data";
import { ScrubberBar } from "../ScrubberBar";
import { PHASE } from "../../types";

export function App(): React.JSX.Element {
  const [data, setData] = useState<[SongInfoMap, SongStatsMap, number]>([new Map, new Map, 0]);
  const [matchIndex, setMatchIndex] = useState<number>(0);
  const [maxMatchIndex, setMaxMatchIndex] = useState<number>(0);
  const [phase, setPhase] = useState<PHASE>(PHASE.REORDER_PHASE);

  useEffect(() => {
    (async () => {
      const data = await getData();
      setData(data);
      setMaxMatchIndex(data[2]);
    })();
  }, []);
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
        <div className="blank"></div>
      </div>
    </body>
  );
}
