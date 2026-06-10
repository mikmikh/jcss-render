import * as jutils from "./utils.js";

export class QRect {
  constructor(pos, size) {
    this.pos = pos;
    this.size = size;
  }
  contains(rhs) {
    return QRect.contains(this, rhs);
  }
  overlaps(rhs) {
    return QRect.overlaps(this, rhs);
  }
  static contains(lhs, rhs) {
    const [lstart, lend] = QRect._getStartEnd(lhs);
    const [rstart, rend] = QRect._getStartEnd(rhs);
    return lstart.every((_, i) => lstart[i] <= rstart[i] && rend[i] < lend[i]);
  }
  static overlaps(lhs, rhs) {
    const [lstart, lend] = QRect._getStartEnd(lhs);
    const [rstart, rend] = QRect._getStartEnd(rhs);
    return !lstart.some((_, i) => lend[i] < rstart[i] || lstart[i] > rend[i]);
  }
  static _getStartEnd(lhs) {
    const lstart = jutils.addV(lhs.pos, jutils.mulS(lhs.size, -0.5));
    const lend = jutils.addV(lhs.pos, jutils.mulS(lhs.size, 0.5));
    return [lstart, lend];
  }
}

export const QT_MAX_DEPTH = 4;
export class QuadTree {
  constructor(qrect, depth = 0) {
    this.qrect = qrect;
    this.depth = depth;
    this.qr_children = [];
    this.qt_children = [null, null, null, null];
    this.values = [];
    this.resize(qrect);
  }
  resize(qrect) {
    this.clear();
    this.qrect = qrect;
    const childSize = jutils.mulS(qrect.size, 0.5);
    const pos = [...qrect.pos];
    const signs = pos.map((_, i) => [-1, 1]);
    const combs = jutils.createCombinations(signs);

    const childSizeH = jutils.mulS(childSize, 0.5);
    this.qr_children = combs.map(
      (offs) =>
        new QRect(jutils.addV(pos, jutils.mulV(childSizeH, offs)), childSize),
    );
  }
  clear() {
    this.values = [];
    this.qt_children.forEach((child) => {
      child?.clear();
    });
    const count = 2 ** this.qrect.pos.length;
    this.qt_children = [...new Array(count)].map(() => null);
  }
  size() {
    let res = this.values.length;
    this.qt_children.forEach((child) => {
      if (child) {
        res += child.size();
      }
    });
  }
  insert(qrect, value) {
    for (let i = 0; i < this.qr_children.length; i++) {
      if (
        this.qr_children[i].contains(qrect) &&
        this.depth + 1 < QT_MAX_DEPTH
      ) {
        if (!this.qt_children[i]) {
          this.qt_children[i] = new QuadTree(
            this.qr_children[i],
            this.depth + 1,
          );
        }
        this.qt_children[i].insert(qrect, value);
        return;
      }
    }
    this.values.push([qrect, value]);
  }
  search(qrect, result = null) {
    if (!result) {
      result = [];
    }
    for (const [r, v] of this.values) {
      if (r.overlaps(qrect)) {
        result.push(v);
      }
    }
    for (let i = 0; i < this.qt_children.length; i++) {
      const child = this.qt_children[i];
      if (!child) {
        continue;
      }
      const childRect = this.qr_children[i];
      if (qrect.contains(childRect)) {
        child.items(result);
      } else if (childRect.overlaps(qrect)) {
        child.search(qrect, result);
      }
    }
    return result;
  }
  items(result) {
    for (const [r, v] of this.values) {
      result.push(v);
    }
    for (const child of this.qt_children) {
      child?.items(result);
    }
  }
}
