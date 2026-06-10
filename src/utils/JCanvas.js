export function loadImagePromise(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      resolve(img);
    };
    img.onerror = (e) => {
      reject("Error loading image from URL: " + url);
    };
    img.src = url;
  });
}
export class JCanvas {
  constructor(canvas, size = [16, 16]) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.size = size;
    this.resize(size);
  }
  resize(size) {
    this.size = size;
    this.canvas.width = size[0];
    this.canvas.height = size[1];
  }
  fillRect(pos, size, fillStyle = "black", strokeStyle = "black") {
    this.ctx.save();
    this.ctx.fillStyle = fillStyle;
    this.ctx.strokeStyle = strokeStyle;
    pos = this._reversePos(pos);
    size = this._reversePos(size);
    this.ctx.fillRect(...pos, ...size);
    this.ctx.restore();
  }
  strokeRect(pos, size, strokeStyle = "black") {
    this.ctx.save();
    this.ctx.strokeStyle = strokeStyle;
    pos = this._reversePos(pos);
    size = this._reversePos(size);
    this.ctx.strokeRect(...pos, ...size);
    this.ctx.restore();
  }
  drawLine(spos, epos, strokeStyle = "black", lineWidth=2) {
    this.ctx.save();
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.lineWidth = lineWidth;
    this.ctx.beginPath();
    spos = this._reversePos(spos);
    epos = this._reversePos(epos);
    this.ctx.moveTo(...spos);
    this.ctx.lineTo(...epos);
    this.ctx.stroke();
    this.ctx.restore();
  }
  drawText(pos, text, font = "8px serif", strokeStyle='red') {
    this.ctx.save();
    this.ctx.font = font;
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.fillStyle = strokeStyle;
    pos = this._reversePos(pos);
    this.ctx.fillText(text, ...pos);
    this.ctx.restore();
  }
  clear(pos = null, size = null) {
    pos ??= [0, 0];
    size ??= this.size;
    this.ctx.clearRect(...pos, ...size);
  }
  drawImage(
    img,
    spos = [undefined, undefined],
    ssize = [undefined, undefined],
    dpos = [undefined, undefined],
    dsize = [undefined, undefined],
  ) {
    this.ctx.drawImage(img, ...spos, ...ssize, ...dpos, ...dsize);
  }
  async drawImageFromUrl(url) {
    await loadImagePromise(url).then((img) => {
      const size = [img.naturalWidth, img.naturalHeight];
      this.resize(size);
      this.ctx.drawImage(img, 0, 0, ...this.size);
    });
  }
  saveImage(name='sprite.png') {
    const dataURL = this.canvas.toDataURL(); // e.g., "data:image/png;base64,iVBORw0KGgo..."
    const link = document.createElement("a");
    link.download = name;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  getRect() {
    const rect = this.canvas.getBoundingClientRect();
    const res = { pos: [rect.x, rect.y], size: [rect.width, rect.height] };
    // console.log(res);
    return res;
  }
  _reversePos(pos) {
    return [...pos].reverse();
  }
}
