import * as THREE from "three";

export class JLights {
  constructor(config) {
    this.config = config;

    this.ambient = null;
    this.directional = null;
    this.meshGroup = new THREE.Group();

    this._init();
  }
  _init() {
    const { acolor, aintensity, dcolor, dintensity } = this.config;
    this.ambient = new THREE.AmbientLight(acolor ?? 0xffffff, aintensity ?? 1);
    this.directional = new THREE.DirectionalLight(
      dcolor ?? 0xffffff,
      dintensity ?? 2,
    );
    this.meshGroup.add(this.ambient);
    this.meshGroup.add(this.directional);
  }
}
