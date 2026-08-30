"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  GizmoHelper,
  GizmoViewport,
  OrbitControls,
  TransformControls,
} from "@react-three/drei";
import {
  Box3,
  BufferGeometry,
  Color,
  DoubleSide,
  Euler,
  Mesh,
  MeshStandardMaterial,
  Vector3,
} from "three";
import type { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import { normalizeTransform } from "@/domain/manufacturing/transform";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";
import type { Vec3Mm } from "@/domain/manufacturing/types";
import { cn } from "@/lib/utils";

export type StudioTool =
  | "select"
  | "rotate"
  | "scale"
  | "move"
  | "measure";

interface BuildPlateViewportProps {
  geometry: BufferGeometry | null;
  transform: ManufacturingTransform;
  activeTool: StudioTool;
  previewColor: string;
  wireframe: boolean;
  showBoundingBox: boolean;
  buildVolumeMm?: Vec3Mm;
  fitKey: number;
  resetCameraKey: number;
  reducedMotion: boolean;
  onTransformCommit: (transform: ManufacturingTransform) => void;
  className?: string;
}

function BuildPlate({ sizeX, sizeY }: { sizeX: number; sizeY: number }) {
  return (
    <group>
      <mesh position={[sizeX / 2, 0.4, sizeY / 2]} receiveShadow>
        <boxGeometry args={[sizeX, 0.8, sizeY]} />
        <meshStandardMaterial color="#141a22" metalness={0.15} roughness={0.85} />
      </mesh>
      <gridHelper
        args={[Math.max(sizeX, sizeY), Math.round(Math.max(sizeX, sizeY) / 10), "#1f4f5c", "#17343d"]}
        position={[sizeX / 2, 0.81, sizeY / 2]}
      />
    </group>
  );
}

function ModelMesh({
  geometry,
  transform,
  previewColor,
  wireframe,
  activeTool,
  onTransformCommit,
}: {
  geometry: BufferGeometry;
  transform: ManufacturingTransform;
  previewColor: string;
  wireframe: boolean;
  activeTool: StudioTool;
  onTransformCommit: (transform: ManufacturingTransform) => void;
}) {
  const groupRef = useRef<Group>(null);
  const [groupObject, setGroupObject] = useState<Group | null>(null);
  const meshRef = useRef<Mesh>(null);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(previewColor),
        metalness: 0.12,
        roughness: 0.46,
        wireframe,
        side: DoubleSide,
      }),
    [previewColor, wireframe],
  );

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const normalized = normalizeTransform(transform);
    group.rotation.set(
      (normalized.rotationDeg.x * Math.PI) / 180,
      (normalized.rotationDeg.y * Math.PI) / 180,
      (normalized.rotationDeg.z * Math.PI) / 180,
      "ZYX",
    );
    group.scale.set(normalized.scale.x, normalized.scale.y, normalized.scale.z);
    group.position.set(
      normalized.positionMm.x,
      normalized.positionMm.z,
      normalized.positionMm.y,
    );
  }, [transform]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new Box3();
    const center = new Vector3();
    box.getCenter(center);
    mesh.position.set(-center.x, -box.min.y, -center.z);
  }, [geometry]);

  const gizmoMode =
    activeTool === "rotate"
      ? "rotate"
      : activeTool === "scale"
        ? "scale"
        : activeTool === "move"
          ? "translate"
          : null;

  function commitFromGizmo() {
    const group = groupRef.current;
    if (!group) return;
    const euler = new Euler().setFromQuaternion(group.quaternion, "ZYX");
    onTransformCommit(
      normalizeTransform({
        ...transform,
        rotationDeg: {
          x: (euler.x * 180) / Math.PI,
          y: (euler.y * 180) / Math.PI,
          z: (euler.z * 180) / Math.PI,
        },
        scale: transform.scale.uniform
          ? {
              x: group.scale.x,
              y: group.scale.y,
              z: group.scale.z,
              uniform: true,
            }
          : {
              x: group.scale.x,
              y: group.scale.y,
              z: group.scale.z,
              uniform: false,
            },
        positionMm: {
          x: group.position.x,
          y: group.position.z,
          z: group.position.y,
        },
        source: "manual",
      }),
    );
  }

  return (
    <>
      <group
        ref={(node) => {
          groupRef.current = node;
          setGroupObject(node);
        }}
      >
        <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow material={material} />
      </group>
      {gizmoMode && groupObject ? (
        <TransformControls
          object={groupObject}
          mode={gizmoMode}
          onMouseUp={commitFromGizmo}
        />
      ) : null}
    </>
  );
}

