import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const UNIQUE_PREFIX = "fresh-cube-pw";

function manufacturingObjectsRoot() {
  return path.resolve(process.cwd(), ".octo-data", "manufacturing", "objects");
}

function deleteLocalObject(storageKey: string | undefined) {
  if (!storageKey) {
    return;
  }
  const root = manufacturingObjectsRoot();
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(root + path.sep)) {
    return;
  }
  rmSync(path.dirname(resolved), { recursive: true, force: true });
}

export function writeUniqueBoxStl(tag: string, sizeMm = { x: 20, y: 20, z: 20.37 }) {
  const name = `fresh-cube-${tag}`;
  const { x, y, z } = sizeMm;
  const faces: Array<[number, number, number][]> = [
    [[0, 0, 0], [x, 0, 0], [x, y, 0]],
    [[0, 0, 0], [x, y, 0], [0, y, 0]],
    [[0, 0, z], [x, y, z], [x, 0, z]],
    [[0, 0, z], [0, y, z], [x, y, z]],
    [[0, 0, 0], [0, 0, z], [x, 0, z]],
    [[0, 0, 0], [x, 0, z], [x, 0, 0]],
    [[0, y, 0], [x, y, 0], [x, y, z]],
    [[0, y, 0], [x, y, z], [0, y, z]],
    [[0, 0, 0], [0, y, 0], [0, y, z]],
    [[0, 0, 0], [0, y, z], [0, 0, z]],
    [[x, 0, 0], [x, 0, z], [x, y, z]],
    [[x, 0, 0], [x, y, z], [x, y, 0]],
  ];
  const body = faces
    .map(
      (triangle) => `  facet normal 0 0 0
    outer loop
      vertex ${triangle[0].join(" ")}
      vertex ${triangle[1].join(" ")}
      vertex ${triangle[2].join(" ")}
    endloop
  endfacet`,
    )
    .join("\n");
  const contents = `solid ${name}\n${body}\nendsolid ${name}\n`;
  const filePath = path.join(os.tmpdir(), `${name}.stl`);
  writeFileSync(filePath, contents, "utf8");
  return {
    filePath,
    checksumSha256: createHash("sha256").update(contents).digest("hex"),
    sizeMm,
  };
}

export function writeUniqueOverhangStl(tag: string) {
  const source = path.join(process.cwd(), "fixtures", "meshes", "t-overhang.stl");
  const bytes = Buffer.from(readFileSync(source));
  bytes.write(`t-overhang-${tag}`.slice(0, 80), 0, 80, "ascii");
  const filePath = path.join(os.tmpdir(), `fresh-overhang-${tag}.stl`);
  writeFileSync(filePath, bytes);
  return {
    filePath,
    checksumSha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export function cleanupManufacturingRecords(jobId: string) {
  const storePath = path.join(process.cwd(), ".octo-data", "manufacturing", "store.json");
  const store = JSON.parse(readFileSync(storePath, "utf8")) as {
    files: Array<{ id: string; storageKey?: string; originalFilename?: string }>;
    jobs: Array<{ id: string; fileId: string; quoteId: string | null }>;
    quotes: Array<{ id: string; jobId: string }>;
    events: Array<{ jobId: string }>;
  };
  const fileIds = new Set<string>();
  const jobIds = new Set<string>();
  if (jobId) {
    jobIds.add(jobId);
  }
  const namedJob = store.jobs.find((item) => item.id === jobId);
  if (namedJob) {
    fileIds.add(namedJob.fileId);
  }
  for (const file of store.files) {
    if (
      file.originalFilename?.startsWith(UNIQUE_PREFIX) ||
      file.originalFilename?.startsWith("fresh-overhang-")
    ) {
      fileIds.add(file.id);
    }
  }
  for (const job of store.jobs) {
    if (jobIds.has(job.id) || fileIds.has(job.fileId)) {
      jobIds.add(job.id);
      fileIds.add(job.fileId);
    }
  }
  const storageKeys = store.files
    .filter((file) => fileIds.has(file.id))
    .map((file) => file.storageKey);
  store.jobs = store.jobs.filter((item) => !jobIds.has(item.id));
  store.quotes = store.quotes.filter((item) => !jobIds.has(item.jobId));
  store.events = store.events.filter((item) => !jobIds.has(item.jobId));
  store.files = store.files.filter((item) => !fileIds.has(item.id));
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  for (const key of storageKeys) {
    deleteLocalObject(key);
  }
}
