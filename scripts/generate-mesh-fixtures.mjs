import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function cube(size, origin = { x: 0, y: 0, z: 0 }) {
  const s = size;
  const o = origin;
  const faces = [
    [o, { x: o.x + s, y: o.y, z: o.z }, { x: o.x + s, y: o.y + s, z: o.z }],
    [o, { x: o.x + s, y: o.y + s, z: o.z }, { x: o.x, y: o.y + s, z: o.z }],
    [{ x: o.x, y: o.y, z: o.z + s }, { x: o.x + s, y: o.y + s, z: o.z + s }, { x: o.x + s, y: o.y, z: o.z + s }],
    [{ x: o.x, y: o.y, z: o.z + s }, { x: o.x, y: o.y + s, z: o.z + s }, { x: o.x + s, y: o.y + s, z: o.z + s }],
    [o, { x: o.x, y: o.y, z: o.z + s }, { x: o.x + s, y: o.y, z: o.z + s }],
    [o, { x: o.x + s, y: o.y, z: o.z + s }, { x: o.x + s, y: o.y, z: o.z }],
    [{ x: o.x, y: o.y + s, z: o.z }, { x: o.x + s, y: o.y + s, z: o.z }, { x: o.x + s, y: o.y + s, z: o.z + s }],
    [{ x: o.x, y: o.y + s, z: o.z }, { x: o.x + s, y: o.y + s, z: o.z + s }, { x: o.x, y: o.y + s, z: o.z + s }],
    [o, { x: o.x, y: o.y + s, z: o.z }, { x: o.x, y: o.y + s, z: o.z + s }],
    [o, { x: o.x, y: o.y + s, z: o.z + s }, { x: o.x, y: o.y, z: o.z + s }],
    [{ x: o.x + s, y: o.y, z: o.z }, { x: o.x + s, y: o.y, z: o.z + s }, { x: o.x + s, y: o.y + s, z: o.z + s }],
    [{ x: o.x + s, y: o.y, z: o.z }, { x: o.x + s, y: o.y + s, z: o.z + s }, { x: o.x + s, y: o.y + s, z: o.z }],
  ];
  const buffer = Buffer.alloc(84 + faces.length * 50);
  buffer.write("Baski Ciftligi fixture", 0, "ascii");
  buffer.writeUInt32LE(faces.length, 80);
  faces.forEach((face, index) => {
    const offset = 84 + index * 50;
    face.forEach((vertex, vertexIndex) => {
      buffer.writeFloatLE(vertex.x, offset + 12 + vertexIndex * 12);
      buffer.writeFloatLE(vertex.y, offset + 16 + vertexIndex * 12);
      buffer.writeFloatLE(vertex.z, offset + 20 + vertexIndex * 12);
    });
  });
  return buffer;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "meshes");
mkdirSync(root, { recursive: true });
writeFileSync(path.join(root, "20mm-cube.stl"), cube(20));
writeFileSync(path.join(root, "simple-vase.stl"), cube(18));
writeFileSync(path.join(root, "overhang.stl"), cube(15, { x: 0, y: 0, z: 8 }));
writeFileSync(path.join(root, "too-large.stl"), cube(400));
writeFileSync(path.join(root, "multi-shell.stl"), cube(12, { x: 40, y: 0, z: 0 }));
writeFileSync(
  path.join(root, "non-manifold.stl"),
  Buffer.from(`solid open
  facet normal 0 0 1
    outer loop
      vertex 0 0 0
      vertex 10 0 0
      vertex 0 10 0
    endloop
  endfacet
endsolid open
`),
);
console.log("Wrote mesh fixtures to", root);
