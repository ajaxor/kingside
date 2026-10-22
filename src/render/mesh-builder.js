// MeshBuilder: builds low-poly models out of boxes, roofs, cones, domes, blobs and discs. It only collects triangles (positions, normals and
// colours as flat arrays), so it needs no WebGL and models can be built and tested anywhere.
//
// Every shape takes `ctr`, a point inside it, so each face's normal can be flipped to point away from it: shapes never need their
// vertices wound in a particular order.

import { cross3, dot3, sub3 } from '../core/math.js';

const TAU = 6.28318;

export class MeshBuilder {
  constructor() { this.p = []; this.n = []; this.c = []; }

  /** One triangle of colour `col`; `ctr` (optional) is a point behind it so the normal faces away. */
  tri(a, b, c, col, ctr) {
    let n = cross3(sub3(b, a), sub3(c, a));
    const len = Math.hypot(n[0], n[1], n[2]);
    if (len < 1e-10) return;
    n = [n[0] / len, n[1] / len, n[2] / len];
    if (ctr) {
      const m = [(a[0] + b[0] + c[0]) / 3 - ctr[0], (a[1] + b[1] + c[1]) / 3 - ctr[1], (a[2] + b[2] + c[2]) / 3 - ctr[2]];
      if (dot3(n, m) < 0) n = [-n[0], -n[1], -n[2]];
    }
    for (const v of [a, b, c]) {
      this.p.push(v[0], v[1], v[2]);
      this.n.push(n[0], n[1], n[2]);
      this.c.push(col[0], col[1], col[2]);
    }
  }

  quad(a, b, c, d, col, ctr) { this.tri(a, b, c, col, ctr); this.tri(a, c, d, col, ctr); }

