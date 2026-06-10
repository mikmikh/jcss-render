import * as jutils from "./utils/utils.js";

// NOTE: deprecated
export function projectPoint(
  position,
  cameraPosition,
  cameraDirection,
  a = 1,
  zfar = 10,
  znear = 0.1,
  fov = Math.PI / 2,
) {
  const up_ = [0, 1, 0];
  const right = jutils.crossV(up_, cameraDirection);
  const up = jutils.crossV(cameraDirection, right);
  const diff = jutils.subV(position, cameraPosition);
  const dx = jutils.dotV(diff, right);
  const dy = jutils.dotV(diff, up);
  const dz = jutils.dotV(diff, cameraDirection);

  // a = w/h, F = 1/tan(fov/2), q = zf/(zf-zn)
  //
  // zf  fx
  // -----------|       dx = z*fx/fz
  // \ ___x__dx_| fy    px = x/(z*fx/fz) = F*x/z
  //  \    \    |       py = y/(1/a*z*fx/fz) = a*F*y/z
  //    \   \   | z     pz = (z-zn)*zf/(zf-zn) = z*q-zn*q
  //   zn \-----|
  //        \ \ |
  //          \\|
  const F = 1 / Math.tan(fov / 2);
  const q = zfar / (zfar - znear);
  const proj = [a * F * dx, F * dy, dz * q - znear * q];
  return proj;
}

// NOTE: deprecated
export function toScreen(pos) {
  return [pos[0] / pos[2] + 0.5, 1 - (pos[1] / pos[2] + 0.5), 1];
}

export function getCssStyles(proj, force = false) {
  if (proj[2] < 1e-3 && !force) {
    return { scale: "0", left: 0, top: 0 };
  }
  const leftTop = toScreen(proj);
  const scale_ = 1 / proj[2];
  const [left, top] = leftTop.map((v) => Math.floor(v * 100) + "%");
  const scale = scale_;
  return { left, top, scale };
}

export class JScene {
  constructor() {
    this.meshes = [];
  }
  add(mesh) {
    this.meshes.push(mesh);
  }
  remove(mesh) {
    this.meshes = this.meshes.filter((m) => m !== mesh);
  }
}
export const JStyles = `
.sprite {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  background-size: cover;
  background-position: center;
}
.shape {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color);
}`;

export class JRenderer {
  constructor(
    screenEl,
    vsize = [64, 64],
    fov = Math.PI / 2,
    znear = 0.1,
    zfar = 5,
  ) {
    this.screenEl = screenEl;
    this.projector = new JProjector(vsize, fov, znear, zfar);
    this.projector.clip = true;
  }
  update() {
    this.projector.update();
  }
  render(scene, camera) {
    const { projector, screenEl } = this;
    const fInfos = projector.render(scene.meshes, camera);
    fInfos.forEach((fInfo, i) => {
      fInfo.index = i;
    });
    const fShapeInfos = fInfos.filter(
      (fInfo) => fInfo.fvertexScreen.length > 1,
    );
    const fSpriteInfos = fInfos.filter(
      (fInfo) => fInfo.fvertexScreen.length === 1,
    );
    const shapeEls = Array.from(screenEl.querySelectorAll(".shape"));
    const spriteEls = Array.from(screenEl.querySelectorAll(".sprite"));

    function ensureEls(count, els, clsName) {
      if (count < els.length) {
        els.slice(count).forEach((el) => el.remove());
      } else if (count > els.length) {
        const n = count - els.length;
        for (let i = 0; i < n; i++) {
          const el = document.createElement("div");
          el.classList.add(clsName);
          screenEl.append(el);
          els.push(el);
        }
      }
    }

    ensureEls(fShapeInfos.length, shapeEls, "shape");
    ensureEls(fSpriteInfos.length, spriteEls, "sprite");

    fShapeInfos.forEach((fInfo, i) => {
      const leftTops = fInfo.fvertexScreen.map((screenPoint) =>
        screenPoint
          .slice(0, 2)
          .map((v) => Math.floor(v * 100) + "%")
          .join(" "),
      );
      const el = shapeEls[i];
      el.style.zIndex = fInfo.index;
      // el.style.setProperty("--color", fInfo.color);
      // el.style.setProperty("--color", fInfo.mesh.material.color);
      Object.entries(fInfo.mesh.material.styles).forEach(([key, val]) => {
        el.style[key] = val;
      });
      // el.style.backgroundColor = `rgba(${fInfo.mesh.material.color.join(",")})`;
      el.style.filter = `brightness(${Math.floor(fInfo.lum * 100)}%)`;
      el.style.clipPath = `polygon(${leftTops.join(",")})`;
    });

    fSpriteInfos.forEach((fInfo, i) => {
      const mesh = fInfo.mesh;
      const leftTop = fInfo.fvertexScreen[0]
        .slice(0, 2)
        .map((v) => Math.floor(v * 100) + "%");
      const scale = mesh.scale
        .slice(0, 2)
        .map((v) => v * (1 - fInfo.z))
        .join(",");
      const el = spriteEls[i];
      Object.entries(fInfo.mesh.material.styles).forEach(([key, val]) => {
        el.style[key] = val;
      });
      el.style.zIndex = fInfo.index;
      el.style.left = leftTop[0];
      el.style.top = leftTop[1];
      // el.style.backgroundImage = `url('${mesh.material.src}')`;
      el.style.transform = `translate(-50%,-50%) scale(${scale})`;
    });
  }
}

