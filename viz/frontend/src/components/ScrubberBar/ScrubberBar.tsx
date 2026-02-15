import { ChangeEvent } from "react";
import { PHASE } from "../../types";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

interface ScrubberCardProps {
  matchIndex: number;
  setMatchIndex: (newState: number) => void;
  maxMatchIndex: number;
  phase: PHASE;
  setPhase: (newPhase: PHASE) => void;
}

export function ScrubberBar({
  matchIndex,
  setMatchIndex,
  maxMatchIndex,
  phase,
  setPhase
}: ScrubberCardProps) {
  const isPreMatch = (matchIndex === 0);
  let phaseLabel: string;
  if (phase == PHASE.STATS_PHASE) {
    phaseLabel = "Stats"
  } else {
    phaseLabel = "Reorder";
  }
  function handleRangeInput(event: ChangeEvent<HTMLInputElement>): void {
    setMatchIndex(clamp(event.currentTarget.valueAsNumber, 0, maxMatchIndex));
  }

  return (
    <div className="scrubber">
      <input
        type="range"
        min={0}
        max={maxMatchIndex}
        value={matchIndex}
        onChange={handleRangeInput}
      />
      <p className="match-line">
        <span>
          {isPreMatch
            ? "Pre-Match"
            : `Match ${matchIndex}/${maxMatchIndex} · ${phaseLabel}`}
        </span>
      </p>
    </div>
  );
}
