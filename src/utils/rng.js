import * as jutils from './utils.js';

// =========================== Seeded Random ==============================
export class JRngMulberry32 {
  constructor(seed = 123456) {
    this.seed = seed;
  }
  random() {
    this.seed += 0x9e3779b9;
    let z = this.seed;
    z = Math.imul(z ^ (z >>> 16), 0x85eab6e7);
    z = Math.imul(z ^ (z >>> 13), 0xc6965731);
    z ^= z >>> 16;

    return (z >>> 0) / 4294967296;
  }
}

export function randInt(min, max, rng = Math) {
  return Math.floor(rng.random() * (max - min)) + min;
}
export function randFloat(min, max, rng = Math) {
  return rng.random() * (max - min) + min;
}
export function shuffle(arr, rng = Math) {
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    const j = randInt(0, len, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
// =========================== / Seeded Random ==============================

// =========================== / Perlin Noise ==============================

export function lerp(f, a, b) {
  return a + f * (b - a);
}
export function fade(f) {
  return ((6 * f - 15) * f + 10) * f * f * f;
}

export class JPerlinNoise {
  constructor(rng) {
    this.rng = rng;
    this.perm = null;
    this.init();
  }
  init() {
    const perm = [...new Array(256)].map((_, i) => i);
    shuffle(perm, this.rng);
    this.perm = perm;
  }
  noise2d(pos) {
    const corners = [
      [0, 0], // bl
      [1, 0], // br
      [0, 1], // tl
      [1, 1], // tr
    ];
    const posim = pos.map((v, i) => Math.floor(v) & 255);
    const posf = pos.map((v, i) => v - Math.floor(v));
    const toPosV = corners.map(([xoff, yoff]) => [
      posf[0] - xoff,
      posf[1] - yoff,
    ]);
    const cornerPValues = corners.map(
      ([xoff, yoff]) =>
        this.perm[(this.perm[posim[0] + xoff] + posim[1] + yoff) & 255],
    );
    const constantVectors = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
    const constVs = cornerPValues.map(
      (p) => constantVectors[p % cornerPValues.length],
    );
    const dotVs = toPosV.map((v, i) => jutils.dotV(v, constVs[i]));
    const fposf = posf.map((v) => fade(v));
    const res = lerp(
      fposf[0],
      lerp(fposf[1], dotVs[0], dotVs[2]),
      lerp(fposf[1], dotVs[1], dotVs[3]),
    );
    return res;
  }
  noise2dFractal(pos, noctaves = 4, persistance = 0.5, scale = 0.001) {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < noctaves; i++) {
      const opos = jutils.mulV(pos, [scale, scale]);
      const v = amplitude * this.noise2d(opos);
      total += v;
      maxValue += amplitude;
      amplitude *= persistance;
      scale *= 2;
    }
    return total / maxValue;
  }
}
// =========================== / Perlin Noise ==============================

// =========================== Simplex Noise ==============================
export class JSimplexNoise {
  constructor(rng) {
    this.rng = rng;
    this.perm = [];
    this.gradients = {};
    this.initGradients();
  }
  initGradients() {
    this.grad2 = _createGradN(2);
    this.grad3 = _createGradN(3);
    const perm = [...new Array(256)].map((_, i) => i);
    shuffle(perm, this.rng);
    this.perm = perm;
  }
  noise2d(pos) {
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;

    // skew to 2d lattice and find cell origin
    const s = (pos[0] + pos[1]) * F2;
    const lpos0 = pos.map((v) => Math.floor(v + s));

    // unskew cell origin back to x,y coords
    const t0_ = (lpos0[0] + lpos0[1]) * G2;
    const pos0 = jutils.subV(lpos0, [t0_, t0_]);

    // within cell (offset)
    const pos0f = jutils.subV(pos, pos0);

    // find simplex
    const offsets = [[0, 0], pos0f[0] < pos0f[1] ? [0, 1] : [1, 0], [1, 1]];
    const lpos_s = offsets.map((off) => jutils.addV(lpos0, off));
    const pos_s = lpos_s.map((lpos) => {
      const t = (lpos[0] + lpos[1]) * G2;
      return jutils.subV(lpos, [t, t]);
    });
    const posf_s = pos_s.map((pos_) => jutils.subV(pos, pos_));
    const lposm_s = lpos_s.map((lpos) => lpos.map((v) => v & 255));

    const ns = posf_s.map((posf, i) => {
      const lposm = lposm_s[i];
      const t_ = 0.5 - jutils.dotV(posf, posf);
      if (t_ < 0) {
        return 0;
      }
      const gi = this.perm[(lposm[0] + this.perm[lposm[1]]) & 255] % 8;
      const n = t_ * t_ * t_ * t_ * jutils.dotV(this.grad2[gi], posf);
      return n;
    });
    const nsum = ns.reduce((s, x) => s + x, 0);

    // its 66.*** but to be safe
    return 70 * nsum;
  }
  noise3d(pos) {
    const F3 = 1 / 3;
    const G3 = 1 / 6;

    const s = (pos[0] + pos[1] + pos[2]) * F3;
    const lpos0 = pos.map((v) => Math.floor(v + s));

    const t = (lpos0[0] + lpos0[1] + lpos0[2]) * G3;
    const pos0 = jutils.subV(lpos0, [t, t, t]);
    const pos0f = jutils.subV(pos, pos0);

    const offsets = [[0, 0, 0]];

    if (pos0f[0] >= pos0f[1]) {
      if (pos0f[1] >= pos0f[2]) {
        offsets.push([1, 0, 0], [1, 1, 0]);
      } else if (pos0f[0] >= pos0f[2]) {
        offsets.push([1, 0, 0], [1, 0, 1]);
      } else {
        offsets.push([0, 0, 1], [1, 0, 1]);
      }
    } else {
      if (pos0f[1] < pos0f[2]) {
        offsets.push([0, 0, 1], [0, 1, 1]);
      } else if (pos0f[0] < pos0f[2]) {
        offsets.push([0, 1, 0], [0, 1, 1]);
      } else {
        offsets.push([0, 1, 0], [1, 1, 0]);
      }
    }
    offsets.push([1, 1, 1]);

    const lpos_s = offsets.map((off) => jutils.addV(lpos0, off));
    const pos_s = lpos_s.map((lpos) => {
      const t = (lpos[0] + lpos[1] + lpos[2]) * G3;
      return jutils.subV(lpos, [t, t, t]);
    });
    const posf_s = pos_s.map((pos_) => jutils.subV(pos, pos_));
    const lposm_s = lpos_s.map((lpos) => lpos.map((v) => v & 255));

    const ns = posf_s.map((posf, i) => {
      const lposm = lposm_s[i];
      const t_ = 0.6 - jutils.dotV(posf, posf);
      if (t_ < 0) {
        return 0;
      }
      const gi =
        this.perm[
          (lposm[0] + this.perm[(lposm[1] + this.perm[lposm[2]]) & 255]) & 255
        ] % 12;
      const n = t_ * t_ * t_ * t_ * jutils.dotV(this.grad3[gi], posf);
      return n;
    });

    const nsum = ns.reduce((s, x) => s + x, 0);

    return 32 * nsum;
  }
  noise2dFractal(pos, octaves = 4, persistance = 0.5, scale = 0.01) {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      const spos = jutils.mulV(pos, [scale, scale]);
      total += this.noise2d(spos) * amplitude;
      maxValue += amplitude;
      amplitude *= persistance;
      scale *= 2;
    }

    return total / maxValue;
  }
  noise3dFractal(pos, octaves=4, persistance=0.5, scale=0.01) {
    let total = 0;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      const spos = jutils.mulV(pos, [scale,scale,scale]);
      total += this.noise3d(spos) * amplitude;
      maxValue += amplitude;
      amplitude *= persistance;
      scale *= 2;
    }

    return total/maxValue;
  }
}

