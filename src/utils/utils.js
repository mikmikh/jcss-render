export function mulV(lhs, rhs) {
  return lhs.map((_, i) => lhs[i] * rhs[i]);
}
export function mulS(lhs, scalar) {
  return lhs.map((_, i) => lhs[i] * scalar);
}
export function addV(lhs, rhs) {
  return lhs.map((_, i) => lhs[i] + rhs[i]);
}
export function subV(lhs, rhs) {
  return lhs.map((_, i) => lhs[i] - rhs[i]);
}
export function divV(lhs, rhs) {
  return lhs.map((_, i) => lhs[i] / rhs[i]);
}
export function floorV(lhs) {
  return lhs.map((v) => Math.floor(v));
}
export function dotV(lhs, rhs) {
  return lhs.map((v, i) => v * rhs[i]).reduce((s, v) => s + v, 0);
}
// ^ n
// |___a
//  \
//    b
// i  j  k
// ax ay az
// bx by bz
export function crossV(lhs, rhs) {
  const [ax, ay, az] = lhs.slice(0, 3);
  const [bx, by, bz] = rhs.slice(0, 3);
  return [ay * bz - az * by, -(ax * bz - az * bx), ax * by - ay * bx];
}
export function lenV(lhs) {
  return Math.sqrt(dotV(lhs, lhs));
}
export function normalizeV(lhs) {
  const len = lenV(lhs);
  return mulS(lhs, len < 1e-5 ? 1 : 1 / len);
}
export function equalV(lhs, rhs) {
  return lhs.every((v, i) => Math.abs(lhs[i] - rhs[i]) < 1e-5);
}
// export function distToPlane(point, planePoint, planeNormal) {
//   const toPoint = subV(point, planePoint);
//   return dotV(toPoint, planeNormal);
// }
export function rotateV(dir, angle) {
  // cos -sin
  // sin  cos
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  return [dir[0] * c - dir[1] * s, dir[0] * s + dir[1] * c];
}

export function getChunkPos(wpos, csize) {
  return floorV(divV(wpos, csize));
}
export function checkInside(wpos, rstart, rsize) {
  const rend = addV(rstart, rsize);
  return wpos.every((v, i) => v >= rstart[i] && v < rend[i]);
}
export function jpos2key(lhs) {
  return lhs.join("_");
}
export function jkey2pos(key) {
  return key.split("_").map((v) => +v);
}
export function polyHash(arr, p = 31, m = 10 ** 9 + 7) {
  const hash = arr.reduce((s, v) => (s * p + v) % m);
  return hash;
}
export function createCombinations(valuesArr) {
  // [[a,b], [1,2]] => [a,1],[b,1],[a,2],[b,2]
  return valuesArr.reduce(
    (combs, vs) => vs.map((v) => combs.map((comb) => [...comb, v])).flat(),
    [[]],
  );
}
export function jdeepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
export function jdeepEqual(lhs, rhs) {
  return JSON.stringify(lhs) === JSON.stringify(rhs);
}
export function jgcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
}
export function jlcm(a, b) {
  if (a === 0 || b === 0) {
    return 0;
  }
  const gcd = jgcd(a, b);
  return Math.abs(a * b) / gcd;
}

export function pos2idx(pos, size) {
  return pos[0] * size[1] + pos[1];
}
export function idx2pos(idx, size) {
  return [Math.floor(idx / size[1]), idx % size[1]];
}
export function swapV(lhs) {
  return [lhs[1], lhs[0]];
}



// =========== MAT ===========

//          top
//    0,1,1-------1,1,1
//      / |      /|
//  0,1,0---1,1,0 |   / north
// west| 0,0,1_|__|1,0,1
//     |/      | /      -> east
//   0,0,0-----1,0,0
//       /  |
//   south  v
//        bottom
export function vec4normalize(vec4) {
  return vec4.map((v) => v / (vec4[vec4.length - 1] || 1));
}
export function vec4toVec3(vec4) {
  const res = vec4normalize(vec4);
  return res.slice(0, res.length - 1);
}
export function mulMatVec(mat, vec) {
  const [rows, cols] = [mat.length, mat[0].length];
  const res = [...new Array(rows)].map(() => 0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      res[r] += vec[c] * mat[r][c];
    }
  }
  return res;
}
// [3,4] [4,5] = [3,5]
export function mulMatMat(a, b) {
  const [rowsA, colsA] = [a.length, a[0].length];
  const [rowsB, colsB] = [b.length, b[0].length];
  if (colsA !== rowsB) {
    throw new Error(`mulMatMat: wrong sizes`);
  }
  //   const [rowsRes, colsC] = [rowsA, colsB];
  const res = [...new Array(rowsA)].map((_, r) =>
    [...new Array(colsB)].map(() => 0)
  );
  for (let r = 0; r < rowsA; r++) {
    for (let c = 0; c < colsB; c++) {
      for (let i = 0; i < colsA; i++) {
        res[r][c] += a[r][i] * b[i][c];
      }
    }
  }
  return res;
}

