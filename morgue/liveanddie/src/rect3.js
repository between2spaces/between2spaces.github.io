import vec3 from './vec3'

/**
 * Returns a new {rect3}.
 * @param {rect3=} r
 * @return {rect3}
 */
let rect3 = (r) => {
  return {
    min: r ? vec3(r.min) : vec3.zero(),
    max: r ? vec3(r.max) : vec3.zero()
  }
}

 
/**
 * Return the zero rectangle {min: {0, 0, 0}, max: {0, 0, 0}}
 * @return {rect3}
 */
rect3.zero = () => {
  return {min: vec3.zero(), max: vec3.zero()}
}


rect3.fromMinMax = (/**{vec3}*/min, /**{vec3}*/max) => {
  return {
    min: vec3(min),
    max: vec3(max),
  }
}


rect3.fromMinDim = (/**{vec3}*/min, /**{vec3}*/dim) => {
  return {
    min: vec3(min),
    max: vec3.addVectors(min, dim),
  }
}


rect3.fromCentreDim = (/**{vec3}*/centre, /**{vec3}*/dim) => {
  let half = vec3.multiplyScalar(vec3(dim), 0.5)
  return {
    min: vec3.subtractVectors(centre, half),
    max: vec3.addVectors(centre, half),
  }
}


rect3.contains = (/**{vect3}*/r, /**{vec3}*/v) => {
  if (v.x < r.min.x || v.x > r.max.x) return false
  if (v.y < r.min.y || v.y > r.max.y) return false
  if (v.z < r.min.z || v.z > r.max.z) return false
  return true
}


rect3.width = (/**{rect3}*/r) => {
  return r.max.x - r.min.x + 1
}


rect3.height = (/**{rect3}*/r) => {
  return r.max.y - r.min.y + 1
}


rect3.intersects = (/**{rect3}*/a, /**{rect3}*/b) => {
  if (a.max.x < b.min.x || a.min.x > b.max.x || a.max.y < b.min.y || a.min.y > b.max.y || a.max.z < b.min.z || a.min.z > b.max.z) {
    return false
  }
  return true
}


rect3.centre = (/**{rect3}*/r) => {
  return vec3.multiplyScalar(vec3.addVectors(r.min, r.max), 0.5)
}


rect3.enlarge = (/**{rect3}*/r, /**{vec3}*/delta) => {
  let centre = rect3.centre(r)
  let dim = vec3.addVectors(vec3.subtractVectors(r.max, centre), delta)
  r.min = vec3.subtractVectors(centre, dim)
  r.max = vec3.addVectors(centre, dim)
  return r
}


export default rect3

