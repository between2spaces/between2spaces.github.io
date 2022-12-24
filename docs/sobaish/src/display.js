import { PerspectiveCamera } from './threejs/cameras/PerspectiveCamera.js'
import { Scene } from './threejs/scenes/Scene.js'
import { Fog } from './threejs/scenes/Fog.js'
import { WebGLRenderer } from './threejs/renderers/WebGLRenderer.js'
import { OrbitControls } from './OrbitControls.js'
import { DirectionalLight } from './threejs/lights/DirectionalLight.js'
import { Frustum } from './threejs/math/Frustum.js'
import { Matrix4 } from './threejs/math/Matrix4.js'
import { Vector3 } from './threejs/math/Vector3.js'

const renderer = new WebGLRenderer()
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )

const scene = new Scene()
scene.fog = new Fog( 0xffffff, 100, 1000 )
renderer.setClearColor( scene.fog.color )

const camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
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

function moveCamera( position, lookat ) {
    camera.position.copy( position )
    updateFrustum()
}

const projScreenMatrix = new Matrix4()
const frustum = new Frustum()

function updateFrustum() {
    camera.updateMatrix()
    camera.updateMatrixWorld()
    camera.matrixWorldInverse.getInverse( camera.matrixWorld )
    projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse )
    frustum.setFromMatrix( projScreenMatrix )
}

function inView( point ) {
    return frustum.containsPoint( point )
}

function update() {
    renderer.render( scene, camera )
    updateFrustum()
}

window.addEventListener( 'resize', onWindowResize, false )

function onWindowResize() {
    windowHalfX = window.innerWidth / 2
    windowHalfY = window.innerHeight / 2
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize( window.innerWidth, window.innerHeight )
}

document.addEventListener( 'mousemove', onDocumentMouseMove, false )

function onDocumentMouseMove( event ) {
    mouseX = ( event.clientX - windowHalfX ) * 10
    mouseY = ( event.clientY - windowHalfY ) * 10
}

export {
    camera,
    controls,
    scene,
    renderer,
    mouseX,
    mouseY,
    windowHalfX,
    windowHalfY,
    updateFrustum,
    inView,
    update,
}