function _createGradN(n) {
  let res = [[]];
  for (let i = 0; i < n; i++) {
    res = _addEvery(res, [-1, 0, 1]);
  }
  return res.filter((vals) => !vals.every((a) => !a));
}
function _addEvery(init = [[]], vals = [-1, 0, 1]) {
  return init.map((arr) => vals.map((val) => [...arr, val])).flat();
}
// =========================== / Simplex Noise ==============================


// =========================== Poisson-Disc Sampling ==============================
export function jcreatePDSPoints(approxCount=10,rng=Math,maxAttempts=16) {
    const msize = [1,1];
    const factor = 2/Math.sqrt(3);
    const minDistance = 1/Math.sqrt(approxCount)/factor;
    return _createPoissonDiscSampling(msize,minDistance,maxAttempts, rng);
}


function _createPoissonDiscSampling(msize,minDistance,maxAttempts=8,rng=Math) {
    const fCellSize = minDistance/Math.sqrt(2);
    const vGridSize = msize.map((v) => Math.ceil(v/fCellSize)+1);
    const grid = [...new Array(vGridSize[0])].map(() => [...new Array(vGridSize[1])].map(() => null));
    const addToGridFn = (point) => {
        const gpos = point.map(v => Math.floor(v/fCellSize));
        if (jutils.checkInside(gpos, [0,0], vGridSize)) {
            grid[gpos[0]][gpos[1]] = point; // maybe push(point)
        }
    };
    const generateRandomPointAround = (point) => {
        const radius= randFloat(minDistance, minDistance*2,rng);
        const angle = randFloat(0,Math.PI*2,rng);
        const res = [point[0]+radius*Math.cos(angle), point[1] + radius*Math.sin(angle)];
        return res;
    }
    const checkValid = (point) => {
        const gpos = point.map((v) => Math.floor(v/fCellSize));
        if (!jutils.checkInside(gpos, [0,0], vGridSize)) {
               return false;
            }
        for (let dr=-1;dr<=1;dr++) {
            for (let dc =-1; dc <=1; dc++ ) {
                const npos = [gpos[0]+dr, gpos[1]+dc];
                // console.log('npos',npos);
                if (!jutils.checkInside(npos, [0,0], vGridSize)) {
                    continue;
                }
                const npoint = grid[npos[0]][npos[1]];
                if (!npoint) {
                    continue;
                }
                const dir = jutils.subV(npoint, point);
                const dist = jutils.lenV(dir);
                // console.log('dist',dist);
                if (dist < minDistance) {
                    return false;
                }
            }
        }
        return true;
    }

    const points = [];
    const active = [];

    const startPoint = [
        randFloat(0, msize[0], rng),
        randFloat(0, msize[1], rng),
    ];
    points.push(startPoint);
    active.push(startPoint);
    addToGridFn(startPoint);

    while(active.length > 0) {
        const ridx = randInt(0,active.length, rng);
        const point = active[ridx];
        let found = false;
        for (let ai = 0; ai < maxAttempts; ai++) {
            const npoint = generateRandomPointAround(point);
            if (!checkValid(npoint)) {
                continue;
            }
            points.push(npoint);
            active.push(npoint);
            addToGridFn(npoint);
            found=true;
            break;
        }

        if (!found) {
            active.splice(ridx,1);
        }
    }
    return points;
}
// =========================== / Poisson-Disc Sampling ==============================