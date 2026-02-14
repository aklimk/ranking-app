export const GET_ALL_SONGS_QUERY = `
  SELECT * FROM song
  LIMIT 1000
`;
export const SAVE_SONGS_QUERY = `
    INSERT INTO song
    SELECT *
    FROM UNNEST($1::int[], $2::text[], $3::text[], $4::text[])
    RETURNING id
`;

export const CREATE_INITIAL_SONG_STATS_QUERY = `
  INSERT INTO song_stats(song_id, matchup_id, rating, rank)
  SELECT info.id, NULL, info.rating, info.rank
  FROM UNNEST($1::int[], $2::float[], $3::int[]) AS info(id, rating, rank)
`;