export function createTranslationMat(vec3) {
  const res = [
    [1, 0, 0, vec3[0]],
    [0, 1, 0, vec3[1]],
    [0, 0, 1, vec3[2]],
    [0, 0, 0, 1],
  ];
  return res;
}
export function createScaleMat(vec3) {
  const res = [
    [vec3[0], 0, 0, 0],
    [0, vec3[1], 0, 0],
    [0, 0, vec3[2], 0],
    [0, 0, 0, 1],
  ];
  return res;
}
export function createProjectionMat(
  aspect,
  fov = Math.PI / 2,
  znear = 0.1,
  zfar = 10
) {
  // [a*F*x/z, F*y/z, z*q-zn*q]
  const F = 1 / Math.tan(fov / 2);
  const q = zfar / (zfar - znear);
  const res = [
    [aspect * F, 0, 0, 0],
    [0, F, 0, 0],
    [0, 0, q, -znear * q],
    [0, 0, 1, 0],
  ];
  return res;
}
export function createScreenMat(width, height, depth = 1) {
  const res = [
    [width, 0, 0, 0.5 * width],
    [0, -height, 0, 0.5 * height],
    [0, 0, depth, 0],
    [0, 0, 0, 1],
  ];
  return res;
}
export function createRotationXMat(angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const res = [
    [1, 0, 0, 0],
    [0, cos, -sin, 0],
    [0, sin, cos, 0],
    [0, 0, 0, 1],
  ];
  return res;
}
export function createRotationYMat(angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const res = [
    [cos, 0, sin, 0],
    [0, 1, 0, 0],
    [-sin, 0, cos, 0],
    [0, 0, 0, 1],
  ];
  return res;
}
export function createRotationZMat(angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const res = [
    [cos, -sin, 0, 0],
    [sin, cos, 0,0 ],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  return res;
}

// v=[x,y,z,1] => [<R,v>,<U,v>,<D,v>, 1>
// project to new coords
// y(u)
// | / z(d)
// |/____x (r)
// Rx Ry Rz 0   1 0 0 -Px
// Ux Uy Uz 0   0 1 0 -Py
// Dx Dy Dz 0   0 0 1 -Pz
// 0  0  0  1   0 0 0  1

// Rx Ry Rz -Px   x
// Ux Uy Uz -Py x y
// Dx Dy Dz -Pz   z
// 0  0  0  1     1
export function createViewMat(pos, dir, worldUp) {
  const right = normalizeV(crossV(worldUp, dir));
  const up = normalizeV(crossV(dir, right));
  const rotateMat = [
    [right[0], right[1], right[2], 0],
    [up[0], up[1], up[2], 0],
    [dir[0], dir[1], dir[2], 0],
    [0, 0, 0, 1],
  ];
  const translateMat = [
    [1, 0, 0, -pos[0]],
    [0, 1, 0, -pos[1]],
    [0, 0, 1, -pos[2]],
    [0, 0, 0, 1],
  ];
  const res = mulMatMat(rotateMat,translateMat);
  return res;
}
export function tri2normal(tri) {
  const vec3a = subV(tri[1], tri[0]);
  const vec3b = subV(tri[2], tri[0]);
  const crossAB = crossV(vec3a, vec3b);
  const normal = normalizeV(crossAB);
  return normal;
}
// distance from point to plane
// <P0P, n>/<n,n>
export function distToPlane(point, planePoint, planeNormal) {
  const dir = subV(point, planePoint);
  return dotV(dir, planeNormal); // len(n)=1
}
export function intersectLinePlane(
  linePoint0,
  linePoint1,
  planePoint,
  planeNormal
) {
  const dist0 = distToPlane(linePoint0, planePoint, planeNormal);
  const dist1 = distToPlane(linePoint1, planePoint, planeNormal);
  if (dist0 * dist1 >= 0) {
    return [null, null];
  }
  const totalDist = Math.abs(dist0) + Math.abs(dist1);
  const direction = subV(linePoint1, linePoint0);
  const frac = Math.abs(dist0) / totalDist;
  const intersectionPoint = addV(linePoint0, mulS(direction, frac));
  return [intersectionPoint, frac];
}

export function createFrustrumPlanes(znear, zfar) {
  return [
    [
      [0, 0, znear/(zfar-znear)],
      [0, 0, 1],
    ],
    [
      [0, 0, 1],
      [0, 0, -1],
    ],
    [
      [0.5, 0, 0],
      [-1, 0, 0],
    ],
    [
      [-0.5, 0, 0],
      [1, 0, 0],
    ],
    [
      [0, 0.5, 0],
      [0, -1, 0],
    ],
    [
      [0, -0.5, 0],
      [0, 1, 0],
    ],
  ];
}