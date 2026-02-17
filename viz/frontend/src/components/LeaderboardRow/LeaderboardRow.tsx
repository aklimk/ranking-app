import type React from "react";
import styles from "./LeaderboardRow.module.css";
import { ROWTYPE } from "../../types";

interface LeaderboardRowProps {
  title: string,
  rank: number,
  rankDelta: number,
  rating: number,
  ratingDelta: number,
  rowType: ROWTYPE
}

interface RankInfoProps {
  rank: number,
  rankDelta: number
}

function deltaDisplay(delta: number, rounding: number | null) {
  const deltaString = (rounding === null)
    ? Math.abs(delta).toString()
    : Math.abs(delta).toFixed(rounding)

  let deltaDisplay: string;
  if (delta > 0) {
    deltaDisplay = `^${deltaString}`;
  } else if (delta < 0) {
    deltaDisplay = `v${deltaString}`;
  } else {
    deltaDisplay = "0";
  }
  return deltaDisplay;
}

function RankInfo({
  rank,
  rankDelta
}: RankInfoProps): React.JSX.Element {
  let chipClass: string;
  if (rankDelta > 0) {
    chipClass = styles["chip-positive"];
  } else if (rankDelta < 0) {
    chipClass = styles["chip-negative"];
  } else {
    chipClass = "";
  }
  return (
    <div className={styles["rank-info"]}>
      <div className={styles["rank"]}>
        #{rank}
      </div>
      <span className={styles["rank-delta"] + " " + styles["chip"] + " " + chipClass}>
        {deltaDisplay(rankDelta, null)}
      </span>
    </div>
  );
}

interface SongInfoProps {
  title: string
}

function SongInfo({ title }: SongInfoProps): React.JSX.Element {
  return (
    <div className={styles["song-title"]}>
      {title}
    </div>
  );
}

interface RatingInfoProps {
  rating: number,
  ratingDelta: number
}

function RatingInfo({
  rating,
  ratingDelta
}: RatingInfoProps): React.JSX.Element {
  let chipClass: string;
  if (ratingDelta > 0) {
    chipClass = styles["chip-positive"];
  } else if (ratingDelta < 0) {
    chipClass = styles["chip-negative"];
  } else {
    chipClass = "";
  }
  return (
    <div className={styles["rating-info"]}>
      <span>{rating.toFixed(2)}</span>
      <span className={styles["rating-delta"] + " " + styles["chip"] + " " + chipClass}>
        {deltaDisplay(ratingDelta, 2)}
      </span>
    </div>
  )
}



export function LeaderboardRow({
  title,
  rank,
  rankDelta,
  rating,
  ratingDelta,
  rowType
}: LeaderboardRowProps): React.JSX.Element {
  let leaderboardClass: string;
  if (rowType === ROWTYPE.WINNER) {
    leaderboardClass = styles["row-winner"];
  } else if (rowType === ROWTYPE.LOSER) {
    leaderboardClass = styles["row-loser"];
  } else {
    leaderboardClass = "";
  }
  return (
    <div className={styles["Leaderboard-row"] + " " + leaderboardClass}>
      <RankInfo
        rank={rank}
        rankDelta={rankDelta}
      />
      <SongInfo
        title={title}
      />
      <RatingInfo
        rating={rating}
        ratingDelta={ratingDelta}
      />
    </div>
  );
}
