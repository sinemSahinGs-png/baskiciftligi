"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { GizmoHelper, GizmoViewport, Grid, OrbitControls } from "@react-three/drei";
import { Box3, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import { unzipSync } from "three/examples/jsm/libs/fflate.module.js";
import type { Object3D } from "three";

export type PreviewStatus =
  | "idle"
  | "parsing"
  | "ready"
  | "unsupported"
  | "corrupt"
  | "too_complex"
  | "unavailable";

interface MeshPreviewProps {
  file: File | null;
  remoteUrl?: string | null;
  scalePercent: number;
  wireframe: boolean;
  resetKey: number;
  fitKey: number;
  reducedMotion: boolean;
  onStatus: (status: PreviewStatus) => void;
  onDimensions: (mm: { x: number; y: number; z: number } | null) => void;
}

const PREVIEW_TRIANGLES = 400_000;

function geometryFrom3mf(buffer: ArrayBuffer): BufferGeometry | null {
  try {
    const parsed = new ThreeMFLoader().parse(buffer) as Object3D;
    const fromLoader = geometryFromObject(parsed);
    if (fromLoader) {
      return fromLoader;
    }
  } catch {
    // Some valid 3MF packages are not accepted by ThreeMFLoader; fall back.
  }
  try {
    const zip = unzipSync(new Uint8Array(buffer));
    const modelKey = Object.keys(zip).find((key) =>
      /3d\/.*\.model$/i.test(key.replaceAll("\\", "/")),
    );
    if (!modelKey || !zip[modelKey]) {
      return null;
    }
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
      if (!a || !b || !c) {
        continue;
      }
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    }
    if (positions.length < 9) {
      return null;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  } catch {
    return null;
  }
}

function geometryFromObject(root: Object3D): BufferGeometry | null {
  let found: BufferGeometry | null = null;
  root.traverse((child) => {
    if (found) {
      return;
    }
    if (child instanceof Mesh && child.geometry) {
      found = child.geometry;
    }
  });
  return found;
}

function countTriangles(geometry: BufferGeometry) {
  const index = geometry.getIndex();
  if (index) {
    return index.count / 3;
  }
  const position = geometry.getAttribute("position");
  return position ? position.count / 3 : 0;
}

function FittedMesh({
  geometry,
  wireframe,
  scalePercent,
}: {
  geometry: BufferGeometry;
  wireframe: boolean;
  scalePercent: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#30d5d2"),
        metalness: 0.12,
        roughness: 0.46,
        wireframe,
        side: DoubleSide,
      }),
    [wireframe],
  );

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new Box3();
    const center = new Vector3();
    box.getCenter(center);
    mesh.position.set(-center.x, -center.y, -center.z);
  }, [geometry]);

  const scale = Math.max(0.01, scalePercent / 100);

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} scale={scale} />
  );
}

function CameraRig({
  resetKey,
  fitKey,
  size,
}: {
  resetKey: number;
  fitKey: number;
  size: { x: number; y: number; z: number } | null;
}) {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as { reset?: () => void } | null;

  useEffect(() => {
    const maxDim = size ? Math.max(size.x, size.y, size.z, 20) : 40;
    camera.position.set(maxDim * 1.4, maxDim * 1.1, maxDim * 1.6);
    camera.lookAt(0, 0, 0);
    controls?.reset?.();
  }, [camera, controls, resetKey, fitKey, size]);

  return null;
}

