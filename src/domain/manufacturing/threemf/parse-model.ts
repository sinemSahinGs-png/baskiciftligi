import {
  THREEMF_MAX_COMPONENT_DEPTH,
  THREEMF_MAX_MESHES,
  THREEMF_MAX_OBJECTS,
  ThreeMfError,
  type ParsedThreeMf,
  type ThreeMfPlate,
} from "@/domain/manufacturing/threemf/types";
import {
  assertSafeXml,
  decodeUtf8,
  elementPattern,
  firstElement,
  identityMat,
  multiplyMat,
  normalizeZipPath,
  openTagPattern,
  parseDisplayColor,
  parseTagAttributes,
  parseTransformAttr,
  transformPoint,
  unitScaleToMm,
  type Mat4,
} from "@/domain/manufacturing/threemf/xml";
import type { Vec3Mm } from "@/domain/manufacturing/types";

interface MeshData {
  vertices: Array<[number, number, number]>;
  triangles: Array<[number, number, number]>;
  colors: Array<[number, number, number]> | null;
}

interface ComponentRef {
  objectId: number;
  transform: Mat4;
}

interface ObjectDef {
  id: number;
  type: string;
  mesh: MeshData | null;
  components: ComponentRef[];
  pid: string | null;
  pindex: string;
}

const MODEL_NS_REL = "http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel";

function parseMesh(xmlSlice: string): MeshData {
  const vertices: Array<[number, number, number]> = [];
  const vertexPattern = openTagPattern("vertex");
  let match: RegExpExecArray | null;
  while ((match = vertexPattern.exec(xmlSlice))) {
    const attrs = parseTagAttributes(match[1] ?? "");
    const x = Number(attrs.x);
    const y = Number(attrs.y);
    const z = Number(attrs.z);
    if (![x, y, z].every(Number.isFinite)) {
      throw new ThreeMfError("corrupt", "3MF tepe koordinatı geçersiz.");
    }
    vertices.push([x, y, z]);
  }
  const triangles: Array<[number, number, number]> = [];
  const trianglePattern = openTagPattern("triangle");
  while ((match = trianglePattern.exec(xmlSlice))) {
    const attrs = parseTagAttributes(match[1] ?? "");
    const v1 = Number(attrs.v1);
    const v2 = Number(attrs.v2);
    const v3 = Number(attrs.v3);
    if (![v1, v2, v3].every((n) => Number.isInteger(n) && n >= 0 && n < vertices.length)) {
      throw new ThreeMfError("corrupt", "3MF üçgen indeksi geçersiz.");
    }
    if (v1 === v2 || v2 === v3 || v1 === v3) {
      continue;
    }
    triangles.push([v1, v2, v3]);
  }
  return { vertices, triangles, colors: null };
}

function parseObjects(xml: string): ObjectDef[] {
  const objects: ObjectDef[] = [];
  const objectPattern = elementPattern("object");
  let match: RegExpExecArray | null;
  while ((match = objectPattern.exec(xml))) {
    const attrs = parseTagAttributes(match[1] ?? "");
    const id = Number(attrs.id);
    if (!Number.isInteger(id)) {
      throw new ThreeMfError("corrupt", "3MF nesne kimliği geçersiz.");
    }
    const body = match[2] ?? "";
    const meshMatch = firstElement(body, "mesh");
    const components: ComponentRef[] = [];
    const componentPattern = openTagPattern("component");
    let componentMatch: RegExpExecArray | null;
    while ((componentMatch = componentPattern.exec(body))) {
      const cattrs = parseTagAttributes(componentMatch[1] ?? "");
      const objectId = Number(cattrs.objectid);
      if (!Number.isInteger(objectId)) {
        throw new ThreeMfError("corrupt", "3MF bileşen referansı geçersiz.");
      }
      components.push({
        objectId,
        transform: parseTransformAttr(cattrs.transform),
      });
    }
    objects.push({
      id,
      type: (attrs.type ?? "model").toLowerCase(),
      mesh: meshMatch ? parseMesh(meshMatch[2] ?? "") : null,
      components,
      pid: attrs.pid ?? null,
      pindex: attrs.pindex ?? "0",
    });
    if (objects.length > THREEMF_MAX_OBJECTS) {
      throw new ThreeMfError("security", "3MF nesne sayısı sınırı aşıldı.");
    }
  }
  return objects;
}

