import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

import { parseGcode } from "../apps/slicer-worker/src/parse-gcode.mjs";

const ROOT = process.cwd();
const CUBE = path.join(ROOT, "fixtures", "meshes", "20mm-cube.stl");
const OVERHANG = path.join(ROOT, "fixtures", "meshes", "t-overhang.stl");
const OUT_DIR = path.join(ROOT, ".octo-data", "manufacturing", "live-slice");
const PROFILE_ROOT = path.join(ROOT, "apps", "slicer-worker", "profiles");
const REMOTE_STL = "/tmp/live-model.stl";
const REMOTE_GCODE = "/tmp/live-model.gcode";
const REMOTE_OVERRIDE = "/tmp/worker-auto-support.ini";

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: "utf8",
    shell: false,
    timeout: 20_000,
    maxBuffer: 20 * 1024 * 1024,
    ...options,
  });
}

function execWorker(args, options = {}) {
  return run(
    "docker",
    [
      "compose",
      "exec",
      "-T",
      "-u",
      "slicer",
      "-e",
      "HOME=/tmp",
      "-e",
      "TMPDIR=/tmp",
      "slicer-worker",
      ...args,
    ],
    options,
  );
}

function fail(message, extra) {
  console.error(message);
  if (extra) {
    console.error(String(extra).slice(0, 1200));
  }
  process.exit(1);
}

const info = run("docker", ["info"]);
if (info.status !== 0) {
  fail(
    "Live PrusaSlicer slice aborted: Docker engine is not reachable.",
    info.stderr || info.stdout,
  );
}

if (!existsSync(CUBE)) {
  fail(`Fixture missing: ${CUBE}`);
}

if (!existsSync(OVERHANG)) {
  fail(`Fixture missing: ${OVERHANG}`);
}

mkdirSync(OUT_DIR, { recursive: true });
const gcodePath = path.join(OUT_DIR, "20mm-cube.gcode");
rmSync(gcodePath, { force: true });

const override = execWorker([
  "sh",
  "-c",
  `cat > ${REMOTE_OVERRIDE} <<'EOF'
fill_density = 20%
support_material = 1
support_material_auto = 1
scale = 100%
EOF`,
]);
if (override.status !== 0) {
  fail("Could not write worker-matching support override.ini", override.stderr || override.stdout);
}

function copyAndSlice(localStl, localGcodePath) {
  const cubeBytes = readFileSync(localStl);
  const copy = execWorker(["sh", "-c", `cat > ${REMOTE_STL}`], {
    encoding: null,
    input: cubeBytes,
    timeout: 30_000,
  });
  if (copy.status !== 0) {
    fail(
      "Could not copy the mesh into slicer-worker tmpfs. Is the container up? npm run manufacturing:up",
      `${copy.stderr || copy.stdout || ""}`,
    );
  }
  const slicerArgs = [
    "/opt/prusa-slicer/usr/bin/prusa-slicer",
    "--export-gcode",
    "--output",
    REMOTE_GCODE,
    "--load",
    "/app/profiles/printer/bambu-a1-dev.ini",
    "--load",
    "/app/profiles/filament/pla.ini",
    "--load",
    "/app/profiles/print/standart.ini",
    "--load",
    REMOTE_OVERRIDE,
    "--center",
    "128,128",
    REMOTE_STL,
  ];
  const slice = execWorker(slicerArgs, { timeout: 8 * 60 * 1000 });
  if (slice.status !== 0) {
    fail(
      `PrusaSlicer exited ${slice.status}. This is not a successful live slice.`,
      `${slice.stdout}\n${slice.stderr}`,
    );
  }
  const pull = execWorker(["cat", REMOTE_GCODE], { timeout: 30_000 });
  if (pull.status !== 0 || !pull.stdout) {
    fail("G-code was not produced or could not be copied out.", pull.stderr || pull.stdout);
  }
  writeFileSync(localGcodePath, pull.stdout, "utf8");
  return parseGcode(pull.stdout);
}

const cubeBytes = readFileSync(CUBE);
const copyInfo = execWorker(["sh", "-c", `cat > ${REMOTE_STL}`], {
  encoding: null,
  input: cubeBytes,
  timeout: 30_000,
});
if (copyInfo.status !== 0) {
  fail(
    "Could not copy the 20 mm cube into slicer-worker tmpfs. Is the container up? npm run manufacturing:up",
    `${copyInfo.stderr || copyInfo.stdout || ""}`,
  );
}

const modelInfo = execWorker(
  ["/opt/prusa-slicer/usr/bin/prusa-slicer", "--info", REMOTE_STL],
  { timeout: 60_000 },
);
const infoText = `${modelInfo.stdout || ""}\n${modelInfo.stderr || ""}`;
const sizeX = Number(infoText.match(/size_x\s*=\s*([0-9.]+)/i)?.[1]);
const sizeY = Number(infoText.match(/size_y\s*=\s*([0-9.]+)/i)?.[1]);
const sizeZ = Number(infoText.match(/size_z\s*=\s*([0-9.]+)/i)?.[1]);

const parsedCube = copyAndSlice(CUBE, gcodePath);
const version = execWorker(["/opt/prusa-slicer/usr/bin/prusa-slicer", "--help"]);
const gcode = readFileSync(gcodePath, "utf8");
const sizeBytes = statSync(gcodePath).size;
const typeSupportMatches = gcode.match(/^;TYPE:Support/gim) ?? [];
const configSupportDump = /; support_material\s*=\s*1/i.test(gcode);

