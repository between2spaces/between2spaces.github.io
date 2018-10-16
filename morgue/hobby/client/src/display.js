import { WebGLRenderer } from "threejs/renderers/WebGLRenderer"
import { Scene } from "threejs/scenes/Scene"
import { PerspectiveCamera } from "threejs/cameras/PerspectiveCamera"
import { OrthographicCamera } from "threejs/cameras/OrthographicCamera"
import { Color } from "threejs/math/Color"
import { AmbientLight } from "threejs/lights/AmbientLight"
import { DirectionalLight } from "threejs/lights/DirectionalLight"
import { Vector3 } from "threejs/math/Vector3"
import * as EditorControls from "client/EditorControls"

const scene = new Scene()
scene.background = new Color( 0xffffff )
scene.add( new AmbientLight( new Color( 0xffffff ) ) )

const addDirectionalLight = ( colour, intensity, x, y, z ) => {

    let dirLight = new DirectionalLight( colour, intensity )
    dirLight.position.set( x, y, z )

    dirLight.castShadow = true
    dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 1024 * 2

    dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -300
    dirLight.shadow.camera.right = dirLight.shadow.camera.top = 300

    dirLight.shadow.camera.far = 3500
    dirLight.shadow.bias = -0.0001

    scene.add( dirLight )

}

addDirectionalLight( 0xffffff, 0.5, -1, 1, -1 )

const fov = 90
// const camera = new PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 0.0001, 5000 )
const camera = new OrthographicCamera( 0, 0, 0, 0, 0.0001, 5000 )


const renderer = new WebGLRenderer( { antialias: true } )
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )

document.body.appendChild( renderer.domElement )

let halfWidth = window.innerWidth / 2
let halfHeight = window.innerHeight / 2

const DEG2RAD = Math.PI / 180

const setSize = ( width, height ) => {

    halfWidth = width / 2
    halfHeight = height / 2
    renderer.setSize( width, height )
    updateProjectionMatrix()

}

const updateProjectionMatrix = () => {

    let aspect = halfWidth / halfHeight

    if ( camera.isPerspectiveCamera ) {

        camera.aspect = aspect

    } else if ( camera.isOrthographicCamera ) {

        let distance = camera.position.distanceTo( lookAt.position )
        let frustumHeight = distance * ( 2.0 * Math.tan( fov * 0.5 * DEG2RAD ) )
        let frustumWidth = frustumHeight * aspect

        camera.left = frustumWidth / - 2
        camera.right = frustumWidth / 2
        camera.top = frustumHeight / 2
        camera.bottom = frustumHeight / - 2

    }

    camera.updateProjectionMatrix()

}

window.addEventListener( "resize", () => { setSize( window.innerWidth, window.innerHeight ) }, false )

let lookAt = scene

const setCamera = ( px, py, pz, focus ) => {

    camera.position.set( px, py, pz )
    if ( focus ) lookAt = focus
    camera.lookAt( lookAt.position )
    updateProjectionMatrix()

}

const focus = ( object ) => {

    lookAt = object
    object.mesh.add( camera )
    camera.lookAt( lookAt.position )
    updateProjectionMatrix()

}

setSize( window.innerWidth, window.innerHeight )
setCamera( 0, 5, 0 )

let controls = new EditorControls.EditorControls( camera )

controls.addEventListener( EditorControls.changeEvent.type, () => {
    updateProjectionMatrix() // setSize( window.innerWidth, window.innerHeight )
} )

let mouseX = 0
let mouseY = 0

const onDocumentMouseMove = event => {

    mouseX = event.clientX - halfWidth
    mouseY = event.clientY - halfHeight

}

document.addEventListener( "mousemove", onDocumentMouseMove, false )

const update = () => {

    renderer.render( scene, camera )

}

export { update, scene, setCamera, mouseX, mouseY, focus }