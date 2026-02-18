from __future__ import annotations

from pathlib import Path

import pytest

from compare.song import MusicFolder


def test_from_folder_rejects_non_directory(tmp_path: Path) -> None:
    file_path = tmp_path / "not_a_dir.mp3"
    file_path.write_text("x")
    with pytest.raises(ValueError):
        MusicFolder.from_folder(file_path)


def test_from_folder_rejects_extensionless_files(tmp_path: Path) -> None:
    (tmp_path / "ok.mp3").write_text("x")
    (tmp_path / "noext").write_text("x")
    with pytest.raises(ValueError):
        MusicFolder.from_folder(tmp_path)


def test_from_folder_sorts_files_and_assigns_ids(tmp_path: Path) -> None:
    (tmp_path / "b.mp3").write_text("x")
    (tmp_path / "a.wav").write_text("x")

    folder = MusicFolder.from_folder(tmp_path)
    songs = folder.songs()

    assert [song.id for song in songs] == [0, 1]
    assert [song.title for song in songs] == ["a", "b"]
    assert [song.extension for song in songs] == [".wav", ".mp3"]
    assert [song.path.name for song in songs] == ["a.wav", "b.mp3"]

