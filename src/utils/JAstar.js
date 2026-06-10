import { JHeap } from "./JHeap.js";
import * as jutils from "./utils.js";

const offsets = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
];
function getAround(pos) {
  return offsets.map((off) => jutils.addV(pos, off));
}
export function jastar(start, finish, dFunc, hFunc) {
  const gScore = {};
  const fScore = {};
  const backtrack = {};
  const kstart = jutils.jpos2key(start);
  const kfinish = jutils.jpos2key(finish);
  gScore[kstart] = 0; // dFunc(start,start)=0
  fScore[kstart] = hFunc(start);
  const heap = new JHeap((a, b) => {
    const sa = fScore[a] ?? 1e9;
    const sb = fScore[b] ?? 1e9;
    return sa < sb;
  });
  heap.push(kstart);
  while (heap.length() > 0) {
    const kv = heap.pop();
    if (kv === kfinish) {
      return backtrack;
    }
    const pv = jutils.jkey2pos(kv);
    const around = getAround(pv);
    around.forEach((pu) => {
      const gs = gScore[kv] + dFunc(pv, pu);
      const ku = jutils.jpos2key(pu);
      if (!(ku in gScore) || gs < gScore[ku]) {
        gScore[ku] = gs;
        fScore[ku] = gs + hFunc(pu);
        // if (fScore[ku] < 1e9) {
          backtrack[ku] = kv;
        // }
        heap.remove(ku);
        heap.push(ku);
      }
    });
  }
  return null;
}