function parseBuildItems(xml: string): Array<{ objectId: number; transform: Mat4 }> {
  const items: Array<{ objectId: number; transform: Mat4 }> = [];
  const buildMatch = firstElement(xml, "build");
  if (!buildMatch) {
    return items;
  }
  const itemPattern = openTagPattern("item");
  let match: RegExpExecArray | null;
  while ((match = itemPattern.exec(buildMatch[2] ?? ""))) {
    const attrs = parseTagAttributes(match[1] ?? "");
    const objectId = Number(attrs.objectid);
    if (!Number.isInteger(objectId)) {
      throw new ThreeMfError("corrupt", "3MF build öğesi geçersiz.");
    }
    items.push({ objectId, transform: parseTransformAttr(attrs.transform) });
  }
  return items;
}

function parseColorTable(xml: string): Map<string, [number, number, number]> {
  const table = new Map<string, [number, number, number]>();
  const groupPattern = elementPattern("basematerials");
  let match: RegExpExecArray | null;
  while ((match = groupPattern.exec(xml))) {
    const id = parseTagAttributes(match[1] ?? "").id ?? "";
    const basePattern = openTagPattern("base");
    let index = 0;
    let baseMatch: RegExpExecArray | null;
    while ((baseMatch = basePattern.exec(match[2] ?? ""))) {
      const color = parseDisplayColor(parseTagAttributes(baseMatch[1] ?? "").displaycolor);
      if (color) table.set(`${id}:${index}`, color);
      index += 1;
    }
  }
  const colorGroupPattern = elementPattern("colorgroup");
  while ((match = colorGroupPattern.exec(xml))) {
    const id = parseTagAttributes(match[1] ?? "").id ?? "";
    const colorPattern = openTagPattern("color");
    let index = 0;
    let colorMatch: RegExpExecArray | null;
    while ((colorMatch = colorPattern.exec(match[2] ?? ""))) {
      const attrs = parseTagAttributes(colorMatch[1] ?? "");
      const color = parseDisplayColor(attrs.color ?? attrs.displaycolor);
      if (color) table.set(`${id}:${index}`, color);
      index += 1;
    }
  }
  return table;
}

function collectTriangles(
  objects: Map<number, ObjectDef>,
  objectId: number,
  parent: Mat4,
  depth: number,
  visiting: Set<number>,
  positions: number[],
  colors: number[],
  colorTable: Map<string, [number, number, number]>,
  objectColors: Map<number, [number, number, number] | null>,
  inheritedColor: [number, number, number] | null,
  meshCount: { value: number },
) {
  if (depth > THREEMF_MAX_COMPONENT_DEPTH) {
    throw new ThreeMfError("cycle", "3MF bileşen derinliği sınırı aşıldı.");
  }
  if (visiting.has(objectId)) {
    throw new ThreeMfError("cycle", "3MF bileşen döngüsü tespit edildi.");
  }
  const object = objects.get(objectId);
  if (!object) {
    throw new ThreeMfError("corrupt", "3MF eksik nesneye referans veriyor.");
  }
  if (object.type === "support" || object.type === "solidsupport") {
    return;
  }
  visiting.add(objectId);
  const objectColor = objectColors.get(objectId) ?? inheritedColor;
  if (object.mesh) {
    meshCount.value += 1;
    if (meshCount.value > THREEMF_MAX_MESHES) {
      throw new ThreeMfError("security", "3MF mesh sayısı sınırı aşıldı.");
    }
    for (const [a, b, c] of object.mesh.triangles) {
      const pa = object.mesh.vertices[a]!;
      const pb = object.mesh.vertices[b]!;
      const pc = object.mesh.vertices[c]!;
      const ta = transformPoint(parent, pa[0], pa[1], pa[2]);
      const tb = transformPoint(parent, pb[0], pb[1], pb[2]);
      const tc = transformPoint(parent, pc[0], pc[1], pc[2]);
      positions.push(...ta, ...tb, ...tc);
      if (objectColor) {
        colors.push(...objectColor, ...objectColor, ...objectColor);
      }
    }
  }
  for (const component of object.components) {
    collectTriangles(
      objects,
      component.objectId,
      multiplyMat(parent, component.transform),
      depth + 1,
      visiting,
      positions,
      colors,
      colorTable,
      objectColors,
      objectColor,
      meshCount,
    );
  }
  visiting.delete(objectId);
}

