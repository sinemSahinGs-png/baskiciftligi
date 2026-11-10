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
  return (packed - 0.5) * 0.28;
}

vec2 encode(vec2 value) {
  return clamp(value / 0.28 + 0.5, 0.0, 1.0);
}

void main() {
  vec4 state = texture(uState, vUv);
  vec2 disp = decode(state.xy);
  vec2 vel = decode(state.zw);
  float dist = distance(vUv, uPointer);
  float falloff = exp(-dist * dist / max(uRadius * uRadius, 0.0004));
  float grain = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
  vel += uDelta * falloff * uForce * (0.8 + grain * 0.4);
  vel *= 0.88;
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
uniform vec2 uResolution;
uniform vec2 uTexel;
uniform vec4 uScreen;
uniform float uRadius;

vec2 decode(vec2 packed) {
  return (packed - 0.5) * 0.28;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  v += noise(p) * 0.52;
  v += noise(p * 2.13) * 0.26;
  v += noise(p * 4.27) * 0.14;
  v += noise(p * 8.71) * 0.08;
  return v;
}

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float screenWindow(vec2 cssUv) {
  vec2 center = uScreen.xy + uScreen.zw * 0.5;
  vec2 halfSize = uScreen.zw * 0.5;
  float d = sdRoundBox(cssUv - center, halfSize, uRadius * min(uScreen.z, uScreen.w));
  return 1.0 - smoothstep(-0.008, 0.016, d);
}

vec3 mineralSand(vec2 uv, float aspect) {
  vec2 p = uv * vec2(aspect, 1.0);
  float n = fbm(p * 38.0);
  float dune = fbm(p * 7.5 + 4.2);
  float fine = noise(p * 190.0);
  float silica = pow(noise(p * 430.0 + dune), 11.0);
  float mica = pow(noise(p * 780.0), 16.0);
  vec3 umber = vec3(0.48, 0.29, 0.15);
  vec3 ochre = vec3(0.76, 0.55, 0.31);
  vec3 honey = vec3(0.91, 0.74, 0.47);
  vec3 sun = vec3(0.97, 0.88, 0.68);
  vec3 color = mix(umber, ochre, smoothstep(0.18, 0.62, n));
  color = mix(color, honey, smoothstep(0.48, 0.86, dune) * 0.72);
  color = mix(color, sun, silica * 0.38 + mica * 0.22);
  color *= 0.9 + fine * 0.18;
  return color;
}

void main() {
  vec2 cssUv = vec2(vUv.x, 1.0 - vUv.y);
  float aperture = screenWindow(cssUv);
  if (aperture > 0.985) {
    fragColor = vec4(0.0);
    return;
  }

  vec2 disp = decode(texture(uState, vUv).xy);
  float hC = length(disp);
  float hR = length(decode(texture(uState, vUv + vec2(uTexel.x, 0.0)).xy));
  float hL = length(decode(texture(uState, vUv - vec2(uTexel.x, 0.0)).xy));
  float hU = length(decode(texture(uState, vUv + vec2(0.0, uTexel.y)).xy));
  float hD = length(decode(texture(uState, vUv - vec2(0.0, uTexel.y)).xy));
  vec3 normal = normalize(vec3((hL - hR) * 22.0, (hD - hU) * 22.0, 1.0));
  vec3 light = normalize(vec3(0.68, 0.52, 0.52));
  float ndl = clamp(dot(normal, light), 0.0, 1.0);

  vec2 warp = disp * 1.45;
  vec2 sampleUv = clamp(vUv + warp, 0.0, 1.0);
  vec3 photo = texture(uAlbedo, sampleUv).rgb;
  vec3 rest = texture(uAlbedo, vUv).rgb;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec3 procedural = mineralSand(cssUv + vec2(warp.x, -warp.y) * 0.35, aspect);
  vec3 sand = mix(rest, photo, smoothstep(0.0, 0.02, hC));
  sand = mix(procedural, sand, uHasAlbedo);

  float lit = mix(0.78, 1.16, ndl);
  sand *= lit;
  sand += vec3(0.98, 0.86, 0.58) * pow(ndl, 7.0) * hC * 1.8;
  sand -= vec3(0.22, 0.14, 0.07) * (1.0 - ndl) * hC * 1.55;

  float cover = mix(0.0, 0.94, smoothstep(0.001, 0.026, hC));
  cover = max(cover, (1.0 - uHasAlbedo) * 0.08);
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
  grid: number;
  dpr: number;
  fps: number;
  frameMs: number;
  webgl: string;
  contextLost: boolean;
  resetting: boolean;
};

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
  private screen = { left: 0.308375, top: 0.142202, width: 0.377704, height: 0.682339, radius: 0.062 };
  private onLost = () => {
    this.lost = true;
    this.stop();
  };
  private onRestored = () => {
    this.lost = true;
  };

  constructor(canvas: HTMLCanvasElement, grid: number, dpr: number) {
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    this.hasAlbedo = 1;
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
    return {
      mode: "webgl2",
      grid: this.grid,
      dpr: this.dpr,
      fps: this.fps,
      frameMs: this.frameMs,
      webgl: "WebGL2",
      contextLost: this.lost,
      resetting: this.resetUntil > performance.now(),
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
    const lose = gl.getExtension("WEBGL_lose_context");
    lose?.loseContext();
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
    this.pointer.force *= 0.35;
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
    gl.uniform1f(gl.getUniformLocation(this.sim, "uRadius"), this.grid <= 256 ? 0.07 : 0.055);
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
    gl.uniform2f(
      gl.getUniformLocation(this.draw, "uResolution"),
      this.canvas.width,
      this.canvas.height,
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
