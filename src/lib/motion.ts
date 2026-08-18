export const foundryEase = [0.22, 1, 0.36, 1] as const;

export const motionDuration = {
  fast: 0.18,
  medium: 0.32,
  page: 0.42,
  reveal: 0.72,
  media: 0.9,
  card: 0.7,
} as const;

export const motionViewport = {
  amount: 0.2,
  margin: "0px 0px -8% 0px",
} as const;

export const motionStagger = {
  word: 0.048,
  item: 0.08,
  column: 0.09,
  rowMax: 0.25,
} as const;

export function splitMotionWords(text: string) {
  return text.match(/\S+|\s+/g) ?? [text];
}

export function splitMotionLines(text: string) {
  const parts = text
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

export function processStepFromProgress(progress: number) {
  if (!Number.isFinite(progress) || progress <= 0) {
    return 0;
  }
  if (progress >= 1) {
    return 4;
  }
  return Math.min(4, Math.floor(progress * 5));
}

export const announceEvent = "somut-status-announce";

export function announceStatus(message: string) {
  if (typeof window === "undefined" || !message) {
    return;
  }

  window.dispatchEvent(new CustomEvent(announceEvent, { detail: message }));
}
