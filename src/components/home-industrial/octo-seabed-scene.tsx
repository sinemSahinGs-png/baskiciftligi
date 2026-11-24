const SAND = "/images/home-atelier/cave-sand-bg.webp";

export function OctoSeabedScene() {
  return (
    <svg
      className="octo-seabed-scene"
      viewBox="0 0 1440 420"
      width="1440"
      height="420"
      preserveAspectRatio="xMidYMax slice"
      overflow="hidden"
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
        <filter
          id="octo-dune-back-grade"
          x="0"
          y="0"
          width="1"
          height="1"
          filterUnits="objectBoundingBox"
        >
          <feColorMatrix
            type="matrix"
            values="0.22 0 0 0 0.02  0 0.14 0 0 0.01  0 0 0.10 0 0.01  0 0 0 1 0"
          />
        </filter>
        <filter
          id="octo-dune-mid-grade"
          x="0"
          y="0"
          width="1"
          height="1"
          filterUnits="objectBoundingBox"
        >
          <feColorMatrix
            type="matrix"
            values="0.55 0 0 0 0.04  0 0.34 0 0 0.02  0 0 0.18 0 0.01  0 0 0 1 0"
          />
        </filter>
        <filter
          id="octo-dune-fore-grade"
          x="0"
          y="0"
          width="1"
          height="1"
          filterUnits="objectBoundingBox"
        >
          <feColorMatrix
            type="matrix"
            values="0.92 0 0 0 0.06  0 0.62 0 0 0.03  0 0 0.28 0 0.01  0 0 0 1 0"
          />
        </filter>
        <linearGradient id="octo-tentacle-body" x1="0.12" y1="0.05" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#6a3a22" />
          <stop offset="28%" stopColor="#3a1c12" />
          <stop offset="62%" stopColor="#1a0d0a" />
          <stop offset="100%" stopColor="#0c0706" />
        </linearGradient>
        <linearGradient id="octo-tentacle-rim" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0%" stopColor="#c48a52" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#8a4e28" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1a0d0a" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="octo-sucker" cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#1a0e0a" />
          <stop offset="45%" stopColor="#3d2216" />
          <stop offset="78%" stopColor="#6a3a22" />
          <stop offset="100%" stopColor="#120a08" />
        </radialGradient>
        <pattern id="octo-tentacle-grain" patternUnits="userSpaceOnUse" width="48" height="28">
          <image href={SAND} x="-20" y="0" width="90" height="40" preserveAspectRatio="xMidYMid slice" />
        </pattern>
        <filter
          id="octo-soft-shadow"
          x="-0.08"
          y="-0.08"
          width="1.2"
          height="1.24"
          filterUnits="objectBoundingBox"
        >
          <feDropShadow dx="6" dy="10" stdDeviation="6" floodColor="#050302" floodOpacity="0.72" />
        </filter>
        <linearGradient id="octo-ivory-print" x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#d7c09a" />
          <stop offset="48%" stopColor="#c4a574" />
          <stop offset="100%" stopColor="#8a6238" />
        </linearGradient>
        <clipPath id="octo-print-bury">
          <path d="M968 352 L 1008 344 L 1024 358 L 1002 368 L 966 362 Z" />
        </clipPath>
        <linearGradient id="octo-cave-fall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24180f" stopOpacity="0" />
          <stop offset="55%" stopColor="#120c09" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#080604" />
        </linearGradient>
      </defs>
      <rect width="1440" height="420" fill="url(#octo-cave-fall)" />
      <g className="octo-seabed-layer octo-seabed-layer-back">
        <path
          fill="#1a110c"
          d="M0 248 C 180 168, 340 228, 520 176 C 720 118, 940 210, 1180 150 C 1320 118, 1400 168, 1440 158 L 1440 420 L 0 420 Z"
        />
        <g filter="url(#octo-dune-back-grade)">
          <path
            fill="url(#octo-sand-back)"
            d="M0 248 C 180 168, 340 228, 520 176 C 720 118, 940 210, 1180 150 C 1320 118, 1400 168, 1440 158 L 1440 420 L 0 420 Z"
          />
        </g>
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-mid">
        <path
          fill="#4a2e18"
          d="M0 292 C 220 214, 410 276, 620 232 C 840 184, 1040 268, 1260 214 C 1360 192, 1420 228, 1440 222 L 1440 420 L 0 420 Z"
        />
        <g filter="url(#octo-dune-mid-grade)">
          <path
            fill="url(#octo-sand-mid)"
            d="M0 292 C 220 214, 410 276, 620 232 C 840 184, 1040 268, 1260 214 C 1360 192, 1420 228, 1440 222 L 1440 420 L 0 420 Z"
          />
        </g>
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-tentacle">
        <g filter="url(#octo-soft-shadow)">
        <ellipse cx="62" cy="392" rx="78" ry="16" fill="#050302" opacity="0.58" />
        <path
          fill="url(#octo-tentacle-body)"
          d="M-22 408 C 6 386, 24 352, 46 324 C 64 302, 90 288, 114 306 C 132 320, 122 338, 98 330 C 80 324, 68 340, 58 360 C 48 380, 22 398, -22 408 Z"
        />
        <path
          fill="url(#octo-tentacle-grain)"
          opacity="0.16"
          style={{ mixBlendMode: "multiply" }}
          d="M-22 408 C 6 386, 24 352, 46 324 C 64 302, 90 288, 114 306 C 132 320, 122 338, 98 330 C 80 324, 68 340, 58 360 C 48 380, 22 398, -22 408 Z"
        />
        <path
          fill="url(#octo-tentacle-rim)"
          d="M-10 396 C 16 372, 36 342, 58 318 C 74 304, 92 298, 106 310 C 92 312, 74 328, 62 348 C 50 368, 24 388, -10 396 Z"
        />
        <g fill="url(#octo-sucker)" opacity="0.95">
          <ellipse cx="96" cy="318" rx="5.6" ry="4.3" transform="rotate(-32 96 318)" />
          <ellipse cx="82" cy="332" rx="5.2" ry="4" transform="rotate(-26 82 332)" />
          <ellipse cx="70" cy="348" rx="4.8" ry="3.6" transform="rotate(-20 70 348)" />
          <ellipse cx="58" cy="364" rx="4.3" ry="3.2" transform="rotate(-14 58 364)" />
        </g>
        <g fill="none" stroke="#0a0604" strokeWidth="1.2" opacity="0.75">
          <ellipse cx="96" cy="318" rx="2.2" ry="1.5" transform="rotate(-32 96 318)" />
          <ellipse cx="82" cy="332" rx="2" ry="1.35" transform="rotate(-26 82 332)" />
          <ellipse cx="70" cy="348" rx="1.8" ry="1.2" transform="rotate(-20 70 348)" />
          <ellipse cx="58" cy="364" rx="1.6" ry="1.05" transform="rotate(-14 58 364)" />
        </g>
        </g>
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-fore">
        <path
          fill="#8a5a32"
          d="M0 348 C 160 300, 310 360, 490 318 C 690 272, 880 352, 1100 308 C 1260 280, 1380 330, 1440 318 L 1440 420 L 0 420 Z"
        />
        <g filter="url(#octo-dune-fore-grade)">
          <path
            fill="url(#octo-sand-fore)"
            d="M0 348 C 160 300, 310 360, 490 318 C 690 272, 880 352, 1100 308 C 1260 280, 1380 330, 1440 318 L 1440 420 L 0 420 Z"
          />
        </g>
      </g>
      <g className="octo-seabed-layer octo-seabed-layer-detail">
        <ellipse cx="268" cy="388" rx="36" ry="8" fill="#080604" opacity="0.28" />
        <g opacity="0.34">
          <ellipse cx="268" cy="376" rx="26" ry="8" fill="#8a6238" />
          <path
            fill="none"
            stroke="#c4a574"
            strokeOpacity="0.55"
            strokeWidth="1.4"
            d="M248 374 C 258 364, 278 364, 288 376 C 278 384, 256 384, 248 374"
          />
        </g>
        <path
          fill="url(#octo-sand-fore)"
          opacity="0.72"
          d="M236 372 C 250 360, 270 358, 292 370 C 286 390, 258 398, 238 388 Z"
        />
        <ellipse cx="996" cy="392" rx="30" ry="7" fill="#080604" opacity="0.32" />
        <g clipPath="url(#octo-print-bury)">
          <path fill="url(#octo-ivory-print)" d="M972 360 L 1006 348 L 1022 372 L 998 386 L 968 376 Z" />
          <path fill="#efe3ce" opacity="0.22" d="M980 358 L 1004 350 L 1008 362 Z" />
        </g>
        <path
          fill="url(#octo-sand-fore)"
          opacity="0.8"
          d="M960 368 C 984 356, 1014 360, 1028 378 C 1012 396, 980 402, 958 388 Z"
        />
      </g>
    </svg>
  );
}
