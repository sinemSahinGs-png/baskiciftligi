"use client";

import { useEffect, useState } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { Object3D, Mesh } from "three";

import { loadThreeMfPackage } from "@/domain/manufacturing/threemf/load-package";
import { readZipEntryFflate } from "@/domain/manufacturing/threemf/read-entry-fflate";
import type { ThreeMfPlate } from "@/domain/manufacturing/threemf/types";
import { ThreeMfError } from "@/domain/manufacturing/threemf/types";
import { PREVIEW_TRIANGLE_LIMIT, type Vec3Mm } from "@/domain/manufacturing/types";
import { ZipValidationError } from "@/domain/manufacturing/zip-inspect";

export type GeometryLoadStatus =
  | "idle"
  | "parsing"
  | "ready"
  | "unsupported"
  | "corrupt"
  | "too_complex"
  | "empty"
  | "multi_plate"
  | "security";

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

function geometryFromPlate(plate: ThreeMfPlate): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(plate.positions, 3));
  if (plate.colors) {
    geometry.setAttribute("color", new Float32BufferAttribute(plate.colors, 3));
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  return geometry;
}

function countTriangles(geometry: BufferGeometry) {
  const index = geometry.getIndex();
  if (index) return index.count / 3;
  const position = geometry.getAttribute("position");
  return position ? position.count / 3 : 0;
}

function mapError(error: unknown): GeometryLoadStatus {
  if (error instanceof ThreeMfError) {
    if (error.code === "multi_plate") return "multi_plate";
    if (error.code === "security" || error.code === "xxe" || error.code === "archive") {
      return "security";
    }
    if (error.code === "empty_mesh") return "empty";
    return "corrupt";
  }
  if (error instanceof ZipValidationError) return "security";
  return "corrupt";
}

export function geometryErrorCopy(status: GeometryLoadStatus, filename?: string | null): string | null {
  const lower = filename?.toLocaleLowerCase("tr-TR") ?? "";
  if (status === "empty") return "Bu dosyada görüntülenebilir bir model bulunamadı.";
  if (status === "multi_plate") {
    return "Bu Bambu Studio projesinde birden fazla plaka var. Analiz edilecek plakayı seçin.";
  }
  if (status === "corrupt") {
    if (lower.endsWith(".3mf")) return "3MF dosyası bozuk veya desteklenmeyen bir özellik içeriyor.";
    return "Bu dosya geçerli bir STL, OBJ veya 3MF değil.";
  }
  if (status === "security") return "Dosya güvenlik sınırlarını aşıyor.";
  if (status === "unsupported") return "Yalnızca STL, 3MF veya OBJ seçilebilir.";
  if (status === "too_complex") return "Model önizleme için çok ayrıntılı. Analiz sunucuda yapılabilir.";
  return null;
}

