import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getData, songStatsKey, unwrap } from "../data";

function makeFetchMock(
  routes: Record<string, { ok: boolean; body: unknown }>
): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const route = routes[url];
    if (!route) {
      throw new Error(`Unhandled fetch: ${url}`);
    }
    return {
      ok: route.ok,
      json: async () => route.body,
    } as Response;
  }) as unknown as typeof fetch;
}

describe("data utilities", () => {
  it("builds stable song stats keys", () => {
    expect(songStatsKey(3, 12)).toBe("3:12");
  });

  it("unwrap returns the value or throws", () => {
    expect(unwrap(0)).toBe(0);
    expect(unwrap("x")).toBe("x");
    expect(() => unwrap(null)).toThrow("UNWRAP FAILED.");
    expect(() => unwrap(undefined)).toThrow("UNWRAP FAILED.");
  });
});

describe("getData", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads song info, stats, and match results", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        "/api/song/all": {
          ok: true,
          body: [
            { id: 1, path: "p1", title: "Song 1", extension: "mp3" },
            { id: 2, path: "p2", title: "Song 2", extension: "flac" },
          ],
        },
        "/api/songstats/all": {
          ok: true,
          body: [
            { id: 1, matchup_id: 1, song_id: 1, rating: 10, rank: 2 },
            { id: 2, matchup_id: 1, song_id: 2, rating: 20, rank: 1 },
            { id: 3, matchup_id: 2, song_id: 1, rating: 11, rank: 2 },
            { id: 4, matchup_id: 2, song_id: 2, rating: 21, rank: 1 },
          ],
        },
        "/api/match/all": {
          ok: true,
          body: [{ id: 2, winner_id: 2, loser_id: 1 }],
        },
      })
    );

    const [songInfoMap, songStatsMap, maxMatchIndex, matchResults] =
      await getData();

    expect(songInfoMap.get(1)).toEqual(["p1", "Song 1", "mp3"]);
    expect(songInfoMap.get(2)).toEqual(["p2", "Song 2", "flac"]);

    expect(songStatsMap.get("1:1")).toEqual([10, 2]);
    expect(songStatsMap.get("1:2")).toEqual([20, 1]);
    expect(songStatsMap.get("2:1")).toEqual([11, 2]);
    expect(songStatsMap.get("2:2")).toEqual([21, 1]);

    expect(maxMatchIndex).toBe(2);
    expect(matchResults.get(2)).toEqual([2, 1]);
  });

  it("throws when match results fail to load", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetchMock({
        "/api/song/all": { ok: true, body: [] },
        "/api/songstats/all": { ok: true, body: [] },
        "/api/match/all": { ok: false, body: [] },
      })
    );

    await expect(getData()).rejects.toThrow("Failed to load.");
  });
});

