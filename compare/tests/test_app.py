from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

from compare.app import RateSongs
from compare.render import MatchInput
from compare.song import Song


class _FakeBackend:
    def __init__(self, *, pick: tuple[int, int] = (0, 1)) -> None:
        self._pick = pick
        self.new_player_calls: list[int] = []
        self.update_calls: list[tuple[int, int]] = []
        self._ranks: dict[int, int] = {}
        self._ratings: dict[int, float] = {}

    def new_player(self, id: int) -> None:
        self.new_player_calls.append(id)

    def pick_two_players(self) -> tuple[int, int]:
        return self._pick

    def ranks(self) -> dict[int, int]:
        return dict(self._ranks)

    def overall_rating(self, player: int) -> float:
        return self._ratings.get(player, 0.0)

    def update(self, winner: int, loser: int) -> None:
        self.update_calls.append((winner, loser))

    def set_state(self, *, ranks: dict[int, int], ratings: dict[int, float]) -> None:
        self._ranks = dict(ranks)
        self._ratings = dict(ratings)


@dataclass
class _FakeAudioPlayer:
    playing: bool = False
    play_calls: int = 0
    pause_calls: int = 0
    toggle_calls: int = 0
    positions: list[float] = None  # type: ignore[assignment]

    def __post_init__(self) -> None:
        if self.positions is None:
            self.positions = []

    def play(self) -> None:
        self.play_calls += 1
        self.playing = True

    def pause(self) -> None:
        self.pause_calls += 1
        self.playing = False

    def is_playing(self) -> bool:
        return self.playing

    def toggle(self) -> None:
        self.toggle_calls += 1
        self.playing = not self.playing

    def set_position(self, position: float) -> None:
        self.positions.append(position)


class _FakeAudioPlayerBuilder:
    def __init__(self, *, fail_on: Path | None = None) -> None:
        self.fail_on = fail_on
        self.create_calls: list[Path] = []
        self.players: list[_FakeAudioPlayer] = []

    def create(self, media_path: Path) -> _FakeAudioPlayer | None:
        self.create_calls.append(media_path)
        if self.fail_on is not None and media_path == self.fail_on:
            return None
        player = _FakeAudioPlayer()
        self.players.append(player)
        return player


class _FakeMatchIO:
    def __init__(self) -> None:
        self.save_songs_calls: list[list[Song]] = []
        self.save_match_calls: list[tuple[int, int]] = []
        self._songs_to_load: list[Song] = []
        self._history_to_load: list[tuple[int, int]] = []

    def save_songs(self, _rating_backend: Any, songs: list[Song]) -> None:
        self.save_songs_calls.append(list(songs))

    def load_songs(self) -> list[Song]:
        return list(self._songs_to_load)

    def load_match_history(self) -> list[tuple[int, int]]:
        return list(self._history_to_load)

    def save_match(self, _rating_backend: Any, winner: int, loser: int) -> None:
        self.save_match_calls.append((winner, loser))

    def set_load_data(self, *, songs: list[Song], history: list[tuple[int, int]]) -> None:
        self._songs_to_load = list(songs)
        self._history_to_load = list(history)


class _FakeRenderer:
    def __init__(self, inputs: list[MatchInput]) -> None:
        self._inputs = inputs
        self._idx = 0
        self.render_calls: int = 0

    def get_input(self) -> MatchInput:
        if self._idx >= len(self._inputs):
            return MatchInput.NONE
        value = self._inputs[self._idx]
        self._idx += 1
        return value

    def render(self, *_args: Any, **_kwargs: Any) -> None:
        self.render_calls += 1


def test_init_with_folder_saves_songs_and_creates_players(tmp_path: Path) -> None:
    (tmp_path / "a.mp3").write_text("x")
    (tmp_path / "b.mp3").write_text("x")

    renderer = _FakeRenderer([])
    backend = _FakeBackend()
    matchio = _FakeMatchIO()
    builder = _FakeAudioPlayerBuilder()

    _app = RateSongs(renderer, backend, matchio, builder, tmp_path)

    assert backend.new_player_calls == [0, 1]
    assert len(matchio.save_songs_calls) == 1
    assert [s.id for s in matchio.save_songs_calls[0]] == [0, 1]
    assert len(builder.create_calls) == 2


def test_init_without_folder_loads_songs_and_replays_history(tmp_path: Path) -> None:
    songs = [
        Song(id=0, path=tmp_path / "a.mp3", title="a", extension=".mp3"),
        Song(id=1, path=tmp_path / "b.mp3", title="b", extension=".mp3"),
        Song(id=2, path=tmp_path / "c.mp3", title="c", extension=".mp3"),
    ]
    matchio = _FakeMatchIO()
    matchio.set_load_data(songs=songs, history=[(0, 1), (2, 0)])

    renderer = _FakeRenderer([])
    backend = _FakeBackend()
    builder = _FakeAudioPlayerBuilder()

    _app = RateSongs(renderer, backend, matchio, builder, None)

    assert backend.new_player_calls == [0, 1, 2]
    assert backend.update_calls == [(0, 1), (2, 0)]
    assert len(builder.create_calls) == 3


def test_init_raises_if_audio_player_builder_fails(tmp_path: Path) -> None:
    (tmp_path / "a.mp3").write_text("x")
    (tmp_path / "b.mp3").write_text("x")

    renderer = _FakeRenderer([])
    backend = _FakeBackend()
    matchio = _FakeMatchIO()
    fail_path = tmp_path / "b.mp3"
    builder = _FakeAudioPlayerBuilder(fail_on=fail_path)

    with pytest.raises(ValueError):
        RateSongs(renderer, backend, matchio, builder, tmp_path)


def test_perform_rating_swap_then_song_a_wins(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    songs = [
        Song(id=0, path=tmp_path / "a.mp3", title="a", extension=".mp3"),
        Song(id=1, path=tmp_path / "b.mp3", title="b", extension=".mp3"),
    ]
    matchio = _FakeMatchIO()
    matchio.set_load_data(songs=songs, history=[])

    backend = _FakeBackend(pick=(0, 1))
    backend.set_state(ranks={0: 1, 1: 2}, ratings={0: 10.0, 1: 5.0})

    renderer = _FakeRenderer([MatchInput.SWAP_PLAYING_SONG, MatchInput.SONG_A_WINS])
    builder = _FakeAudioPlayerBuilder()

    import compare.app as app_mod

    monkeypatch.setattr(app_mod.time, "sleep", lambda _s: None)

    app = RateSongs(renderer, backend, matchio, builder, None)
    app.perform_rating()

    # Positions are set for both players before play.
    assert builder.players[0].positions == [0.15]
    assert builder.players[1].positions == [0.15]

    # Swap toggles both players once.
    assert builder.players[0].toggle_calls == 1
    assert builder.players[1].toggle_calls == 1

    # Choosing SONG_A_WINS updates and saves the match with (0, 1).
    assert backend.update_calls == [(0, 1)]
    assert matchio.save_match_calls == [(0, 1)]

