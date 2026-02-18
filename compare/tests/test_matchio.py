from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

from compare.matchio import OnlineMatchIO
from compare.song import Song


@dataclass
class _FakeResponse:
    status_code: int = 200
    text: str = ""

    def raise_for_status(self) -> None:
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class _FakeBackend:
    def __init__(self, ratings: dict[int, float]) -> None:
        self._ratings = ratings

    def overall_rating(self, player: int) -> float:  # matches RatingBackend shape
        return self._ratings[player]


def test_save_songs_deletes_then_posts_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, str, dict[str, Any]]] = []

    def fake_get(url: str, **kwargs: Any) -> _FakeResponse:
        calls.append(("get", url, dict(kwargs)))
        return _FakeResponse(status_code=200)

    def fake_post(url: str, **kwargs: Any) -> _FakeResponse:
        calls.append(("post", url, dict(kwargs)))
        return _FakeResponse(status_code=200)

    import compare.matchio as matchio_mod

    monkeypatch.setattr(matchio_mod.requests, "get", fake_get)
    monkeypatch.setattr(matchio_mod.requests, "post", fake_post)

    backend = _FakeBackend({0: 10.0, 1: 20.5})
    songs = [
        Song(id=0, path=Path(r"C:\music\a.mp3"), title="a", extension=".mp3"),
        Song(id=1, path=Path(r"C:\music\b.wav"), title="b", extension=".wav"),
    ]

    io = OnlineMatchIO(base_url="http://example.test/api")
    io.save_songs(backend, songs)

    assert [c[0] for c in calls] == ["get", "post"]
    assert calls[0][1] == "http://example.test/api/delete/all"
    assert calls[1][1] == "http://example.test/api/song/all"

    posted_json = calls[1][2]["json"]
    assert posted_json == [
        {
            "id": 0,
            "path": str(songs[0].path),
            "title": "a",
            "extension": ".mp3",
            "starting_rating": 10.0,
        },
        {
            "id": 1,
            "path": str(songs[1].path),
            "title": "b",
            "extension": ".wav",
            "starting_rating": 20.5,
        },
    ]


def test_load_songs_raises_on_non_200(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(_url: str, **_kwargs: Any) -> _FakeResponse:
        return _FakeResponse(status_code=500, text="[]")

    import compare.matchio as matchio_mod

    monkeypatch.setattr(matchio_mod.requests, "get", fake_get)
    io = OnlineMatchIO(base_url="http://example.test/api")
    with pytest.raises(RuntimeError):
        io.load_songs()


def test_load_songs_parses_models(monkeypatch: pytest.MonkeyPatch) -> None:
    songs_json = json.dumps(
        [
            {"id": 0, "path": r"C:\m\a.mp3", "title": "a", "extension": ".mp3"},
            {"id": 1, "path": r"C:\m\b.wav", "title": "b", "extension": ".wav"},
        ]
    )

    def fake_get(_url: str, **_kwargs: Any) -> _FakeResponse:
        return _FakeResponse(status_code=200, text=songs_json)

    import compare.matchio as matchio_mod

    monkeypatch.setattr(matchio_mod.requests, "get", fake_get)
    io = OnlineMatchIO(base_url="http://example.test/api")
    songs = io.load_songs()

    assert [s.id for s in songs] == [0, 1]
    assert [s.title for s in songs] == ["a", "b"]
    assert [str(s.path) for s in songs] == [r"C:\m\a.mp3", r"C:\m\b.wav"]


def test_load_match_history_raises_on_non_200(monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_get(_url: str, **_kwargs: Any) -> _FakeResponse:
        return _FakeResponse(status_code=404, text="[]")

    import compare.matchio as matchio_mod

    monkeypatch.setattr(matchio_mod.requests, "get", fake_get)
    io = OnlineMatchIO(base_url="http://example.test/api")
    with pytest.raises(RuntimeError):
        io.load_match_history()


def test_load_match_history_parses_models(monkeypatch: pytest.MonkeyPatch) -> None:
    matches_json = json.dumps(
        [
            {"id": 1, "winner_id": 0, "loser_id": 1},
            {"id": 2, "winner_id": 2, "loser_id": 0},
        ]
    )

    def fake_get(_url: str, **_kwargs: Any) -> _FakeResponse:
        return _FakeResponse(status_code=200, text=matches_json)

    import compare.matchio as matchio_mod

    monkeypatch.setattr(matchio_mod.requests, "get", fake_get)
    io = OnlineMatchIO(base_url="http://example.test/api")
    history = io.load_match_history()
    assert history == [(0, 1), (2, 0)]


def test_save_match_posts_payload(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[str, str, dict[str, Any]]] = []

    def fake_post(url: str, **kwargs: Any) -> _FakeResponse:
        calls.append(("post", url, dict(kwargs)))
        return _FakeResponse(status_code=201)

    import compare.matchio as matchio_mod

    monkeypatch.setattr(matchio_mod.requests, "post", fake_post)

    backend = _FakeBackend({0: 99.0, 1: 12.25})
    io = OnlineMatchIO(base_url="http://example.test/api")
    io.save_match(backend, winner=0, loser=1)

    assert len(calls) == 1
    assert calls[0][1] == "http://example.test/api/match/one"
    assert calls[0][2]["json"] == {
        "winning_song": 0,
        "losing_song": 1,
        "winning_song_rating": 99.0,
        "losing_song_rating": 12.25,
    }

