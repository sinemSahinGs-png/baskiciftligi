import { ThreeMfError } from "@/domain/manufacturing/threemf/types";

export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

export function normalizeZipPath(name: string): string {
  return name.replace(/\\/g, "/").replace(/^\/+/, "");
}

export function parseTagAttributes(tag: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(tag))) {
    const raw = match[1]!.toLowerCase();
    const local = raw.includes(":") ? raw.slice(raw.indexOf(":") + 1) : raw;
    const value = match[2] ?? match[3] ?? "";
    attrs[raw] = value;
    attrs[local] = value;
  }
  return attrs;
}

export function openTagPattern(tag: string) {
  return new RegExp(`<(?:[\\w]+:)?${tag}\\b([^>]*)\\/?>`, "gi");
}

export function elementPattern(tag: string) {
  return new RegExp(`<(?:[\\w]+:)?${tag}\\b([^>]*)>([\\s\\S]*?)<\\/(?:[\\w]+:)?${tag}>`, "gi");
}

export function firstElement(xml: string, tag: string) {
  return new RegExp(`<(?:[\\w]+:)?${tag}\\b([^>]*)>([\\s\\S]*?)<\\/(?:[\\w]+:)?${tag}>`, "i").exec(
    xml,
  );
}

export function parseDisplayColor(value: string | undefined): [number, number, number] | null {
  if (!value) return null;
  const hex = value.trim().replace(/^#/, "");
  if (hex.length !== 6 && hex.length !== 8) return null;
  const r = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const g = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const b = Number.parseInt(hex.slice(4, 6), 16) / 255;
  if (![r, g, b].every(Number.isFinite)) return null;
  return [r, g, b];
}

export function assertSafeXml(xml: string) {
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml) || /SYSTEM\s+["']/i.test(xml)) {
    throw new ThreeMfError("xxe", "3MF XML dış varlık içeriyor.");
  }
}

export function unitScaleToMm(unit: string | undefined): number {
  switch ((unit ?? "millimeter").toLowerCase()) {
    case "micron":
    case "micrometer":
      return 0.001;
    case "millimeter":
    case "mm":
      return 1;
    case "centimeter":
    case "cm":
      return 10;
    case "meter":
    case "m":
      return 1000;
    case "inch":
      return 25.4;
    case "foot":
    case "feet":
      return 304.8;
    default:
      return 1;
  }
}

export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

export function identityMat(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** 3MF 12-value affine transform → column-major 4x4. */
export function parseTransformAttr(value: string | undefined): Mat4 {
  if (!value?.trim()) {
    return identityMat();
  }
  const parts = value.trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 12 || parts.some((n) => !Number.isFinite(n))) {
    throw new ThreeMfError("corrupt", "3MF transform değeri geçersiz.");
  }
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22, m30, m31, m32] = parts as number[];
  return [
    m00!, m10!, m20!, 0,
    m01!, m11!, m21!, 0,
    m02!, m12!, m22!, 0,
    m30!, m31!, m32!, 1,
  ];
}

export function multiplyMat(a: Mat4, b: Mat4): Mat4 {
  const out = identityMat();
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) {
      out[col * 4 + row] =
        a[row]! * b[col * 4]! +
        a[4 + row]! * b[col * 4 + 1]! +
        a[8 + row]! * b[col * 4 + 2]! +
        a[12 + row]! * b[col * 4 + 3]!;
    }
  }
  return out;
}

export function transformPoint(m: Mat4, x: number, y: number, z: number): [number, number, number] {
  return [
    m[0]! * x + m[4]! * y + m[8]! * z + m[12]!,
    m[1]! * x + m[5]! * y + m[9]! * z + m[13]!,
    m[2]! * x + m[6]! * y + m[10]! * z + m[14]!,
  ];
}
