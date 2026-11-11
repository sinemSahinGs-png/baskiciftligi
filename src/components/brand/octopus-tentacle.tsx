type TentacleVariant = "hero-corner" | "hero-guide" | "journey" | "wholesale";

export function OctopusTentacle({
  variant,
  className,
}: {
  variant: TentacleVariant;
  className?: string;
}) {
  const view =
    variant === "journey"
      ? "0 0 920 180"
      : variant === "wholesale"
        ? "0 0 420 280"
        : "0 0 280 360";

  return (
    <svg
      className={className}
      viewBox={view}
      aria-hidden="true"
      focusable="false"
      data-octo-tentacle={variant}
    >
      <defs>
        <linearGradient id={`octo-flesh-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a2418" />
          <stop offset="42%" stopColor="#6a3c24" />
          <stop offset="78%" stopColor="#c4844a" />
          <stop offset="100%" stopColor="#ecd9b0" />
        </linearGradient>
        <linearGradient id={`octo-rim-${variant}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#8d4e28" />
          <stop offset="100%" stopColor="#f0d7a4" />
        </linearGradient>
        <radialGradient id={`octo-sucker-${variant}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#f4e6c8" />
          <stop offset="55%" stopColor="#b56a38" />
          <stop offset="100%" stopColor="#4a2616" />
        </radialGradient>
      </defs>
      {variant === "journey" ? <JourneyPath /> : null}
      {variant === "wholesale" ? <WholesalePath /> : null}
      {variant === "hero-corner" ? <CornerPath /> : null}
      {variant === "hero-guide" ? <GuidePath /> : null}
    </svg>
  );
}

function Suckers({
  fill,
  points,
}: {
  fill: string;
  points: ReadonlyArray<{ cx: number; cy: number; r: number }>;
}) {
  return (
    <g>
      {points.map((point) => (
        <g key={`${point.cx}-${point.cy}`}>
          <circle cx={point.cx} cy={point.cy} r={point.r} fill={fill} />
          <circle
            cx={point.cx - point.r * 0.12}
            cy={point.cy - point.r * 0.18}
            r={point.r * 0.38}
            fill="#2a160e"
            opacity="0.55"
          />
        </g>
      ))}
    </g>
  );
}

function CornerPath() {
  return (
    <g>
      <path
        d="M18 18 C 48 92, 38 168, 92 214 C 146 260, 188 238, 236 292 C 252 314, 268 348, 274 360"
        fill="none"
        stroke="url(#octo-rim-hero-corner)"
        strokeWidth="46"
        strokeLinecap="round"
      />
      <path
        d="M18 18 C 48 92, 38 168, 92 214 C 146 260, 188 238, 236 292 C 252 314, 268 348, 274 360"
        fill="none"
        stroke="url(#octo-flesh-hero-corner)"
        strokeWidth="34"
        strokeLinecap="round"
      />
      <Suckers
        fill="url(#octo-sucker-hero-corner)"
        points={[
          { cx: 46, cy: 86, r: 9 },
          { cx: 62, cy: 138, r: 10 },
          { cx: 92, cy: 186, r: 11 },
          { cx: 138, cy: 228, r: 10 },
          { cx: 186, cy: 252, r: 9 },
          { cx: 228, cy: 292, r: 8 },
        ]}
      />
    </g>
  );
}

function GuidePath() {
  return (
    <g>
      <path
        d="M262 12 C 210 62, 188 118, 132 168 C 86 208, 54 248, 28 348"
        fill="none"
        stroke="url(#octo-rim-hero-guide)"
        strokeWidth="38"
        strokeLinecap="round"
      />
      <path
        d="M262 12 C 210 62, 188 118, 132 168 C 86 208, 54 248, 28 348"
        fill="none"
        stroke="url(#octo-flesh-hero-guide)"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <Suckers
        fill="url(#octo-sucker-hero-guide)"
        points={[
          { cx: 228, cy: 48, r: 8 },
          { cx: 186, cy: 98, r: 9 },
          { cx: 148, cy: 148, r: 9 },
          { cx: 108, cy: 188, r: 8 },
          { cx: 72, cy: 238, r: 7 },
        ]}
      />
    </g>
  );
}

function JourneyPath() {
  return (
    <g>
      <path
        d="M-20 96 C 90 18, 210 168, 340 72 C 470 -12, 560 154, 700 88 C 820 38, 900 128, 960 92"
        fill="none"
        stroke="url(#octo-rim-journey)"
        strokeWidth="42"
        strokeLinecap="round"
      />
      <path
        d="M-20 96 C 90 18, 210 168, 340 72 C 470 -12, 560 154, 700 88 C 820 38, 900 128, 960 92"
        fill="none"
        stroke="url(#octo-flesh-journey)"
        strokeWidth="28"
        strokeLinecap="round"
      />
      <Suckers
        fill="url(#octo-sucker-journey)"
        points={[
          { cx: 70, cy: 78, r: 8 },
          { cx: 160, cy: 108, r: 9 },
          { cx: 250, cy: 92, r: 8 },
          { cx: 360, cy: 78, r: 9 },
          { cx: 480, cy: 70, r: 8 },
          { cx: 590, cy: 112, r: 8 },
          { cx: 710, cy: 84, r: 7 },
          { cx: 820, cy: 92, r: 7 },
        ]}
      />
    </g>
  );
}

function WholesalePath() {
  return (
    <g>
      <path
        d="M430 20 C 340 40, 300 110, 240 150 C 170 196, 90 168, 18 250"
        fill="none"
        stroke="url(#octo-rim-wholesale)"
        strokeWidth="64"
        strokeLinecap="round"
      />
      <path
        d="M430 20 C 340 40, 300 110, 240 150 C 170 196, 90 168, 18 250"
        fill="none"
        stroke="url(#octo-flesh-wholesale)"
        strokeWidth="46"
        strokeLinecap="round"
      />
      <Suckers
        fill="url(#octo-sucker-wholesale)"
        points={[
          { cx: 360, cy: 54, r: 12 },
          { cx: 300, cy: 96, r: 13 },
          { cx: 246, cy: 140, r: 14 },
          { cx: 176, cy: 176, r: 13 },
          { cx: 108, cy: 196, r: 12 },
          { cx: 48, cy: 236, r: 11 },
        ]}
      />
    </g>
  );
}
