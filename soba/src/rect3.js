import Vec3 from './vec3'

let Rect3 = (/**{Rect3}*/rect3) => {
  return {
    min: /**{Vec3}*/(!rect3 || !rect3.min) ? Vec3() : rect3.min,
    max: /**{Vec3}*/(!rect3 || !rect3.max) ? Vec3() : rect3.max
  }
}

Rect3.fromMinMax = (/**{Vec3}*/min, /**{Vec3}*/max) => {
  return {
    min: Vec3(min),
    max: Vec3(max)
  }
}

Rect3.fromMinDim = (/**{Vec3}*/min, /**{Vec3}*/dim) => {
  return {
    min: Vec3(min),
    max: Vec3.add(Vec3(min), dim)
  }
}

Rect3.fromCentreDim = (/**{Vec3}*/centre, /**{Vec3}*/dim) => {
  let half = Vec3.multiplyScalar(Vec3(dim), 0.5)
  return {
    min: Vec3.subtractVectors(centre, half),
    max: Vec3.addVectors(centre, half)
  }
}

Rect3.contains = (/**{Rect3}*/rect3, /**{Vec3}*/vec3) => {
  if (vec3.x < rect3.min.x || vec3.x > rect3.max.x) return false
  if (vec3.y < rect3.min.y || vec3.y > rect3.max.y) return false
  if (vec3.z < rect3.min.z || vec3.z > rect3.max.z) return false
  return true
}

Rect3.intersects = (/**{Rect3}*/a, /**{Rect3}*/b) => {
  if (a.max.x < b.min.x || a.min.x > b.max.x || a.max.y < b.min.y || a.min.y > b.max.y || a.max.z < b.min.z || a.min.z > b.max.z) {
    return false
  }
  return true
}

Rect3.centre = (/**{Rect3}*/rect3) => {
  return Vec3.multiplyScalar(Vec3.addVectors(rect3.min, rect3.max), 0.5)
}

Rect3.enlarge = (/**{Rect3}*/rect3, /**{Vec3}*/delta) => {
  let centre = Rect3.centre(rect3)
  let dim = Vec3.addVectors(Vec3.subtractVectors(rect3.max, centre), delta)
  rect3.min = Vec3.subtractVectors(centre, dim)
  rect3.max = Vec3.addVectors(centre, dim)
  return rect3
}

export default Rect3
