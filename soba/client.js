// client.js

Array.prototype.random = function () {
    return this.length ? this[ Math.floor( Math.random() * this.length ) ] : null
}

const display = ( function () {
    const canvas = document.getElementById( "game-layer" )
    const ctx = canvas.getContext( "2d", { alpha: false } )

    function onresize() {
        ctx.canvas.style.width = window.innerWidth + "px"
        ctx.canvas.style.height = window.innerHeight + "px"
    }

    onresize()

    function debounce( func, wait, immediate ) {
        let timeout
        return function () {
            let context = this
            let args = arguments
            let later = function () {
                timeout = null
                if ( !immediate ) func.apply( context, args )
            };
            let callNow = immediate && !timeout
            clearTimeout( timeout )
            timeout = setTimeout( later, wait )
            if ( callNow ) func.apply( context, args )
        }
    }

    const resizeListener = debounce( onresize, 250 )

    window.addEventListener( 'resize', resizeListener )

    const sprites = []

    class Sprite {
        constructor( char, colour, fill, border, spritesize ) {
            this.spritesize = spritesize ? spritesize : 32
            this.canvas = document.createElement( "canvas" )
            this.canvas.width = this.canvas.height = this.spritesize
            this.ctx = this.canvas.getContext( "2d" )
            this.ctx.font = Math.floor( this.spritesize ) + "px Monospace"
            this.ctx.textAlign = "center"
            this.ctx.textBaseline = "middle"
            this.x = 0
            this.y = 0
            this.dirty = true
            if ( char ) this.set( char, colour, fill, border )
            sprites.push( this )
        }
        set( char, colour, fill, border ) {
            this.char = char
            this.colour = colour
            this.fill = fill
            this.border = border
            if ( fill ) {
                this.ctx.fillStyle = fill
                this.ctx.fillRect( 0, 0, this.spritesize, this.spritesize )
            }
            if ( border ) {
                this.ctx.beginPath()
                this.ctx.strokeStyle = border
                this.ctx.lineWidth = 1
                this.ctx.rect( 0, 0, this.spritesize, this.spritesize )
                this.ctx.stroke()
            }
            this.ctx.fillStyle = colour
            this.ctx.fillText( char, Math.round( this.spritesize * 0.5 ), Math.round( this.spritesize * 0.4 ) )
        }
        setChar( char ) {
            this.set( char, this.colour, this.fill, this.border )
        }
        setColour( colour ) {
            this.set( this.char, colour, this.fill, this.border )
        }
        setFill( fill ) {
            this.set( this.char, this.colour, fill, this.border )
        }
        setBorder( border ) {
            this.set( this.char, this.colour, this.fill, border )
        }
        updatePos( v ) {
            this.x = ~~( 0.5 + this.spritesize * v.x )
            this.y = ~~( 0.5 + this.spritesize * v.y )
            this.draw()
        }
        setCentre( v ) {
            this.centre.copy( v )
            for ( let i = 0; i < this.sprites; i++ ) {
                this.sprites[ i ].draw()
            }
        }
        draw() {
            ctx.drawImage( this.canvas, this.x, this.y )
        }
    }

    return { Sprite }
} )()


class Vec2 {
    constructor( x, y ) {
        this.x = x || 0
        this.y = y || 0
    }

    get width() {
        return this.x
    }

    set width( value ) {
        this.x = value
    }

    get height() {
        return this.y
    }

    set height( value ) {
        this.y = value
    }

    set( x, y ) {
        this.x = x
        this.y = y
        return this
    }

    clone() {
        return new this.constructor( this.x, this.y )
    }

    copy( v ) {
        this.x = v.x
        this.y = v.y
        return this
    }

    add( v, w ) {
        this.x += v.x
        this.y += v.y
        return this
    }

    addScalar( s ) {
        this.x += s
        this.y += s
        return this
    }

    addVectors( a, b ) {
        this.x = a.x + b.x
        this.y = a.y + b.y
        return this
    }

    addScaledVector( v, s ) {
        this.x += v.x * s
        this.y += v.y * s
        return this
    }

    sub( v, w ) {
        this.x -= v.x
        this.y -= v.y
        return this
    }

    subScalar( s ) {
        this.x -= s
        this.y -= s
        return this
    }

    subVectors( a, b ) {
        this.x = a.x - b.x
        this.y = a.y - b.y
        return this
    }

    multiply( v ) {
        this.x *= v.x
        this.y *= v.y
        return this
    }

    multiplyScalar( scalar ) {
        this.x *= scalar
        this.y *= scalar
        return this
    }

    divide( v ) {
        this.x /= v.x
        this.y /= v.y
        return this
    }

    divideScalar( scalar ) {
        return this.multiplyScalar( 1 / scalar )
    }

    min( v ) {
        this.x = Math.min( this.x, v.x )
        this.y = Math.min( this.y, v.y )
        return this
    }