const overhangGcodePath = path.join(OUT_DIR, "overhang.gcode");
rmSync(overhangGcodePath, { force: true });
const parsedOverhang = copyAndSlice(OVERHANG, overhangGcodePath);
const overhangGcode = readFileSync(overhangGcodePath, "utf8");
const overhangTypeSupport = overhangGcode.match(/^;TYPE:Support/gim) ?? [];

const cleanup = execWorker(["rm", "-f", REMOTE_STL, REMOTE_GCODE, REMOTE_OVERRIDE]);
const leftover = execWorker([
  "sh",
  "-c",
  `if [ -e ${REMOTE_STL} ] || [ -e ${REMOTE_GCODE} ]; then echo LEFT; else echo CLEAN; fi`,
]);
const cleanedUp = (leftover.stdout || "").trim() === "CLEAN" && cleanup.status === 0;

const metrics = {
  prusaSlicerHelpHead: (version.stdout || "").split(/\r?\n/)[0] ?? null,
  engine: parsedCube.engineVersion,
  printerProfile: "bambu-a1-dev",
  material: "PLA",
  layerHeightMm: 0.2,
  infillPercent: 20,
  supports:
    "worker-matching override: support_material=1, support_material_auto=1 (standart.ini default is 0)",
  fixture: "fixtures/meshes/20mm-cube.stl",
  expectedDimensionsMm: { x: 20, y: 20, z: 20 },
  dimensionsMm: {
    x: Number.isFinite(sizeX) ? sizeX : null,
    y: Number.isFinite(sizeY) ? sizeY : null,
    z: Number.isFinite(sizeZ) ? sizeZ : null,
  },
  layerCount: parsedCube.layerCount,
  filamentLengthMm: parsedCube.filamentLengthMm,
  filamentWeightGrams: parsedCube.filamentWeightGrams,
  estimatedDurationSeconds: parsedCube.estimatedDurationSeconds,
  gcodeBytes: sizeBytes,
  gcodeParserVersion: parsedCube.gcodeParserVersion,
  supportGenerated: parsedCube.supportGenerated,
  supportMaterialMm: parsedCube.supportMaterialMm,
  supportMaterialGrams: parsedCube.supportMaterialGrams,
  supportLayerCount: parsedCube.supportLayerCount,
  typeSupportCommentCount: typeSupportMatches.length,
  configDumpSupportMaterialOn: configSupportDump,
  temporaryFilesCleanedUp: cleanedUp,
  overhang: {
    fixture: "fixtures/meshes/t-overhang.stl",
    supportGenerated: parsedOverhang.supportGenerated,
    supportMaterialMm: parsedOverhang.supportMaterialMm,
    supportMaterialGrams: parsedOverhang.supportMaterialGrams,
    supportLayerCount: parsedOverhang.supportLayerCount,
    typeSupportCommentCount: overhangTypeSupport.length,
    filamentWeightGrams: parsedOverhang.filamentWeightGrams,
    estimatedDurationSeconds: parsedOverhang.estimatedDurationSeconds,
  },
};

function implausibleCube(value, min, max) {
  return !(Number.isFinite(value) && value >= min && value <= max);
}

if (
  !(parsedCube.filamentLengthMm > 0) ||
  !(parsedCube.filamentWeightGrams > 0) ||
  !(parsedCube.estimatedDurationSeconds > 0) ||
  !(parsedCube.layerCount > 0) ||
  sizeBytes <= 0
) {
  fail("Parsed live G-code metrics are not all positive.", JSON.stringify(metrics, null, 2));
}

if (
  implausibleCube(sizeX, 19.5, 20.5) ||
  implausibleCube(sizeY, 19.5, 20.5) ||
  implausibleCube(sizeZ, 19.5, 20.5)
) {
  fail("PrusaSlicer --info dimensions are not a 20 mm cube.", JSON.stringify(metrics, null, 2));
}

if (implausibleCube(parsedCube.layerCount, 80, 120)) {
  fail("Layer count is not plausible for a 20 mm cube at 0.20 mm.", JSON.stringify(metrics, null, 2));
}

if (
  implausibleCube(parsedCube.filamentWeightGrams, 0.4, 15) ||
  implausibleCube(parsedCube.filamentLengthMm, 100, 20_000)
) {
  fail("Filament usage is not plausible for a 20 mm PLA cube.", JSON.stringify(metrics, null, 2));
}

if (implausibleCube(parsedCube.estimatedDurationSeconds, 30, 3600)) {
  fail("Estimated duration is not plausible for a 20 mm cube.", JSON.stringify(metrics, null, 2));
}

if (parsedCube.supportGenerated || typeSupportMatches.length > 0) {
  fail(
    "20 mm cube G-code contains support toolpaths; supportGenerated must be false.",
    JSON.stringify(metrics, null, 2),
  );
}

if (!parsedOverhang.supportGenerated || overhangTypeSupport.length === 0) {
  fail(
    "Overhang fixture did not produce support toolpaths with the selected profile.",
    JSON.stringify(metrics, null, 2),
  );
}

if (!cleanedUp) {
  fail("Temporary model and G-code files were not cleaned up.", JSON.stringify(metrics, null, 2));
}

writeFileSync(
  path.join(OUT_DIR, "metrics.json"),
  `${JSON.stringify(metrics, null, 2)}\n`,
  "utf8",
);

console.log("Live PrusaSlicer 20 mm cube slice succeeded.");
console.log(JSON.stringify(metrics, null, 2));
console.log(`G-code kept locally at ${gcodePath} (do not commit).`);
console.log(`Profiles used from ${PROFILE_ROOT} (also /app/profiles in the container).`);
