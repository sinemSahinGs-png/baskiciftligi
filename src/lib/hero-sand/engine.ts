import { SAND_RESET_MS } from "@/lib/hero-sand/physics";

const SIM_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const SIM_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform vec2 uPointer;
uniform vec2 uDelta;
uniform float uForce;
uniform float uRadius;
uniform float uReset;
uniform float uSettle;

vec2 decode(vec2 packed) {
  return (packed - 0.5) * 0.46;
}

vec2 encode(vec2 value) {
  return clamp(value / 0.46 + 0.5, 0.0, 1.0);
}

void main() {
  vec4 state = texture(uState, vUv);
  vec2 disp = decode(state.xy);
  vec2 vel = decode(state.zw);
  float dist = distance(vUv, uPointer);
  float falloff = exp(-dist * dist / max(uRadius * uRadius, 0.0004));
  float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
  vel += uDelta * falloff * uForce * (0.85 + grain * 0.55);
  vel *= 0.9;
  disp += vel;
  disp += (vUv - vec2(0.5)) * length(disp) * 0.002 * uSettle;
  disp = mix(disp, vec2(0.0), uReset);
  vel = mix(vel, vec2(0.0), uReset);
  fragColor = vec4(encode(disp), encode(vel));
}`;

const DRAW_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uState;
uniform sampler2D uAlbedo;
uniform float uHasAlbedo;
uniform vec2 uRepeat;
uniform vec2 uTexel;
uniform vec2 uPointer;
uniform float uBrush;
uniform float uBrushRadius;
uniform vec4 uScreen;
uniform float uRadius;

vec2 decode(vec2 packed) {
  return (packed - 0.5) * 0.46;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float screenWindow(vec2 cssUv) {
  vec2 center = uScreen.xy + uScreen.zw * 0.5;
  vec2 halfSize = uScreen.zw * 0.5;
  float d = sdRoundBox(cssUv - center, halfSize, uRadius * min(uScreen.z, uScreen.w));
  return 1.0 - smoothstep(-0.004, 0.01, d);
}

void main() {
  vec2 cssUv = vec2(vUv.x, 1.0 - vUv.y);
  float aperture = screenWindow(cssUv);
  if (aperture > 0.82 || uHasAlbedo < 0.5) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 disp = decode(texture(uState, vUv).xy);
  float hC = length(disp);
  float hR = length(decode(texture(uState, vUv + vec2(uTexel.x, 0.0)).xy));
  float hL = length(decode(texture(uState, vUv - vec2(uTexel.x, 0.0)).xy));
  float hU = length(decode(texture(uState, vUv + vec2(0.0, uTexel.y)).xy));
  float hD = length(decode(texture(uState, vUv - vec2(0.0, uTexel.y)).xy));
  vec3 normal = normalize(vec3((hL - hR) * 26.0, (hD - hU) * 26.0, 1.0));
  float ndl = clamp(dot(normal, normalize(vec3(0.72, 0.48, 0.48))), 0.0, 1.0);

  vec2 warp = disp * 3.6;
  vec3 sand = texture(uAlbedo, vUv * uRepeat + warp).rgb;
  sand *= mix(0.78, 1.16, ndl);

  float piles = smoothstep(0.0008, 0.028, hC);
  float dist = distance(vUv, uPointer);
  float scrape = exp(-dist * dist / max(uBrushRadius * uBrushRadius * 1.15, 0.0003)) * smoothstep(0.01, 0.12, uBrush);
  float cover = mix(0.28, 1.0, piles);
  cover = mix(cover, 0.03, scrape);
  cover *= 1.0 - aperture;
  fragColor = vec4(sand * cover, cover);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader) ?? "compile";
    gl.deleteShader(shader);
    throw new Error(info);
  }
  return shader;
}

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const vert = compile(gl, gl.VERTEX_SHADER, vs);
  const frag = compile(gl, gl.FRAGMENT_SHADER, fs);
  const prog = gl.createProgram();
  if (!prog) throw new Error("program");
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog) ?? "link";
    gl.deleteProgram(prog);
    throw new Error(info);
  }
  return prog;
}

function makeTexture(
  gl: WebGL2RenderingContext,
  size: number,
  seed?: Uint8Array,
  filter: number = gl.NEAREST,
) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    size,
    size,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    seed ?? null,
  );
  return texture;
}

function makeFbo(gl: WebGL2RenderingContext, texture: WebGLTexture) {
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error("framebuffer");
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error("framebuffer incomplete");
  }
  return fbo;
}

export type SandDiagnostics = {
  mode: "webgl2" | "fallback";
  reason: "webgl" | "context_lost";
  grid: number;
  dpr: number;
  fps: number;
  frameMs: number;
  frames: number;
  webgl: string;
  contextLost: boolean;
  resetting: boolean;
  hasAlbedo: boolean;
  live: boolean;
  textureWidth: number;
  textureHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  cssWidth: number;
  cssHeight: number;
  sampled: string;
};

export function acquireWebGl2(canvas: HTMLCanvasElement) {
  const options: WebGLContextAttributes = {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "default",
    failIfMajorPerformanceCaveat: false,
  };
  return (
    canvas.getContext("webgl2", options) ??
    canvas.getContext("webgl2")
  );
}

export class OctoSandEngine {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private sim: WebGLProgram;
  private draw: WebGLProgram;
  private quad: WebGLBuffer;
  private texA: WebGLTexture;
  private texB: WebGLTexture;
  private albedo: WebGLTexture;
  private fboA: WebGLFramebuffer;
  private fboB: WebGLFramebuffer;
  private writeA = true;
  private hasAlbedo = 0;
  private textureWidth = 0;
  private textureHeight = 0;
  private sampled = "";
  private raf = 0;
  private grid: number;
  private dpr: number;
  private lost = false;
  private paused = false;
  private resetUntil = 0;
  private last = 0;
  private frames = 0;
  private fps = 0;
  private frameMs = 0;
  private pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, force: 0 };
  private brush = 0;
  private screen = { left: 0.308375, top: 0.142202, width: 0.377704, height: 0.682339, radius: 0.062 };
  private onLost = () => {
    this.lost = true;
    this.stop();
  };
  private onRestored = () => {
    this.lost = true;
  };

  constructor(canvas: HTMLCanvasElement, grid: number, dpr: number) {
    const gl = acquireWebGl2(canvas);
    if (!gl) throw new Error("webgl2");
    this.gl = gl;
    this.canvas = canvas;
    this.grid = grid;
    this.dpr = dpr;
    this.sim = program(gl, SIM_VS, SIM_FS);
    this.draw = program(gl, SIM_VS, DRAW_FS);
    const mid = new Uint8Array(grid * grid * 4).fill(128);
    this.texA = makeTexture(gl, grid, mid);
    this.texB = makeTexture(gl, grid);
    this.albedo = makeTexture(gl, 1, new Uint8Array([200, 154, 90, 255]), gl.LINEAR);
    this.fboA = makeFbo(gl, this.texA);
    this.fboB = makeFbo(gl, this.texB);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setAlbedo(image: TexImageSource) {
    if (this.lost) return;
    const { gl } = this;
    gl.bindTexture(gl.TEXTURE_2D, this.albedo);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    this.hasAlbedo = 1;
    if (image instanceof HTMLImageElement) {
      this.textureWidth = image.naturalWidth;
      this.textureHeight = image.naturalHeight;
    } else if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
      this.textureWidth = image.width;
      this.textureHeight = image.height;
    }
    this.sampled = "/images/hero/octo-sand-field.webp";
  }

  impulse(nx: number, ny: number, dx: number, dy: number, force: number) {
    this.pointer = { x: nx, y: ny, dx, dy, force };
  }

  setScreen(next: { left: number; top: number; width: number; height: number; radius: number }) {
    this.screen = next;
  }

  startReset() {
    if (this.resetUntil > performance.now()) return;
    this.resetUntil = performance.now() + SAND_RESET_MS;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (!paused && !this.raf && !this.lost) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.loop);
    }
  }

  resize(width: number, height: number, dpr: number) {
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
  }

  diagnostics(): SandDiagnostics {
    const css = this.canvas.getBoundingClientRect();
    return {
      mode: "webgl2",
      reason: this.lost ? "context_lost" : "webgl",
      grid: this.grid,
      dpr: this.dpr,
      fps: this.fps,
      frameMs: this.frameMs,
      frames: this.frames,
      webgl: "WebGL2",
      contextLost: this.lost,
      resetting: this.resetUntil > performance.now(),
      hasAlbedo: this.hasAlbedo === 1,
      live: !this.lost && this.hasAlbedo === 1 && this.frames > 0,
      textureWidth: this.textureWidth,
      textureHeight: this.textureHeight,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      cssWidth: Math.round(css.width),
      cssHeight: Math.round(css.height),
      sampled: this.sampled,
    };
  }

  destroy() {
    this.stop();
    const { gl } = this;
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    gl.deleteBuffer(this.quad);
    gl.deleteTexture(this.texA);
    gl.deleteTexture(this.texB);
    gl.deleteTexture(this.albedo);
    gl.deleteFramebuffer(this.fboA);
    gl.deleteFramebuffer(this.fboB);
    gl.deleteProgram(this.sim);
    gl.deleteProgram(this.draw);
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private loop(now: number) {
    if (this.lost || this.paused) {
      this.raf = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
    const dt = this.last ? Math.min(0.033, (now - this.last) / 1000) : 0.016;
    this.last = now;
    this.frames += 1;
    this.frameMs = dt * 1000;
    if (this.frames % 20 === 0) this.fps = this.frameMs > 0 ? Math.round(1000 / this.frameMs) : 0;
    this.step(now);
    this.brush = Math.max(this.pointer.force, this.brush * 0.82);
    this.pointer.force *= 0.42;
  }

  private bindQuad(prog: WebGLProgram) {
    const { gl } = this;
    const loc = gl.getAttribLocation(prog, "aPos");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  }

  private step(now: number) {
    const { gl } = this;
    const reset = this.resetUntil > now ? 0.045 : 0;
    const readTex = this.writeA ? this.texA : this.texB;
    const writeFbo = this.writeA ? this.fboB : this.fboA;
    gl.bindFramebuffer(gl.FRAMEBUFFER, writeFbo);
    gl.viewport(0, 0, this.grid, this.grid);
    gl.useProgram(this.sim);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, readTex);
    gl.uniform1i(gl.getUniformLocation(this.sim, "uState"), 0);
    gl.uniform2f(gl.getUniformLocation(this.sim, "uPointer"), this.pointer.x, 1 - this.pointer.y);
    gl.uniform2f(gl.getUniformLocation(this.sim, "uDelta"), this.pointer.dx, -this.pointer.dy);
    gl.uniform1f(gl.getUniformLocation(this.sim, "uForce"), this.pointer.force);
    gl.uniform1f(gl.getUniformLocation(this.sim, "uRadius"), this.grid <= 256 ? 0.09 : 0.055);
    gl.uniform1f(gl.getUniformLocation(this.sim, "uReset"), reset);
    gl.uniform1f(gl.getUniformLocation(this.sim, "uSettle"), 1);
    this.bindQuad(this.sim);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.draw);
    const writeTex = this.writeA ? this.texB : this.texA;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, writeTex);
    gl.uniform1i(gl.getUniformLocation(this.draw, "uState"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.albedo);
    gl.uniform1i(gl.getUniformLocation(this.draw, "uAlbedo"), 1);
    gl.uniform1f(gl.getUniformLocation(this.draw, "uHasAlbedo"), this.hasAlbedo);
    gl.uniform2f(gl.getUniformLocation(this.draw, "uPointer"), this.pointer.x, 1 - this.pointer.y);
    gl.uniform1f(gl.getUniformLocation(this.draw, "uBrush"), this.brush);
    gl.uniform1f(
      gl.getUniformLocation(this.draw, "uBrushRadius"),
      this.grid <= 256 ? 0.09 : 0.055,
    );
    const tile = Math.max(1, 580 * this.dpr);
    gl.uniform2f(
      gl.getUniformLocation(this.draw, "uRepeat"),
      this.canvas.width / tile,
      this.canvas.height / tile,
    );
    gl.uniform2f(gl.getUniformLocation(this.draw, "uTexel"), 1 / this.grid, 1 / this.grid);
    gl.uniform4f(
      gl.getUniformLocation(this.draw, "uScreen"),
      this.screen.left,
      this.screen.top,
      this.screen.width,
      this.screen.height,
    );
    gl.uniform1f(gl.getUniformLocation(this.draw, "uRadius"), this.screen.radius);
    this.bindQuad(this.draw);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    this.writeA = !this.writeA;
  }
}