function boundsFromPositions(positions: Float32Array): {
  min: Vec3Mm;
  max: Vec3Mm;
  dimensions: Vec3Mm;
} {
  const min = { x: Infinity, y: Infinity, z: Infinity };
  const max = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;
    min.x = Math.min(min.x, x);
    min.y = Math.min(min.y, y);
    min.z = Math.min(min.z, z);
    max.x = Math.max(max.x, x);
    max.y = Math.max(max.y, y);
    max.z = Math.max(max.z, z);
  }
  if (!Number.isFinite(min.x)) {
    throw new ThreeMfError("empty_mesh", "Bu dosyada görüntülenebilir bir model bulunamadı.");
  }
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

function plateFromPositions(
  id: string,
  label: string,
  objectIds: number[] | null,
  positions: number[],
  colors: number[],
): ThreeMfPlate {
  const array = new Float32Array(positions);
  const box = boundsFromPositions(array);
  const colorArray =
    colors.length === array.length ? new Float32Array(colors) : null;
  return {
    id,
    label,
    objectIds,
    triangleCount: Math.floor(array.length / 9),
    vertexCount: Math.floor(array.length / 3),
    dimensionsMm: box.dimensions,
    boundingBoxMm: { min: box.min, max: box.max },
    positions: array,
    colors: colorArray,
  };
}

function parsePlateJson(text: string): number[] | null {
  try {
    const parsed = JSON.parse(text) as {
      bbox_objects?: Array<{ id?: number | string }>;
      objects?: Array<{ id?: number | string }>;
    };
    const rows = parsed.bbox_objects ?? parsed.objects ?? [];
    const ids = rows
      .map((row) => Number(row.id))
      .filter((id) => Number.isInteger(id));
    return ids.length > 0 ? ids : null;
  } catch {
    return null;
  }
}

function findRootModelPath(files: Map<string, Uint8Array>): string {
  const rels = files.get("_rels/.rels") ?? files.get("_rels/.rels".toLowerCase());
  if (rels) {
    const xml = decodeUtf8(rels);
    assertSafeXml(xml);
    const relPattern = openTagPattern("relationship");
    let match: RegExpExecArray | null;
    while ((match = relPattern.exec(xml))) {
      const attrs = parseTagAttributes(match[1] ?? "");
      if ((attrs.type ?? "").toLowerCase() === MODEL_NS_REL.toLowerCase()) {
        return normalizeZipPath(attrs.target ?? "");
      }
    }
  }
  const preferred = [...files.keys()].find(
    (key) => /3d\/3dmodel\.model$/i.test(key) || /3d\/.*\.model$/i.test(key),
  );
  if (preferred) return preferred;
  throw new ThreeMfError("empty_mesh", "Bu dosyada görüntülenebilir bir model bulunamadı.");
}

