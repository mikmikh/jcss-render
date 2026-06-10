export class JGeometry {
  /**
   *
   * @param {[number,number,number][]} v
   * @param {[number,number,number][]} vn
   * @param {[number,number][]} f
   */
  constructor(v, vn, f) {
    this.v = v;
    this.vn = vn;
    this.f = f;
  }
}
export class JMaterial {
  /**
   *
   * @param {[number,number,number]} color
   */
  constructor(styles) {
    const defaultStyles = {backgroundColor: null, backgroundImage: null};
    this.styles = {...defaultStyles,...styles};
  }
}
// export class JSpriteMaterial extends JMaterial {
//   constructor(src, color = [255, 255, 255]) {
//     super(color);
//     this.src = src;
//   }
// }
export class JMesh {
  constructor(geometry, material) {
    this.geometry = geometry;
    this.material = material;
    this.position = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.rotation = [0, 0, 0];
  }
}
export class JSpriteGeometry extends JGeometry {
  constructor() {
    super(
      [[0, 0, 0]],
      [[0, 0, -1]],
      [
        [
          [0, 0],
        ],
      ],
    );
  }
}
// [-+0]-[++0]
//   |     |
// [--0]-[+-0]
export class JPlaneGeometry extends JGeometry {
  constructor() {
    super(
      [
        [-0.5, -0.5, 0],
        [-0.5, 0.5, 0],
        [0.5, 0.5, 0],
        [0.5, -0.5, 0],
      ],
      [[0, 0, -1]],
      [
        [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        [
          [0, 0],
          [2, 0],
          [3, 0],
        ],
      ],
    );
  }
}
export class JBoxGeometry extends JGeometry {
  constructor() {
    super(
      [
        // south
        [-1, -1, -1], // 0
        [-1, 1, -1], // 1
        [1, 1, -1], // 2
        [1, -1, -1], // 3
        // north
        [1, -1, 1], // 4
        [1, 1, 1], // 5
        [-1, 1, 1], // 6
        [-1, -1, 1], // 7
      ],
      [
        [0, 0, -1], // south
        [0, 0, 1], // north
        [-1, 0, 0], // west
        [1, 0, 0], // east
        [0, -1, 0], // bottom
        [0, 1, 0], // top
      ],
      [
        // south
        [
          [0, 0],
          [1, 0],
          [2, 0],
        ],
        [
          [0, 0],
          [2, 0],
          [3, 0],
        ],
        // north
        [
          [4, 1],
          [5, 1],
          [6, 1],
        ],
        [
          [4, 1],
          [6, 1],
          [7, 1],
        ],
        // west
        [
          [7, 2],
          [6, 2],
          [1, 2],
        ],
        [
          [7, 2],
          [1, 2],
          [0, 2],
        ],
        // east
        [
          [3, 3],
          [2, 3],
          [5, 3],
        ],
        [
          [3, 3],
          [5, 3],
          [4, 3],
        ],
        // bottom
        [
          [7, 4],
          [0, 4],
          [3, 4],
        ],
        [
          [7, 4],
          [3, 4],
          [4, 4],
        ],
        // top
        [
          [1, 5],
          [6, 5],
          [5, 5],
        ],
        [
          [1, 5],
          [5, 5],
          [2, 5],
        ],
      ],
    );
  }
}
