import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LeaderboardRow } from "../components/LeaderboardRow";
import styles from "../components/LeaderboardRow/LeaderboardRow.module.css";
import { ROWTYPE } from "../types";

describe("LeaderboardRow", () => {
  it("renders rating + delta formatting and neutral styling", () => {
    const { container } = render(
      <LeaderboardRow
        title="Song"
        rank={2}
        rankDelta={1}
        rating={100}
        ratingDelta={-1.234}
        rowType={ROWTYPE.NEUTRAL}
      />
    );

    expect(container.firstChild).toHaveClass(styles["Leaderboard-row"]);
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("^1")).toBeInTheDocument();
    expect(screen.getByText("100.00")).toBeInTheDocument();
    expect(screen.getByText("v1.23")).toBeInTheDocument();
  });

  it("applies winner/loser row styles", () => {
    const { rerender, container } = render(
      <LeaderboardRow
        title="Song"
        rank={1}
        rankDelta={0}
        rating={1}
        ratingDelta={0}
        rowType={ROWTYPE.WINNER}
      />
    );
    expect(container.firstChild).toHaveClass(styles["row-winner"]);

    rerender(
      <LeaderboardRow
        title="Song"
        rank={1}
        rankDelta={0}
        rating={1}
        ratingDelta={0}
        rowType={ROWTYPE.LOSER}
      />
    );
    expect(container.firstChild).toHaveClass(styles["row-loser"]);
  });
});

