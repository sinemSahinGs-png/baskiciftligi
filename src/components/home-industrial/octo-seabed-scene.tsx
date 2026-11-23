export function OctoSeabedScene() {
  return (
    <svg
      className="octo-seabed-scene"
      viewBox="0 0 1440 420"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="octo-cave-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24180f" stopOpacity="0" />
          <stop offset="42%" stopColor="#1a120c" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0b0907" />
        </linearGradient>
        <linearGradient id="octo-dune-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a301c" />
          <stop offset="100%" stopColor="#2a1a10" />
        </linearGradient>
        <linearGradient id="octo-dune-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6238" />
          <stop offset="100%" stopColor="#5c3c22" />
        </linearGradient>
        <linearGradient id="octo-dune-fore" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8a56e" />
          <stop offset="58%" stopColor="#8a6238" />
          <stop offset="100%" stopColor="#3d2816" />
        </linearGradient>
      </defs>
      <rect width="1440" height="420" fill="url(#octo-cave-fall)" />
      <g className="octo-seabed-layer octo-seabed-layer-back">
        <path
          fill="url(#octo-dune-back)"
          d="M0 248 C 180 168, 340 228, 520 176 C 720 118, 940 210, 1180 150 C 1320 118, 1400 168, 1440 158 L 1440 420 L 0 420 Z"
        />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-mid">
        <path
          fill="url(#octo-dune-mid)"
          d="M0 292 C 220 214, 410 276, 620 232 C 840 184, 1040 268, 1260 214 C 1360 192, 1420 228, 1440 222 L 1440 420 L 0 420 Z"
        />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-tentacle">
        <path
          fill="#6e3f24"
          d="M18 318 C 70 250, 96 214, 138 188 C 168 170, 186 198, 154 214 C 126 230, 108 268, 92 304 C 78 336, 108 352, 70 368 C 40 380, 8 352, 18 318 Z"
        />
        <path
          fill="#3d2416"
          d="M40 340 C 78 300, 92 278, 118 262 C 132 254, 138 268, 118 278 C 96 292, 84 318, 74 340 C 66 358, 88 366, 58 372 C 42 376, 28 356, 40 340 Z"
        />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-fore">
        <path
          fill="url(#octo-dune-fore)"
          d="M0 348 C 160 300, 310 360, 490 318 C 690 272, 880 352, 1100 308 C 1260 280, 1380 330, 1440 318 L 1440 420 L 0 420 Z"
        />
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-detail">
        <ellipse cx="268" cy="372" rx="34" ry="12" fill="#d9b984" opacity="0.28" />
        <path
          fill="none"
          stroke="#efe3ce"
          strokeOpacity="0.45"
          strokeWidth="2"
          d="M248 370 C 258 358, 278 358, 288 372 C 278 380, 258 380, 248 370"
        />
        <path
          fill="#c8a56e"
          d="M980 356 L 1004 348 L 1016 368 L 996 380 L 976 370 Z"
          opacity="0.85"
        />
        <ellipse cx="996" cy="386" rx="28" ry="8" fill="#1a120c" opacity="0.45" />
      </g>
    </svg>
  );
}
