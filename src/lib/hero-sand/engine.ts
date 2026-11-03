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
  vel += uDelta * falloff * uForce;
  vel *= 0.9;
  disp += vel;
  disp *= mix(1.0, 0.994, uSettle);
  disp = mix(disp, vec2(0.0), uReset);
  vel = mix(vel, vec2(0.0), uReset);
  fragColor = vec4(encode(disp), encode(vel));
}`;

const DRAW_VS = `#version 300 es
in vec2 aUv;
uniform sampler2D uState;
uniform vec2 uResolution;
uniform float uPoint;
out float vSeed;
out float vCover;

vec2 decode(vec2 packed) {
  return (packed - 0.5) * 0.28;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float octoAperture(vec2 uv) {
  vec2 centered = (uv - vec2(0.5, 0.46)) * vec2(1.0, uResolution.x / max(uResolution.y, 1.0));
  float ring = abs(sdCircle(centered, 0.16)) - 0.018;
  vec2 q = centered - vec2(0.09, 0.05);
  float curve = abs(q.y - 0.55 * q.x * q.x) - 0.03;
  float window = min(ring, curve);
  float copyWell = sdCircle((uv - vec2(0.5, 0.34)) * vec2(1.35, 1.0), 0.22);
  return 1.0 - smoothstep(0.0, 0.08, min(window, copyWell));
}

void main() {
  vec4 state = texture(uState, aUv);
  vec2 disp = decode(state.xy);
  vec2 pos = aUv * 2.0 - 1.0;
  pos += disp * 2.0;
  pos.y *= -1.0;
  float seed = hash(aUv);
  float aperture = octoAperture(aUv);
  vCover = mix(1.0, 0.18, aperture);
  vCover *= step(aperture * 0.72, seed);
  vSeed = seed;
  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = mix(1.2, uPoint, 0.45 + seed * 0.7) * (0.35 + vCover);
}`;

const DRAW_FS = `#version 300 es
precision highp float;
in float vSeed;
in float vCover;
out vec4 fragColor;

void main() {
  if (vCover < 0.04) discard;
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  p.y *= 1.12 + vSeed * 0.22;
  float d = length(p);
  float r = 0.52 + vSeed * 0.38;
  if (d > r) discard;
  float alpha = smoothstep(r, r - 0.42, d) * (0.78 + vSeed * 0.2) * vCover;
  vec3 dark = vec3(0.031, 0.024, 0.018);
  vec3 brown = vec3(0.145, 0.086, 0.048);
  vec3 bronze = vec3(0.58, 0.4, 0.24);
  vec3 champ = vec3(0.82, 0.7, 0.5);
  vec3 color = mix(dark, brown, vSeed);
  color = mix(color, bronze, step(0.91, vSeed) * 0.42);
  color = mix(color, champ, step(0.978, vSeed) * 0.28);
  fragColor = vec4(color, alpha);
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

function makeTexture(gl: WebGL2RenderingContext, size: number, seed?: Uint8Array) {
  const texture = gl.createTexture();
  if (!texture) throw new Error("texture");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
  private particles: WebGLBuffer;
  private texA: WebGLTexture;
  private texB: WebGLTexture;
  private fboA: WebGLFramebuffer;
  private fboB: WebGLFramebuffer;
  private writeA = true;
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
    this.draw = program(gl, DRAW_VS, DRAW_FS);
    const mid = new Uint8Array(grid * grid * 4).fill(128);
    this.texA = makeTexture(gl, grid, mid);
    this.texB = makeTexture(gl, grid);
    this.fboA = makeFbo(gl, this.texA);
    this.fboB = makeFbo(gl, this.texB);
    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const uvs = new Float32Array(grid * grid * 2);
    let i = 0;
    for (let y = 0; y < grid; y += 1) {
      for (let x = 0; x < grid; x += 1) {
        uvs[i++] = (x + 0.5) / grid;
        uvs[i++] = (y + 0.5) / grid;
      }
    }
    this.particles = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particles);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  impulse(nx: number, ny: number, dx: number, dy: number, force: number) {
    this.pointer = { x: nx, y: ny, dx, dy, force };
  }

  startReset() {
    if (this.resetUntil > performance.now()) return;
    this.resetUntil = performance.now() + 1600;
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
    gl.deleteBuffer(this.particles);
    gl.deleteTexture(this.texA);
    gl.deleteTexture(this.texB);
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
    if (this.lost) return;
    this.raf = requestAnimationFrame(this.loop);
    if (this.paused) return;
    const dt = this.last ? Math.min(0.033, (now - this.last) / 1000) : 0.016;
    this.last = now;
    this.frames += 1;
    this.frameMs = dt * 1000;
    if (this.frames % 20 === 0) this.fps = this.frameMs > 0 ? Math.round(1000 / this.frameMs) : 0;
    this.step(now);
    this.pointer.force *= 0.35;
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
    const loc = gl.getAttribLocation(this.sim, "aPos");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.draw);
    const writeTex = this.writeA ? this.texB : this.texA;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, writeTex);
    gl.uniform1i(gl.getUniformLocation(this.draw, "uState"), 0);
    gl.uniform2f(
      gl.getUniformLocation(this.draw, "uResolution"),
      this.canvas.width,
      this.canvas.height,
    );
    gl.uniform1f(gl.getUniformLocation(this.draw, "uPoint"), this.dpr * (this.grid <= 256 ? 2.4 : 2.8));
    const uvLoc = gl.getAttribLocation(this.draw, "aUv");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.particles);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, this.grid * this.grid);
    gl.disable(gl.BLEND);
    this.writeA = !this.writeA;
  }
}
