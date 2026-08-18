import fs from "node:fs";
import path from "node:path";

export type ContactFrame = {
  file: string;
  caption: string;
  group?: string;
};

export function writeContactSheet({
  title,
  directory,
  frames,
  intro = "Kronolojik kaydırma kareleri. Video kaydı yoksa bu contact sheet inceleme artefaktıdır.",
}: {
  title: string;
  directory: string;
  frames: ContactFrame[];
  intro?: string;
}) {
  fs.mkdirSync(directory, { recursive: true });
  const grouped = new Map<string, ContactFrame[]>();
  let hasGroups = false;
  for (const frame of frames) {
    const key = frame.group ?? "";
    if (frame.group) {
      hasGroups = true;
    }
    const list = grouped.get(key) ?? [];
    list.push(frame);
    grouped.set(key, list);
  }

  const sections = hasGroups
    ? [...grouped.entries()]
        .map(([group, items]) => {
          const heading = group
            ? `<h2>${escapeHtml(group)}</h2>`
            : "";
          return `${heading}
    <ol class="frames">
      ${items.map(renderFrame).join("\n")}
    </ol>`;
        })
        .join("\n")
    : `<ol class="frames">
      ${frames.map(renderFrame).join("\n")}
    </ol>`;

  const html = `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin: 0; background: #070713; color: #f9f8f5; font-family: ui-sans-serif, system-ui, sans-serif; }
    h1 { font-size: 1.4rem; padding: 1.5rem 1.5rem 0.5rem; }
    h2 { font-size: 1.05rem; padding: 0 1.5rem; margin: 1.5rem 0 0.75rem; color: #30d5d2; }
    p { padding: 0 1.5rem 1.25rem; color: rgb(249 248 245 / .68); max-width: 70ch; }
    .frames { display: grid; gap: 18px; padding: 0 1.5rem 2rem; margin: 0; list-style: none; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    figure { margin: 0; background: #10101a; border: 1px solid rgb(249 248 245 / .12); border-radius: 16px; overflow: hidden; }
    .shot { max-height: 78vh; overflow: auto; background: #0b1020; }
    img { width: 100%; display: block; background: #0b1020; }
    figcaption { padding: .85rem 1rem; font-size: .85rem; color: #30d5d2; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(intro)}</p>
  ${sections}
</body>
</html>
`;
  fs.writeFileSync(path.join(directory, "index.html"), html);
}

function renderFrame(frame: ContactFrame) {
  return `<li>
      <figure>
        <div class="shot"><img src="./${escapeHtml(frame.file)}" alt="${escapeHtml(frame.caption)}" /></div>
        <figcaption>${escapeHtml(frame.caption)}</figcaption>
      </figure>
    </li>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
