import type React from "react";
import styles from "./LeaderboardRow.module.css";

interface LeaderboardRowProps {
  title: string,
  rank: number,
  rankDelta: number,
  rating: number,
  ratingDelta: number
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
  return (
    <div className={styles["rank-info"]}>
      <div className={styles["rank"]}>
        #{rank}
      </div>
      <span className={styles["rank-delta"] + " " + styles["chip"]}>
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
  return (
    <div className={styles["rating-info"]}>
      <span>{rating.toFixed(2)}</span>
      <span className={styles["rating-delta"] + " " + styles["chip"]}>
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
  ratingDelta
}: LeaderboardRowProps): React.JSX.Element {
  return (
    <div className={styles["Leaderboard-row"]}>
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
