/** Must stay aligned with src/domain/manufacturing/transform-math.ts */

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function rotatePoint(point, rotationDeg) {
  let { x, y, z } = point;
  const rx = degToRad(rotationDeg.x);
  const ry = degToRad(rotationDeg.y);
  const rz = degToRad(rotationDeg.z);

  {
    const x1 = x * Math.cos(rz) - y * Math.sin(rz);
    const y1 = x * Math.sin(rz) + y * Math.cos(rz);
    x = x1;
    y = y1;
  }
  {
    const x1 = x * Math.cos(ry) + z * Math.sin(ry);
    const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    x = x1;
    z = z1;
  }
  {
    const y1 = y * Math.cos(rx) - z * Math.sin(rx);
    const z1 = y * Math.sin(rx) + z * Math.cos(rx);
    y = y1;
    z = z1;
  }
  return { x, y, z };
}

function cornersFromDimensions(dimensions) {
  const { x, y, z } = dimensions;
  return [
    { x: 0, y: 0, z: 0 },
    { x, y: 0, z: 0 },
    { x: 0, y, z: 0 },
    { x: 0, y: 0, z },
    { x, y, z: 0 },
    { x, y: 0, z },
    { x: 0, y, z },
    { x, y, z },
  ];
}

export function computeOrientedBounds(originalDimensionsMm, transform) {
  const scaledCorners = cornersFromDimensions({
    x: originalDimensionsMm.x * transform.scale.x,
    y: originalDimensionsMm.y * transform.scale.y,
    z: originalDimensionsMm.z * transform.scale.z,
  }).map((point) => rotatePoint(point, transform.rotationDeg));

  const xs = scaledCorners.map((point) => point.x + transform.positionMm.x);
  const ys = scaledCorners.map((point) => point.y + transform.positionMm.y);
  const zs = scaledCorners.map((point) => point.z + transform.positionMm.z);

  const min = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    z: Math.min(...zs),
  };
  const max = {
    x: Math.max(...xs),
    y: Math.max(...ys),
    z: Math.max(...zs),
  };

  return {
    min,
    max,
    dimensions: {
      x: max.x - min.x,
      y: max.y - min.y,
      z: max.z - min.z,
    },
  };
}

export function placeOnBedTransform(transform, originalDimensionsMm) {
  const bounds = computeOrientedBounds(originalDimensionsMm, transform);
  const deltaZ = transform.placeOnBed ? -bounds.min.z : 0;
  return {
    ...transform,
    positionMm: {
      x: transform.positionMm.x,
      y: transform.positionMm.y,
      z: transform.positionMm.z + deltaZ,
    },
  };
}
