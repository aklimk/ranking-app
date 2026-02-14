-- Initialization script for the database schema.
-- Will run if the docker database volume is empty (first time).


CREATE TABLE IF NOT EXISTS song (
  id integer PRIMARY KEY,
  path text NOT NULL,
  title text NOT NULL,
  extension text NOT NULL
);

CREATE TABLE IF NOT EXISTS matchup (
  id serial PRIMARY KEY,
  winner_id integer NOT NULL REFERENCES song(id) ON DELETE CASCADE,
  loser_id integer NOT NULL REFERENCES song(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS song_stats(
    id serial PRIMARY KEY,
    matchup_id integer REFERENCES matchup(id) ON DELETE CASCADE,
    song_id integer NOT NULL REFERENCES song(id) ON DELETE CASCADE,
    rating real NOT NULL,
    rank integer NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_song_stats_match_id ON song_stats(matchup_id);
