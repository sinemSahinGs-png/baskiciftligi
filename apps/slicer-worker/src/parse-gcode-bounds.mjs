/** Parse axis-aligned bounds from sliced G-code travel/extrusion moves. */

const AXIS_RE = /([XYZ])(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi;

function parseCoord(token) {
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}

export function parseGcodeBounds(gcode) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  let sawPoint = false;

  let currentX = 0;
  let currentY = 0;
  let currentZ = 0;
  let absolute = true;

  for (const raw of gcode.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(";")) continue;

    if (/^G90\b/i.test(line)) {
      absolute = true;
      continue;
    }
    if (/^G91\b/i.test(line)) {
      absolute = false;
      continue;
    }
    if (!/^G[01]\b/i.test(line)) continue;

    let nextX = currentX;
    let nextY = currentY;
    let nextZ = currentZ;
    let touched = false;

    AXIS_RE.lastIndex = 0;
    let match;
    while ((match = AXIS_RE.exec(line)) !== null) {
      const axis = match[1].toUpperCase();
      const value = parseCoord(match[2]);
      if (value === null) continue;
      touched = true;
      if (axis === "X") nextX = absolute ? value : currentX + value;
      if (axis === "Y") nextY = absolute ? value : currentY + value;
      if (axis === "Z") nextZ = absolute ? value : currentZ + value;
    }

    if (!touched) continue;

    currentX = nextX;
    currentY = nextY;
    currentZ = nextZ;
    sawPoint = true;

    minX = Math.min(minX, currentX);
    minY = Math.min(minY, currentY);
    minZ = Math.min(minZ, currentZ);
    maxX = Math.max(maxX, currentX);
    maxY = Math.max(maxY, currentY);
    maxZ = Math.max(maxZ, currentZ);
  }

  if (!sawPoint) {
    throw new Error("G-code içinde koordinat bulunamadı.");
  }

  const round = (value) => Math.round(value * 1000) / 1000;
  const min = { x: round(minX), y: round(minY), z: round(minZ) };
  const max = { x: round(maxX), y: round(maxY), z: round(maxZ) };

  return {
    min,
    max,
    dimensions: {
      x: round(max.x - min.x),
      y: round(max.y - min.y),
      z: round(max.z - min.z),
    },
  };
}
