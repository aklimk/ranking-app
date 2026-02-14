"""
Provides a `RatingBackend` interface which gives common methods required for
getting information on player ranks as well as selecting and performing
individual pairwise matches between different players.

`RatingBackend` modules should keep an internal pool of players, exposing
an opaque id through PlayerID. Notably, PlayerID references should
be consistent for the lifetime of the class.

`PlackettLuceBackend` is an implementation of `RatingBackend` based on
Plackett-Luce utilities/functions from the openskill library.

Classes
-------
RatingBackend: Interface for ranking and matchmaking utilities.
PlackettLuceBackend: Implementation of `RatingBackend`
    using openskill's PlackettLuce module.
"""

from __future__ import annotations
import math
import random
from typing import Protocol, override
from itertools import combinations
from openskill.models import PlackettLuce, PlackettLuceRating


# Opaque reference type.
type PlayerID = int

class RatingBackend(Protocol):
    """
    Abstract interface for providing rating and matchmaking utilities.
    Provides methods commonly needed for getting information on player ranks
    as well as selecting and performing pairwise matches between players.

    Implementations manage a population of players addressed by `PlayerID`,
    which should be stable for the lifetime of the class, and
    expose read and update operations for matchmaking. Implementations
    must accept player ids and ensure that its reference remains stable
    for the lifetime of the program.

    Implementations should raise a ValueError in cases where there is
    no logical implementation for the input arguments, failing fast.
    """

    def new_player(self, id: PlayerID) -> None:
        """
        Create a new player entry based on the id given.

        Args:
            id: Should be a unique reference to the new player and >= 0.

        Raises:
            - `ValueError` If `id` is not >= 0.
            - `ValueError` if two players are attempted to be created
            with the same `id`.
        """
        ...

    def overall_rating(self, player: PlayerID) -> float:
        """
        Return an overall rating for a player, intended as a single Elo-like float.

        Raises:
            - `ValueError` if player is not found.
        """
        ...

    def rating_certainties(self) -> dict[PlayerID, float]:
        """
        Return per-player rating certainty values.

        Rating certainty is in [0, 1], representing a
        rough decimal probability that the overall rating is accurate.

        Backends should enforce that players start with a completely
        uncertain (0%) starting certainty, even though this is not
        representative of real scoring systems.

        Notes:
        - Rating certainties must be stable between updates.
        - The returned dictionary is not guaranteed
        to be sorted in any particular way.
        - Running this with no players results in an empty dictionary.
        """
        ...

    def ranks(self) -> dict[PlayerID, int]:
        """
        Return per-player ranks (1 is best rank).
        Ranks should be based on the ordering of
        player overall ratings.

        Rank tie breaks are based on insertion order.

        Notes:
        - The returned dictionary is not guaranteed
        to be sorted in any particular way.
        - Running this on no players results in an empty dictionary.
        - Running this on one player means it always has rank 1.
        """
        ...

    def update(self, winner: PlayerID, loser: PlayerID) -> None:
        """
        Apply a 1v1 result where `winner_id` defeats `loser_id`.

        Raises:
            - `ValueError` if any of the players is not found.

        Notes:
            - A player playing against themselves results in no change.
        """
        ...

    def pick_two_players(self) -> tuple[PlayerID, PlayerID]:
        """
        Picks two players from the current pool to play against each other.

        Raises:
            - `ValueError` if there are less than two players.

        Notes:
            - Will never pick the same player for both players.
        """
        ...


