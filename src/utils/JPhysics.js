import * as jutils from "./utils.js";

export class JPhysics {
  constructor(simulationRate = 200) {
    this.simulationRate = simulationRate;
    this.accumulator = 0;
    this.gravity = 64;
    this.timestep = 1 / simulationRate;
  }
  update(dt, objects, blockFn) {
    this.accumulator += dt;
    while (this.accumulator >= this.timestep) {
      objects.forEach((obj) => {
        obj.velocity[1] -= this.gravity * this.timestep;
        obj.pos = jutils.addV(
          obj.pos,
          jutils.mulS(obj.velocity, this.timestep),
        );
        obj.velocity = jutils.mulS(obj.velocity, 0.9);
        this._handleCollisions(obj, blockFn);
      });

      this.accumulator -= this.timestep;
    }
  }
  _handleCollisions(obj, blockFn) {
    obj.onGround = false;
    obj.haveCollision = false;
    const candidates = broadPhase(obj, blockFn);
    const collisions = narrowPhase(obj, candidates);
    if (collisions.length === 0) {
      return;
    }
    resolveCollisions(obj, collisions);
  }
}

function broadPhase(obj, blockFn) {
  const extents = obj.pos.map((v, i) => [
    Math.floor(v - obj.size[i] * 0.5),
    Math.ceil(v + obj.size[i] * 0.5),
  ]);
  const res = [];
  const size = obj.pos.map(() => 1);

  const coordValues = extents.map(([min, max]) =>
    [...new Array(max - min + 1)].map((_, v) => v + min),
  );
  const positionsToCheck = jutils.createCombinations(coordValues);
  // console.log('positionsToCheck', positionsToCheck);
  positionsToCheck.forEach((cpos) => {
    const name = blockFn(cpos);
    if (!name) {
      return;
    }
    const pos = cpos.map((v) => v);
    res.push({ cpos, pos, size, name });
  });

  return res;
}

function narrowPhase(obj, candidates) {
  const res = [];
  const objStart = jutils.addV(obj.pos, jutils.mulS(obj.size, -0.5));
  candidates.forEach(({ pos, size, name }) => {
    const slide =
      name.indexOf("$") !== -1 ? jutils.jkey2pos(name.split("$")[1]) : null;
    if (slide) {
      const slideN = jutils.normalizeV(slide);
      const distToPlane = jutils.distToPlane(obj.pos, pos, slideN);
      if (distToPlane > 0) {
        const slidePoint = jutils.addV(
          obj.pos,
          jutils.mulS(slideN, -distToPlane),
        );
        const cellStart = jutils.addV(pos, jutils.mulS(size, -0.5));
        if (jutils.checkInside(slidePoint, cellStart, size)) {
          const overlap = obj.size[0] - distToPlane;
          if (overlap <= 0) {
            return;
          }
          const collision = {
            name,
            closest: slidePoint,
            overlap: slidePoint[1] - (obj.pos[1] - obj.size[1] / 2),
            normal: [0, 1, 0],
          };
          res.push(collision);
          return;
        }
      }
    }

    const closest = obj.pos.map((v, i) =>
      Math.max(pos[i] - size[i] * 0.5, Math.min(v, pos[i] + size[i] * 0.5)),
    );

    if (!jutils.checkInside(closest, objStart, obj.size)) {
      return;
    }
    const dir = jutils.subV(closest, obj.pos);
    const overlapV = obj.size.map((v, i) => v * 0.5 - Math.abs(dir[i]));

    // console.log(overlapV);
    const overlap = Math.min(...overlapV);

    const idx = overlapV.indexOf(overlap);
    // console.log('dir',dir);
    const normal = [...new Array(dir.length)].map((_, i) =>
      i === idx ? -Math.sign(dir[i]) : 0,
    );
    const collision = {
      name,
      closest,
      overlap,
      normal,
    };
    res.push(collision);
  });
  return res;
}

function resolveCollisions(obj, collisions) {
  collisions.sort((lhs, rhs) => lhs.overlap - rhs.overlap);
  const objStart = jutils.addV(obj.pos, jutils.mulS(obj.size, -0.5));
  collisions.forEach((collision) => {
    if (!jutils.checkInside(collision.closest, objStart, obj.size)) {
      return;
    }
    obj.haveCollision = true;
    if (collision.normal[1] === 1) {
      obj.onGround = true;
    }
    const deltaPosition = jutils.mulS(collision.normal, collision.overlap);
    obj.pos = jutils.addV(obj.pos, deltaPosition);
    const magnitude = jutils.dotV(obj.velocity, collision.normal);
    const velocityAdjustment = jutils.mulS(collision.normal, magnitude);
    obj.velocity = jutils.subV(obj.velocity, velocityAdjustment);
  });
}
