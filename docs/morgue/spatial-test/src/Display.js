import { PerspectiveCamera } from 'threejs'
import { OrthographicCamera } from 'threejs'
import { Scene } from 'threejs'
import { WebGLRenderer } from 'threejs'
import { DirectionalLight } from 'threejs'
import { AmbientLight } from 'threejs'
import { Vector2 } from 'threejs'
import { Vector3 } from 'threejs'
import { _Math } from 'threejs'
import { EventDispatcher } from 'threejs'
import * as global from './global'
import { OrbitControls } from './OrbitControls'
import * as events from './events'


export class Display extends EventDispatcher {

    constructor( options ) {

        super()

        options = options || {}

        this.renderer = new WebGLRenderer( { antialias: true } )
        this.renderer.setPixelRatio( window.devicePixelRatio )

        let container = document.createElement( 'div' )
        document.body.appendChild( container )
        container.appendChild( this.renderer.domElement )

        this.scene = new Scene()

        let camera = !options[ 'camera' ] ? 'perspective' : options[ 'camera' ]
        this.near = !options[ 'near' ] ? 1 : options[ 'near' ]
        this.far = !options[ 'far' ] ? 100 : options[ 'far' ]
        this.fov = !options[ 'fov' ] ? 35 : options[ 'fov' ]

        if ( camera === 'perspective' ) {

            this.camera = new PerspectiveCamera( this.fov, 0, this.near, this.far )

        } else if ( camera === 'orthographic' ) {

            this.camera = new OrthographicCamera( 0, 0, 0, 0, this.near, this.far )

        } else {

            console.warn( 'Display option { camera: "' + camera + '" } not supported' )

        }

        this.camera.position.set( 0, 50, 0 )
        // this.camera.up.set( 0, 1, 0 )

        this.previousCameraPosition = new Vector3()
        this.previousCameraZoom = this.camera.zoom
        this.previousCameraLookAt = new Vector3( 0, 0, -1 )

        if ( camera === 'orthographic' ) {

            this.camera.zoom = 1 / 50.0

        }

        this.centre = new Vector2()

        this.setSize( window.innerWidth, window.innerHeight )

        this.orbitcontrols = new OrbitControls( this.camera, this.renderer.domElement )
        this.orbitcontrols.maxPolarAngle = _Math.degToRad( 60 )

        let _this = this
        window.addEventListener( 'resize', function () { _this.setSize( window.innerWidth, window.innerHeight ) } )

    }

    addAmbientLight( colour ) {

        this.scene.add( new AmbientLight( colour ) )

    }

    addDirectionalLight( colour, intensity, x, y, z ) {

        let dirLight = new DirectionalLight( colour, intensity )
        dirLight.position.set( x, y, z )
        this.scene.add( dirLight )

        dirLight.castShadow = true
        dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 1024 * 2

        dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -300
        dirLight.shadow.camera.right = dirLight.shadow.camera.top = 300

        dirLight.shadow.camera.far = 3500
        dirLight.shadow.bias = -0.0001

    }

    setSize( width, height ) {

        this.aspect = width / height

        if ( this.camera.isPerspectiveCamera ) {

            this.camera.aspect = this.aspect

        } else if ( this.camera.isOrthographicCamera ) {

            let frustumHeight = 2.0 * Math.tan( _Math.degToRad( this.fov * 0.5 ) )
            let frustumWidth = frustumHeight * this.aspect

            this.camera.left = frustumWidth / - 2
            this.camera.right = frustumWidth / 2
            this.camera.top = frustumHeight / 2
            this.camera.bottom = frustumHeight / - 2

        }

        this.renderer.setSize( width, height )
        this.camera.updateProjectionMatrix()
        this.centre.set( width / 2, height / 2 )

        this.camera.dispatchEvent( global.changeEvent )

    }

    follow( worldobject ) {

        let camera = this.camera

        worldobject.addEventListener( events.OBJECT3D_CREATED, function ( event ) {

            camera.lookAt( event.object3d.position )
            event.object3d.add( camera )

        } )

    }

    update() {

        let camera = this.camera

        this.renderer.render( this.scene, camera )

        // Dispatch a change event on the camera if it's position or lookAt vector has changed
        let dispatchChangeEvent = false

        let previous = this.previousCameraLookAt

        cameraLookAt.set( 0, 0, -1 )
        cameraLookAt.applyQuaternion( camera.quaternion )


        if ( this.previousCameraZoom !== camera.zoom ) {

            this.previousCameraZoom = camera.zoom
            dispatchChangeEvent = true

        } else if ( cameraLookAt.x !== previous.x || cameraLookAt.y !== previous.y || cameraLookAt.z !== previous.z ) {

            previous.copy( cameraLookAt )
            dispatchChangeEvent = true

        } else {

            cameraPosition.setFromMatrixPosition( camera.matrixWorld )
            previous = this.previousCameraPosition

            if ( cameraPosition.x !== previous.x || cameraPosition.y !== previous.y || cameraPosition.z !== previous.z ) {

                previous.copy( cameraPosition )
                dispatchChangeEvent = true

            }

        }

        if ( dispatchChangeEvent ) {

            this.camera.dispatchEvent( global.changeEvent )

        }

    }

}


const cameraPosition = new Vector3()
const cameraLookAt = new Vector3()


const style = document.createElement( 'style' )
style.textContent = 'body { margin: 0; overflow: hidden; background-color: black }'
document.getElementsByTagName( 'head' )[ 0 ].appendChild( style )
