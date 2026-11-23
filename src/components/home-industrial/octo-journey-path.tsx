"use client";

const D =
  "M52 8 C 70 90, 28 150, 48 230 S 82 330, 36 410 S 16 520, 60 610 S 88 720, 40 820 S 18 930, 58 1020 S 84 1120, 46 1228";

const NODES = [
  { x: 52, y: 8 },
  { x: 48, y: 230 },
  { x: 36, y: 410 },
  { x: 60, y: 610 },
  { x: 40, y: 820 },
  { x: 58, y: 1020 },
  { x: 46, y: 1228 },
];

export function OctoJourneyPath() {
  return (
    <svg
      className="octo-journey"
      viewBox="0 0 100 1240"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="octo-journey-stroke"
        d={D}
        fill="none"
        stroke="#C08A4A"
        strokeWidth="2.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {NODES.map((node) => (
        <g key={`${node.x}-${node.y}`} className="octo-journey-node">
          <circle cx={node.x} cy={node.y} r="3.2" fill="none" stroke="#C08A4A" strokeWidth="1.1" />
          <circle cx={node.x} cy={node.y} r="1.1" fill="#D9B984" />
        </g>
      ))}
    </svg>
  );
}