    max( v ) {
        this.x = Math.max( this.x, v.x )
        this.y = Math.max( this.y, v.y )
        return this
    }

    clamp( min, max ) {
        this.x = Math.max( min.x, Math.min( max.x, this.x ) )
        this.y = Math.max( min.y, Math.min( max.y, this.y ) )
        return this
    }

    clampScalar( minVal, maxVal ) {
        this.x = Math.max( minVal, Math.min( maxVal, this.x ) )
        this.y = Math.max( minVal, Math.min( maxVal, this.y ) )
        return this
    }

    clampLength( min, max ) {
        var length = this.length()
        return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) )
    }

    floor() {
        this.x = Math.floor( this.x )
        this.y = Math.floor( this.y )
        return this
    }

    ceil() {
        this.x = Math.ceil( this.x )
        this.y = Math.ceil( this.y )
        return this
    }

    round() {
        this.x = Math.round( this.x )
        this.y = Math.round( this.y )
        return this
    }

    negate() {
        this.x = - this.x
        this.y = - this.y
        return this
    }

    dot( v ) {
        return this.x * v.x + this.y * v.y
    }

    cross( v ) {
        return this.x * v.y - this.y * v.x
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y
    }

    length() {
        return Math.sqrt( this.x * this.x + this.y * this.y )
    }

    manhattanLength() {
        return Math.abs( this.x ) + Math.abs( this.y )
    }

    normalise() {
        return this.divideScalar( this.length() || 1 )
    }

    angle() {
        // computes the angle in radians with respect to the positive x-axis
        var angle = Math.atan2( this.y, this.x )
        if ( angle < 0 ) angle += 2 * Math.PI
        return angle
    }

    distanceTo( v ) {
        return Math.sqrt( this.distanceToSquared( v ) )
    }

    distanceToSquared( v ) {
        var dx = this.x - v.x, dy = this.y - v.y
        return dx * dx + dy * dy
    }

    manhattanDistanceTo( v ) {
        return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y )
    }

    setLength( length ) {
        return this.normalise().multiplyScalar( length )
    }

    lerp( v, alpha ) {
        this.x += ( v.x - this.x ) * alpha
        this.y += ( v.y - this.y ) * alpha
        return this
    }

    lerpVectors( v1, v2, alpha ) {
        return this.subVectors( v2, v1 ).multiplyScalar( alpha ).add( v1 )
    }

    equals( v ) {
        return ( ( v.x === this.x ) && ( v.y === this.y ) )
    }

    rotateAround( center, angle ) {
        var c = Math.cos( angle ), s = Math.sin( angle )
        var x = this.x - center.x
        var y = this.y - center.y
        this.x = x * c - y * s + center.x
        this.y = x * s + y * c + center.y
        return this
    }

}

