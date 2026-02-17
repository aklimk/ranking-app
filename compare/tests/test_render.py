from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pytest

from compare.render import CursesMatchRenderer, MatchInput
from compare.song import Song


@dataclass
class _AddNStrCall:
    y: int
    x: int
    text: str
    n: int
    attr: int


class _FakeWindow:
    def __init__(self, inputs: list[int]) -> None:
        self._inputs = inputs
        self._input_index = 0
        self.keypad_calls: list[bool] = []
        self.cleared = 0
        self.refreshed = 0
        self.addnstr_calls: list[_AddNStrCall] = []

    def keypad(self, enabled: bool) -> None:
        self.keypad_calls.append(enabled)

    def getch(self) -> int:
        if self._input_index >= len(self._inputs):
            return -1
        value = self._inputs[self._input_index]
        self._input_index += 1
        return value

    def addnstr(self, y: int, x: int, text: str, n: int, attr: int) -> None:
        self.addnstr_calls.append(_AddNStrCall(y=y, x=x, text=text, n=n, attr=attr))

    def move(self, _y: int, _x: int) -> None:
        return None

    def clear(self) -> None:
        self.cleared += 1

    def refresh(self) -> None:
        self.refreshed += 1


def test_get_input_maps_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    import compare.render as render_mod

    monkeypatch.setattr(render_mod.curses, "noecho", lambda: None, raising=False)
    monkeypatch.setattr(render_mod.curses, "cbreak", lambda: None, raising=False)

    window = _FakeWindow([ord("1"), ord("2"), ord("3"), ord("x")])
    renderer = CursesMatchRenderer(window, (0, 0, 80, 80))

    assert renderer.get_input() == MatchInput.SONG_A_WINS
    assert renderer.get_input() == MatchInput.SONG_B_WINS
    assert renderer.get_input() == MatchInput.SWAP_PLAYING_SONG
    assert renderer.get_input() == MatchInput.NONE


def test_render_uses_bold_for_currently_playing(monkeypatch: pytest.MonkeyPatch) -> None:
    import compare.render as render_mod

    monkeypatch.setattr(render_mod.curses, "A_BOLD", 999, raising=False)
    monkeypatch.setattr(render_mod.curses, "A_NORMAL", 111, raising=False)
    monkeypatch.setattr(render_mod.curses, "noecho", lambda: None, raising=False)
    monkeypatch.setattr(render_mod.curses, "cbreak", lambda: None, raising=False)

    window = _FakeWindow([])
    renderer = CursesMatchRenderer(window, (0, 0, 80, 80))

    song_a = Song(id=0, path=Path("a.mp3"), title="A", extension=".mp3")
    song_b = Song(id=1, path=Path("b.mp3"), title="B", extension=".mp3")
    stats = {song_a: (1, 10.0), song_b: (2, 5.0)}

    renderer.render(song_a, song_b, True, stats)
    assert window.cleared == 1
    assert window.refreshed == 1

    # First two player lines should bold the currently-playing song.
    assert window.addnstr_calls[0].attr == 999
    assert window.addnstr_calls[1].attr == 111

