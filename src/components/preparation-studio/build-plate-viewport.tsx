"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  ContactShadows,
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
  MOUSE,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
} from "three";
import type { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import { normalizeTransform } from "@/domain/manufacturing/transform";
import { applyBedDragDelta } from "@/domain/manufacturing/transform-math";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";
import type { Vec3Mm } from "@/domain/manufacturing/types";
import { cn } from "@/lib/utils";

export type StudioTool = "select" | "rotate" | "scale" | "move" | "measure";

const DRAG_PX = 5;

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
  selected?: boolean;
  onTransformCommit: (transform: ManufacturingTransform) => void;
  onOutOfPlate?: (outside: boolean) => void;
  className?: string;
}

function BuildPlate({ sizeX, sizeY }: { sizeX: number; sizeY: number }) {
  return (
    <group>
      <mesh position={[sizeX / 2, -0.6, sizeY / 2]} receiveShadow>
        <boxGeometry args={[sizeX + 16, 1.2, sizeY + 16]} />
        <meshStandardMaterial color="#2a3340" metalness={0.2} roughness={0.72} />
      </mesh>
      <mesh position={[sizeX / 2, 0.02, sizeY / 2]} receiveShadow>
        <boxGeometry args={[sizeX, 0.04, sizeY]} />
        <meshStandardMaterial color="#3d4754" metalness={0.08} roughness={0.9} />
      </mesh>
      <gridHelper
        args={[Math.max(sizeX, sizeY), Math.round(Math.max(sizeX, sizeY) / 20), "#4a5b66", "#354049"]}
        position={[sizeX / 2, 0.05, sizeY / 2]}
      />
    </group>
  );
}

function applyGroupTransform(group: Group, transform: ManufacturingTransform) {
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
}

