export const GET_ALL_MATCHES_QUERY = `
  SELECT * FROM matchup
  LIMIT 1000
`;
export const SAVE_MATCH_QUERY = `
    INSERT INTO matchup (winner_id, loser_id)
    VALUES ($1, $2)
    RETURNING id
`;

export const SAVE_SECOND_SONG_STATS_QUERY = `
  WITH song_rating AS (
    SELECT song_stats.song_id,
      CASE
        WHEN song_stats.song_id = $1 THEN $3
        WHEN song_stats.song_id = $2 THEN $4
        ELSE song_stats.rating
      END AS rating
    FROM song_stats
    WHERE song_stats.matchup_id IS NULL
  )
  INSERT INTO song_stats (matchup_id, song_id, rating, rank)
  SELECT 1, song_rating.song_id, song_rating.rating,
    DENSE_RANK() OVER (ORDER BY rating DESC, song_id ASC)
  FROM song_rating
`;

export const SAVE_SONG_STATS_QUERY = `
  WITH song_rating AS (
    SELECT song_stats.song_id,
      CASE
        WHEN song_stats.song_id = $2 THEN $4
        WHEN song_stats.song_id = $3 THEN $5
        ELSE song_stats.rating
      END AS rating
    FROM song_stats
    WHERE song_stats.matchup_id = $1 - 1
  )
  INSERT INTO song_stats (matchup_id, song_id, rating, rank)
  SELECT $1, song_rating.song_id, song_rating.rating,
    DENSE_RANK() OVER (ORDER BY rating DESC, song_id ASC)
  FROM song_rating
`;
