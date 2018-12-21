let Vec3 = (/**{Vec3}*/vec3) => {
	return {
		x: (!vec3 || !vec3.x) ? 0 : vec3.x,
		y: (!vec3 || !vec3.y) ? 0 : vec3.y,
		z: (!vec3 || !vec3.z) ? 0 : vec3.z
	}
}


Vec3.equals = (v1, v2) => {
	return ((v2.x === v1.x) && (v2.y === v1.y) && (v2.z === v1.z))
}


Vec3.add = (v1, v2) => {
	v1.x += v2.x
	v1.y += v2.y
	v1.z += v2.z
	return v1
}


Vec3.addVectors = (v1, v2) => {
	return Vec3.add(Vec3(v1), v2)
}


Vec3.addScalar = (v, scalar) => {
	v.x += scalar
	v.y += scalar
	v.z += scalar
	return v
}


Vec3.subtract = (v1, v2) => {
	v1.x -= v2.x
	v1.y -= v2.y
	v1.z -= v2.z
	return v1
}


Vec3.subtractVectors = (v1, v2) => {
	return Vec3.subtract(Vec3(v1), v2)
}


Vec3.multiply = (v1, v2) => {
	v1.x *= v2.x
	v1.y *= v2.y
	v1.z *= v2.z
	return v1
}


Vec3.multiplyScalar = (v, scalar) => {
	v.x *= scalar
	v.y *= scalar
	v.z *= scalar
	return v
}


Vec3.divide = (v1, v2) => {
	v1.x /= v2.x
	v1.y /= v2.y
	v1.z /= v2.z
	return v1
}


Vec3.divideScalar = (v, scalar) => {
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


Vec3.clamp = (v, min, max) => {
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


Vec3.floor = (v) => {
	v.x = Math.floor(v.x)
	v.y = Math.floor(v.y)
	v.z = Math.floor(v.z)
	return v
}


Vec3.ceil = (v) => {
	v.x = Math.ceil(v.x)
	v.y = Math.ceil(v.y)
	v.z = Math.ceil(v.z)
	return v
}


Vec3.round = (v) => {
	v.x = Math.round(v.x)
	v.y = Math.round(v.y)
	v.z = Math.round(v.z)
	return v
}


Vec3.roundToZero = (v) => {
	v.x = (v.x < 0) ? Math.ceil(v.x) : Math.floor(v.x)
	v.y = (v.y < 0) ? Math.ceil(v.y) : Math.floor(v.y)
	v.z = (v.z < 0) ? Math.ceil(v.z) : Math.floor(v.z)
	return v
}


Vec3.negate = (v) => {
	v.x = -v.x
	v.y = -v.y
	v.z = -v.z
	return v
}


Vec3.dot = (v1, v2) => {
	return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
}


Vec3.lenSq = (v) => {
	return v.x * v.x + v.y * v.y + v.z * v.z
}


Vec3.len = (v) => {
	return Math.sqrt(Vec3.lenSq(v))
}


Vec3.normalise = (v) => {
	return Vec3.divideScalar(v, Vec3.len(v))
}


Vec3.distanceToSq = (v1, v2) => {
	var dx = v1.x - v2.x
	var dy = v1.y - v2.y
	var dz = v1.z - v2.z
	return dx * dx + dy * dy + dz * dz
}


Vec3.distanceTo = (v1, v2) => {
	return Math.sqrt(Vec3.distanceToSq(v1, v2))
}


Vec3.setLen = (v, length) => {
	var oldLength = Vec3.len(v)
	if (oldLength !== 0 && length !== oldLength) {
		Vec3.multiplyScalar(v, length / oldLength)
	}
	return v
}


Vec3.lerp = (v1, v2, alpha) => {
	v1.x += (v2.x - v1.x) * alpha
	v1.y += (v2.y - v1.y) * alpha
	v1.z += (v2.z - v1.z) * alpha
	return v1
}


export default Vec3
