// 4x4 matrices in the column-major layout WebGL wants.

import { cross3, dot3, norm3, sub3 } from '../../core/math.js';

export function perspective(fov, aspect, near, far) {
  const t = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
  return [t / aspect, 0, 0, 0, 0, t, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
}

export function lookAt(eye, center) {
  const z = norm3(sub3(eye, center)), x = norm3(cross3([0, 1, 0], z)), y = cross3(z, x);
  return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot3(x, eye), -dot3(y, eye), -dot3(z, eye), 1];
}

export function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
    out[c * 4 + r] = s;
  }
  return out;
}