export function parseThreeMfFromFiles(files: Map<string, Uint8Array>): ParsedThreeMf {
  const normalized = new Map<string, Uint8Array>();
  for (const [key, value] of files) {
    normalized.set(normalizeZipPath(key), value);
  }
  const rootModelPath = findRootModelPath(normalized);
  const modelBytes = normalized.get(rootModelPath);
  if (!modelBytes) {
    throw new ThreeMfError("empty_mesh", "3MF kök modeli okunamadı.");
  }
  const xml = decodeUtf8(modelBytes);
  assertSafeXml(xml);
  const unit = parseTagAttributes(/<(?:[\w]+:)?model\b([^>]*)>/i.exec(xml)?.[1] ?? "").unit ?? "millimeter";
  const scale = unitScaleToMm(unit);
  const objects = new Map(parseObjects(xml).map((object) => [object.id, object]));
  const colorTable = parseColorTable(xml);
  const objectColors = new Map<number, [number, number, number] | null>();
  for (const object of objects.values()) {
    objectColors.set(
      object.id,
      object.pid ? (colorTable.get(`${object.pid}:${object.pindex}`) ?? null) : null,
    );
  }
  const buildItems = parseBuildItems(xml);
  if (buildItems.length === 0 && objects.size > 0) {
    const first = [...objects.values()].find((object) => object.type === "model") ?? [...objects.values()][0];
    if (first) {
      buildItems.push({ objectId: first.id, transform: identityMat() });
    }
  }

  const plateJsonKeys = [...normalized.keys()]
    .filter((key) => /metadata\/plate_\d+\.json$/i.test(key))
    .sort();
  const requiresPlateSelection = plateJsonKeys.length > 1;

  const assemble = (itemFilter: number[] | null) => {
    const positions: number[] = [];
    const colors: number[] = [];
    const meshCount = { value: 0 };
    for (const item of buildItems) {
      if (itemFilter && !itemFilter.includes(item.objectId)) {
        continue;
      }
      const scaled = multiplyMat(
        [
          scale, 0, 0, 0,
          0, scale, 0, 0,
          0, 0, scale, 0,
          0, 0, 0, 1,
        ],
        item.transform,
      );
      collectTriangles(
        objects,
        item.objectId,
        scaled,
        0,
        new Set(),
        positions,
        colors,
        colorTable,
        objectColors,
        objectColors.get(item.objectId) ?? null,
        meshCount,
      );
    }
    return { positions, colors };
  };

  const plates: ThreeMfPlate[] = [];
  if (requiresPlateSelection) {
    for (const key of plateJsonKeys) {
      const match = /plate_(\d+)\.json$/i.exec(key);
      const n = match?.[1] ?? String(plates.length + 1);
      const ids = parsePlateJson(decodeUtf8(normalized.get(key)!));
      const assembled = assemble(ids);
      if (assembled.positions.length < 9) {
        continue;
      }
      plates.push(plateFromPositions(`plate-${n}`, `Plaka ${n}`, ids, assembled.positions, assembled.colors));
    }
    if (plates.length === 0) {
      throw new ThreeMfError(
        "multi_plate",
        "Bu Bambu Studio projesinde birden fazla plaka var. Analiz edilecek plakayı seçin.",
      );
    }
  } else {
    const assembled = assemble(null);
    if (assembled.positions.length < 9) {
      throw new ThreeMfError("empty_mesh", "Bu dosyada görüntülenebilir bir model bulunamadı.");
    }
    plates.push(plateFromPositions("default", "Ana plaka", null, assembled.positions, assembled.colors));
  }

  return {
    unit,
    unitScaleToMm: scale,
    rootModelPath,
    plates,
    requiresPlateSelection,
    objectCount: objects.size,
  };
}

export function threeMfPlateToVertices(plate: ThreeMfPlate): Vec3Mm[] {
  const vertices: Vec3Mm[] = [];
  for (let i = 0; i < plate.positions.length; i += 3) {
    vertices.push({
      x: plate.positions[i]!,
      y: plate.positions[i + 1]!,
      z: plate.positions[i + 2]!,
    });
  }
  return vertices;
}
