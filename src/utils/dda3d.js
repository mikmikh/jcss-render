import { addV, mulS } from "./utils.js";

export function jddaRaycast3d(predicateFn, vRayStart, vRayDir, fMaxDistance) {
  // dsx = [dx/dx,dy/dx,dz/dx]
  // dsy = [dx/dy,dy/dy,dz/dy]
  // dsz = [dx/dz,dy/dz,dz/dz]
  const dd = vRayDir.map((_, i) => vRayDir.map((v) => v / vRayDir[i]));
  // sqrt(dsx.x^2+dsx.y^2+dsx.z^2)
  // sqrt(dsy.x^2+dsy.y^2+dsy.z^2)
  // sqrt(dsz.x^2+dsz.y^2+dsz.z^2)
  const vRayUnitStepSizes = dd.map((d) =>
    Math.sqrt(d.reduce((s, v) => s + v * v, 0)),
  );
  const vMapCheck = vRayStart.map((v) => Math.floor(v));
  const vRayLength1D = vRayDir.map(
    (v, i) =>
      (v < 0 ? vRayStart[i] - vMapCheck[i] : vMapCheck[i] + 1 - vRayStart[i]) *
      vRayUnitStepSizes[i],
  );
  const vStep = vRayDir.map((v) => (v < 0 ? -1 : 1));

  let fDistance = 0;
  let side = 0;
  const cells = [];
  let hit = false;
  while (fDistance < fMaxDistance) {
    cells.push([...vMapCheck]);
    if (predicateFn(vMapCheck)) {
      hit = true;
      break;
    }
    if (
      vRayLength1D[0] <= vRayLength1D[1] &&
      vRayLength1D[0] <= vRayLength1D[2]
    ) {
      vMapCheck[0] += vStep[0];
      fDistance = vRayLength1D[0];
      vRayLength1D[0] += vRayUnitStepSizes[0];
      side = 0;
    } else if (
      vRayLength1D[1] <= vRayLength1D[0] &&
      vRayLength1D[1] <= vRayLength1D[2]
    ) {
      vMapCheck[1] += vStep[1];
      fDistance = vRayLength1D[1];
      vRayLength1D[1] += vRayUnitStepSizes[1];
      side = 1;
    } else {
      vMapCheck[2] += vStep[2];
      fDistance = vRayLength1D[2];
      vRayLength1D[2] += vRayUnitStepSizes[2];
      side = 2;
    }
  }
  const normal = vStep.map((v, i) => (i === side ? -v : 0));
  const point = hit ? addV(vRayStart, mulS(vRayDir, fDistance)) : null;
  return { cells, distance: fDistance, side, hit, point, normal };
}
// function isCellInSize(cell, size) {
//   return cell.every((v, i) => v >= 0 && v < size[i]);
// }
