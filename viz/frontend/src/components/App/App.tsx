import { useState, useEffect } from "react";
import { getData } from "../../data";
import type { SongInfoMap, SongStatsMap } from "../../data";

export function App(): React.JSX.Element {
  const [data, setData] = useState<[SongInfoMap, SongStatsMap]>([new Map, new Map]);
  useEffect(() => {
    getData().then(setData);
  }, []);
  return <p style={{ whiteSpace: "pre-line" }}>{data}</p>;
}
