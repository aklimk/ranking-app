import { ChangeEvent, useEffect } from "react";
import type React from "react";
import { PHASE, EDITABLE_TAGS } from "../../types";
import styles from "./ScrubberBar.module.css";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isComponentEditable(target: EventTarget | null): boolean {
  if (target instanceof HTMLElement && EDITABLE_TAGS.has(target.tagName)) {
    return true;
  }
  return false;
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
}: ScrubberCardProps): React.JSX.Element {
  useEffect(() => {
    function scrubberKeys(event: KeyboardEvent): void {
      if (event.altKey || event.metaKey || isComponentEditable(event.target)) {
        return;
      }

      switch (event.key) {
        case "ArrowRight":
          if (phase === PHASE.REORDER_PHASE) {
            if (matchIndex < maxMatchIndex) {
              setMatchIndex(matchIndex + 1);
              setPhase(PHASE.STATS_PHASE);
            }
          } else {
            setPhase(PHASE.REORDER_PHASE);
          }
          break;
        case "ArrowLeft":
          if (phase === PHASE.REORDER_PHASE) {
            setPhase(PHASE.STATS_PHASE);
          } else {
            if (matchIndex > 0) {
              setMatchIndex(matchIndex - 1);
              setPhase(PHASE.REORDER_PHASE);
            }
          }
          break;
        default:
          return;
      }
      event.preventDefault();
    }
    window.addEventListener("keydown", scrubberKeys);
    return () => window.removeEventListener("keydown", scrubberKeys);
  });

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
    <div className={"card " + styles["scrubber-card"]}>
      <div className={styles["scrubber"]}>
      <input
        type="range"
        min={0}
        max={maxMatchIndex}
        value={matchIndex}
        onChange={handleRangeInput}
        />
      </div>
      <p className={styles["match-line"]}>
        <span>
          {isPreMatch
            ? "Pre-Match"
            : `Match ${matchIndex}/${maxMatchIndex} · ${phaseLabel}`}
        </span>
      </p>
    </div>
  );
}