function CameraRig({
  fitKey,
  resetCameraKey,
  buildVolumeMm,
}: {
  fitKey: number;
  resetCameraKey: number;
  buildVolumeMm: Vec3Mm;
}) {
  const { camera } = useThree();
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  useEffect(() => {
    const span = Math.max(buildVolumeMm.x, buildVolumeMm.y, buildVolumeMm.z, 80);
    camera.position.set(span * 0.9, span * 0.75, span * 1.1);
    camera.lookAt(buildVolumeMm.x / 2, 0, buildVolumeMm.y / 2);
    controls?.target.set(buildVolumeMm.x / 2, 0, buildVolumeMm.y / 2);
    controls?.update();
  }, [buildVolumeMm.x, buildVolumeMm.y, buildVolumeMm.z, camera, controls, fitKey, resetCameraKey]);

  return null;
}

function DisableOrbitWhileTransforming({ activeTool }: { activeTool: StudioTool }) {
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;
  const orbitEnabled = activeTool === "select" || activeTool === "measure";
  useEffect(() => {
    if (!controls) return;
    const previous = controls.enabled;
    // eslint-disable-next-line react-hooks/immutability -- OrbitControls toggles enabled at runtime
    controls.enabled = orbitEnabled;
    return () => {
      controls.enabled = previous;
    };
  }, [activeTool, controls, orbitEnabled]);
  return null;
}

export function BuildPlateViewport({
  geometry,
  transform,
  activeTool,
  previewColor,
  wireframe,
  showBoundingBox,
  buildVolumeMm = DEVELOPMENT_PRINTER.buildVolumeMm,
  fitKey,
  resetCameraKey,
  reducedMotion,
  onTransformCommit,
  className,
}: BuildPlateViewportProps) {
  const [webglFailed, setWebglFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  void showBoundingBox;

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (webglFailed) {
    return (
      <div className={cn("grid h-full place-items-center p-6 text-center text-sm text-muted-light", className)}>
        WebGL kullanılamıyor. Analiz sunucuda yapılabilir.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_20%,rgba(33,212,253,0.08),transparent_55%),#0a1016]",
        className,
      )}
      data-testid="build-plate-viewport"
    >
      <Canvas
        frameloop={paused ? "never" : "demand"}
        dpr={[1, 1.5]}
        shadows
        camera={{ position: [180, 140, 200], fov: 38, near: 0.1, far: 5000 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            setWebglFailed(true);
          });
        }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      >
        <color attach="background" args={["#0a1016"]} />
        <ambientLight intensity={0.55} />
        <directionalLight castShadow position={[120, 220, 80]} intensity={1.05} />
        <BuildPlate sizeX={buildVolumeMm.x} sizeY={buildVolumeMm.y} />
        {geometry ? (
          <ModelMesh
            geometry={geometry}
            transform={transform}
            previewColor={previewColor}
            wireframe={wireframe}
            activeTool={activeTool}
            onTransformCommit={onTransformCommit}
          />
        ) : null}
        <CameraRig fitKey={fitKey} resetCameraKey={resetCameraKey} buildVolumeMm={buildVolumeMm} />
        <OrbitControls
          makeDefault
          enableDamping={!reducedMotion}
          dampingFactor={0.1}
          target={[buildVolumeMm.x / 2, 0, buildVolumeMm.y / 2]}
          maxPolarAngle={Math.PI / 2.05}
        />
        <DisableOrbitWhileTransforming activeTool={activeTool} />
        <GizmoHelper alignment="bottom-right" margin={[56, 56]}>
          <GizmoViewport labelColor="white" axisHeadScale={0.85} />
        </GizmoHelper>
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/45 px-2.5 py-1 text-[11px] text-white/75 backdrop-blur-sm">
        {buildVolumeMm.x} × {buildVolumeMm.y} × {buildVolumeMm.z} mm
      </div>
    </div>
  );
}
