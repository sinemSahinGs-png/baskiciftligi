export interface Vec3Mm {
  x: number;
  y: number;
  z: number;
}

export interface GcodeBounds {
  min: Vec3Mm;
  max: Vec3Mm;
  dimensions: Vec3Mm;
}

export function parseGcodeBounds(gcode: string): GcodeBounds;
