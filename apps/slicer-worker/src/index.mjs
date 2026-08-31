import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GCODE_PARSER_VERSION, parseGcode } from "./parse-gcode.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKER_VERSION = "0.2.0";
const PRUSA_PINNED = "2.8.1";
const APP_BASE_URL = process.env.APP_BASE_URL ?? "http://127.0.0.1:3000";
const SECRET = process.env.SLICER_WORKER_SECRET ?? "";
const WORKER_ID = process.env.SLICER_WORKER_ID ?? `slicer-${process.pid}`;
const BIN =
  process.env.PRUSA_SLICER_BIN ??
  "/opt/prusa-slicer/usr/bin/prusa-slicer";
const PROFILE_ROOT =
  process.env.SLICER_PROFILE_ROOT ?? path.join(__dirname, "..", "profiles");
const JOB_ROOT = process.env.SLICER_JOB_ROOT ?? "/tmp/slicer-jobs";
const SLICE_TIMEOUT_MS = Number(process.env.SLICER_TIMEOUT_MS ?? 8 * 60 * 1000);
const ALLOWED_QUALITY = new Set(["ekonomik", "standart", "detayli"]);
const ALLOWED_INFILL = new Set([10, 15, 20, 30, 50, 100]);
const ALLOWED_SUPPORTS = new Set(["auto", "on", "off"]);

function headers() {
  return {
    Authorization: `Bearer ${SECRET}`,
    "Content-Type": "application/json",
    "x-slicer-worker-id": WORKER_ID,
    "x-slicer-worker-version": WORKER_VERSION,
    "x-prusa-slicer-version": PRUSA_PINNED,
  };
}

async function profileChecksum() {
  const files = [
    "printer/bambu-a1-dev.ini",
    "filament/pla.ini",
    "print/ekonomik.ini",
    "print/standart.ini",
    "print/detayli.ini",
  ];
  const hash = createHash("sha256");
  for (const relative of files) {
    hash.update(await readFile(path.join(PROFILE_ROOT, relative)));
  }
  return hash.digest("hex");
}

