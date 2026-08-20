import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
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
const MAX_GCODE_BYTES = Number(process.env.SLICER_MAX_GCODE_BYTES ?? 64 * 1024 * 1024);
const MAX_CONCURRENT = Math.max(1, Number(process.env.SLICER_MAX_CONCURRENT ?? 1));
const ALLOWED_QUALITY = new Set(["ekonomik", "standart", "detayli"]);
const ALLOWED_INFILL = new Set([10, 15, 20, 30, 50, 100]);
const ALLOWED_SUPPORTS = new Set(["auto", "on", "off"]);

let shuttingDown = false;
let activeJobs = 0;
let currentJobId = null;
let lastPollAt = null;
let lastError = null;
let cachedProfileChecksum = null;

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
  if (cachedProfileChecksum) {
    return cachedProfileChecksum;
  }
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
  cachedProfileChecksum = hash.digest("hex");
  return cachedProfileChecksum;
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

async function submitResult(jobId, body) {
  const response = await fetch(
    new URL(`/api/internal/slicer/jobs/${jobId}/result`, APP_BASE_URL),
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    },
  );
  if (!response.ok) {
    throw new Error(`Sonuç gönderilemedi (${response.status}).`);
  }
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

    const support = config.supports === "off" ? "0" : "1";
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

    const rotateX = job.analysis?.flags?.includes("does_not_fit") ? 90 : 0;
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
      "128,128",
    ];
    if (rotateX) {
      args.push("--rotate-x", String(rotateX));
    }
    args.push(inputPath);

    const slicer = await runSlicer(args, dir, SLICE_TIMEOUT_MS);
    const gcodeStats = await stat(outputPath);
    if (gcodeStats.size > MAX_GCODE_BYTES) {
      throw new Error("G-code çıktısı boyut sınırını aştı.");
    }
    const gcode = await readFile(outputPath, "utf8");
    const parsed = parseGcode(gcode);
    const checksum = await profileChecksum();
    const dims = job.analysis?.dimensionsMm ?? { x: 0, y: 0, z: 0 };

    await submitResult(job.id, {
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
        orientation: { rotateX, rotateY: 0, rotateZ: 0 },
        engine: {
          name: "PrusaSlicer",
          version: parsed.engineVersion ?? `PrusaSlicer ${PRUSA_PINNED}`,
        },
        profileChecksum: checksum,
        warnings: [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bilinmeyen işçi hatası.";
    lastError = message.slice(0, 200);
    await submitResult(job.id, {
      ok: false,
      errorCode: message.includes("zaman aşımı") ? "timeout" : "slicer_failure",
      errorMessage: message.slice(0, 400),
      logsSanitized: sanitizeLog(message),
    }).catch(() => undefined);
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
  if (!SECRET || shuttingDown) {
    return;
  }
  if (activeJobs >= MAX_CONCURRENT) {
    return;
  }
  lastPollAt = new Date().toISOString();
  const response = await fetch(new URL("/api/internal/slicer/claim", APP_BASE_URL), {
    method: "POST",
    headers: headers(),
  });
  if (!response.ok) {
    lastError = `claim ${response.status}`;
    return;
  }
  const payload = await response.json();
  const job = payload?.job;
  if (!job || !isUuid(job.id) || !isUuid(job.fileId)) {
    return;
  }
  activeJobs += 1;
  currentJobId = job.id;
  try {
    await processJob(job);
  } finally {
    activeJobs -= 1;
    if (currentJobId === job.id) {
      currentJobId = null;
    }
  }
}

function startHealthServer() {
  const port = Number(process.env.PORT ?? 8788);
  const startedAt = Date.now();
  const server = createServer(async (req, res) => {
    if (req.url === "/health") {
      const checksum = await profileChecksum().catch(() => null);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ok: !shuttingDown && Boolean(SECRET),
          workerVersion: WORKER_VERSION,
          prusaSlicerPinned: PRUSA_PINNED,
          authenticated: Boolean(SECRET),
          processing: activeJobs > 0,
          currentJobId,
          concurrency: MAX_CONCURRENT,
          activeJobs,
          profileChecksum: checksum,
          lastPollAt,
          lastError: lastError ? sanitizeLog(lastError) : null,
          uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
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
  console.log(`slicer-worker ${WORKER_VERSION} polling (concurrency ${MAX_CONCURRENT})`);
  pollInterval = setInterval(() => {
    tick().catch((error) => {
      lastError = error instanceof Error ? error.message : String(error);
      console.error("tick failed", lastError);
    });
  }, 2500);
  tick().catch(() => undefined);
}

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log(`slicer-worker shutting down (${signal})`);
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  const drainDeadline = Date.now() + SLICE_TIMEOUT_MS + 15_000;
  while (activeJobs > 0 && Date.now() < drainDeadline) {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  server.close(() => process.exit(activeJobs > 0 ? 1 : 0));
  setTimeout(() => process.exit(activeJobs > 0 ? 1 : 0), 5000).unref();
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
