"""
Defines a public interface to save and load player and match information.

OnlineMatchIO is an implementation of this interface for saving and loading
match information from/to an external server.
"""

from __future__ import annotations

from pathlib import Path
from typing import Protocol, final, override
import requests
from compare.matchmaking import RatingBackend
from compare.song import Song, SongID
from pydantic import BaseModel, TypeAdapter

class MatchIO(Protocol):
    def save_songs(self, rating_backend: RatingBackend, songs: list[Song]) -> None:
        ...

    def load_songs(self) -> list[Song]:
        ...

    def load_match_history(self) -> list[tuple[SongID, SongID]]:
        ...

    def save_match(self,
        rating_backend: RatingBackend,
        winner: SongID,
        loser: SongID
    ) -> None:
        ...


class SongIn(BaseModel):
    id: SongID
    path: str
    title: str
    extension: str

class SongOut(BaseModel):
    id: SongID
    path: str
    title: str
    extension: str
    starting_rating: float

class MatchIn(BaseModel):
    id: int
    winner_id: SongID
    loser_id: SongID

class MatchOut(BaseModel):
    winning_song: SongID
    losing_song: SongID
    winning_song_rating: float
    losing_song_rating: float

@final
class OnlineMatchIO(MatchIO):
    def __init__(self, base_url: str = "http://localhost:3000/api"):
        self._base_url = base_url
        self._songs_in_adapter = TypeAdapter(list[SongIn])
        self._matches_in_adapter = TypeAdapter(list[MatchIn])

    @override
    def save_songs(self, rating_backend: RatingBackend, songs: list[Song]) -> None:
        response = requests.get(self._base_url + "/delete/all", timeout=10)
        response.raise_for_status()
        songs_data = [
            SongOut(
                id=song.id, path=str(song.path), title=song.title,
                extension=song.extension,
                starting_rating=rating_backend.overall_rating(song.id)
            )
            for song in songs
        ]
        response = requests.post(
            self._base_url + "/song/all",
            json=[song_data.model_dump() for song_data in songs_data],
            timeout=10
        )
        response.raise_for_status()

    @override
    def load_songs(self) -> list[Song]:
        response = requests.get(self._base_url + "/song/all", timeout=10)
        if response.status_code != 200:
            raise RuntimeError("Failed to retrieve songs.")
        songs_data = self._songs_in_adapter.validate_json(response.text)
        return [
            Song(
                id=song_data.id, path=Path(song_data.path), title=song_data.title,
                extension=song_data.extension
            )
            for song_data in songs_data
        ]

    @override
    def load_match_history(self) -> list[tuple[SongID, SongID]]:
        response = requests.get(self._base_url + "/match/all", timeout=10)
        if response.status_code != 200:
            raise RuntimeError("Failed to retrieve matches.")
        matches_data = self._matches_in_adapter.validate_json(response.text)
        return [
            (match_data.winner_id, match_data.loser_id)
            for match_data in matches_data
        ]

    @override
    def save_match(self,
        rating_backend: RatingBackend,
        winner: SongID,
        loser: SongID
    ) -> None:
        winner_rating = rating_backend.overall_rating(winner)
        loser_rating = rating_backend.overall_rating(loser)
        match_data: MatchOut = MatchOut(
            winning_song=winner,
            winning_song_rating=winner_rating,
            losing_song=loser,
            losing_song_rating=loser_rating
        )
        response = requests.post(
            self._base_url + "/match/one",
            json=match_data.model_dump(),
            timeout=10
        )
        response.raise_for_status()
