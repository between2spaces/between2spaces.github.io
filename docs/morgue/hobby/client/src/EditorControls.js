import { Vector3 } from "threejs/math/Vector3"
import { Box3 } from "threejs/math/Box3"
import { Matrix3 } from "threejs/math/Matrix3"
import { Vector2 } from "threejs/math/Vector2"
import { Spherical } from "threejs/math/Spherical"
import { EventDispatcher } from "threejs/core/EventDispatcher"


class EditorControls extends EventDispatcher {

    constructor( object, domElement ) {

        super()

        this.object = object
        this.domElement = ( domElement !== undefined ) ? domElement : document;

        this.enabled = true;
        this.center = new Vector3();
        this.panSpeed = 0.001;
        this.zoomSpeed = 0.1;
        this.rotationSpeed = 0.005;

        let _this = this
        this.domElement.addEventListener( 'contextmenu', event => { scope = _this; contextmenu( event ) }, false );
        this.domElement.addEventListener( 'mousedown', event => { scope = _this; onMouseDown( event ) }, false );
        this.domElement.addEventListener( 'wheel', event => { scope = _this; onMouseWheel( event ) }, false );

    }

    focus( target ) {

        var distance;

        box.setFromObject( target );

        if ( box.isEmpty() === false ) {

            this.center.copy( box.getCenter() );
            distance = box.getBoundingSphere().radius;

        } else {

            // Focusing on an Group, AmbientLight, etc

            this.center.setFromMatrixPosition( target.matrixWorld );
            distance = 0.1;

        }

        delta.set( 0, 0, 1 );
        delta.applyQuaternion( this.object.quaternion );
        delta.multiplyScalar( distance * 4 );

        this.object.position.copy( this.center ).add( delta );

        this.dispatchEvent( changeEvent );

    }

    pan( delta ) {

        var distance = this.object.position.distanceTo( this.center );

        delta.multiplyScalar( distance * this.panSpeed );
        delta.applyMatrix3( normalMatrix.getNormalMatrix( this.object.matrix ) );

        this.object.position.add( delta );
        this.center.add( delta );

        this.dispatchEvent( changeEvent );

    }

    zoom( delta ) {

        var distance = this.object.position.distanceTo( this.center );

        delta.multiplyScalar( distance * this.zoomSpeed );

        if ( delta.length() > distance ) return;

        delta.applyMatrix3( normalMatrix.getNormalMatrix( this.object.matrix ) );

        this.object.position.add( delta );

        this.dispatchEvent( changeEvent );

    }

    rotate( delta ) {

        vector.copy( this.object.position ).sub( this.center );

        spherical.setFromVector3( vector );

        spherical.theta += delta.x;
        spherical.phi += delta.y;

        spherical.makeSafe();

        vector.setFromSpherical( spherical );

        this.object.position.copy( this.center ).add( vector );

        this.object.lookAt( this.center );

        this.dispatchEvent( changeEvent );

    }

}



const onMouseDown = event => {

    if ( scope.enabled === false ) return;

    if ( event.button === 0 ) {

        state = STATE.ROTATE;

    } else if ( event.button === 1 ) {

        state = STATE.ZOOM;

    } else if ( event.button === 2 ) {

        state = STATE.PAN;

    }

    pointerOld.set( event.clientX, event.clientY );

    scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
    scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
    scope.domElement.addEventListener( 'mouseout', onMouseUp, false );
    scope.domElement.addEventListener( 'dblclick', onMouseUp, false );

}

const onMouseMove = event => {

    if ( scope.enabled === false ) return;

    pointer.set( event.clientX, event.clientY );

    var movementX = pointer.x - pointerOld.x;
    var movementY = pointer.y - pointerOld.y;

    if ( state === STATE.ROTATE ) {

        scope.rotate( delta.set( - movementX * scope.rotationSpeed, - movementY * scope.rotationSpeed, 0 ) );

    } else if ( state === STATE.ZOOM ) {

        scope.zoom( delta.set( 0, 0, movementY ) );

    } else if ( state === STATE.PAN ) {

        scope.pan( delta.set( - movementX, movementY, 0 ) );

    }

    pointerOld.set( event.clientX, event.clientY );

}

const onMouseUp = event => {

    scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
    scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
    scope.domElement.removeEventListener( 'mouseout', onMouseUp, false );
    scope.domElement.removeEventListener( 'dblclick', onMouseUp, false );

    state = STATE.NONE;

}

const onMouseWheel = event => {

    event.preventDefault();

    // Normalize deltaY due to https://bugzilla.mozilla.org/show_bug.cgi?id=1392460
    scope.zoom( delta.set( 0, 0, event.deltaY > 0 ? 1 : - 1 ) );

}

const contextmenu = event => {

    event.preventDefault();

}

const vector = new Vector3();
const delta = new Vector3();
const box = new Box3();

const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2 };
let state = STATE.NONE;

const normalMatrix = new Matrix3();
const pointer = new Vector2();
const pointerOld = new Vector2();
const spherical = new Spherical();

const changeEvent = { type: 'change' };

let scope


export { EditorControls, changeEvent }
