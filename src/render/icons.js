// Renders each buildable thing's model to a small picture (a data URL) for the build tray, using the real meshes and the same camera angle.

import { BUILDINGS, BUILD_MENU } from '../data/buildings.js';
import { FORWARD } from './camera.js';
import { lookAt, multiply, perspective } from './gl/matrix.js';
import { drawMesh, forgetBoundMesh, freeMesh, getGL, makeMesh, setBlending, setFog, setViewProjection } from './gl/context.js';
import { meshes } from './models/index.js';
import { buildBuildingModel } from './models/buildings.js';

const SIZE = 112;
export const icons = {};

/** A wall or palisade shows as three posts in a row joined by links, so the icon reads as a wall. */
function linkableMesh(def) {
  const post = buildBuildingModel(def.models.post, 0), link = buildBuildingModel(def.models.link, 0), second = buildBuildingModel(def.models.post, 0);
  const add = (from, dx) => {
    for (let i = 0; i < from.p.length; i += 3) {
      post.p.push(from.p[i] + dx, from.p[i + 1], from.p[i + 2]);
      post.n.push(from.n[i], from.n[i + 1], from.n[i + 2]);
      post.c.push(from.c[i], from.c[i + 1], from.c[i + 2]);
    }
  };
  add(link, -1);
  add(second, -1);
  return makeMesh(post);
}

function boundsOf(points) {
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < points.length; i += 3) for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], points[i + a]); hi[a] = Math.max(hi[a], points[i + a]); }
  return { center: lo.map((v, a) => (v + hi[a]) / 2), radius: Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) / 2 };
}

/** Fill `icons[type]` for everything in the build tray. Needs the GL context and meshes. */
export function renderIcons(createCanvas = () => document.createElement('canvas')) {
  const gl = getGL(), pixels = new Uint8Array(SIZE * SIZE * 4);
  const canvas = createCanvas();
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d'), image = ctx.createImageData(SIZE, SIZE);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, SIZE, SIZE);
  setFog(500, 600);
  setBlending(false);
  for (const type of BUILD_MENU) {
    const def = BUILDINGS[type], temporary = def.linkable;
    const mesh = temporary ? linkableMesh(def) : meshes.building[0][type];
    const { center, radius } = boundsOf(mesh.pts);
    const distance = radius / Math.sin(.36) * 1.0, pitch = .95;
    const eye = [center[0] - FORWARD[0] * distance * Math.cos(pitch), center[1] + distance * Math.sin(pitch), center[2] - FORWARD[2] * distance * Math.cos(pitch)];
    setViewProjection(multiply(perspective(.72, 1, .1, 100), lookAt(eye, center)));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    forgetBoundMesh();
    drawMesh(mesh, 0, 0, 0);
    gl.readPixels(0, 0, SIZE, SIZE, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    for (let y = 0; y < SIZE; y++) image.data.set(pixels.subarray((SIZE - 1 - y) * SIZE * 4, (SIZE - y) * SIZE * 4), y * SIZE * 4);
    ctx.putImageData(image, 0, 0);
    icons[type] = canvas.toDataURL();
    if (temporary) freeMesh(mesh);
  }
  forgetBoundMesh();
}