export class JCamera {
  constructor(position = [0, 0, 0], pitch = 0, yaw = Math.PI / 2) {
    this.position = position;
    this.pitch = pitch;
    this.yaw = yaw;
    this.direction = [0, 0, 1];
  }
  update() {
    this.direction = [
      Math.cos(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.sin(this.yaw) * Math.cos(this.pitch),
    ];
  }
}
export class JProjector {
  constructor(vsize = [64, 64], fov = Math.PI / 2, znear = 0.1, zfar = 5) {
    this.vsize = vsize;
    this.aspect = vsize[0] / vsize[1];
    this.fov = fov;
    this.znear = znear;
    this.zfar = zfar;
    this.clip = false;

    this.light = {
      position: [1, 0, -1],
      ambient: 0.5,
    };
    this.frustrumPlanes = [];
    this.projMat = null;
    this.screenMat = null;
  }
  update() {
    this.frustrumPlanes = jutils.createFrustrumPlanes(this.znear, this.zfar);
    this.projMat = jutils.createProjectionMat(
      this.aspect,
      this.fov,
      this.znear,
      this.zfar,
    );
    this.screenMat = jutils.createScreenMat(this.vsize[0], this.vsize[1], 1);
  }
  render(meshes, camera) {
    const viewMat = jutils.createViewMat(
      camera.position,
      camera.direction,
      [0, 1, 0],
    );
    const meshDists = meshes.map((mesh) =>
      jutils.lenV(jutils.subV(camera.position, mesh.position)),
    );
    const order = [...new Array(meshes.length)].map((_, i) => i);
    order.sort((lhs, rhs) => meshDists[rhs] - meshDists[lhs]);
    const meshTriInfos = order.map((mi) =>
      this.render_(meshes[mi], camera, viewMat),
    );
    return meshTriInfos.flat();
  }
  render_(mesh, camera, viewMat) {
    const { scale, rotation, position, geometry, material } = mesh;

    // prepare matrices
    const scaleMat = jutils.createScaleMat(scale);
    let rotationMat = jutils.createScaleMat([1, 1, 1]);
    rotation.forEach((rot, ri) => {
      if (rot === 0) {
        return;
      }
      let rotMat = null;
      if (ri === 0) {
        rotMat = jutils.createRotationXMat(rot);
      } else if (ri === 1) {
        rotMat = jutils.createRotationYMat(rot);
      } else {
        rotMat = jutils.createRotationZMat(rot);
      }
      rotationMat = jutils.mulMatMat(rotationMat, rotMat);
    });
    const translationMat = jutils.createTranslationMat(position);
    const rotScaleMat = jutils.mulMatMat(rotationMat, scaleMat);
    const modelMat = jutils.mulMatMat(translationMat, rotScaleMat);

    // transform normals and vertices
    const normals = geometry.vn
      .map((vec3) => [...vec3, 0])
      .map((vec4) => jutils.mulMatVec(modelMat, vec4));
    const vertexModel = geometry.v
      .map((vec3) => [...vec3, 1])
      .map((vec4) => jutils.mulMatVec(modelMat, vec4));

    // sort faces
    const forder = [...new Array(geometry.f.length)].map((_, i) => i);
    const fcenters = geometry.f.map((vns) => {
      const fcenter = vns
        .map(([vi, ni]) => vertexModel[vi])
        .reduce((s, v) => jutils.addV(s, v))
        .map((v) => v / 3);
      return fcenter;
    });
    const fdists = fcenters.map((fcenter) =>
      jutils.lenV(jutils.subV(camera.position, fcenter)),
    );
    forder.sort((lhs, rhs) => fdists[rhs] - fdists[lhs]);

    //
    const result = [];
    forder.forEach((fi) => {
      const vns = geometry.f[fi];
      const fvertexModel = vns.map(([vi, ni]) => vertexModel[vi]);
      const dirToCamera = jutils.subV(camera.position, fvertexModel[0]);
      const normalFromVertex = normals[vns[0][1]];
      // NOTE: check if not one point
      if (jutils.dotV(dirToCamera, normalFromVertex) < 0 && vns.length > 1) {
        // skip, it's back of the face
        return;
      }
      const fcenter = fcenters[fi];
      const lightDir = jutils.normalizeV(
        jutils.subV(this.light.position, fcenter),
      );
      const lum = jutils.dotV(lightDir, normalFromVertex);

      const fview = fvertexModel.map((vec4) => jutils.mulMatVec(viewMat, vec4));
      const fproj = fview.map((vec4) => jutils.mulMatVec(this.projMat, vec4));
      const fprojNormalized = fproj
        .map((vec4) => jutils.vec4normalize(vec4))
        .map((v) => v.slice(0, 3));
      // TODO: clip tris
      let trisToRender = [fprojNormalized];
      if (this.clip) {
        const fprojNormalizedSigned = fprojNormalized.map((vec3, vi) =>
          vec3.map((v) => v * Math.sign(fproj[vi][3])),
        );
        trisToRender = this.clipTri_(fprojNormalizedSigned);
      }
      trisToRender.forEach((tri) => {
        const fvertexScreen = tri
          .map((vec3) => [...vec3, 1])
          .map((vec4) => jutils.mulMatVec(this.screenMat, vec4))
          .map((vec4) => jutils.vec4normalize(vec4));
        const z =
          fvertexScreen.reduce((s, v) => s + v[2], 0) / fvertexScreen.length;

        // const trgb = material.color;
        // const trgbl = trgb.map((v) =>
        //   Math.min(255, Math.floor(v * (this.light.ambient + lum))),
        // );
        // const tcolor = `rgb(${trgbl.join(",")})`;
        result.push({ fvertexScreen, z, lum, mesh, fi });
      });
    });

    return result;
  }

