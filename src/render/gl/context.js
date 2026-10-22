// The WebGL layer: one canvas, one shader for flat-shaded low-poly meshes (three hard light bands, see MESH_VS), and an optional two-pass
// tilt-shift blur that makes the world look like a miniature. It owns the only GL state; everything else asks it to make, draw and
// free meshes.
//
// A mesh is { bp, bn, bc, count, pts }: GPU buffers for positions, normals and colours, the vertex count, and the raw positions
// (kept so a mesh can be redrawn elsewhere, e.g. rendered to an icon in icons.js).

import { clamp, norm3 } from '../../core/math.js';

// The look: flat colour, no gradients. Every face lands in one of three hard light bands (shade, side, top) chosen by how it faces the
// sun. Shade leans cool and violet, light leans warm, so a plain box reads as three clean tones. The sun is placed so the two walls the
// camera sees fall in different bands (left wall mid, right wall shade, roofs and ground light).
const MESH_VS = `attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;
uniform mat4 uVP;uniform mat4 uM;uniform vec3 uSun;uniform vec4 uTint;uniform vec2 uFogR;
varying vec3 vC;varying float vF;
void main(){vec4 w=uM*vec4(aP,1.);gl_Position=uVP*w;vec3 n=normalize((uM*vec4(aN,0.)).xyz);
float d=dot(n,uSun);
vec3 l=mix(vec3(.60,.63,.82),vec3(.88,.90,.96),step(.34,d));
l=mix(l,vec3(1.07,1.03,.92),step(.64,d));
vec3 c=mix(aC,uTint.rgb,uTint.a);
vC=c*l;
vF=smoothstep(uFogR.x,uFogR.y,gl_Position.w);}`;
const MESH_FS = `precision mediump float;uniform vec3 uFog;uniform float uA;varying vec3 vC;varying float vF;
void main(){gl_FragColor=vec4(mix(vC,uFog,vF),uA);}`;

const POST_VS = 'attribute vec2 aQ;varying vec2 vUv;void main(){vUv=aQ*.5+.5;gl_Position=vec4(aQ,0.,1.);}';
const POST_FS = `precision mediump float;uniform sampler2D uTex;uniform vec2 uDir;uniform vec2 uTexel;uniform float uFocus,uBand,uMax,uSat,uCon;varying vec2 vUv;
void main(){float d=abs(vUv.y-uFocus);float r=uMax*smoothstep(uBand,uBand+.34,d);vec4 acc=vec4(0.);float ws=0.;
 for(int i=-4;i<=4;i++){float fi=float(i);float w=exp(-fi*fi*.125);vec4 s=texture2D(uTex,vUv+uDir*uTexel*fi*r*.25);acc+=vec4(s.rgb*s.a,s.a)*w;ws+=w;}
 float a=acc.a/ws;vec3 c=acc.rgb/max(acc.a,.0001);float l=dot(c,vec3(.3,.59,.11));c=mix(vec3(l),c,uSat);c=(c-.5)*uCon+.5;gl_FragColor=vec4(c,a);}`;

const SUN = norm3([-.45, .85, .28]);
const FOG_COLOR = [.86, .91, .88];

let canvas = null, gl = null, mesh = null, post = null;
let lastMesh = null;
const target = { w: 0, h: 0, scale: 1, scene: null, blur: null };   // offscreen framebuffers for the blur
const model = new Float32Array(16);

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function link(vs, fs, attributes = []) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vs));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fs));
  attributes.forEach((name, i) => gl.bindAttribLocation(program, i, name));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

function uniforms(program, names) {
  const out = {};
  for (const n of names) out[n] = gl.getUniformLocation(program, n);
  return out;
}

