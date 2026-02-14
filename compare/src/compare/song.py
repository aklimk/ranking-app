"""
Defines classes to represent audio media and folders of audio media.
"""
from dataclasses import dataclass
import os
from pathlib import Path
from typing import Self


type SongID = int

@dataclass(frozen=True)
class Song:
    """
    Immutable dataclass representing a particular media file.
    """
    id: SongID
    path: Path
    title: str
    extension: str


class MusicFolder:
    """
    Represents a folder of music. Internally holds
    a list of `Song` objects, and performs verification
    and initialization of those objects given a folder path.
    """

    def __init__(self, songs: list[Song]) -> None:
        self._songs: list[Song] = songs

    def add_song(self, song: Song) -> None:
        self._songs.append(song)

    @classmethod
    def from_folder(cls, folder_path: Path) -> Self:
        """
        Creates a `SongFolder` object from a path to a folder.

        Args:
            folder_path: Path to the folder containing music.

        Raises:
            - `ValueError` If `folder_path` is not a valid path to a directory.
            - `ValueError` If the folder at `folder_path` contains files which
            don't have an extension
        """
        if not folder_path.is_dir():
            raise ValueError("Path does not point to a folder.")

        songs: list[Song] = []
        for i, file in enumerate(sorted(os.listdir(folder_path))):
            path = Path(os.path.join(folder_path, file))
            _, extension = os.path.splitext(path)
            if extension == "":
                raise ValueError(f"Media at path {path} has no extension.")
            songs.append(Song(i, path, path.stem, extension))
        return cls(songs)

    def songs(self) -> list[Song]:
        return self._songs