export function useGeometryLoader(file: File | null, selectedPlateId: string | null) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [status, setStatus] = useState<GeometryLoadStatus>("idle");
  const [originalDimensionsMm, setOriginalDimensionsMm] = useState<Vec3Mm | null>(null);
  const [triangleCount, setTriangleCount] = useState(0);
  const [plates, setPlates] = useState<ThreeMfPlate[]>([]);
  const [requiresPlateSelection, setRequiresPlateSelection] = useState(false);
  const [activePlate, setActivePlate] = useState<ThreeMfPlate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const fileId = file ? `${file.name}:${file.size}:${file.lastModified}:${selectedPlateId ?? ""}` : null;

  useEffect(() => {
    let cancelled = false;
    if (!file) {
      return () => {
        cancelled = true;
      };
    }
    const activeFile = file;
    const start = window.setTimeout(() => {
      if (cancelled) return;
      void load(activeFile);
    }, 0);

    async function load(sourceFile: File) {
      setStatus("parsing");
      setErrorMessage(null);
      try {
        const buffer = await sourceFile.arrayBuffer();
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 0);
        });
        if (cancelled) return;
        const lower = sourceFile.name.toLocaleLowerCase("tr-TR");
        let geo: BufferGeometry | null = null;
        let plate: ThreeMfPlate | null = null;
        let nextPlates: ThreeMfPlate[] = [];
        let multi = false;

        if (lower.endsWith(".stl")) {
          geo = new STLLoader().parse(buffer);
        } else if (lower.endsWith(".obj")) {
          geo = geometryFromObject(new OBJLoader().parse(new TextDecoder().decode(buffer)));
        } else if (lower.endsWith(".3mf")) {
          const parsed = loadThreeMfPackage(new Uint8Array(buffer), readZipEntryFflate);
          nextPlates = parsed.plates;
          multi = parsed.requiresPlateSelection;
          const chosen =
            (selectedPlateId
              ? parsed.plates.find((item) => item.id === selectedPlateId)
              : null) ?? (multi ? null : parsed.plates[0] ?? null);
          if (!chosen) {
            setPlates(nextPlates);
            setRequiresPlateSelection(multi);
            setActivePlate(null);
            setStatus(multi ? "multi_plate" : "empty");
            setErrorMessage(geometryErrorCopy(multi ? "multi_plate" : "empty", sourceFile.name));
            setLoadedId(`${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}:${selectedPlateId ?? ""}`);
            setGeometry((current) => {
              current?.dispose();
              return null;
            });
            return;
          }
          plate = chosen;
          geo = geometryFromPlate(chosen);
        } else {
          setStatus("unsupported");
          setErrorMessage(geometryErrorCopy("unsupported", sourceFile.name));
          setLoadedId(`${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}:${selectedPlateId ?? ""}`);
          return;
        }
        if (!geo) {
          setStatus("corrupt");
          setErrorMessage(geometryErrorCopy("corrupt", sourceFile.name));
          setLoadedId(`${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}:${selectedPlateId ?? ""}`);
          return;
        }
        const triangles = plate?.triangleCount ?? countTriangles(geo);
        if (!Number.isFinite(triangles) || triangles <= 0) {
          setStatus(lower.endsWith(".3mf") ? "empty" : "corrupt");
          setErrorMessage(
            geometryErrorCopy(lower.endsWith(".3mf") ? "empty" : "corrupt", sourceFile.name),
          );
          geo.dispose();
          setLoadedId(`${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}:${selectedPlateId ?? ""}`);
          return;
        }
        geo.computeBoundingBox();
        const box = geo.boundingBox;
        const dims = plate?.dimensionsMm ??
          (box
            ? {
                x: box.max.x - box.min.x,
                y: box.max.y - box.min.y,
                z: box.max.z - box.min.z,
              }
            : null);
        if (triangles > PREVIEW_TRIANGLE_LIMIT) {
          setStatus("too_complex");
          setOriginalDimensionsMm(dims);
          setErrorMessage(geometryErrorCopy("too_complex", sourceFile.name));
          geo.dispose();
          setLoadedId(`${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}:${selectedPlateId ?? ""}`);
          return;
        }
        geo.computeVertexNormals();
        if (cancelled) {
          geo.dispose();
          return;
        }
        setTriangleCount(Math.floor(triangles));
        setOriginalDimensionsMm(dims);
        setPlates(nextPlates);
        setRequiresPlateSelection(multi);
        setActivePlate(plate);
        setLoadedId(`${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}:${selectedPlateId ?? ""}`);
        setGeometry((current) => {
          current?.dispose();
          return geo;
        });
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        const mapped = mapError(error);
        setStatus(mapped);
        const friendly = geometryErrorCopy(mapped, sourceFile.name);
        setErrorMessage(
          error instanceof ThreeMfError || error instanceof ZipValidationError
            ? error.message
            : (friendly ?? (error instanceof Error ? error.message : "Dosya okunamadı.")),
        );
        setLoadedId(`${sourceFile.name}:${sourceFile.size}:${sourceFile.lastModified}:${selectedPlateId ?? ""}`);
        setGeometry((current) => {
          current?.dispose();
          return null;
        });
      }
    }

    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, [file, selectedPlateId]);

  const showing = loadedId === fileId;

  if (!file) {
    return {
      geometry: null,
      status: "idle" as const,
      originalDimensionsMm: null,
      triangleCount: 0,
      plates: [] as ThreeMfPlate[],
      requiresPlateSelection: false,
      activePlate: null,
      errorMessage: null,
    };
  }

  return {
    geometry: showing ? geometry : null,
    status: showing || status === "parsing" ? status : status === "idle" ? "parsing" : status,
    originalDimensionsMm: showing ? originalDimensionsMm : null,
    triangleCount: showing ? triangleCount : 0,
    plates,
    requiresPlateSelection,
    activePlate: showing ? activePlate : null,
    errorMessage,
  };
}
