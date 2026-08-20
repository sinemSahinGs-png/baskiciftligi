import fs from "node:fs";

const path = "src/providers/thingiverse/client.ts";
let source = fs.readFileSync(path, "utf8");

if (!source.includes('from "@/providers/thingiverse/normalize-list"')) {
  source = source.replace(
    'from "@/providers/thingiverse/types";\n',
    'from "@/providers/thingiverse/types";\nimport { normalizeThingList as normalizeThingListShape } from "@/providers/thingiverse/normalize-list";\n',
  );
}

const inline = `export function normalizeThingList(payload: unknown): ThingiverseThing[] {
  if (Array.isArray(payload)) {
    return payload as ThingiverseThing[];
  }
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    for (const key of ["hits", "things", "objects", "results", "docs"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value as ThingiverseThing[];
      }
    }
  }
  throw new ThingiverseApiError(502, "Thingiverse liste biçimi beklenmeyen.");
}`;

const wrapper = `export function normalizeThingList(payload: unknown): ThingiverseThing[] {
  try {
    return normalizeThingListShape(payload);
  } catch (error) {
    throw new ThingiverseApiError(
      502,
      error instanceof Error ? error.message : "Thingiverse liste biçimi beklenmeyen.",
    );
  }
}`;

if (source.includes(inline)) {
  source = source.replace(inline, wrapper);
  fs.writeFileSync(path, source);
  console.log("client.ts normalize refactored");
} else if (source.includes("normalizeThingListShape")) {
  console.log("client.ts already refactored");
} else {
  console.log("inline block not found; no change");
}