  /** An axis-aligned box. `top` colours the top face differently. The bottom is skipped when the box floats above the ground. */
  box(x0, y0, z0, x1, y1, z1, col, top) {
    const ctr = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], t = top || col;
    this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], t, ctr);
    if (y0 > .001) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col, ctr);
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col, ctr);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], col, ctr);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col, ctr);
    this.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], col, ctr);
  }

  /** A bar from (ax, az) to (bx, bz) in plan, `w` wide, from height y0 to y1: a box at any angle, for diagonals in a top-down glyph. */
  beam(ax, az, bx, bz, w, y0, y1, col, top) {
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1, nx = -dz / len * w / 2, nz = dx / len * w / 2;
    const P = [[ax + nx, az + nz], [ax - nx, az - nz], [bx - nx, bz - nz], [bx + nx, bz + nz]];
    const ctr = [(ax + bx) / 2, (y0 + y1) / 2, (az + bz) / 2], t = top || col;
    this.quad([P[0][0], y1, P[0][1]], [P[1][0], y1, P[1][1]], [P[2][0], y1, P[2][1]], [P[3][0], y1, P[3][1]], t, ctr);
    if (y0 > .001) this.quad([P[0][0], y0, P[0][1]], [P[1][0], y0, P[1][1]], [P[2][0], y0, P[2][1]], [P[3][0], y0, P[3][1]], col, ctr);
    for (let i = 0; i < 4; i++) {
      const a = P[i], b = P[(i + 1) % 4];
      this.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], col, ctr);
    }
  }

  /** A gabled roof with its ridge along x. `ecol` colours the gable ends. */
  roof(x0, z0, x1, z1, y, h, col, ecol) {
    const zm = (z0 + z1) / 2, ctr = [(x0 + x1) / 2, y + h * .3, zm];
    const A = [x0, y, z0], B = [x1, y, z0], Cc = [x1, y, z1], D = [x0, y, z1], r0 = [x0, y + h, zm], r1 = [x1, y + h, zm];
    this.quad(A, B, r1, r0, col, ctr);
    this.quad(D, Cc, r1, r0, col, ctr);
    this.tri(A, D, r0, ecol || col, ctr);
    this.tri(B, Cc, r1, ecol || col, ctr);
  }

  /** A gabled roof with its ridge along z. */
  roofZ(x0, z0, x1, z1, y, h, col, ecol) {
    const xm = (x0 + x1) / 2, ctr = [xm, y + h * .3, (z0 + z1) / 2];
    const A = [x0, y, z0], B = [x0, y, z1], Cc = [x1, y, z1], D = [x1, y, z0], r0 = [xm, y + h, z0], r1 = [xm, y + h, z1];
    this.quad(A, B, r1, r0, col, ctr);
    this.quad(D, Cc, r1, r0, col, ctr);
    this.tri(A, D, r0, ecol || col, ctr);
    this.tri(B, Cc, r1, ecol || col, ctr);
  }

  /** A cone or cylinder (r1 = 0 gives a cone) with n sides, from radius r0 at y0 to r1 at y1. `cap` colours the top. */
  cyl(cx, y0, cz, r0, y1, r1, n, col, rot = 0, cap) {
    const ctr = [cx, (y0 + y1) / 2, cz];
    for (let i = 0; i < n; i++) {
      const a0 = rot + i / n * TAU, a1 = rot + (i + 1) / n * TAU;
      const p0 = [cx + Math.cos(a0) * r0, y0, cz + Math.sin(a0) * r0], p1 = [cx + Math.cos(a1) * r0, y0, cz + Math.sin(a1) * r0];
      if (r1 > 0) {
        const q0 = [cx + Math.cos(a0) * r1, y1, cz + Math.sin(a0) * r1], q1 = [cx + Math.cos(a1) * r1, y1, cz + Math.sin(a1) * r1];
        this.quad(p0, p1, q1, q0, col, ctr);
        this.tri([cx, y1, cz], q0, q1, cap || col, [cx, y0 - 1, cz]);
      } else this.tri(p0, p1, [cx, y1, cz], col, ctr);
      if (y0 > .01 && r0 > 0) this.tri([cx, y0, cz], p1, p0, col, [cx, y0 + 1, cz]);
    }
  }

  /** A rough low-poly ball: `rings` x `seg` facets, each vertex jittered by `jit` using `rnd`. `colf(ring, seg)` can colour facets individually. */
  blob(cx, cy, cz, rx, ry, rz, col, jit, rnd, seg = 6, rings = 4, colf) {
    rnd = rnd || Math.random;
    const V = [];
    for (let a = 0; a <= rings; a++) {
      const ph = a / rings * Math.PI;
      for (let b = 0; b < seg; b++) {
        const th = b / seg * TAU + (a % 2) * Math.PI / seg;
        const jj = (a === 0 || a === rings) ? 1 : 1 + (rnd() - .5) * jit;
        V.push([cx + Math.sin(ph) * Math.cos(th) * rx * jj, cy + Math.cos(ph) * ry * jj, cz + Math.sin(ph) * Math.sin(th) * rz * jj]);
      }
    }
    const ctr = [cx, cy, cz];
    for (let a = 0; a < rings; a++) {
      for (let b = 0; b < seg; b++) {
        const p00 = V[a * seg + b], p01 = V[a * seg + (b + 1) % seg], p10 = V[(a + 1) * seg + b], p11 = V[(a + 1) * seg + (b + 1) % seg];
        const c = colf ? colf(a, b) : col;
        this.tri(p00, p10, p11, c, ctr);
        this.tri(p00, p11, p01, c, ctr);
      }
    }
  }

  /** The upper half of a ball (radius rx x ry x rz), `rings` bands of `seg` facets: a rounded cap to sit on a cylinder. */
  dome(cx, cy, cz, rx, ry, rz, col, seg = 8, rings = 2) {
    const V = [];
    for (let a = 0; a <= rings; a++) {
      const ph = a / rings * Math.PI / 2;
      for (let b = 0; b < seg; b++) {
        const th = b / seg * TAU;
        V.push([cx + Math.sin(ph) * Math.cos(th) * rx, cy + Math.cos(ph) * ry, cz + Math.sin(ph) * Math.sin(th) * rz]);
      }
    }
    const ctr = [cx, cy - ry, cz];
    for (let a = 0; a < rings; a++) {
      for (let b = 0; b < seg; b++) {
        const p00 = V[a * seg + b], p01 = V[a * seg + (b + 1) % seg], p10 = V[(a + 1) * seg + b], p11 = V[(a + 1) * seg + (b + 1) % seg];
        this.tri(p00, p10, p11, col, ctr);
        this.tri(p00, p11, p01, col, ctr);
      }
    }
  }

  /** A flat disc facing up. */
  disc(cx, y, cz, r, n, col) {
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
      this.tri([cx, y, cz], [cx + Math.cos(a0) * r, y, cz + Math.sin(a0) * r], [cx + Math.cos(a1) * r, y, cz + Math.sin(a1) * r], col, [cx, y - 1, cz]);
    }
  }

  get vertexCount() { return this.p.length / 3; }
}