function ModelMesh({
  geometry,
  transform,
  previewColor,
  wireframe,
  activeTool,
  selected,
  buildVolumeMm,
  onTransformCommit,
  onOutOfPlate,
}: {
  geometry: BufferGeometry;
  transform: ManufacturingTransform;
  previewColor: string;
  wireframe: boolean;
  activeTool: StudioTool;
  selected: boolean;
  buildVolumeMm: Vec3Mm;
  onTransformCommit: (transform: ManufacturingTransform) => void;
  onOutOfPlate?: (outside: boolean) => void;
}) {
  const groupRef = useRef<Group>(null);
  const [groupObject, setGroupObject] = useState<Group | null>(null);
  const meshRef = useRef<Mesh>(null);
  const { camera, gl, controls, invalidate } = useThree();
  const orbit = controls as OrbitControlsImpl | null;
  const orbitRef = useRef<OrbitControlsImpl | null>(null);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moving: boolean;
    origin: Vector3;
  } | null>(null);
  const plane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), []);
  const [hovered, setHovered] = useState(false);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: geometry.getAttribute("color") ? new Color("#ffffff") : new Color(previewColor),
        vertexColors: Boolean(geometry.getAttribute("color")),
        metalness: 0.22,
        roughness: 0.48,
        envMapIntensity: 0.35,
        wireframe,
        side: DoubleSide,
        emissive: new Color("#12323a"),
        emissiveIntensity: hovered ? 0.09 : 0.04,
      }),
    [geometry, hovered, previewColor, wireframe],
  );

  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    applyGroupTransform(group, transform);
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

  function worldOnPlane(clientX: number, clientY: number) {
    const rect = gl.domElement.getBoundingClientRect();
    const ndc = new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    const raycaster = new Raycaster();
    const hit = new Vector3();
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(plane, hit) ? hit.clone() : null;
  }

  function reportBounds(group: Group) {
    const box = new Box3().setFromObject(group);
    const outside =
      box.min.x < -2 ||
      box.max.x > buildVolumeMm.x + 2 ||
      box.min.z < -2 ||
      box.max.z > buildVolumeMm.y + 2;
    onOutOfPlate?.(outside);
  }

  function commitFromGroup() {
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
        scale: {
          x: group.scale.x,
          y: group.scale.y,
          z: group.scale.z,
          uniform: transform.scale.uniform,
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

  const transformRef = useRef(transform);
  const gizmoMode =
    activeTool === "rotate" ? "rotate" : activeTool === "scale" ? "scale" : activeTool === "move" ? "translate" : null;

  useEffect(() => {
    transformRef.current = transform;
  }, [transform]);
  useEffect(() => {
    orbitRef.current = orbit;
  }, [orbit]);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const session = drag.current;
      if (!session || session.pointerId !== event.pointerId) return;
      if (gizmoMode === "rotate" || gizmoMode === "scale") return;
      const dist = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);
      if (!session.moving && dist < DRAG_PX) return;
      session.moving = true;
      const liveOrbit = orbitRef.current;
      if (liveOrbit) liveOrbit.enabled = false;
      const point = worldOnPlane(event.clientX, event.clientY);
      const group = groupRef.current;
      const current = transformRef.current;
      if (!point || !group) return;
      const start = worldOnPlane(session.startX, session.startY);
      if (!start) return;
      group.position.x = current.positionMm.x + (point.x - start.x);
      group.position.z = current.positionMm.y + (point.z - start.z);
      group.position.y = current.positionMm.z;
      reportBounds(group);
      invalidate();
    };
    const onUp = (event: PointerEvent) => {
      const session = drag.current;
      if (!session || session.pointerId !== event.pointerId) return;
      drag.current = null;
      const orbit = orbitRef.current;
      if (orbit) orbit.enabled = true;
      try {
        gl.domElement.releasePointerCapture(event.pointerId);
      } catch {
        /* already released */
      }
      if (session.moving) {
        const point = worldOnPlane(event.clientX, event.clientY);
        const start = worldOnPlane(session.startX, session.startY);
        if (point && start) {
          onTransformCommit(
            applyBedDragDelta(transformRef.current, point.x - start.x, point.z - start.z),
          );
        } else {
          commitFromGroup();
        }
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    // Demand-loop invalidation is enough; worldOnPlane/reportBounds read latest refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pointer session lives in refs
  }, [gizmoMode, gl, invalidate, onTransformCommit]);

  return (
    <>
      <group
        ref={(node) => {
          groupRef.current = node;
          setGroupObject(node);
        }}
      >
        <mesh
          ref={meshRef}
          geometry={geometry}
          castShadow
          receiveShadow
          material={material}
          onPointerOver={() => {
            setHovered(true);
            invalidate();
          }}
          onPointerOut={() => {
            setHovered(false);
            invalidate();
          }}
          onPointerDown={(event) => {
            if (event.button !== 0 && event.pointerType === "mouse") return;
            if (gizmoMode === "rotate" || gizmoMode === "scale") return;
            event.stopPropagation();
            gl.domElement.setPointerCapture(event.pointerId);
            const liveOrbit = orbitRef.current;
            if (liveOrbit) liveOrbit.enabled = false;
            const point = worldOnPlane(event.clientX, event.clientY);
            drag.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              moving: false,
              origin: point ?? new Vector3(),
            };
          }}
        >
          {selected ? (
            <mesh geometry={geometry}>
              <meshBasicMaterial color="#30d5d2" wireframe transparent opacity={0.35} />
            </mesh>
          ) : null}
        </mesh>
      </group>
      {gizmoMode && groupObject ? (
        <TransformControls object={groupObject} mode={gizmoMode} onMouseUp={commitFromGroup} />
      ) : null}
    </>
  );
}

