"""
Matchmaking/rating backend tests.

This test suite is intentionally split into:
- Contract tests: invariants expected of any `RatingBackend` implementation.
- Backend-specific tests: behavior tied to a particular algorithm/config.
"""

from __future__ import annotations

import math
import random
from collections.abc import Callable, Iterable

import pytest

from compare.matchmaking import PlackettLuceBackend


def make_plackett_luce_backend(**kwargs: object) -> PlackettLuceBackend:
    """Backend factory for `PlackettLuceBackend`."""
    return PlackettLuceBackend(**kwargs)


def _create_players(backend: PlackettLuceBackend, ids: Iterable[int]) -> list[int]:
    """Create players with the given IDs and return them in creation order."""
    id_list = list(ids)
    for player_id in id_list:
        backend.new_player(player_id)
    return id_list


def _assert_ranks_are_permutation(ranks: dict[int, int], player_ids: list[int]) -> None:
    """Assert `ranks` maps all players to a 1..N permutation."""
    assert set(ranks.keys()) == set(player_ids)
    assert set(ranks.values()) == set(range(1, len(player_ids) + 1))


def _assert_all_finite_overall_ratings(backend: PlackettLuceBackend, player_ids: list[int]) -> None:
    """Assert `overall_rating` returns finite floats for all players."""
    for player_id in player_ids:
        rating = backend.overall_rating(player_id)
        assert isinstance(rating, float)
        assert math.isfinite(rating)


def _simulate_random_matches(
    backend: PlackettLuceBackend,
    player_ids: list[int],
    rng: random.Random,
    *,
    n_matches: int,
) -> None:
    """Apply `n_matches` random 1v1 outcomes among `player_ids`."""
    assert len(player_ids) >= 2
    for _ in range(n_matches):
        a, b = rng.sample(player_ids, 2)
        winner, loser = (a, b) if rng.random() < 0.5 else (b, a)
        backend.update(winner, loser)


@pytest.fixture(params=[pytest.param(make_plackett_luce_backend, id="plackett_luce")])
def backend_factory(
    request: pytest.FixtureRequest,
) -> Callable[..., PlackettLuceBackend]:
    """Factories for running contract tests across different backend implementations."""
    return request.param


