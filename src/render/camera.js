// The camera looks down at the map at a fixed compass angle and can pan, zoom, and tell which ground point is under a screen point.

import { MAP_SIZE } from '../core/config.js';
import { clamp, cross3, norm3, sub3 } from '../core/math.js';
import { centerX, centerZ } from '../game/query.js';

export const FOV = .72;
export const FORWARD = [Math.SQRT1_2, 0, -Math.SQRT1_2];     // the compass direction the camera faces, flat on the ground
export const MIN_ZOOM = 8, MAX_ZOOM = 56;

/** tx, tz: the ground point at the screen centre; D: distance from it; pitch: angle above the ground. width/height: the screen, in CSS pixels. */
export const camera = { tx: 0, tz: 0, D: 17, pitch: .94, width: 1, height: 1 };

export function cameraEye() {
  const c = Math.cos(camera.pitch), s = Math.sin(camera.pitch);
  return [camera.tx - FORWARD[0] * camera.D * c, camera.D * s, camera.tz - FORWARD[2] * camera.D * c];
}

/** The ground point (x, z) under screen point (px, py), or null if that ray points at the sky. */
export function pick(px, py) {
  const nx = px / camera.width * 2 - 1, ny = 1 - py / camera.height * 2;
  const eye = cameraEye();
  const f = norm3(sub3([camera.tx, 0, camera.tz], eye));
  const right = norm3(cross3(f, [0, 1, 0])), up = cross3(right, f);
  const th = Math.tan(FOV / 2), aspect = camera.width / camera.height;
  const d = norm3([0, 1, 2].map((a) => f[a] + right[a] * nx * th * aspect + up[a] * ny * th));
  if (d[1] > -1e-4) return null;
  const t = -eye[1] / d[1];
  return [eye[0] + d[0] * t, eye[2] + d[2] * t];
}

export function clampCamera() {
  camera.tx = clamp(camera.tx, 0, MAP_SIZE);
  camera.tz = clamp(camera.tz, 0, MAP_SIZE);
  camera.D = clamp(camera.D, MIN_ZOOM, MAX_ZOOM);
}

export function focusOn(b) { camera.tx = centerX(b); camera.tz = centerZ(b); }

/** Drag the map so the ground point that was under (x0, y0) is now under (x1, y1). */
export function panBy(x0, y0, x1, y1) {
  const a = pick(x0, y0), b = pick(x1, y1);
  if (!a || !b) return;
  camera.tx += a[0] - b[0];
  camera.tz += a[1] - b[1];
  clampCamera();
}

export function setViewport(width, height) { camera.width = width; camera.height = height; }