const world = ( function () {
    const entities = []
    let nextEntityId = 0
    class Entity {
        constructor( type, cell ) {
            this.id = nextEntityId++
            this.type = type
            this.pos = cell.pos.clone()
            this.sprite = new display.Sprite( " " )
            this.dirty = true
            this.blocking = true
            this.behaviours = []
            entities.push( this )
            this.sprite.updatePos( this.pos )
            this.cell().move( this )
        }
        cell() {
            return grid[ this.pos.x ][ this.pos.y ]
        }
        update() {
            let currentCell = this.cell()
            let neighbouringCells = currentCell.neighbours()
            let neighbouringEntities = []
            neighbouringCells.forEach( cell => {
                cell.entities.forEach( entity => { neighbouringEntities.push( entity ) } )
            } )
            let chosenBehaviour
            for ( let i = 0; i < this.behaviours.length; i++ ) {
                let behaviour = this.behaviours[ i ]
                behaviour.evaluate( this, currentCell, neighbouringCells, neighbouringEntities )
                if ( behaviour.score > 0 && ( !chosenBehaviour || behaviour.score > chosenBehaviour.score ) ) {
                    chosenBehaviour = behaviour
                }
            }
            if ( chosenBehaviour ) chosenBehaviour.perform( this )
        }
    }
    let grid = [ [] ]
    class Cell {
        constructor( x, y ) {
            this.pos = new Vec2( x, y )
            this.sprite = new display.Sprite( " ", null, "#000000", "#333333" )
            this.sprite.updatePos( this.pos )
            this.entities = []
            this.north = this.east = this.south = this.west = null
        }
        neighbours() {
            let cells = []
            this.north && cells.push( this.north )
            this.east && cells.push( this.east )
            this.south && cells.push( this.south )
            this.west && cells.push( this.west )
            return cells
        }
        blocked() {
            let blocking = false
            for ( let i = 0; i < this.entities.length; i++ ) {
                if ( this.entities[ i ].blocking ) return true
            }
            return blocking
        }
        draw() {
            this.sprite.draw()
            this.entities.forEach( entity => { entity.sprite.draw() } )
        }
        move( entity ) {
            entity.previousCell = entity.cell()
            let entities = entity.previousCell.entities
            let i = entities.indexOf( entity )
            if ( i > -1 ) entities.splice( i, 1 )
            entity.pos.copy( this.pos )
            this.entities.push( entity )
            entity.sprite.updatePos( entity.pos )
            entity.previousCell.draw()
        }
    }
    function setSize( width, height ) {
        grid = new Array( width )
        for ( let x = 0; x < width; x++ ) {
            grid[ x ] = new Array( height )
            for ( let y = 0; y < height; y++ ) {
                grid[ x ][ y ] = new Cell( x, y )
            }
        }
        for ( let x = 0; x < width; x++ ) {
            for ( let y = 0; y < height; y++ ) {
                let cell = grid[ x ][ y ]
                if ( x > 0 ) cell.west = grid[ x - 1 ][ y ]
                if ( x < width - 1 ) cell.east = grid[ x + 1 ][ y ]
                if ( y > 0 ) cell.north = grid[ x ][ y - 1 ]
                if ( y < height - 1 ) cell.south = grid[ x ][ y + 1 ]
            }
        }
    }
    function build( asciary, map ) {
        let width = 0
        let height = 0
        let linelength = 0
        for ( let i = 1; i < map.length; i++ ) {
            if ( map.charAt( i ) === "\n" ) {
                width = linelength > width ? linelength : width
                linelength = 0
            } else if ( !linelength++ ) height++
        }
        setSize( width, height )
        let x = 0
        let y = 0
        for ( let i = 1; i < map.length; i++ ) {
            let char = map.charAt( i )
            if ( char === "\n" ) {
                x = 0
                y++
            } else {
                let entityMap = asciary[ char ]
                let cell = grid[ x ][ y ]
                for ( let a = 0; a < entityMap.length; a++ ) {
                    new entityMap[ a ]( cell )
                }
                x++
            }
        }
    }
    function getWidth() {
        return grid.length
    }
    function getHeight() {
        return grid.length > 0 ? grid[ 0 ].length : 0
    }
    function randomUnblockedCell() {
        let cell
        while ( !cell || cell.blocked() ) {
            cell = grid[ Math.round( Math.random() * ( getWidth() - 1 ) ) ][ Math.round( Math.random() * ( getHeight() - 1 ) ) ]
        }
        return cell
    }
    function update() {
        requestAnimationFrame( update )
        for ( let i = 0; i < entities.length; i++ ) {
            let entity = entities[ i ]
            entity.update()
            if ( !entity.dirty ) continue
            entity.dirty = false
            entity.sprite.updatePos( entity.pos )
        }
    }
    requestAnimationFrame( update )
    return { setSize, getWidth, getHeight, Entity, randomUnblockedCell, build }
} )()

class NPC extends world.Entity {
    constructor( cell ) {
        super( "NPC", cell )
        this.sprite.set( "@", "#777777" )
    }
    update() {
        super.update()
    }
}

const movementKeys = {
    "h": "west",
    "j": "south",
    "k": "north",
    "l": "east"
}

class Player extends world.Entity {
    constructor( cell ) {
        super( "PLAYER", cell )
        this.sprite.set( "@", "#777777" )
        let player = this
        document.addEventListener( "keydown", function ( event ) {
            let key = event.key
            if ( key in movementKeys ) {
                let cell = player.cell()[ movementKeys[ key ] ]
                if ( cell && !cell.blocked() ) cell.move( player )
            } else {
                console.log( key )
            }
        } )
    }
    update() {
        super.update()
    }
}

const wonder = {
    evaluate: ( npc, currentCell, neighbouringCells, neighbouringEntities ) => {
        let unblockedNeighbours = []
        neighbouringCells.forEach( cell => { cell.blocked() || cell === npc.previousCell || unblockedNeighbours.push( cell ) } )
        wonder.chosenCell = unblockedNeighbours.random()
        wonder.score = wonder.chosenCell ? 0.5 : 0
    },
    perform: ( npc ) => {
        wonder.chosenCell.move( npc )
    }
}

class Floor extends world.Entity {
    constructor( cell ) {
        super( "FLOOR", cell )
        this.sprite.set( ".", "#333333" )
        this.blocking = false
    }
    update() {
        super.update()
    }
}

class Wall extends world.Entity {
    constructor( cell ) {
        super( "WALL", cell )
        this.sprite.set( "#", "#777777" )
    }
    update() {
        super.update()
    }
}

// world.setSize( 10, 10 )
const asciary = {
    " ": [ Floor ],
    "#": [ Floor, Wall ],
    "@": [ Floor, Player ]
}

world.build( asciary, `
#####
#   #
# @ #
#####` )