class PlackettLuceBackend(RatingBackend):
    """
    `RatingBackend` implementation using `openskill` Plackett-Luce.
    """

    def __init__(self,
        rng_seed: int | None = None,
        relative_matchup_epsilon: float = 0.01
    ) -> None:
        """
        Initialize a default Plackett-Luce model and empty player list.

        Args:
            rng_seed: Optional variable to seed all randomness,
                allows for fully deterministic matchmaking.
            relative_matchup_epsilon: The pick_two_players function uses expected change
                in Plackett-Luce sigma as a heuristic for matchup quality, with
                ties being broken with a random choice. This quantity determines
                how close two matchup sigma change EVs have to be in order to be
                considered equal. The quantity is relative to the starting sigma of players.
                E.G. Starting sigma of 2. A value of 0.1 indicates a +/- 0.2 is equal (inclusive).
                Must be >= 0.
        """
        if not (relative_matchup_epsilon >= 0):
            raise ValueError("`relative_matchup_epsilon` must be >= 0")
        self._rng: random.Random = random.Random(rng_seed)
        self._model: PlackettLuce = PlackettLuce()
        self._matchup_epsilon: float = self._model.sigma * relative_matchup_epsilon
        self._players: list[PlackettLuceRating] = []
        self._id_to_index: dict[PlayerID, int] = {}

    @override
    def new_player(self, id: PlayerID) -> None:
        if id < 0:
            raise ValueError(f"id {id} is not >= 0.")
        if id in self._id_to_index:
            raise ValueError(f"Player with id {id} already exists.")
        rating = self._model.rating(name="no name")
        self._players.append(rating)
        self._id_to_index[id] = len(self._players) - 1

    def _get_player(self, player: PlayerID) -> PlackettLuceRating:
        """
        Return the player rating object for `player`.

        Raises:
            `ValueError` if its an invalid index.
        """
        if player not in self._id_to_index:
            raise ValueError("Player does not exist.")
        return self._players[self._id_to_index[player]]

    @override
    def overall_rating(self, player: PlayerID) -> float:
        return self._get_player(player).ordinal()

    def _rating_certainty(self, player_obj: PlackettLuceRating) -> float:
        """
        Map player Plackett-Luce uncertainty (`sigma`)
        to a probability in `[0, 1]`.

        Certainty is measured relative to the model's prior sigma baseline:
        players at prior sigma map to `0`, and lower sigma maps toward `1`.
        """
        if self._model.sigma == 0:
            return 0.0
        # Certainty is relative to the model's sigma baseline.
        sigma_ratio = 1 - (player_obj.sigma / self._model.sigma)

        # Clamp ratio to [0, 1]
        sigma_ratio = min(1.0, sigma_ratio)
        sigma_ratio = max(0.0, sigma_ratio)
        return sigma_ratio

    @override
    def rating_certainties(self) -> dict[PlayerID, float]:
        return {
            player: self._rating_certainty(self._get_player(player))
            for player in self._id_to_index.keys()
        }

    @override
    def ranks(self) -> dict[PlayerID, int]:
        if len(self._players) == 0:
            return {}
        elif len(self._players) == 1:
            return {list(self._id_to_index.keys())[0]: 1}

        # Sort players based on the ordinal rating (descending),
        # with tie breaks based on player id (ascending)
        score_tuples: list[tuple[float, PlayerID]] = [
            (self.overall_rating(player), player)
            for player in self._id_to_index.keys()
        ]
        score_tuples = sorted(
            score_tuples, key=lambda tup: (-tup[0], tup[1])
        )

        # Create dictionary of player ranks by using position in the
        # sorted array.
        ranks = {player: 0 for player in self._id_to_index.keys()}
        for i, score_tuple in enumerate(score_tuples):
            ranks[score_tuple[1]] = i + 1
        return ranks

    @override
    def update(self, winner: PlayerID, loser: PlayerID) -> None:
        if winner == loser:
            return
        winner_team, loser_team = self._model.rate([
            [self._get_player(winner)],
            [self._get_player(loser)]
        ])
        self._players[self._id_to_index[winner]] = winner_team[0]
        self._players[self._id_to_index[loser]] = loser_team[0]

    def _total_sigma_change_after_match(self,
        hypothetical_winner: PlackettLuceRating,
        hypothetical_loser: PlackettLuceRating
    ) -> float:
        """
        Internal helper function to determine the total sigma change after a
        particular matchup is played. Positive change implies sigma increased.

        Makes no actual change to any of the players.

        In this case total sigma change is equal to local sigma change
        as matches can only affect the sigma of participating players.

        Invariant:
            - Assumes the hypothetical winner and loser are different.
            Result is undefined if this assumption is broken.
        """
        sigma_before: float = hypothetical_winner.sigma + hypothetical_loser.sigma
        [hypothetical_winner_after], [hypothetical_loser_after] = self._model.rate(
            [[hypothetical_winner], [hypothetical_loser]]
        )
        sigma_after: float = hypothetical_winner_after.sigma + hypothetical_loser_after.sigma
        return sigma_after - sigma_before

    def _match_sigma_change_ev(self,
        player1: PlackettLuceRating,
        player2: PlackettLuceRating
    ) -> float:
        """
        Helper function to predict the expected change in sigma if two players
        are matched up with each other.

        Absolute decrease in sigma is determined by playing the 2 possible
        matchups (player1 win vs player2 win), while the probability of
        each outcome is predicted by the Plackett-Luce model. The combination
        of both gives a sigma change EV.
        """
        [player1_win_chance, player2_win_chance] = self._model.predict_win(
            [[player1], [player2]]
        )
        player1_win_sigma_change = self._total_sigma_change_after_match(
            player1, player2
        )
        player2_win_sigma_change = self._total_sigma_change_after_match(
            player2, player1
        )
        return (
            player1_win_sigma_change * player1_win_chance +
            player2_win_sigma_change * player2_win_chance
        )

    @override
    def pick_two_players(self) -> tuple[PlayerID, PlayerID]:
        if len(self._players) < 2:
            raise ValueError("Not enough players to pick 2.")

        # TODO: Add a cheaper code path for large pools of players.

        # The quality of a matchup is its expected *decrease* in sigma.
        # Lower EVs indicate better matchups.
        minimum_matchup_ev = math.inf
        matchup_evs: list[tuple[tuple[PlayerID, PlayerID], float]] = []

        # Go through all possible combinations of matchups.
        for player1, player2 in combinations(self._id_to_index.keys(), 2):
            player1_obj = self._players[self._id_to_index[player1]]
            player2_obj = self._players[self._id_to_index[player2]]
            sigma_change_ev = self._match_sigma_change_ev(player1_obj, player2_obj)
            matchup_evs.append(
                ((player1, player2), sigma_change_ev)
            )
            minimum_matchup_ev = min(minimum_matchup_ev, sigma_change_ev)

        # Create a list of the best matchups using `_matchup_epsilon` to
        # determine float equivalence.
        best_matchups = [
            tup[0]
            for tup in matchup_evs
            if abs(tup[1] - minimum_matchup_ev) <= self._matchup_epsilon
        ]

        # Break ties using randomness.
        return self._rng.choice(best_matchups)
