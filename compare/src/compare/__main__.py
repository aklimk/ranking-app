"""
Creates a `RateSongs` application with default interfaces.
Runs `--runs` number of song ratings.
`--music-folder` being set indicates that the tables should be
rebuilt around a new folder. Not setting any music folder will
load the currently active session from sql
"""
import argparse
import curses
from pathlib import Path

from compare.audio_player import VlcAudioPlayerBuilder
from compare.matchio import OnlineMatchIO
from compare.matchmaking import PlackettLuceBackend
from compare.app import RateSongs
from compare.render import CursesMatchRenderer

def main(window: curses.window):
    parser = argparse.ArgumentParser(prog="Compare Music")
    parser.add_argument("--runs", type=int, default=10)
    parser.add_argument("--music-folder", type=Path, default=None)
    args = parser.parse_args()

    renderer = CursesMatchRenderer(window, (0, 0, 80, 80))
    rating_backend = PlackettLuceBackend()
    database_manager = OnlineMatchIO()
    audio_player_builder = VlcAudioPlayerBuilder(0.1)
    app = RateSongs(
        renderer,
        rating_backend,
        database_manager,
        audio_player_builder,
        args.music_folder
    )
    for _ in range(args.runs):
        app.perform_rating()

if __name__ == "__main__":
    curses.wrapper(main)
