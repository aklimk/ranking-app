from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pytest

from compare.audio_player import VlcAudioPlayer, VlcAudioPlayerBuilder


@dataclass
class _FakeMedia:
    added_options: list[str]

    def add_option(self, option: str) -> None:
        self.added_options.append(option)


class _FakeMediaPlayer:
    def __init__(self) -> None:
        self._is_playing = 0
        self.play_calls = 0
        self.pause_calls = 0
        self.positions: list[float] = []
        self.media: object | None = None

    def is_playing(self) -> int:
        return self._is_playing

    def play(self) -> None:
        self.play_calls += 1
        self._is_playing = 1

    def pause(self) -> None:
        self.pause_calls += 1
        self._is_playing = 0

    def set_position(self, position: float) -> None:
        self.positions.append(position)

    def set_media(self, media: object) -> None:
        self.media = media


class _FakeVlcInstance:
    def __init__(self) -> None:
        self.media_new_paths: list[Path] = []
        self.created_players: list[_FakeMediaPlayer] = []
        self.last_media: _FakeMedia | None = None

    def media_player_new(self) -> _FakeMediaPlayer:
        player = _FakeMediaPlayer()
        self.created_players.append(player)
        return player

    def media_new(self, media_path: Path) -> _FakeMedia:
        self.media_new_paths.append(media_path)
        media = _FakeMedia(added_options=[])
        self.last_media = media
        return media


def test_vlc_audio_player_gates_play_pause_calls() -> None:
    raw = _FakeMediaPlayer()
    player = VlcAudioPlayer(raw)

    player.play()
    player.play()
    assert raw.play_calls == 1
    assert player.is_playing() is True

    player.pause()
    player.pause()
    assert raw.pause_calls == 1
    assert player.is_playing() is False


def test_vlc_audio_player_toggle_and_set_position() -> None:
    raw = _FakeMediaPlayer()
    player = VlcAudioPlayer(raw)

    player.toggle()
    assert player.is_playing() is True

    player.toggle()
    assert player.is_playing() is False

    player.set_position(0.5)
    assert raw.positions == [0.5]


def test_vlc_audio_player_builder_sets_start_option_and_media(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_instance = _FakeVlcInstance()
    captured_instance_args: list[tuple[Any, ...]] = []

    def fake_instance_factory(*args: Any, **_kwargs: Any) -> _FakeVlcInstance:
        captured_instance_args.append(tuple(args))
        return fake_instance

    import compare.audio_player as audio_mod

    monkeypatch.setattr(audio_mod.vlc, "Instance", fake_instance_factory, raising=True)

    builder = VlcAudioPlayerBuilder(pre_buffer_time=0.1)
    assert captured_instance_args == [("--no-video", "--quiet")]

    created = builder.create(Path("song.mp3"))
    assert created is not None
    assert fake_instance.media_new_paths == [Path("song.mp3")]
    assert fake_instance.last_media is not None
    assert fake_instance.last_media.added_options == ["start-time=15"]
    assert fake_instance.created_players[0].media is fake_instance.last_media

