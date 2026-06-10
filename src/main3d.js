import * as jutils from "./utils/utils.js";
import { EventManager, KeyboardControls } from "./utils/keyboard.js";
import * as jrng from "./utils/rng.js";
import { JCamera, JRenderer, JScene } from "./j3d.js";
import {
  JBoxGeometry,
  JMaterial,
  JMesh,
  JPlaneGeometry,
  JSpriteGeometry,
} from "./jmesh.js";

function main() {
  const camera = new JCamera([0, 0, 0]);
  const renderer = new JRenderer(
    document.querySelector(".screen"),
    [1, 1],
    Math.PI / 2,
    0.1,
    32,
  );
  const scene = new JScene();

  const floorMesh = new JMesh(
    new JPlaneGeometry(),
    new JMaterial({ backgroundColor: "#fff" }),
  );
  floorMesh.position = [0, -2, 0];
  floorMesh.scale = [5, 5, 5];
  floorMesh.rotation = [Math.PI / 2, 0, 0];
  scene.add(floorMesh);

  const planeMesh = new JMesh(
    new JPlaneGeometry(),
    new JMaterial({ backgroundColor: "#00f", backgroundImage: "url('./assets/bg-blue.png')" }),
  );
  planeMesh.position = [0.5, 0, 2];
  planeMesh.scale = [0.5, 0.5, 0.5];
  scene.add(planeMesh);

  const boxMesh = new JMesh(
    new JBoxGeometry(),
    new JMaterial({ backgroundColor: "#f0f" }),
  );
  boxMesh.position = [-0.5, 0, 2];
  boxMesh.scale = [0.5, 0.5, 0.5];
  scene.add(boxMesh);

  const spriteMesh = new JMesh(
    new JSpriteGeometry(),
    new JMaterial({ backgroundImage: "url('./assets/sprite.png')" }),
  );
  spriteMesh.position = [0.25, 0, 1];
  spriteMesh.scale = [1, 1, 1];
  scene.add(spriteMesh);

  function update(dt) {
    updateControls(dt);
    camera.update();
    renderer.update();
  }

  function render() {
    renderer.render(scene, camera);
  }

  const keyboard = new KeyboardControls(new EventManager());
  keyboard.activate();
  const btnStates = {};

  let prevT = -1;
  const ttl = 0.01;
  let tt = 0;
  function animate(t) {
    if (prevT < 0) {
      prevT = t;
    }
    const dt = (t - prevT) / 1000;
    prevT = t;
    requestAnimationFrame(animate);
    update(dt);
    tt += dt;
    if (tt < ttl) {
      return;
    }
    tt = 0;
    render();
  }
  requestAnimationFrame(animate);

  function setUpButtons() {
    const selectorMap = {
      ".btn-w": "forward",
      ".btn-s": "backward",
      ".btn-d": "right",
      ".btn-a": "left",
      ".btn-q": "up",
      ".btn-e": "down",
      ".btn-arrowup": "lookup",
      ".btn-arrowdown": "lookdown",
      ".btn-arrowleft": "lookleft",
      ".btn-arrowright": "lookright",
      ".btn-shift": "shift",
    };
    Object.entries(selectorMap).forEach(([key, val]) => {
      document
        .querySelector(key)
        ?.addEventListener("click", () => applyControls_(0.1, { [val]: true }));
      document
        .querySelector(key)
        ?.addEventListener("touch", () => applyControls_(0.1, { [val]: true }));
    });
  }
  setUpButtons();

  function updateControls(dt) {
    const controlMap = {
      w: "forward",
      s: "backward",
      d: "right",
      a: "left",
      q: "up",
      e: "down",
      arrowup: "lookup",
      arrowdown: "lookdown",
      arrowleft: "lookleft",
      arrowright: "lookright",
      shift: "shift",
    };
    const controls = {};
    Object.entries(controlMap).forEach(([key, val]) => {
      if (keyboard.keyStates[key]) {
        controls[val] = true;
      }
      if (btnStates[val]) {
        controls[val] = true;
      }
    });
    applyControls_(dt, controls);
  }
  function applyControls_(dt, controls) {
    const up = [0, 1, 0];
    const right = jutils.crossV(up, camera.direction);
    let offset = [0, 0, 0];
    if (controls["forward"]) {
      offset = jutils.addV(offset, camera.direction);
    }
    if (controls["backward"]) {
      offset = jutils.subV(offset, camera.direction);
    }
    if (controls["right"]) {
      offset = jutils.addV(offset, right);
    }
    if (controls["left"]) {
      offset = jutils.subV(offset, right);
    }
    if (controls["up"]) {
      offset = jutils.addV(offset, up);
    }
    if (controls["down"]) {
      offset = jutils.subV(offset, up);
    }
    const speed = controls["shift"] ? 4 : 2;
    camera.position = jutils.addV(
      camera.position,
      jutils.mulS(offset, speed * dt),
    );

    if (controls["lookup"]) {
      camera.pitch = camera.pitch + dt; // Math.min(camera.pitch + dt, Math.PI / 2 - 0.01);
    }
    if (controls["lookdown"]) {
      camera.pitch = camera.pitch - dt; // Math.max(camera.pitch - dt, -Math.PI / 2 + 0.01);
    }
    camera.pitch = Math.min(
      Math.PI / 2 - 0.01,
      Math.max(-Math.PI / 2 + 0.01, camera.pitch),
    );
    if (controls["lookleft"]) {
      camera.yaw += dt;
    }
    if (controls["lookright"]) {
      camera.yaw -= dt;
    }
  }
}

main();
