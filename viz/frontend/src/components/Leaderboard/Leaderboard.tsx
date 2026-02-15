import type { SongInfoMap, SongStatsMap } from "../../data";
import { songStatsKey, unwrap } from "../../data";
import styles from "./Leaderboard.module.css";
import { LeaderboardRow } from "../LeaderboardRow";
import { PHASE, ROWTYPE } from "../../types";

interface LeaderboardProps {
  matchIndex: number;
  phase: PHASE;
  winner_id: number,
  loser_id: number,
  songIds: number[];
  songInfoMap: SongInfoMap,
  songStatsMap: SongStatsMap
}

export function Leaderboard({
  matchIndex,
  phase,
  winner_id,
  loser_id,
  songIds,
  songInfoMap,
  songStatsMap
}: LeaderboardProps): React.JSX.Element {
  const leaderboardRows = songIds.map(id => {
    const title = unwrap(songInfoMap.get(id)?.[1]);
    const rating = unwrap(
      songStatsMap.get(songStatsKey(matchIndex, id))?.[0]
    );
    const prevRating = (matchIndex === 0 || phase === PHASE.REORDER_PHASE)
      ? rating
      : unwrap(songStatsMap.get(songStatsKey(matchIndex - 1, id))?.[0]);
    const rank = unwrap(
      songStatsMap.get(songStatsKey(matchIndex, id))?.[1]
    );
    const prevRank = (matchIndex === 0 || phase === PHASE.REORDER_PHASE)
      ? rank
      : unwrap(songStatsMap.get(songStatsKey(matchIndex - 1, id))?.[1]);

    let rowType: ROWTYPE;
    if (winner_id === id && matchIndex > 0) {
      rowType = ROWTYPE.WINNER;
    } else if (loser_id === id && matchIndex > 0) {
      rowType = ROWTYPE.LOSER;
    } else {
      rowType = ROWTYPE.NEUTRAL;
    }

    return (<LeaderboardRow
      title={title}
      rank={rank}
      rankDelta={prevRank - rank}
      rating={rating}
      ratingDelta={rating - prevRating}
      rowType={rowType}
    />);
  });
  return (
    <div className={styles["leaderboard"]}>
      {leaderboardRows}
    </div>
  );
}
