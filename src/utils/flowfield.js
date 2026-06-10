import * as jutils from "./utils.js";

export class JFlowField {
  constructor(size, tposs, sposs) {
    this.size = size;
    this.data = [];
    this._init(tposs, sposs);
  }
  at(pos) {
    const idx = jutils.pos2idx(pos, this.size);
    return this.data[idx];
  }
  _init(tposs, sposs) {
    const { size } = this;
    const data = [...new Array(size[0] * size[1])].map(() => ({})); // zero vec
    // bfs from tpos
    sposs.forEach((pos) => {
      const idx = jutils.pos2idx(pos, size);
      data[idx].solid = true;
    });
    const queue = [];
    tposs.forEach((pos) => {
      const idx = jutils.pos2idx(pos, size);
      const cell = data[idx];
      data[idx].dir = [0, 0];
      data[idx].dist = 0;
      queue.push(idx);
    });
    const offsets = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    while (queue.length > 0) {
      const cidx = queue.shift();
      const ccell = data[cidx];
      const cpos = jutils.idx2pos(cidx, size);
      offsets.forEach((offset) => {
        const apos = jutils.addV(cpos, offset);
        if (!jutils.checkInside(apos, [0, 0], size)) {
          return;
        }
        const aidx = jutils.pos2idx(apos, size);
        const acell = data[aidx];
        if (acell.dist !== undefined) {
          // already visited
          return;
        }
        if (acell.solid) {
          // solid
          return;
        }
        // set dist +1 and dir
        acell.dist = ccell.dist + 1;
        acell.dir = jutils.mulS(offset, -1); // TODO: invert
        queue.push(aidx);
      });
    }
    this.data = data;
  }
}
