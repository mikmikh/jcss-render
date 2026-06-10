import * as THREE from "three";
import { JCanvas } from "../core/JCanvas.js";
import * as jutils from "../utils/utils.js";

export class JSpriteSheet {
  constructor(debugEl=null, spriteSize=[16,16]) {
    this.debugEl=debugEl;
    this.spriteSize=spriteSize;
    this.texture = null;
    this.size = null;
    this.name2uv = {};
    this.frame=0;
    this.frames=1;
  }
  generate(sprites) {
    sprites.forEach((s) => {
      // if (!s.size) {
        s.size=[s.img.naturalWidth, s.img.naturalHeight]
      // }
    });
    let frames = 1;
    sprites.forEach((s) => {
      const sframes = Math.floor(s.size[0]/this.spriteSize[0]);
      frames = jutils.jlcm(frames, sframes)
    });
    this.frames=frames;

    const canvasSize = sprites.reduce(
      (size, sprite) => {
        return [jutils.jlcm(size[0], sprite.size[0]), size[1] + sprite.size[1]];
      },
      [1, 0],
    );
    this.size = canvasSize;
    const canvas = document.createElement("canvas");
    const jcanvas = new JCanvas(canvas, canvasSize);

    const name2uv = {};
    let offsetY = 0;
    sprites.forEach((sprite, i) => {
      const dpos = [0, offsetY];
      offsetY += sprite.size[1];
      if (sprite.img) {
        // jcanvas.fillRect([0, 0], sprite.size, '#ff00ff');
        const sframes = Math.ceil(sprite.size[0]/this.spriteSize[0]);
        const spriteRepeatCount = Math.ceil(frames/sframes);
        console.log('spriteRepeatCount',spriteRepeatCount);
        for (let i = 0; i < spriteRepeatCount; i++) {
          dpos[0] = sprite.size[0]*i;
          jcanvas.drawImage(sprite.img, [0, 0], sprite.size, dpos, sprite.size);
        }
        
      }
      name2uv[sprite.name] = {
        start: [0, (canvasSize[1] - offsetY) / canvasSize[1]],
        size: sprite.size.map((v, i) => v / canvasSize[i]),
        size: this.spriteSize.map((v, i) => v / canvasSize[i]),
      };
    });
    this.name2uv = name2uv;

    const texture = new THREE.CanvasTexture(jcanvas.canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;

    this.texture = texture;

    if (this.debugEl) {
      this.debugEl.innerHTML='';
      this.debugEl.appendChild(jcanvas.canvas);
    }
  }
}
