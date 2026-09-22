/// <reference lib="webworker" />

export type StlParseRequest = { id: string; buffer: ArrayBuffer };
export type StlParseResponse =
  | { id: string; ok: true; positions: Float32Array }
  | { id: string; ok: false; error: "corrupt" | "unsupported" };

function parseAsciiStl(text: string) {
  const positions: number[] = [];
  const vertex = /vertex\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s+([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = vertex.exec(text))) {
    positions.push(Number(match[1]), Number(match[2]), Number(match[3]));
  }
  if (positions.length < 9 || positions.length % 9 !== 0) {
    throw new Error("corrupt");
  }
  return new Float32Array(positions);
}

function parseBinaryStl(buffer: ArrayBuffer) {
  if (buffer.byteLength < 84) throw new Error("corrupt");
  const view = new DataView(buffer);
  const triangles = view.getUint32(80, true);
  const expected = 84 + triangles * 50;
  if (expected > buffer.byteLength || triangles <= 0) throw new Error("corrupt");
  const positions = new Float32Array(triangles * 9);
  let offset = 84;
  let cursor = 0;
  for (let index = 0; index < triangles; index += 1) {
    offset += 12;
    for (let vertex = 0; vertex < 3; vertex += 1) {
      positions[cursor++] = view.getFloat32(offset, true);
      positions[cursor++] = view.getFloat32(offset + 4, true);
      positions[cursor++] = view.getFloat32(offset + 8, true);
      offset += 12;
    }
    offset += 2;
  }
  return positions;
}

function parseStl(buffer: ArrayBuffer) {
  const prefix = new TextDecoder().decode(buffer.slice(0, 80)).trim().toLowerCase();
  if (prefix.startsWith("solid") && !prefix.includes("\0")) {
    try {
      return parseAsciiStl(new TextDecoder().decode(buffer));
    } catch {
      return parseBinaryStl(buffer);
    }
  }
  return parseBinaryStl(buffer);
}

self.onmessage = (event: MessageEvent<StlParseRequest>) => {
  try {
    const positions = parseStl(event.data.buffer);
    const response: StlParseResponse = { id: event.data.id, ok: true, positions };
    self.postMessage(response, [positions.buffer]);
  } catch {
    const response: StlParseResponse = { id: event.data.id, ok: false, error: "corrupt" };
    self.postMessage(response);
  }
};
