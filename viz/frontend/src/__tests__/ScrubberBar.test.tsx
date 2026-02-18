import { render, screen, fireEvent } from "@testing-library/react";
import { act, useState } from "react";
import { describe, expect, it } from "vitest";
import { ScrubberBar } from "../components/ScrubberBar";
import { PHASE } from "../types";

function Harness({
  initialMatchIndex,
  maxMatchIndex,
  initialPhase,
}: {
  initialMatchIndex: number;
  maxMatchIndex: number;
  initialPhase: PHASE;
}): React.JSX.Element {
  const [matchIndex, setMatchIndex] = useState(initialMatchIndex);
  const [phase, setPhase] = useState(initialPhase);
  return (
    <ScrubberBar
      matchIndex={matchIndex}
      setMatchIndex={setMatchIndex}
      maxMatchIndex={maxMatchIndex}
      phase={phase}
      setPhase={setPhase}
    />
  );
}

describe("ScrubberBar", () => {
  it("advances matchIndex and toggles phases via arrow keys", async () => {
    render(
      <Harness
        initialMatchIndex={1}
        maxMatchIndex={3}
        initialPhase={PHASE.REORDER_PHASE}
      />
    );
    await act(async () => {});

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await act(async () => {});
    expect(
      screen.getByText(/Match 2\/3 .* Stats/)
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowRight" });
    await act(async () => {});
    expect(
      screen.getByText(/Match 2\/3 .* Reorder/)
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(
      screen.getByText(/Match 2\/3 .* Stats/)
    ).toBeInTheDocument();
  });

  it("ignores arrow keys while focused on an editable element", async () => {
    render(
      <Harness
        initialMatchIndex={1}
        maxMatchIndex={3}
        initialPhase={PHASE.REORDER_PHASE}
      />
    );
    await act(async () => {});

    const slider = screen.getByRole("slider");
    slider.focus();

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(
      screen.getByText(/Match 1\/3 .* Reorder/)
    ).toBeInTheDocument();
  });

  it("clamps range input to the allowed match index bounds", async () => {
    render(
      <Harness
        initialMatchIndex={1}
        maxMatchIndex={3}
        initialPhase={PHASE.REORDER_PHASE}
      />
    );
    await act(async () => {});

    const slider = screen.getByRole("slider") as HTMLInputElement;
    slider.value = "99";
    fireEvent.input(slider);

    expect(
      screen.getByText(/Match 3\/3 .* Reorder/)
    ).toBeInTheDocument();
  });
});