  clipTri_(tri) {
    let queue = [tri];
    for (const [planePoint, planeNormal] of this.frustrumPlanes) {
      queue = queue.map((tri) => clipTri(tri, planePoint, planeNormal)).flat();
    }
    return queue;
  }
}

function clipTri(tri, planePoint, planeNormal) {
  const pInside = tri.map(
    (p) => jutils.distToPlane(p, planePoint, planeNormal) > 0,
  );
  if (pInside.every((x) => !x)) {
    return [];
  }
  if (pInside.every((x) => x)) {
    return [tri];
  }
  const clippedPoints = [];
  for (let i = 0; i < tri.length; i++) {
    const i2 = (i + 1) % tri.length;
    if (pInside[i]) {
      clippedPoints.push(tri[i]);
    }
    const [p01, frac] = jutils.intersectLinePlane(
      tri[i],
      tri[i2],
      planePoint,
      planeNormal,
    );
    if (p01) {
      clippedPoints.push(p01);
    }
  }
  if (clippedPoints.length === 3) {
    return [clippedPoints];
  }
  if (clippedPoints.length === 4) {
    const idxs0 = [0, 1, 2];
    const idxs1 = [0, 2, 3];
    const triClipped0 = idxs0.map((i) => clippedPoints[i]);
    const triClipped1 = idxs1.map((i) => clippedPoints[i]);
    return [triClipped0, triClipped1];
  }
  return [];
}
