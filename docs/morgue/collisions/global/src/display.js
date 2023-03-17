import { PerspectiveCamera } from './threejs/cameras/PerspectiveCamera.js.js'
import { Scene } from './threejs/scenes/Scene.js.js'
import { Fog } from './threejs/scenes/Fog.js.js'
import { WebGLRenderer } from './threejs/renderers/WebGLRenderer.js.js'
import { OrbitControls } from './OrbitControls.js'
import { DirectionalLight } from './threejs/lights/DirectionalLight.js.js'
import { Frustum } from './threejs/math/Frustum.js.js'
import { Matrix4 } from './threejs/math/Matrix4.js.js'
import { Vector3 } from './threejs/math/Vector3.js.js'

const renderer = new WebGLRenderer()
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )

export const scene = new Scene()
scene.fog = new Fog( 0xffffff, 100, 1000 )
renderer.setClearColor( scene.fog.color )

export const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
const controls = new OrbitControls( camera, renderer.domElement )

const container = document.createElement( 'div' )
document.body.appendChild( container )
container.appendChild( renderer.domElement )


let directionalLight = new DirectionalLight( 0xffffff )
directionalLight.position.x = - 0.5
directionalLight.position.y = 0.5
directionalLight.position.z = - 0.5
directionalLight.position.normalize()
scene.add( directionalLight )

let mouseX = 0, mouseY = 0
let windowHalfX = window.innerWidth / 2
let windowHalfY = window.innerHeight / 2

const projScreenMatrix = new Matrix4()
const frustum = new Frustum()

export function moveCamera( position, lookat ) {
    camera.position.copy( position )
    camera.lookAt( lookat )
    controls.target.copy( lookat )
    // Update inView frustum
    camera.updateMatrix()
    camera.updateMatrixWorld()
    camera.matrixWorldInverse.getInverse( camera.matrixWorld )
    projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse )
    frustum.setFromMatrix( projScreenMatrix )
}

export const inView = function ( point ) {
    return frustum.containsPoint( point )
}

export const update = function () {
    renderer.render( scene, camera )
}

const onWindowResize = function () {
    windowHalfX = window.innerWidth / 2
    windowHalfY = window.innerHeight / 2
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize( window.innerWidth, window.innerHeight )
}

window.addEventListener( 'resize', onWindowResize, false )

const onDocumentMouseMove = function ( event ) {
    mouseX = ( event.clientX - windowHalfX ) * 10
    mouseY = ( event.clientY - windowHalfY ) * 10
}

document.addEventListener( 'mousemove', onDocumentMouseMove, false )
