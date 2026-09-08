import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const roots = [
  "public/videos",
  "public/demo/hero",
];
const outDir = path.join("test-results", "hero-video-inventory");
mkdirSync(outDir, { recursive: true });

function walk(dir, acc = []) {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return acc;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.(mp4|webm|mov)$/i.test(name)) acc.push(full);
  }
  return acc;
}

const files = roots.flatMap((dir) => walk(dir));
const rows = [];

for (const file of files) {
  const stat = statSync(file);
  const buf = readFileSync(file);
  const sha = createHash("sha256").update(buf).digest("hex");
  let probe = {};
  try {
    probe = JSON.parse(
      execFileSync(
        "ffprobe",
        ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,duration,codec_name,bit_rate,nb_frames,avg_frame_rate", "-of", "json", file],
        { encoding: "utf8" },
      ),
    ).streams?.[0] ?? {};
  } catch {
    probe = { error: "ffprobe failed" };
  }
  const duration = Number(probe.duration ?? 0);
  const stamps = [0.12, Math.max(0.2, duration / 2), Math.max(0.3, duration - 0.15)];
  const slug = file.replace(/[\\/]/g, "__").replace(/[^a-zA-Z0-9._-]+/g, "-");
  stamps.forEach((time, index) => {
    const label = ["first", "middle", "last"][index];
    const dest = path.join(outDir, `${slug}-${label}.png`);
    try {
      execFileSync(
        "ffmpeg",
        ["-y", "-ss", String(time), "-i", file, "-frames:v", "1", "-update", "1", dest],
        { stdio: "ignore" },
      );
    } catch {
      /* ignore */
    }
  });
  rows.push({
    filename: path.basename(file),
    path: file.replaceAll("\\", "/"),
    modified: stat.mtime.toISOString(),
    bytes: stat.size,
    sha256: sha,
    width: probe.width ?? null,
    height: probe.height ?? null,
    duration: probe.duration ?? null,
    codec: probe.codec_name ?? null,
    bitrate: probe.bit_rate ?? null,
    frames: probe.nb_frames ?? null,
    fps: probe.avg_frame_rate ?? null,
  });
}

writeFileSync(path.join(outDir, "inventory.json"), JSON.stringify(rows, null, 2));
const html = `<!doctype html><meta charset="utf-8"><title>Hero video inventory</title>
<style>body{font:14px/1.4 sans-serif;background:#111;color:#eee;padding:24px} .row{display:grid;grid-template-columns:220px 1fr 1fr 1fr;gap:12px;margin:24px 0;align-items:start} img{width:100%;background:#000} code{color:#ffb070}</style>
<h1>Hero video candidates</h1>
<p>Currently served: <code>/videos/home-industrial/hero-mobile.mp4</code> and <code>/videos/home-industrial/hero-desktop.mp4</code>.</p>
${rows.map((row) => {
  const slug = row.path.replace(/[\\/]/g, "__").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `<section class="row">
    <div><strong>${row.filename}</strong><br>${row.path}<br>${row.width}×${row.height}<br>${row.duration}s ${row.codec}<br>${(row.bytes/1024).toFixed(0)} KB<br>${row.modified}<br><code>${row.sha256.slice(0,16)}</code></div>
    <div><img src="${slug}-first.png" alt="first"><p>first</p></div>
    <div><img src="${slug}-middle.png" alt="middle"><p>middle</p></div>
    <div><img src="${slug}-last.png" alt="last"><p>last</p></div>
  </section>`;
}).join("")}`;
writeFileSync(path.join(outDir, "contact-sheet.html"), html);
console.log(JSON.stringify(rows, null, 2));