/** Set up WebGL on `canvasEl`. Throws if the browser cannot do it. */
export function initGL(canvasEl) {
  canvas = canvasEl;
  gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
  if (!gl) throw new Error('WebGL is not available');

  const program = link(MESH_VS, MESH_FS);
  mesh = {
    program, u: uniforms(program, ['uVP', 'uM', 'uSun', 'uTint', 'uFogR', 'uFog', 'uA']),
    aP: gl.getAttribLocation(program, 'aP'), aN: gl.getAttribLocation(program, 'aN'), aC: gl.getAttribLocation(program, 'aC'),
  };
  gl.useProgram(program);
  enableMeshAttributes();
  gl.enable(gl.DEPTH_TEST);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.uniform3f(mesh.u.uSun, SUN[0], SUN[1], SUN[2]);
  gl.uniform3f(mesh.u.uFog, FOG_COLOR[0], FOG_COLOR[1], FOG_COLOR[2]);

  const program2 = link(POST_VS, POST_FS, ['aQ']);
  post = { program: program2, u: uniforms(program2, ['uTex', 'uDir', 'uTexel', 'uFocus', 'uBand', 'uMax', 'uSat', 'uCon']), buffer: gl.createBuffer() };
  gl.bindBuffer(gl.ARRAY_BUFFER, post.buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  return gl;
}

function enableMeshAttributes() {
  gl.enableVertexAttribArray(mesh.aP); gl.enableVertexAttribArray(mesh.aN); gl.enableVertexAttribArray(mesh.aC);
}

export const getGL = () => gl;
export const getCanvas = () => canvas;

// ---- meshes ----

/** Upload a MeshBuilder's triangles. */
export function makeMesh(builder) {
  const upload = (data) => {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return buffer;
  };
  return { bp: upload(builder.p), bn: upload(builder.n), bc: upload(builder.c), count: builder.p.length / 3, pts: builder.p };
}

export function freeMesh(m) {
  if (!m) return;
  gl.deleteBuffer(m.bp); gl.deleteBuffer(m.bn); gl.deleteBuffer(m.bc);
  if (lastMesh === m) lastMesh = null;
}

/** Draw a mesh at (x, y, z), turned `rot` radians about the up axis, scaled (sx, sy, sz). `tint` blends the colours toward a colour. */
export function drawMesh(m, x, y, z, rot = 0, sx = 1, sy = sx, sz = sx, tint = null, tintAmount = 0, alpha = 1) {
  const c = Math.cos(rot), s = Math.sin(rot);
  model[0] = c * sx; model[1] = 0; model[2] = -s * sx; model[3] = 0;
  model[4] = 0; model[5] = sy; model[6] = 0; model[7] = 0;
  model[8] = s * sz; model[9] = 0; model[10] = c * sz; model[11] = 0;
  model[12] = x; model[13] = y; model[14] = z; model[15] = 1;
  gl.uniformMatrix4fv(mesh.u.uM, false, model);
  if (tint) gl.uniform4f(mesh.u.uTint, tint[0], tint[1], tint[2], tintAmount); else gl.uniform4f(mesh.u.uTint, 0, 0, 0, 0);
  gl.uniform1f(mesh.u.uA, alpha);
  if (lastMesh !== m) {
    lastMesh = m;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.bp); gl.vertexAttribPointer(mesh.aP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.bn); gl.vertexAttribPointer(mesh.aN, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.bc); gl.vertexAttribPointer(mesh.aC, 3, gl.FLOAT, false, 0, 0);
  }
  gl.drawArrays(gl.TRIANGLES, 0, m.count);
}

export function setViewProjection(vp) { gl.uniformMatrix4fv(mesh.u.uVP, false, vp); }
export function setFog(near, far) { gl.uniform2f(mesh.u.uFogR, near, far); }
export function setBlending(on) { if (on) gl.enable(gl.BLEND); else gl.disable(gl.BLEND); }
export function setDepthWrite(on) { gl.depthMask(on); }

// ---- the frame ----

function makeTexture(w, h) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return t;
}

/** Match the canvas and the offscreen targets to the window size. */
export function resize(width, height, devicePixelRatio) {
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const scale = Math.min(2, Math.max(dpr, 1.5)), w = Math.max(2, Math.round(width * scale)), h = Math.max(2, Math.round(height * scale));
  if (target.w === w && target.h === h) return;
  if (target.sceneTex) {
    gl.deleteTexture(target.sceneTex); gl.deleteTexture(target.blurTex); gl.deleteRenderbuffer(target.depth);
    gl.deleteFramebuffer(target.scene); gl.deleteFramebuffer(target.blur);
  }
  Object.assign(target, { w, h, scale, sceneTex: makeTexture(w, h), blurTex: makeTexture(w, h) });
  target.depth = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, target.depth);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
  target.scene = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.scene);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.sceneTex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.depth);
  target.blur = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, target.blur);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.blurTex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

/** Start drawing the world: into the offscreen target when the blur is on, else straight to the canvas. */
export function beginScene(blurOn, sky) {
  gl.useProgram(mesh.program);
  lastMesh = null;
  if (blurOn) { gl.bindFramebuffer(gl.FRAMEBUFFER, target.scene); gl.viewport(0, 0, target.w, target.h); }
  else { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height); }
  gl.clearColor(sky[0], sky[1], sky[2], 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.depthMask(true);
}

function postPass(texture, destination, w, h, dx, dy, max, saturation, contrast) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
  gl.viewport(0, 0, w, h);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform2f(post.u.uDir, dx, dy);
  gl.uniform2f(post.u.uTexel, 1 / target.w, 1 / target.h);
  gl.uniform1f(post.u.uMax, max); gl.uniform1f(post.u.uSat, saturation); gl.uniform1f(post.u.uCon, contrast);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/** Blur the top and bottom of the finished scene (focus band in the middle) and lift the colours. `zoom` is the camera distance. */
export function endScene(zoom) {
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  gl.disableVertexAttribArray(mesh.aN); gl.disableVertexAttribArray(mesh.aC); gl.disableVertexAttribArray(mesh.aP);
  gl.useProgram(post.program);
  gl.bindBuffer(gl.ARRAY_BUFFER, post.buffer);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(post.u.uTex, 0); gl.uniform1f(post.u.uFocus, .52); gl.uniform1f(post.u.uBand, .13);
  const max = (3.2 + 3.6 * clamp((zoom - 8) / 20, 0, 1)) * target.scale;
  postPass(target.sceneTex, target.blur, target.w, target.h, 1, 0, max, 1, 1);
  postPass(target.blurTex, null, canvas.width, canvas.height, 0, 1, max, 1.18, 1.06);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.disableVertexAttribArray(0);
  gl.useProgram(mesh.program);
  gl.enable(gl.DEPTH_TEST);
  enableMeshAttributes();
  lastMesh = null;
}

export function viewportSize() { return { width: canvas.width, height: canvas.height }; }

/** Forget which mesh's buffers are bound (after drawing somewhere else). */
export function forgetBoundMesh() { lastMesh = null; }
