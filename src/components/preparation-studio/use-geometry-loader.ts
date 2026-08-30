"use client";

import { useEffect, useState } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { unzipSync } from "three/examples/jsm/libs/fflate.module.js";
import type { Object3D } from "three";
import type { Mesh } from "three";

import type { Vec3Mm } from "@/domain/manufacturing/types";

export type GeometryLoadStatus =
  | "idle"
  | "parsing"
  | "ready"
  | "unsupported"
  | "corrupt"
  | "too_complex";

const PREVIEW_TRIANGLES = 400_000;

function geometryFromObject(root: Object3D): BufferGeometry | null {
  let found: BufferGeometry | null = null;
  root.traverse((child) => {
    if (found) return;
    if ((child as Mesh).isMesh && (child as Mesh).geometry) {
      found = (child as Mesh).geometry;
    }
  });
  return found;
}

function geometryFrom3mf(buffer: ArrayBuffer): BufferGeometry | null {
  try {
    const parsed = new ThreeMFLoader().parse(buffer) as Object3D;
    const fromLoader = geometryFromObject(parsed);
    if (fromLoader) return fromLoader;
  } catch {
    // fallback below
  }
  try {
    const zip = unzipSync(new Uint8Array(buffer));
    const modelKey = Object.keys(zip).find((key) =>
      /3d\/.*\.model$/i.test(key.replaceAll("\\", "/")),
    );
    if (!modelKey || !zip[modelKey]) return null;
    const xml = new TextDecoder().decode(zip[modelKey]);
    const verts: Array<{ x: number; y: number; z: number }> = [];
    const vertexPattern =
      /<vertex\b[^>]*\bx=["']([^"']+)["'][^>]*\by=["']([^"']+)["'][^>]*\bz=["']([^"']+)["']/gi;
    let match: RegExpExecArray | null;
    while ((match = vertexPattern.exec(xml))) {
      verts.push({ x: Number(match[1]), y: Number(match[2]), z: Number(match[3]) });
    }
    const positions: number[] = [];
    const trianglePattern =
      /<triangle\b[^>]*\bv1=["']([^"']+)["'][^>]*\bv2=["']([^"']+)["'][^>]*\bv3=["']([^"']+)["']/gi;
    while ((match = trianglePattern.exec(xml))) {
      const a = verts[Number(match[1])];
      const b = verts[Number(match[2])];
      const c = verts[Number(match[3])];
      if (!a || !b || !c) continue;
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
    if (positions.length < 9) return null;
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  } catch {
    return null;
  }
}

function countTriangles(geometry: BufferGeometry) {
  const index = geometry.getIndex();
  if (index) return index.count / 3;
  const position = geometry.getAttribute("position");
  return position ? position.count / 3 : 0;
}

export function useGeometryLoader(file: File | null) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [status, setStatus] = useState<GeometryLoadStatus>("idle");
  const [originalDimensionsMm, setOriginalDimensionsMm] = useState<Vec3Mm | null>(null);
  const [triangleCount, setTriangleCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const activeFile = file;
    if (!activeFile) {
      return () => {
        cancelled = true;
        setGeometry((current) => {
          current?.dispose();
          return null;
        });
      };
    }

    async function load(sourceFile: File) {
      setStatus("parsing");
      try {
        const buffer = await sourceFile.arrayBuffer();
        if (cancelled) return;
        const lower = sourceFile.name.toLocaleLowerCase("tr-TR");
        let geo: BufferGeometry | null = null;
        if (lower.endsWith(".stl")) {
          geo = new STLLoader().parse(buffer);
        } else if (lower.endsWith(".obj")) {
          geo = geometryFromObject(new OBJLoader().parse(new TextDecoder().decode(buffer)));
        } else if (lower.endsWith(".3mf")) {
          geo = geometryFrom3mf(buffer);
        } else {
          setStatus("unsupported");
          return;
        }
        if (!geo) {
          setStatus("corrupt");
          return;
        }
        const triangles = countTriangles(geo);
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        const dims = box
          ? {
              x: box.max.x - box.min.x,
              y: box.max.y - box.min.y,
              z: box.max.z - box.min.z,
            }
          : null;
        if (triangles > PREVIEW_TRIANGLES) {
          setStatus("too_complex");
          setOriginalDimensionsMm(dims);
          geo.dispose();
          return;
        }
        geo.computeVertexNormals();
        setTriangleCount(Math.floor(triangles));
        setOriginalDimensionsMm(dims);
        setGeometry(geo);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("corrupt");
      }
    }

    void load(activeFile);
    return () => {
      cancelled = true;
      setGeometry((current) => {
        current?.dispose();
        return null;
      });
      setStatus("idle");
      setOriginalDimensionsMm(null);
      setTriangleCount(0);
    };
  }, [file]);

  if (!file) {
    return { geometry: null, status: "idle" as const, originalDimensionsMm: null, triangleCount: 0 };
  }

  return { geometry, status, originalDimensionsMm, triangleCount };
}