export function MeshPreview({
  file,
  remoteUrl,
  scalePercent,
  wireframe,
  resetKey,
  fitKey,
  reducedMotion,
  onStatus,
  onDimensions,
}: MeshPreviewProps) {
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  const [fittedSize, setFittedSize] = useState<{ x: number; y: number; z: number } | null>(
    null,
  );
  const [webglFailed, setWebglFailed] = useState(false);
  const objectUrlRef = useRef<string | null>(null);
  const hiddenRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => {
      hiddenRef.current = document.hidden;
      setPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        onStatus("unavailable");
      }
    }, 20_000);

    async function load() {
      if (!file && !remoteUrl) {
        setGeometry(null);
        onStatus("idle");
        onDimensions(null);
        return;
      }
      onStatus("parsing");
      try {
        let buffer: ArrayBuffer;
        const name = file?.name ?? remoteUrl ?? "model.stl";
        if (file) {
          buffer = await file.arrayBuffer();
        } else if (remoteUrl) {
          const response = await fetch(remoteUrl, { cache: "no-store" });
          if (!response.ok) {
            throw new Error("remote");
          }
          buffer = await response.arrayBuffer();
        } else {
          return;
        }
        if (cancelled) {
          return;
        }
        const lower = name.toLocaleLowerCase("tr-TR");
        let geo: BufferGeometry | null = null;
        if (lower.endsWith(".stl")) {
          geo = new STLLoader().parse(buffer);
        } else if (lower.endsWith(".obj")) {
          geo = geometryFromObject(new OBJLoader().parse(new TextDecoder().decode(buffer)));
        } else if (lower.endsWith(".3mf")) {
          geo = geometryFrom3mf(buffer);
        } else {
          onStatus("unsupported");
          return;
        }
        if (!geo) {
          onStatus("corrupt");
          return;
        }
        if (countTriangles(geo) > PREVIEW_TRIANGLES) {
          onStatus("too_complex");
          geo.computeBoundingBox();
          const box = geo.boundingBox;
          if (box) {
            const size = box.getSize(new Vector3());
            onDimensions({ x: size.x, y: size.y, z: size.z });
          }
          geo.dispose();
          return;
        }
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        const size = geo.boundingBox?.getSize(new Vector3());
        setGeometry(geo);
        setFittedSize(size ? { x: size.x, y: size.y, z: size.z } : null);
        onStatus("ready");
        onDimensions(size ? { x: size.x, y: size.y, z: size.z } : null);
      } catch {
        if (!cancelled) {
          onStatus("corrupt");
          onDimensions(null);
          setFittedSize(null);
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void load();
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      setGeometry((current) => {
        current?.dispose();
        return null;
      });
      setFittedSize(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [file, remoteUrl, onDimensions, onStatus]);

  if (webglFailed) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-light">
        <p>
          WebGL bu tarayıcıda kullanılamıyor. Model yüklendi
          {fittedSize
            ? ` (${fittedSize.x.toFixed(1)} × ${fittedSize.y.toFixed(1)} × ${fittedSize.z.toFixed(1)} mm)`
            : ""}
          ; 3D yörünge kapalı. Sunucu analizi yine de çalışabilir.
        </p>
      </div>
    );
  }

  if (!file && !remoteUrl) {
    return null;
  }

  return (
    <Canvas
      frameloop={paused ? "never" : "demand"}
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "default" }}
      camera={{ position: [40, 30, 50], fov: 35, near: 0.1, far: 5000 }}
      onCreated={({ gl, invalidate }) => {
        const context = gl.getContext();
        if (!context) {
          setWebglFailed(true);
          return;
        }
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          setWebglFailed(true);
        });
        invalidate();
      }}
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[40, 80, 30]} intensity={1.1} />
      <Grid
        infiniteGrid
        fadeDistance={180}
        cellSize={5}
        sectionSize={20}
        cellColor="#1c3d4a"
        sectionColor="#30d5d2"
      />
      <axesHelper args={[25]} />
      {geometry ? (
        <FittedMesh geometry={geometry} wireframe={wireframe} scalePercent={scalePercent} />
      ) : null}
      <CameraRig resetKey={resetKey} fitKey={fitKey} size={fittedSize} />
      <OrbitControls makeDefault enableDamping={!reducedMotion} dampingFactor={0.12} />
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport labelColor="white" />
      </GizmoHelper>
    </Canvas>
  );
}
