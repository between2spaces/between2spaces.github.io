import './p2'

const world = new World()

const objects = []

const Object = function ( options ) {
    options = options || {}
    let width = options.width !== undefined ? options.width : 1
    let height = options.height !== undefined ? options.height : 1
    let position = options.position ? clone( options.position ) : Vec2( 0, 0 )
    let object = {
        element: document.createElement( 'div' ),
        physics: addBox( world, {
            width: width,
            height: height,
            mass: options.mass !== undefined ? options.mass : 1,
            position: position,
        } )
    }
    object.element.style.width = width
    object.element.style.height = height
    document.body.appendChild( object.element )
    object.element.style.webkitTransform = 'translate(' + position[ 0 ] + 'px,' + position[ 1 ] + 'px)'
    objects.push( object )
}

Object()

const STEP = 1 / 60


function animate() {
    requestAnimationFrame( animate )
    world.step( STEP )
    let i = objects.length
    while ( i-- ) {
        let object = objects[ i ]
        object.element.style.webkitTransform = 'translate(' + physics.position[ 0 ] + 'px,' + physics.position[ 1 ] + 'px)'
    }
}

requestAnimationFrame( animate )

/*
let ground = new Body( { mass: 0 } )
ground.addShape( new Plane( new Vec3( 0, 0, 1 ) ) )
world.addBody( ground )

let style = document.createElement( 'style' )
let basestyle = 'position: absolute; display: inline-block; padding: 1em; border: 1px solid gray;'
style.textContent = '\n' + [
    '.fallingkey_ { ' + basestyle + ' background-color: red; }',
    '.fallingkey { ' + basestyle + ' transition: background-color 1s ease; background-color: rgba( 255, 255, 255, 0 ); }'
].join( '\n' ) + '\n'
document.getElementsByTagName( 'head' )[ 0 ].appendChild( style )

let current = 0
let elapsed = 0
const step = 1.0 / 60.0
const keys = []

function update( time ) {
    requestAnimationFrame( update )
    elapsed = time - current
    current = time
    let i = keys.length
    while( i-- ) {
        let k = keys[ i ]
        let p = k.b.position
        k.e.style.webkitTransform = 'translate(' + p.x + 'px,' + p.z + 'px)' 
        k.e.style.transform = 'translate(' + p.x + 'px,' + p.z + 'px)'
    }
    world.step( step )
}

update()

document.addEventListener( 'keyup', event => {
    ;( ( label, e ) => {
        let b = new Body( { mass: 1 } )
        b.addShape( new Box( new Vec3( 1, 1, 1 ) ) )
        world.addBody( b )
        e.className = 'fallingkey_'
        e.textContent = label
        document.body.appendChild( e )
        setTimeout( () => e.className = 'fallingkey', 30 )
        keys.push( {
            e: e,
            b: b
        } )
    } )( event.key.replace( / /, 'Space' ), document.createElement( 'div' ) )
} )
*/