function runSlicer(args, cwd, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(BIN, args, {
      cwd,
      env: { ...process.env, HOME: cwd, TMPDIR: cwd },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8").slice(0, 4000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8").slice(0, 4000);
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("PrusaSlicer zaman aşımı."));
    }, timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`PrusaSlicer çıktı kodu ${code}. ${stderr.slice(0, 300)}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function sanitizeLog(text) {
  return text
    .replace(SECRET, "[redacted]")
    .replace(/https?:\/\/[^\s]+/g, "[url]")
    .slice(0, 2000);
}

function logTickFailure(details) {
  console.error(
    JSON.stringify({
      event: "slicer_tick_failed",
      ...details,
    }),
  );
}

function describeFetchError(error) {
  if (!(error instanceof Error)) {
    return { message: String(error).slice(0, 200) };
  }
  const cause = error.cause;
  return {
    message: error.message.slice(0, 200),
    code: "code" in error ? String(error.code) : undefined,
    cause:
      cause instanceof Error
        ? cause.message.slice(0, 200)
        : cause
          ? String(cause).slice(0, 200)
          : undefined,
  };
}

async function processJob(job) {
  const dir = path.join(JOB_ROOT, job.id);
  await mkdir(dir, { recursive: true });
  try {
    const config = job.configuration;
    if (config.materialId !== "pla") {
      throw new Error("Yalnız PLA otomatik dilimlenir.");
    }
    if (!ALLOWED_QUALITY.has(config.qualityId)) {
      throw new Error("Kalite profili geçersiz.");
    }
    if (!ALLOWED_INFILL.has(config.infillPercent)) {
      throw new Error("Dolgu değeri izin listesinde değil.");
    }
    if (!ALLOWED_SUPPORTS.has(config.supports)) {
      throw new Error("Destek ayarı geçersiz.");
    }

    const downloadUrl = new URL(job.downloadPath, APP_BASE_URL);
    const response = await fetch(downloadUrl, { headers: headers() });
    if (!response.ok) {
      throw new Error(`Dosya indirilemedi (${response.status}).`);
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const inputPath = path.join(dir, `model.${job.format}`);
    const outputPath = path.join(dir, "out.gcode");
    const overridePath = path.join(dir, "override.ini");
    await writeFile(inputPath, bytes);

    const support =
      config.supports === "off" ? "0" : "1";
    const auto = config.supports === "auto" ? "1" : "0";
    await writeFile(
      overridePath,
      [
        `fill_density = ${config.infillPercent}%`,
        `support_material = ${support}`,
        `support_material_auto = ${auto}`,
        `scale = ${config.scalePercent}%`,
      ].join("\n"),
      "utf8",
    );

    const transform = config.manufacturingTransform ?? null;
    const rotateX = transform?.rotationDeg.x ?? (job.analysis?.flags?.includes("does_not_fit") ? 90 : 0);
    const rotateY = transform?.rotationDeg.y ?? 0;
    const rotateZ = transform?.rotationDeg.z ?? 0;
    const centerX = transform
      ? 128 + (transform.positionMm?.x ?? 0)
      : 128;
    const centerY = transform
      ? 128 + (transform.positionMm?.y ?? 0)
      : 128;
    const args = [
      "--export-gcode",
      "--output",
      outputPath,
      "--load",
      path.join(PROFILE_ROOT, "printer/bambu-a1-dev.ini"),
      "--load",
      path.join(PROFILE_ROOT, "filament/pla.ini"),
      "--load",
      path.join(PROFILE_ROOT, `print/${config.qualityId}.ini`),
      "--load",
      overridePath,
      "--center",
      `${centerX},${centerY}`,
    ];
    if (rotateX) {
      args.push("--rotate-x", String(rotateX));
    }
    if (rotateY) {
      args.push("--rotate-y", String(rotateY));
    }
    if (rotateZ) {
      args.push("--rotate", String(rotateZ));
    }
    args.push(inputPath);

    const slicer = await runSlicer(args, dir, SLICE_TIMEOUT_MS);
    const gcode = await readFile(outputPath, "utf8");
    const parsed = parseGcode(gcode);
    const checksum = await profileChecksum();
    const dims = job.analysis?.dimensionsMm ?? { x: 0, y: 0, z: 0 };

    await fetch(new URL(`/api/internal/slicer/jobs/${job.id}/result`, APP_BASE_URL), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        ok: true,
        logsSanitized: sanitizeLog(`${slicer.stdout}\n${slicer.stderr}`),
        flags: job.analysis?.flags ?? [],
        metrics: {
          dimensionsMm: dims,
          filamentLengthMm: parsed.filamentLengthMm,
          filamentWeightGrams: parsed.filamentWeightGrams,
          estimatedDurationSeconds: parsed.estimatedDurationSeconds,
          layerCount: parsed.layerCount,
          supportUsed: parsed.supportGenerated,
          supportGenerated: parsed.supportGenerated,
          supportMaterialMm: parsed.supportMaterialMm,
          supportMaterialGrams: parsed.supportMaterialGrams,
          supportLayerCount: parsed.supportLayerCount,
          gcodeParserVersion: parsed.gcodeParserVersion ?? GCODE_PARSER_VERSION,
          materialId: "pla",
          qualityId: config.qualityId,
          quantity: config.quantity,
          orientation: { rotateX, rotateY, rotateZ: rotateZ },
          engine: { name: "PrusaSlicer", version: parsed.engineVersion ?? `PrusaSlicer ${PRUSA_PINNED}` },
          profileChecksum: checksum,
          warnings: [],
        },
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen işçi hatası.";
    await fetch(new URL(`/api/internal/slicer/jobs/${job.id}/result`, APP_BASE_URL), {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        ok: false,
        errorCode: message.includes("zaman aşımı") ? "timeout" : "slicer_failure",
        errorMessage: message.slice(0, 400),
        logsSanitized: sanitizeLog(message),
      }),
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function isUuid(value) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim(),
    ) &&
    value.trim().toLowerCase() !== "null"
  );
}

async function tick() {
  if (!SECRET) {
    console.error("SLICER_WORKER_SECRET missing");
    return;
  }
  const claimUrl = new URL("/api/internal/slicer/claim", APP_BASE_URL);
  let response;
  try {
    response = await fetch(claimUrl, {
      method: "POST",
      headers: headers(),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    logTickFailure({
      path: claimUrl.pathname,
      phase: "network",
      ...describeFetchError(error),
    });
    return;
  }
  if (!response.ok) {
    let body = "";
    try {
      body = (await response.text()).slice(0, 240);
    } catch {
      body = "";
    }
    logTickFailure({
      path: claimUrl.pathname,
      phase: "http",
      status: response.status,
      body: sanitizeLog(body),
    });
    return;
  }
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    logTickFailure({
      path: claimUrl.pathname,
      phase: "json",
      status: response.status,
      ...describeFetchError(error),
    });
    return;
  }
  const job = payload?.job;
  if (!job || !isUuid(job.id) || !isUuid(job.fileId)) {
    return;
  }
  await processJob(job);
}

function startHealthServer() {
  const port = Number(process.env.PORT ?? 8788);
  const server = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          workerVersion: WORKER_VERSION,
          prusaSlicerPinned: PRUSA_PINNED,
          authenticated: Boolean(SECRET),
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });
  server.listen(port, "0.0.0.0");
  return server;
}

const server = startHealthServer();
let pollInterval = null;
if (!SECRET) {
  console.error("SLICER_WORKER_SECRET missing; polling disabled");
} else {
  console.log(`slicer-worker ${WORKER_VERSION} polling`);
  pollInterval = setInterval(() => {
    tick().catch((error) =>
      logTickFailure({
        path: "/api/internal/slicer/claim",
        phase: "unexpected",
        ...describeFetchError(error),
      }),
    );
  }, 2500);
  tick().catch(() => undefined);
}

function shutdown(signal) {
  console.log(`slicer-worker shutting down (${signal})`);
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
