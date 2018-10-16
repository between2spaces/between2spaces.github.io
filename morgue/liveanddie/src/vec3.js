/**
 * Returns a new {vec3}.
 * @param {vec3=} v
 * @return {vec3}
 */
let vec3 = (v) => {
  return {x: (v && v.x) ? v.x : 0, y: (v && v.y) ? v.y : 0, z: (v && v.z) ? v.z : 0}
}

 
/**
 * Returns the zero vector <0, 0, 0>
 * @return {vec3}
 */
vec3.zero = () => {
  return {x: 0, y: 0, z: 0}
}


/**
 * Returns the unit vector <1, 1, 1>
 * @return {vec3}
 */
vec3.unit = () => {
  return {x: 1, y: 1, z: 1}
}


vec3.toString = (v) => {
  let str = ~~(v.x * 1000) / 1000
  if (v.y !== 0) str += ',' + ~~(v.y * 1000) / 1000
  if (v.z !== 0) str += ',' + ~~(v.z * 1000) / 1000
  return str
}


vec3.fromString = (str) => {
  let xyz = str.split(',')
  return vec3({
    x: xyz.length > 0 ? parseFloat(xyz[0]) : 0,
    y: xyz.length > 1 ? parseFloat(xyz[1]) : 0,
    z: xyz.length > 2 ? parseFloat(xyz[2]) : 0
  })
}


vec3.equals = (v1, v2) => {
  return ((v2.x === v1.x) && (v2.y === v1.y) && (v2.z === v1.z))
}


vec3.add = (v1, v2) => {
  v1.x += v2.x
  v1.y += v2.y
  v1.z += v2.z
  return v1
}


vec3.addVectors = (v1, v2) => {
  return vec3.add(vec3(v1), v2)
}


vec3.addScalar = (v, scalar) => {
  v.x += scalar
  v.y += scalar
  v.z += scalar
  return v
}


vec3.subtract = (v1, v2) => {
  v1.x -= v2.x
  v1.y -= v2.y
  v1.z -= v2.z
  return v1
}


vec3.subtractVectors = (v1, v2) => {
  return vec3.subtract(vec3(v1), v2)
}


vec3.multiply = (v1, v2) => {
  v1.x *= v2.x
  v1.y *= v2.y
  v1.z *= v2.z
  return v1
}


vec3.multiplyVectors = (v1, v2) => {
  return vec3.multiply(vec3(v1), v2)
}


vec3.multiplyScalar = (v, scalar) => {
  v.x *= scalar
  v.y *= scalar
  v.z *= scalar
  return v
}


vec3.divide = (v1, v2) => {
  v1.x /= v2.x
  v1.y /= v2.y
  v1.z /= v2.z
  return v1
}


vec3.divideScalar = (v, scalar) => {
  if (scalar !== 0) {
    var inv = 1.0 / scalar
    v.x *= inv
    v.y *= inv
    v.z *= inv
  } else {
    v.x = 0
    v.y = 0
    v.z = 0
  }
  return v
}


vec3.clamp = (v, min, max) => {
  if (v.x < min.x) {
    v.x = min.x
  } else if (v.x > max.x) {
    v.x = max.x
  }
  if (v.y < min.y) {
    v.y = min.y
  } else if (v.y > max.y) {
    v.y = max.y
  }
  if (v.z < min.z) {
    v.z = min.z
  } else if (v.z > max.z) {
    v.z = max.z
  }
  return v
}


vec3.floor = (v) => {
  v.x = Math.floor(v.x)
  v.y = Math.floor(v.y)
  v.z = Math.floor(v.z)
  return v
}


vec3.ceil = (v) => {
  v.x = Math.ceil(v.x)
  v.y = Math.ceil(v.y)
  v.z = Math.ceil(v.z)
  return v
}


vec3.round = (v) => {
  v.x = Math.round(v.x)
  v.y = Math.round(v.y)
  v.z = Math.round(v.z)
  return v
}


vec3.roundToZero = (v) => {
  v.x = (v.x < 0) ? Math.ceil(v.x) : Math.floor(v.x)
  v.y = (v.y < 0) ? Math.ceil(v.y) : Math.floor(v.y)
  v.z = (v.z < 0) ? Math.ceil(v.z) : Math.floor(v.z)
  return v
}


vec3.negate = (v) => {
  v.x = -v.x
  v.y = -v.y
  v.z = -v.z
  return v
}


vec3.dot = (v1, v2) => {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}


vec3.lenSq = (v) => {
  return v.x * v.x + v.y * v.y + v.z * v.z
}


vec3.len = (v) => {
  return Math.sqrt(vec3.lenSq(v))
}


vec3.normalise = (v) => {
  return vec3.divideScalar(v, vec3.len(v))
}


vec3.distanceToSq = (v1, v2) => {
  var dx = v1.x - v2.x
  var dy = v1.y - v2.y
  var dz = v1.z - v2.z
  return dx * dx + dy * dy + dz * dz
}


vec3.distanceTo = (v1, v2) => {
  return Math.sqrt(vec3.distanceToSq(v1, v2))
}


vec3.setLen = (v, length) => {
  var oldLength = vec3.len(v)
  if (oldLength !== 0 && length !== oldLength) {
    vec3.multiplyScalar(v, length / oldLength)
  }
  return v
}


vec3.lerp = (v1, v2, alpha) => {
  v1.x += (v2.x - v1.x) * alpha
  v1.y += (v2.y - v1.y) * alpha
  v1.z += (v2.z - v1.z) * alpha
  return v1
}


export default vec3

