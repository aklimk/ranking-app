"""
Classes in order to receive input from, and render to, a matchmaking GUI.
"""

import curses
from enum import Enum, auto
from typing import Protocol, override

from compare.song import Song

class MatchInput(Enum):
    """
    Represents an input from a `MatchRenderer` during a match.

    SONG_A_WINS indicates the player has chosen songa to beat songb.
    SONG_B_WINS indicates the player has chosen songb to beat songa.
    SWAP_PLAYING_SONG indicata
    """
    SONG_A_WINS = auto()
    SONG_B_WINS = auto()
    SWAP_PLAYING_SONG = auto()
    NONE = auto()

class MatchRenderer(Protocol):
    def get_input(self) -> MatchInput:
        """
        Retrieves a `MatchInput` enum from player input during a match.
        """
        ...

    def render(self,
        song1: Song,
        song2: Song,
        song1_is_playing: bool,
        song_stats: dict[Song, tuple[int, float]]
    ) -> None:
        """
        Renders the current matchmaking status to the GUI.
        """
        ...

class CursesMatchRenderer(MatchRenderer):
    def __init__(self,
        window: curses.window,
        bounds: tuple[int, int, int, int]
    ) -> None:
        self._window: curses.window = window
        self._bounds: tuple[int, int, int, int] = bounds
        self._player_bounds: tuple[int, int, int, int] = (
            self._bounds[0], self._bounds[1],
            int(self._bounds[2] * 0.333), self._bounds[3]
        )
        self._song_list_bounds: tuple[int, int, int, int] = (
            self._player_bounds[2] + 1, self._bounds[1],
            self._bounds[2], self._bounds[3]
        )
        curses.noecho()
        curses.cbreak()
        self._window.keypad(True)

    @override
    def get_input(self) -> MatchInput:
        char_input = self._window.getch()
        if char_input == ord('3'):
            return MatchInput.SWAP_PLAYING_SONG
        elif char_input == ord('1'):
            return MatchInput.SONG_A_WINS
        elif char_input == ord('2'):
            return MatchInput.SONG_B_WINS
        return MatchInput.NONE

    def _render_player(
        self,
        song1: Song,
        song2: Song,
        song1_is_playing: bool
    ) -> None:
        if song1_is_playing:
            song1_highlight = curses.A_UNDERLINE
            song2_highlight = curses.A_NORMAL
        else:
            song1_highlight = curses.A_NORMAL
            song2_highlight = curses.A_UNDERLINE

        self._window.addnstr(
            self._player_bounds[1],
            self._player_bounds[0],
            "a: " + song1.title,
            self._player_bounds[2] - self._player_bounds[0],
            song1_highlight,
        )
        self._window.addnstr(
            self._player_bounds[1] + 3,
            self._player_bounds[0],
            "b: " + song2.title,
            self._player_bounds[2] - self._player_bounds[0],
            song2_highlight,
        )
        self._window.move(0, 0)

    def _render_songlist(
        self,
        song1: Song,
        song2: Song,
        song_ranks: dict[Song, tuple[int, float]]
    ) -> None:
        for song, info in song_ranks.items():
            highlight = curses.A_NORMAL
            if song in [song1, song2]:
                highlight = curses.A_UNDERLINE
            self._window.addnstr(
                self._song_list_bounds[1] + info[0],
                self._song_list_bounds[0] + 2,
                "|", 1,
                curses.A_NORMAL
            )
            self._window.addnstr(
                self._song_list_bounds[1] + info[0],
                self._song_list_bounds[0] + 5,
                song.title,
                (self._song_list_bounds[2] - self._song_list_bounds[0]) - 10,
                highlight,
            )
            self._window.addnstr(
                self._song_list_bounds[1] + info[0],
                self._song_list_bounds[2] - 10,
                " | " + str(info[1]),
                10,
                highlight,
            )

    @override
    def render(self,
        song1: Song,
        song2: Song,
        song1_is_playing: bool,
        song_stats: dict[Song, tuple[int, float]]
    ) -> None:
        self._window.clear()
        self._render_player(song1, song2, song1_is_playing)
        self._render_songlist(song1, song2, song_stats)
        self._window.refresh()
