const SAND = "/images/home-atelier/cave-sand-bg.webp";

export function OctoSeabedScene() {
  return (
    <svg
      className="octo-seabed-scene"
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <pattern id="octo-sand-back" patternUnits="userSpaceOnUse" width="1440" height="420">
          <image href={SAND} x="0" y="-40" width="1440" height="520" preserveAspectRatio="xMidYMax slice" />
        </pattern>
        <pattern id="octo-sand-mid" patternUnits="userSpaceOnUse" width="1440" height="420">
          <image href={SAND} x="-40" y="10" width="1520" height="500" preserveAspectRatio="xMidYMax slice" />
        </pattern>
        <pattern id="octo-sand-fore" patternUnits="userSpaceOnUse" width="1440" height="420">
          <image href={SAND} x="-80" y="40" width="1600" height="480" preserveAspectRatio="xMidYMax slice" />
        </pattern>
        <filter id="octo-dune-back-grade">
          <feColorMatrix
            type="matrix"
            values="0.22 0 0 0 0.02  0 0.14 0 0 0.01  0 0 0.10 0 0.01  0 0 0 1 0"
          />
        </filter>
        <filter id="octo-dune-mid-grade">
          <feColorMatrix
            type="matrix"
            values="0.55 0 0 0 0.04  0 0.34 0 0 0.02  0 0 0.18 0 0.01  0 0 0 1 0"
          />
        </filter>
        <filter id="octo-dune-fore-grade">
          <feColorMatrix
            type="matrix"
            values="0.92 0 0 0 0.06  0 0.62 0 0 0.03  0 0 0.28 0 0.01  0 0 0 1 0"
          />
        </filter>
        <linearGradient id="octo-tentacle-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d9b984" />
          <stop offset="38%" stopColor="#8a6238" />
          <stop offset="100%" stopColor="#3d2416" />
        </linearGradient>
        <radialGradient id="octo-sucker" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#efe3ce" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#8a6238" />
          <stop offset="100%" stopColor="#2a1a10" />
        </radialGradient>
        <filter id="octo-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#080604" floodOpacity="0.55" />
        </filter>
        <linearGradient id="octo-cave-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24180f" stopOpacity="0" />
          <stop offset="55%" stopColor="#120c09" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#080604" />
        </linearGradient>
      </defs>
      <rect width="1440" height="420" fill="url(#octo-cave-fall)" />
      <g className="octo-seabed-layer octo-seabed-layer-back" filter="url(#octo-dune-back-grade)">
        <path
          fill="url(#octo-sand-back)"
          d="M0 248 C 180 168, 340 228, 520 176 C 720 118, 940 210, 1180 150 C 1320 118, 1400 168, 1440 158 L 1440 420 L 0 420 Z"
        />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-mid" filter="url(#octo-dune-mid-grade)">
        <path
          fill="url(#octo-sand-mid)"
          d="M0 292 C 220 214, 410 276, 620 232 C 840 184, 1040 268, 1260 214 C 1360 192, 1420 228, 1440 222 L 1440 420 L 0 420 Z"
        />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-tentacle" filter="url(#octo-soft-shadow)">
        <path
          fill="url(#octo-tentacle-body)"
          d="M-10 392 C 28 350, 48 300, 86 252 C 118 214, 156 188, 198 214 C 226 232, 198 258, 164 248 C 132 238, 112 278, 96 318 C 82 352, 108 372, 76 386 C 42 400, 8 396, -10 392 Z"
        />
        <path
          fill="none"
          stroke="#efe3ce"
          strokeOpacity="0.35"
          strokeWidth="3"
          d="M18 360 C 52 318, 78 274, 118 246"
        />
        <ellipse cx="72" cy="348" rx="9" ry="7" fill="url(#octo-sucker)" />
        <ellipse cx="58" cy="368" rx="8" ry="6" fill="url(#octo-sucker)" />
        <ellipse cx="92" cy="328" rx="7" ry="6" fill="url(#octo-sucker)" />
        <ellipse cx="108" cy="304" rx="6" ry="5" fill="url(#octo-sucker)" />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-fore" filter="url(#octo-dune-fore-grade)">
        <path
          fill="url(#octo-sand-fore)"
          d="M0 348 C 160 300, 310 360, 490 318 C 690 272, 880 352, 1100 308 C 1260 280, 1380 330, 1440 318 L 1440 420 L 0 420 Z"
        />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-detail">
        <ellipse cx="268" cy="384" rx="38" ry="10" fill="#080604" opacity="0.4" />
        <ellipse cx="268" cy="372" rx="28" ry="9" fill="#d9b984" opacity="0.38" />
        <path
          fill="none"
          stroke="#efe3ce"
          strokeOpacity="0.55"
          strokeWidth="2.2"
          d="M246 370 C 258 356, 278 356, 290 372 C 278 382, 256 382, 246 370"
        />
        <ellipse cx="996" cy="394" rx="34" ry="9" fill="#080604" opacity="0.45" />
        <path fill="#c8a56e" d="M972 360 L 1006 348 L 1022 372 L 998 386 L 968 376 Z" />
        <path fill="#efe3ce" opacity="0.28" d="M980 358 L 1004 350 L 1008 362 Z" />
      </g>
    </svg>
  );
}