function CameraRig({
  fitKey,
  resetCameraKey,
  buildVolumeMm,
  geometry,
  reducedMotion,
}: {
  fitKey: number;
  resetCameraKey: number;
  buildVolumeMm: Vec3Mm;
  geometry: BufferGeometry | null;
  reducedMotion: boolean;
}) {
  const { camera, invalidate } = useThree();
  const controls = useThree((state) => state.controls) as OrbitControlsImpl | null;

  useEffect(() => {
    const target = new Vector3(buildVolumeMm.x / 2, 8, buildVolumeMm.y / 2);
    let span = Math.max(buildVolumeMm.x, buildVolumeMm.y, 80);
    if (geometry?.boundingBox) {
      span = Math.max(
        span / 4,
        geometry.boundingBox.max.x - geometry.boundingBox.min.x,
        geometry.boundingBox.max.y - geometry.boundingBox.min.y,
        geometry.boundingBox.max.z - geometry.boundingBox.min.z,
        24,
      );
    }
    const dest = new Vector3(target.x + span * 0.9, span * 0.75, target.z + span * 1.05);
    if (reducedMotion) {
      camera.position.copy(dest);
      camera.lookAt(target);
      controls?.target.copy(target);
      controls?.update();
      invalidate();
      return;
    }
    const start = camera.position.clone();
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / 420);
      const e = 1 - (1 - t) ** 3;
      camera.position.lerpVectors(start, dest, e);
      camera.lookAt(target);
      controls?.target.copy(target);
      controls?.update();
      invalidate();
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [buildVolumeMm.x, buildVolumeMm.y, camera, controls, fitKey, geometry, invalidate, reducedMotion, resetCameraKey]);

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
  selected = true,
  onTransformCommit,
  onOutOfPlate,
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
        "relative h-full w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_18%,rgba(48,213,210,0.16),transparent_42%),linear-gradient(180deg,#1b2430,#121821)]",
        className,
      )}
      data-testid="build-plate-viewport"
    >
      <Canvas
        frameloop={paused ? "never" : "demand"}
        dpr={[1, 1.25]}
        shadows
        camera={{ position: [180, 140, 200], fov: 38, near: 0.1, far: 5000 }}
        onCreated={({ gl }) => {
          gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
          gl.domElement.addEventListener("webglcontextlost", (event) => {
            event.preventDefault();
            setWebglFailed(true);
          });
        }}
        style={{ width: "100%", height: "100%", touchAction: "none" }}
      >
        <color attach="background" args={["#151c26"]} />
        <hemisphereLight args={["#d7e4f2", "#1b222c", 0.7]} />
        <ambientLight intensity={0.28} />
        <directionalLight castShadow position={[90, 160, 40]} intensity={1.15} color="#fff6ea" />
        <directionalLight position={[-70, 80, -40]} intensity={0.35} color="#9eb6ff" />
        <directionalLight position={[20, 50, 120]} intensity={0.28} color="#7ee0dc" />
        <BuildPlate sizeX={buildVolumeMm.x} sizeY={buildVolumeMm.y} />
        <ContactShadows
          position={[buildVolumeMm.x / 2, 0.06, buildVolumeMm.y / 2]}
          opacity={0.35}
          scale={Math.max(buildVolumeMm.x, buildVolumeMm.y)}
          blur={2.2}
          far={40}
        />
        {geometry ? (
          <ModelMesh
            geometry={geometry}
            transform={transform}
            previewColor={previewColor}
            wireframe={wireframe}
            activeTool={activeTool}
            selected={selected}
            buildVolumeMm={buildVolumeMm}
            onTransformCommit={onTransformCommit}
            onOutOfPlate={onOutOfPlate}
          />
        ) : null}
        <CameraRig
          fitKey={fitKey}
          resetCameraKey={resetCameraKey}
          buildVolumeMm={buildVolumeMm}
          geometry={geometry}
          reducedMotion={reducedMotion}
        />
        <OrbitControls
          makeDefault
          enableDamping={!reducedMotion}
          dampingFactor={0.08}
          target={[buildVolumeMm.x / 2, 0, buildVolumeMm.y / 2]}
          maxPolarAngle={Math.PI / 2.05}
          mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }}
        />
        <GizmoHelper alignment="bottom-right" margin={[56, 56]}>
          <GizmoViewport labelColor="white" axisHeadScale={0.85} />
        </GizmoHelper>
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/35 px-2.5 py-1 text-[11px] text-white/80 backdrop-blur-sm">
        {buildVolumeMm.x} × {buildVolumeMm.y} × {buildVolumeMm.z} mm
      </div>
    </div>
  );
}