class TestRatingBackendContract:
    """Contract tests for `RatingBackend` implementations."""

    def test_empty_backend_has_empty_ranks_and_certainties(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """Empty player pools return empty mappings."""
        backend = backend_factory()
        assert backend.ranks() == {}
        assert backend.rating_certainties() == {}

    def test_read_methods_are_stable_without_updates(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """Repeated reads without updates return stable results."""
        backend = backend_factory()
        player_ids = _create_players(backend, [0, 1, 2, 3])

        cert_1 = backend.rating_certainties()
        cert_2 = backend.rating_certainties()
        assert cert_1 == cert_2

        ranks_1 = backend.ranks()
        ranks_2 = backend.ranks()
        assert ranks_1 == ranks_2

        for player_id in player_ids:
            assert backend.overall_rating(player_id) == pytest.approx(
                backend.overall_rating(player_id)
            )

    def test_pick_two_players_requires_at_least_two_players(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """`pick_two_players` rejects pools with <2 players."""
        backend = backend_factory()
        with pytest.raises(ValueError):
            backend.pick_two_players()
        backend.new_player(0)
        with pytest.raises(ValueError):
            backend.pick_two_players()

    def test_new_player_ids_are_accepted_and_remain_usable(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """Players created with explicit IDs remain usable after growth."""
        backend = backend_factory()
        player_ids = _create_players(backend, range(50))

        pinned_id = player_ids[10]

        _create_players(backend, range(50, 100))
        assert math.isfinite(backend.overall_rating(pinned_id))

    @pytest.mark.parametrize("bad_id", [-1, 10_000])
    def test_invalid_player_ids_raise_value_error(
        self, backend_factory: Callable[..., PlackettLuceBackend], bad_id: int
    ) -> None:
        """Invalid IDs raise `ValueError` on read/update operations."""
        backend = backend_factory()
        a, b = _create_players(backend, [0, 1])
        with pytest.raises(ValueError):
            backend.overall_rating(bad_id)
        with pytest.raises(ValueError):
            backend.update(bad_id, a)
        with pytest.raises(ValueError):
            backend.update(a, bad_id)

        assert math.isfinite(backend.overall_rating(a))
        assert math.isfinite(backend.overall_rating(b))

    def test_update_self_is_noop(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """Self-play does not change ratings or certainties."""
        backend = backend_factory()
        backend.new_player(0)
        player_id = 0

        before_rating = backend.overall_rating(player_id)
        before_certainties = backend.rating_certainties()
        backend.update(player_id, player_id)

        assert backend.overall_rating(player_id) == pytest.approx(before_rating)
        assert backend.rating_certainties() == before_certainties

    def test_new_players_start_with_zero_certainty(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """New players have 0 certainty per the documented backend requirement."""
        backend = backend_factory()
        player_ids = _create_players(backend, range(10))
        certainties = backend.rating_certainties()
        assert set(certainties.keys()) == set(player_ids)
        assert all(certainties[player_id] == 0.0 for player_id in player_ids)

    def test_ranks_break_ties_by_id_for_fresh_players(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """With equal initial ratings, ranks follow ascending player id (1 is best)."""
        backend = backend_factory()
        player_ids = _create_players(backend, [10, 3, 7, 1])
        ranks = backend.ranks()
        _assert_ranks_are_permutation(ranks, player_ids)
        for expected_rank, player_id in enumerate(sorted(player_ids), start=1):
            assert ranks[player_id] == expected_rank

    def test_winner_moves_ahead_of_loser_for_two_fresh_players(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """A single 1v1 result should separate two initially-tied players."""
        backend = backend_factory()
        winner, loser = _create_players(backend, [0, 1])

        backend.update(winner, loser)
        ranks = backend.ranks()
        assert ranks[winner] == 1
        assert ranks[loser] == 2

    def test_pick_two_players_returns_valid_distinct_ids_under_random_play(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """Repeated picks always return distinct, in-range player IDs."""
        backend = backend_factory()
        player_ids = _create_players(backend, range(10))

        for _ in range(10):
            a, b = backend.pick_two_players()
            assert a != b
            assert a in player_ids
            assert b in player_ids

    def test_pick_two_players_returns_player_ids_not_internal_indexes(
        self, backend_factory: Callable[..., PlackettLuceBackend]
    ) -> None:
        """
        `pick_two_players` must return `PlayerID`s from the created population.

        This catches bugs where a backend accidentally returns internal storage
        indexes instead of the externally-visible IDs.
        """
        backend = backend_factory()
        player_ids = _create_players(backend, [10, 20, 30, 40, 50])

        a, b = backend.pick_two_players()
        assert a != b
        assert a in player_ids
        assert b in player_ids

    @pytest.mark.parametrize("seed", [0, 1, 2, 3, 4, 5])
    def test_invariants_hold_under_many_random_updates(
        self, backend_factory: Callable[..., PlackettLuceBackend], seed: int
    ) -> None:
        """Property-style: random play preserves basic invariants."""
        rng = random.Random(seed)
        backend = backend_factory(rng_seed=seed)

        n_players = rng.randint(2, 25)
        player_ids = _create_players(backend, range(n_players))

        _simulate_random_matches(
            backend,
            player_ids,
            rng,
            n_matches=rng.randint(200, 800),
        )

        certainties = backend.rating_certainties()
        assert set(certainties.keys()) == set(player_ids)
        for value in certainties.values():
            assert isinstance(value, float)
            assert 0.0 <= value <= 1.0
            assert math.isfinite(value)

        ranks = backend.ranks()
        _assert_ranks_are_permutation(ranks, player_ids)
        _assert_all_finite_overall_ratings(backend, player_ids)

        # Ranking should agree with sorted overall_rating, tie-breaking by id.
        expected_order = sorted(
            player_ids,
            key=lambda pid: (-backend.overall_rating(pid), pid),
        )
        for expected_rank, player_id in enumerate(expected_order, start=1):
            assert ranks[player_id] == expected_rank


class TestPlackettLuceBackendSpecific:
    """Tests specific to `PlackettLuceBackend` configuration and determinism."""

    def test_rejects_negative_relative_matchup_epsilon(self) -> None:
        """Constructor input validation for `relative_matchup_epsilon`."""
        with pytest.raises(ValueError):
            PlackettLuceBackend(relative_matchup_epsilon=-0.0001)

    def test_pick_two_players_is_reproducible_with_seed_when_ties_are_common(self) -> None:
        """Two identical seeded backends produce the same pick sequence."""
        seed = 123
        # Make tie-breaking very likely by allowing a huge EV tolerance.
        backend_a = PlackettLuceBackend(rng_seed=seed, relative_matchup_epsilon=1e9)
        backend_b = PlackettLuceBackend(rng_seed=seed, relative_matchup_epsilon=1e9)

        ids = list(range(12))
        _create_players(backend_a, ids)
        _create_players(backend_b, ids)

        picks_a = [backend_a.pick_two_players() for _ in range(10)]
        picks_b = [backend_b.pick_two_players() for _ in range(10)]
        assert picks_a == picks_b
