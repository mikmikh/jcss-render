export function jddaRaycast(vRayStart, vRayDir, mapSize, fMaxDistance) {
  const dxdy = vRayDir[0] / vRayDir[1];
  const dydx = vRayDir[1] / vRayDir[0];
  const vRayUnitStepSize = [
    Math.sqrt(1 + dydx * dydx),
    Math.sqrt(1 + dxdy * dxdy),
  ];
  const vMapCheck = vRayStart.map((v) => Math.floor(v));
  const vRayLength1D = [0, 0];
  const vStep = [0, 0];

  vStep[1] = vRayDir[1] < 0 ? -1 : 1;
  vRayLength1D[1] =
    vRayDir[1] < 0
      ? (vRayStart[1] - vMapCheck[1]) * vRayUnitStepSize[1]
      : (vMapCheck[1] + 1 - vRayStart[1]) * vRayUnitStepSize[1];

  vStep[0] = vRayDir[0] < 0 ? -1 : 1;
  vRayLength1D[0] =
    vRayDir[0] < 0
      ? (vRayStart[0] - vMapCheck[0]) * vRayUnitStepSize[0]
      : (vMapCheck[0] + 1 - vRayStart[0]) * vRayUnitStepSize[0];
  let fDistance=  0;
  let side=0;
  const cells = [];
  while (fDistance < fMaxDistance) {
    if (!isCellInSize(vMapCheck, mapSize)) {
        break;
    } 
    cells.push([...vMapCheck]);
    if (vRayLength1D[1] < vRayLength1D[0]) {
        vMapCheck[1] += vStep[1];
        fDistance = vRayLength1D[1];
        vRayLength1D[1] += vRayUnitStepSize[1];
        side=1;
    } else {
        vMapCheck[0] += vStep[0];
        fDistance = vRayLength1D[0];
        vRayLength1D[0] += vRayUnitStepSize[0];
        side=0;
    }
  }
  return {cells,distance: fDistance,side,};
}
function isCellInSize(cell,size) {
    return cell.every((v,i)=> v >= 0 && v < size[i]);
}