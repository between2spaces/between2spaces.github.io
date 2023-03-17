import { BufferGeometry } from '../threejs/core/BufferGeometry.js'
import { Float32BufferAttribute, Uint32BufferAttribute } from '../threejs/core/BufferAttribute.js'

const QUADBUFFERGEOMETRY = new BufferGeometry()

let vertices = new Float32Array( [
    - 0.5, 0, - 0.5,
      0.5, 0, - 0.5,
      0.5, 0,   0.5,
    - 0.5, 0,   0.5
] )

let uvs = new Float32Array( [
    0.0, 1.0,
    1.0, 1.0,
    1.0, 0.0,
    0.0, 0.0
] )

var indices = new Uint32Array( [
    0, 3, 2, 0, 2, 1
] )

QUADBUFFERGEOMETRY.addAttribute( "position", new Float32BufferAttribute( vertices, 3 ) )
QUADBUFFERGEOMETRY.addAttribute( "uv", new Float32BufferAttribute( uvs, 2 ) )
QUADBUFFERGEOMETRY.setIndex( new Uint32BufferAttribute( indices, 1 ) )

export { QUADBUFFERGEOMETRY }
