import type { ThreeMfPlate } from "@/domain/manufacturing/threemf/types";

export function plateToBinaryStl(plate: ThreeMfPlate): Uint8Array {
  const triangles = plate.triangleCount;
  const buffer = new ArrayBuffer(84 + triangles * 50);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const header = "Baski Ciftligi plate";
  for (let i = 0; i < header.length; i += 1) {
    bytes[i] = header.charCodeAt(i);
  }
  view.setUint32(80, triangles, true);
  for (let t = 0; t < triangles; t += 1) {
    const offset = 84 + t * 50 + 12;
    const i = t * 9;
    view.setFloat32(offset, plate.positions[i]!, true);
    view.setFloat32(offset + 4, plate.positions[i + 1]!, true);
    view.setFloat32(offset + 8, plate.positions[i + 2]!, true);
    view.setFloat32(offset + 12, plate.positions[i + 3]!, true);
    view.setFloat32(offset + 16, plate.positions[i + 4]!, true);
    view.setFloat32(offset + 20, plate.positions[i + 5]!, true);
    view.setFloat32(offset + 24, plate.positions[i + 6]!, true);
    view.setFloat32(offset + 28, plate.positions[i + 7]!, true);
    view.setFloat32(offset + 32, plate.positions[i + 8]!, true);
  }
  return bytes;
}
