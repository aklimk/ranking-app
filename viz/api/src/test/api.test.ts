import request from "supertest";
import { createApp } from "../app.js";
import { pool } from "../database.js";

const app = createApp();

const TRUNCATE_ALL_DATA_QUERY = `
  TRUNCATE song, matchup, song_stats RESTART IDENTITY CASCADE;
`;

type SongSeed = {
  id: number;
  path: string;
  title: string;
  extension: string;
  starting_rating: number;
};

async function resetDatabase() {
  await pool.query(TRUNCATE_ALL_DATA_QUERY);
}

async function seedSongs(songs: SongSeed[]) {
  await request(app).post("/api/song/all").send(songs).expect(201);
}

function findSongStat(
  stats: Array<Record<string, unknown>>,
  matchupId: number | null,
  songId: number
) {
  return stats.find(
    (row) => row["matchup_id"] === matchupId && row["song_id"] === songId
  );
}

beforeEach(async () => {
  await resetDatabase();
});

test("POST /song/all persists songs and creates initial song_stats", async () => {
  const songs: SongSeed[] = [
    {
      id: 1,
      path: "/music/a.mp3",
      title: "A",
      extension: "mp3",
      starting_rating: 100,
    },
    {
      id: 2,
      path: "/music/b.mp3",
      title: "B",
      extension: "mp3",
      starting_rating: 200,
    },
    {
      id: 3,
      path: "/music/c.mp3",
      title: "C",
      extension: "mp3",
      starting_rating: 150,
    },
  ];

  await seedSongs(songs);

  const songsRes = await request(app).get("/api/song/all").expect(200);
  const receivedSongs = (songsRes.body as Array<Record<string, unknown>>).map(
    (s) => ({
      id: s["id"],
      path: s["path"],
      title: s["title"],
      extension: s["extension"],
    })
  );

  const expectedSongs = songs.map(({ id, path, title, extension }) => ({
    id,
    path,
    title,
    extension,
  }));

  expect(receivedSongs.sort((a, b) => Number(a.id) - Number(b.id))).toEqual(
    expectedSongs.sort((a, b) => a.id - b.id)
  );

  const statsRes = await request(app).get("/api/songstats/all").expect(200);
  const allStats = statsRes.body as Array<Record<string, unknown>>;

  const initialStats = allStats.filter((s) => s["matchup_id"] === null);
  expect(initialStats).toHaveLength(3);

  for (const song of songs) {
    const stat = findSongStat(allStats, null, song.id);
    expect(stat).toBeDefined();
    expect(stat?.["rating"]).toBe(song.starting_rating);
  }

  const ranks = initialStats.map((s) => s["rank"]);
  expect(new Set(ranks).size).toBe(3);
  expect(Math.min(...(ranks as number[]))).toBe(1);
  expect(Math.max(...(ranks as number[]))).toBe(3);
});

test("POST /match/one appends per-match song_stats with updated ratings and ranks", async () => {
  await seedSongs([
    {
      id: 1,
      path: "/music/a.mp3",
      title: "A",
      extension: "mp3",
      starting_rating: 100,
    },
    {
      id: 2,
      path: "/music/b.mp3",
      title: "B",
      extension: "mp3",
      starting_rating: 200,
    },
    {
      id: 3,
      path: "/music/c.mp3",
      title: "C",
      extension: "mp3",
      starting_rating: 150,
    },
  ]);

  await request(app)
    .post("/api/match/one")
    .send({
      winning_song: 2,
      losing_song: 1,
      winning_song_rating: 210,
      losing_song_rating: 90,
    })
    .expect(201)
    .expect({ ok: true });

  await request(app)
    .post("/api/match/one")
    .send({
      winning_song: 3,
      losing_song: 2,
      winning_song_rating: 220,
      losing_song_rating: 205,
    })
    .expect(201)
    .expect({ ok: true });

  const matchRes = await request(app).get("/api/match/all").expect(200);
  const matches = (matchRes.body as Array<Record<string, unknown>>).sort(
    (a, b) => Number(a["id"]) - Number(b["id"])
  );

  expect(matches).toHaveLength(2);
  expect(matches[0]).toMatchObject({ id: 1, winner_id: 2, loser_id: 1 });
  expect(matches[1]).toMatchObject({ id: 2, winner_id: 3, loser_id: 2 });

  const statsRes = await request(app).get("/api/songstats/all").expect(200);
  const allStats = statsRes.body as Array<Record<string, unknown>>;

  const matchup1 = allStats.filter((s) => s["matchup_id"] === 1);
  const matchup2 = allStats.filter((s) => s["matchup_id"] === 2);
  expect(matchup1).toHaveLength(3);
  expect(matchup2).toHaveLength(3);

  expect(findSongStat(allStats, 1, 2)).toMatchObject({
    matchup_id: 1,
    song_id: 2,
    rating: 210,
    rank: 1,
  });
  expect(findSongStat(allStats, 1, 3)).toMatchObject({
    matchup_id: 1,
    song_id: 3,
    rating: 150,
    rank: 2,
  });
  expect(findSongStat(allStats, 1, 1)).toMatchObject({
    matchup_id: 1,
    song_id: 1,
    rating: 90,
    rank: 3,
  });

  expect(findSongStat(allStats, 2, 3)).toMatchObject({
    matchup_id: 2,
    song_id: 3,
    rating: 220,
    rank: 1,
  });
  expect(findSongStat(allStats, 2, 2)).toMatchObject({
    matchup_id: 2,
    song_id: 2,
    rating: 205,
    rank: 2,
  });
  expect(findSongStat(allStats, 2, 1)).toMatchObject({
    matchup_id: 2,
    song_id: 1,
    rating: 90,
    rank: 3,
  });
});

test("GET /delete/all truncates tables", async () => {
  await seedSongs([
    {
      id: 1,
      path: "/music/a.mp3",
      title: "A",
      extension: "mp3",
      starting_rating: 100,
    },
    {
      id: 2,
      path: "/music/b.mp3",
      title: "B",
      extension: "mp3",
      starting_rating: 200,
    },
  ]);

  await request(app)
    .post("/api/match/one")
    .send({
      winning_song: 2,
      losing_song: 1,
      winning_song_rating: 210,
      losing_song_rating: 90,
    })
    .expect(201);

  await request(app).get("/api/delete/all").expect(201).expect({ ok: true });

  await request(app).get("/api/song/all").expect(200).expect([]);
  await request(app).get("/api/match/all").expect(200).expect([]);
  await request(app).get("/api/songstats/all").expect(200).expect([]);
});

test("invalid payloads return 400 with validation issues", async () => {
  await request(app)
    .post("/api/song/all")
    .send({ not: "an array" })
    .expect(400)
    .expect((res) => {
      expect(res.body?.error).toBe("invalid payload");
      expect(Array.isArray(res.body?.issues)).toBe(true);
    });

  await request(app)
    .post("/api/match/one")
    .send({ winning_song: 1 })
    .expect(400)
    .expect((res) => {
      expect(res.body?.error).toBe("invalid payload");
      expect(Array.isArray(res.body?.issues)).toBe(true);
    });
});

