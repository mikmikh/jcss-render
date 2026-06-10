export class JHeap {
  constructor(less = (a, b) => a < b) {
    this._less = less;
    this.data = [];
  }

  push(value) {
    this.data.push(value);
    this._heapifyUp(this.data.length - 1);
  }
  peek() {
    return this.data[0];
  }
  length() {
    return this.data.length;
  }
  pop() {
    const res = this.data[0];
    if (this.data.length <= 1) {
      this.data.pop();
      return res;
    }
    this.data[0] = this.data[this.data.length - 1];
    this.data.pop();
    // TODO: heapifyDown
    this._heapifyDown(0);
    return res;
  }
  remove(elem) {
    const idx = this.data.indexOf(elem);
    if (idx === -1) {
      return;
    }
    this._remove(idx);
  }
  _left(i) {
    return 2 * i + 1;
  }
  _right(i) {
    return 2 * i + 2;
  }
  _parent(i) {
    return Math.floor((i - 1) / 2);
  }
  _remove(i) {
    this.data[i] = this.data[this.data.length - 1];
    this.data.pop();
    this._heapifyDown(i);
  }
  _heapifyUp(i) {
    while (i > 0) {
      const parent = this._parent(i);
      if (!this._less(this.data[i], this.data[parent])) {
        break;
      }
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }
  _heapifyDown(i) {
    while (i < this.data.length) {
      const left = this._left(i);
      const right = this._left(i);
      if (left >= this.data.length) {
        return;
      }
      let smallestChild = left;
      if (right < this.data.length) {
        smallestChild = this._less(this.data[left], this.data[right])
          ? left
          : right;
      }
      if (!this._less(this.data[smallestChild], this.data[i])) {
        break;
      }
      // child is smaller, swap it up, i goes down
      [this.data[i], this.data[smallestChild]] = [
        this.data[smallestChild],
        this.data[i],
      ];
      i = smallestChild;
    }
  }
}
