"""
Hooks together `MatchRenderer`, `RatingBackend`, `MatchLoadStore` and
`AudioPlayerBuilder` to create a matchmaking application.
"""

from pathlib import Path
import time

from compare.audio_player import AudioPlayer, AudioPlayerBuilder
from compare.matchio import MatchIO
from compare.matchmaking import RatingBackend
from compare.render import MatchInput, MatchRenderer
from compare.song import MusicFolder, Song


class RateSongs:
    def __init__(self,
        renderer: MatchRenderer,
        rating_backend: RatingBackend,
        match_serializer: MatchIO,
        audio_player_builder: AudioPlayerBuilder,
        folder_path: Path | None
    ) -> None:
        self._renderer: MatchRenderer = renderer
        self._rating_backend: RatingBackend = rating_backend
        self._match_serializer: MatchIO = match_serializer
        self._audio_player_builder: AudioPlayerBuilder = audio_player_builder

        if folder_path is not None:
            music_folder = MusicFolder.from_folder(folder_path)
            self._songs: list[Song] = music_folder.songs()
            for song_id in [song.id for song in self._songs]:
                self._rating_backend.new_player(song_id)
            self._match_serializer.save_songs(self._rating_backend, self._songs)
        else:
            self._songs = self._match_serializer.load_songs()
            for song_id in [song.id for song in self._songs]:
                self._rating_backend.new_player(song_id)
            for match in self._match_serializer.load_match_history():
                self._rating_backend.update(match[0], match[1])

        self._audio_players: list[AudioPlayer] = []
        for song in self._songs:
            player = audio_player_builder.create(song.path)
            if player is None:
                raise ValueError(f"Player failed for song with path {song.path}")
            self._audio_players.append(player)

    def perform_rating(self) -> None:
        player1_id, player2_id = self._rating_backend.pick_two_players()
        audio_player_1 = self._audio_players[player1_id]
        audio_player_2 = self._audio_players[player2_id]
        audio_player_1.set_position(0.15)
        audio_player_2.set_position(0.15)
        audio_player_1.play()

        while True:
            time.sleep(0.25)
            ranks = self._rating_backend.ranks()
            song_infos = {
                self._songs[id]: (rank, self._rating_backend.overall_rating(id))
                for id, rank in ranks.items()
            }
            self._renderer.render(
                self._songs[player1_id],
                self._songs[player2_id],
                self._audio_players[player1_id].is_playing(),
                song_infos
            )

            action: MatchInput = self._renderer.get_input()
            if action != MatchInput.NONE:
                if action == MatchInput.SWAP_PLAYING_SONG:
                    audio_player_1.toggle()
                    audio_player_2.toggle()
                else:
                    audio_player_1.pause()
                    audio_player_2.pause()
                    if action == MatchInput.SONG_A_WINS:
                        self._rating_backend.update(player1_id, player2_id)
                        self._match_serializer.save_match(
                            self._rating_backend,
                            player1_id,
                            player2_id
                        )
                    elif action == MatchInput.SONG_B_WINS:
                        self._rating_backend.update(player2_id, player1_id)
                        self._match_serializer.save_match(
                            self._rating_backend,
                            player2_id,
                            player1_id
                        )
                    return
