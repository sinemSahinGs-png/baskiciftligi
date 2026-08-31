import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import { DEFAULT_MANUFACTURING_TRANSFORM, transformsEqual } from "@/domain/manufacturing/transform";

export interface TransformHistoryState {
  past: ManufacturingTransform[];
  present: ManufacturingTransform;
  future: ManufacturingTransform[];
}

export const TRANSFORM_HISTORY_LIMIT = 40;

export function createTransformHistory(
  initial: ManufacturingTransform = DEFAULT_MANUFACTURING_TRANSFORM,
): TransformHistoryState {
  return { past: [], present: initial, future: [] };
}

export function commitTransformHistory(
  state: TransformHistoryState,
  next: ManufacturingTransform,
): TransformHistoryState {
  if (transformsEqual(state.present, next)) {
    return state;
  }
  const past = [...state.past, state.present].slice(-TRANSFORM_HISTORY_LIMIT);
  return { past, present: next, future: [] };
}

export function undoTransformHistory(
  state: TransformHistoryState,
): TransformHistoryState {
  if (state.past.length === 0) {
    return state;
  }
  const previous = state.past[state.past.length - 1]!;
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future].slice(0, TRANSFORM_HISTORY_LIMIT),
  };
}

export function redoTransformHistory(
  state: TransformHistoryState,
): TransformHistoryState {
  if (state.future.length === 0) {
    return state;
  }
  const [next, ...rest] = state.future;
  return {
    past: [...state.past, state.present].slice(-TRANSFORM_HISTORY_LIMIT),
    present: next!,
    future: rest,
  };
}

export function canUndoTransform(state: TransformHistoryState): boolean {
  return state.past.length > 0;
}

export function canRedoTransform(state: TransformHistoryState): boolean {
  return state.future.length > 0;
}
