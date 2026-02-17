"""
Classes to allow for audio files to be validated and played.
"""

import time
from pathlib import Path
from typing import Protocol, cast, override

import vlc


class AudioPlayer(Protocol):
    """
    Interface to play and interact with a particular audio file.
    """

    def play(self) -> None:
        """
        Plays the underlying media if it's not currently playing.
        """
        ...

    def pause(self) -> None:
        """
        Pauses the underlying media if it's currently playing.
        """
        ...

    def is_playing(self) -> bool:
        """
        Returns true iff the underlying media is playing.
        """
        ...

    def toggle(self) -> None:
        """
        Toggles the underlying media on/off based on the current state.
        """
        ...

    def set_position(self, position: float) -> None:
        """
        Sets the position of the underlying media based on the percentage elapsed.
        Args:
            position: Decimal percentage of song elapsed.
        """
        ...


class AudioPlayerBuilder(Protocol):
    """
    Interface to provide a standardized way of creating audio players.
    """

    def create(self, media_path: Path) -> AudioPlayer | None:
        """
        Creates a new audio player from a media path.

        If the audio file is not playable, this should return None.
        """
        ...


class VlcAudioPlayer(AudioPlayer):
    def __init__(self, player: vlc.MediaPlayer) -> None:
        self._player = player

    def play(self) -> None:
        if self._player.is_playing() == 0:
            self._player.play()

    def pause(self) -> None:
        if self._player.is_playing() == 1:
            self._player.pause()

    def is_playing(self) -> bool:
        return self._player.is_playing() == 1

    def toggle(self) -> None:
        if self._player.is_playing() == 1:
            self._player.pause()
        else:
            self._player.play()

    def set_position(self, position: float) -> None:
        self._player.set_position(position)


class VlcAudioPlayerBuilder(AudioPlayerBuilder):
    """
    Class to build a `VlcAudioPlayer` instance.
    """

    def __init__(self, pre_buffer_time: float) -> None:
        self._pre_buffer_time: float = pre_buffer_time
        self._vlc_instance: vlc.Instance = cast(vlc.Instance, vlc.Instance("--no-video", "--quiet"))

    @override
    def create(self, media_path: Path) -> VlcAudioPlayer | None:
        player = self._vlc_instance.media_player_new()
        media = self._vlc_instance.media_new(media_path)
        media.add_option("start-time=15")
        player.set_media(media)
        if player is None:
            return None
        return VlcAudioPlayer(player)
