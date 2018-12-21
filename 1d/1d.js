( function () {

    const print = console.log

    function debounce( func, wait, immediate ) {

        let timeout

        return function () {

            let context = this
            let args = arguments
            let later = () => { timeout = null; !immediate && func.apply( context, args ) }
            let callNow = immediate && !timeout
            clearTimeout( timeout )
            timeout = setTimeout( later, wait )
            callNow && func.apply( context, args )

        }

    }

    class Vec2 {

        constructor( x, y ) {

            this.x = x || 0
            this.y = y || 0

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

        add( v ) {

            this.x += v.x
            this.y += v.y
            return this

        }

        addVectors( a, b ) {

            this.x = a.x + b.x
            this.y = a.y + b.y
            return this

        }

        addScalar( n ) {

            this.x += n
            this.y += n
            return this

        }

        addHeadingVector( angle, length ) {

            this.x += Math.cos( angle ) * length
            this.y += Math.sin( angle ) * length
            return this

        }

        sub( v ) {

            this.x -= v.x
            this.y -= v.y
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

        multiplyScalar( n ) {

            this.x *= n
            this.y *= n
            return this

        }

        divide( v ) {

            this.x /= v.x
            this.y /= v.y
            return this

        }

        divideScalar( n ) {

            this.x /= n
            this.y /= n
            return this

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

        length() {

            return Math.sqrt( this.x * this.x + this.y * this.y )

        }

        distanceTo( v ) {

            let dx = this.x - v.x
            let dy = this.y - v.y
            return Math.sqrt( dx * dx + dy * dy )

        }

        toString() {

            return this.x + "," + this.y

        }

    }

    const boundingboxVec2 = new Vec2()

    class BoundingBox {

        constructor() {

            this.min = new Vec2()
            this.max = new Vec2()

        }

        set( centre, size ) {

            boundingboxVec2.copy( size ).multiplyScalar( 0.5 )
            this.min.subVectors( centre, boundingboxVec2 )
            this.max.addVectors( centre, boundingboxVec2 )

        }

        copy( boundingbox ) {

            this.min.copy( boundingbox.min )
            this.max.copy( boundingbox.max )

        }

        get width() {

            return this.max.x - this.min.x

        }

        get height() {

            return this.max.y - this.min.y

        }

        overlaps( boundingbox ) {

            return ( this.max.x < boundingbox.min.x || this.min.x > boundingbox.max.x || this.max.y < boundingbox.min.y || this.min.y > boundingbox.max.y ) ? false : true

        }

        contains( vec2 ) {

            return ( vec2.x <= this.min.x || vec2.x >= this.max.x || vec2.y <= this.min.y || vec2.y >= this.max.y ) ? false : true

        }

        expand( vec2 ) {

            if ( vec2.x < this.min.x ) this.min.x = vec2.x
            else if ( vec2.x > this.max.x ) this.max.x = vec2.x

            if ( vec2.y < this.min.y ) this.min.y = vec2.y
            else if ( vec2.y > this.max.y ) this.max.y = vec2.y

        }

        toString() {

            return this.min.toString() + "x" + this.max.toString()

        }

    }


    function EventDispatcher() { }

    Object.assign( EventDispatcher.prototype, {

        addEventListener: function ( type, listener ) {

            if ( this._listeners === undefined ) this._listeners = {}
            let listeners = this._listeners
            if ( listeners[ type ] === undefined ) listeners[ type ] = []
            listeners[ type ].push( listener )

        },

        hasEventListener: function ( type, listener ) {

            if ( this._listeners === undefined ) return false
            let listeners = this._listeners
            return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1

        },

        removeEventListener: function ( type, listener ) {

            if ( this._listeners === undefined ) return
            let listeners = this._listeners
            let array = listeners[ type ]
            if ( array === undefined ) return
            for ( let i = array.indexOf( listener ); i > -1; i = array.indexOf( listener ) ) array.splice( i, 1 )

        },

        dispatchEvent: function ( event ) {

            if ( this._listeners === undefined ) return
            let listeners = this._listeners
            let listenerArray = listeners[ event.type ]
            if ( listenerArray === undefined ) return
            event.target = this
            let array = listenerArray.slice( 0 )
            for ( let i = 0, l = array.length; i < l; i++ ) array[ i ].call( this, event )

        }

    } )


    class Obj2 extends EventDispatcher {

        constructor( name ) {

            super()

            this.name = name
            this.position = new Vec2()
            this.size = new Vec2()
            this.rotation = 0
            this.children = []

            this.animation = {
                from: new Vec2(),
                to: new Vec2(),
                start: 0,
                duration: 0
            }

        }

        add( obj ) {

            this.children.push( obj )
            this.dispatchEvent( { type: "add", context: this, obj: obj } )

        }

        remove( obj ) {

            let i = this.children.indexOf( obj )
            if ( i !== -1 ) this.children.splice( i, 1 )
            this.dispatchEvent( { type: "remove", context: this, obj: obj } )

        }

        resize( width, height ) {

            this.size.set( width, height )
            this.dispatchEvent( { type: "resize", context: this, width: width, height: height } )

        }

        translate( x, y ) {

            this.position.set( x, y )
            this.dispatchEvent( { type: "translate", context: this, x: x, y: y } )

        }

        update( ctx ) {

            let array = this.children
            for ( let i = 0, l = array.length; i < l; i++ ) array[ i ].update( ctx )

        }

    }


    class Sprite extends Obj2 {

        constructor( name ) {

            super( name )

            this.canvas = document.createElement( "canvas" )
            this.ctx = this.canvas.getContext( "2d" )

            if ( name ) this.setImage( name )

        }

        setImage( name ) {

            let sprite = this

            sprites.getImage( name, image => {

                sprite.image = image
                sprite.resize( image.width, image.height )
                this.dispatchEvent( { type: "setImage", context: this, name: name } )

            } )

        }

        resize( width, height ) {

            super.resize( Math.round( width ), Math.round( height ) )

            this.canvas.width = this.size.x
            this.canvas.height = this.size.y

            this.repaint()

        }

        setBorder( border ) {

            this.border = border
            this.dispatchEvent( { type: "setBorder", context: this, border: border } )
            this.repaint()

        }

        translate( x, y ) {

            super.translate( x, y )

        }

        repaint() {

            this.canvas.width = this.canvas.width

            if ( this.image ) this.ctx.drawImage( this.image, 0, 0 )

            if ( this.border ) {

                this.ctx.beginPath()
                this.ctx.strokeStyle = this.border
                this.ctx.lineWidth = 0.5
                this.ctx.rect( 0.5, 0.5, this.canvas.width - 1, this.canvas.height - 1 )
                this.ctx.stroke()

            }

            this.dispatchEvent( { type: "repaint", context: this } )

        }

        update( ctx ) {

            let size = this.size

            if ( size.x === 0 || size.y === 0 ) return

            ctx.save()
            ctx.translate( Math.round( this.position.x ), Math.round( this.position.y ) )
            if ( this.rotation ) ctx.rotate( this.rotation )
            ctx.drawImage( this.canvas, - size.x * 0.5, - size.y * 0.5 )
            super.update( this.ctx )
            ctx.restore()

        }

    }


    const entityVec2 = new Vec2()

    class Entity extends Obj2 {

        constructor( name ) {

            super( name )
            this.collidable = true
            this.speed = 0.5
            this.boundingbox = new BoundingBox()
            this.boundingbox.set( this.position, this.size )

            spacial.update( this )

            this.debugbb = new Sprite( "blank" )
            this.debugbb.resize( 0, 0 )
            this.debugbb.setBorder( "#cccccc" )
            this.add( this.debugbb )

        }

        resize( width, height ) {

            super.resize( width, height )
            this.boundingbox.set( this.position, this.size )
            this.debugbb.resize( this.boundingbox.width, this.boundingbox.height )

        }

        translate( x, y ) {

            entityVec2.set( x, y )

            if ( this.collidable ) {

                let collision = spacial.collision( this, entityVec2, this.size )

                if ( collision ) {

                    this.dispatchEvent( { type: "collision", context: this, obj: collision } )
                    return false

                }

            }

            super.translate( x, y )

            this.boundingbox.set( this.position, this.size )

            spacial.update( this )

            return true

        }

        move( dx, dy ) {

            let distance = Math.sqrt( dx * dx + dy * dy )
            let duration = distance / this.speed
            let position = this.position

            animate.start( this, position.x + dx, position.y + dy, duration )

        }

        moveTo( x, y ) {

            let path = spacial.path( player.cell, spacial.cellAt( x, y ) )
            //print( path )
            this.move( x - this.position.x, y - this.position.y )

        }

        update( ctx ) {

            ctx.save()
            ctx.translate( Math.round( this.position.x ), Math.round( this.position.y ) )
            if ( this.rotation ) ctx.rotate( this.rotation )
            super.update( ctx )
            ctx.restore()

        }

    }


    class Heap {

        constructor() {

            this.items = []

        }

        push( item ) {

            //item.index = this.items.length
            this.items.push( item )
            this.bubbleUp( this.items.length - 1 )

        }

        pop() {

            let array = this.items
            let result = array[ 0 ]
            let end = array.pop()

            if ( array.length > 0 ) {

                array[ 0 ] = end
                this.sinkDown( 0 )

            }

            return result

        }

        remove( item ) {

            let array = this.items
            let length = array.length

            for ( let i = 0; i < length; i++ ) {

                if ( array[ i ] != item ) continue

                let end = array.pop()

                if ( i == length - 1 ) break

                array[ i ] = end
                this.bubbleUp( i )
                this.sinkDown( i )
                break

            }

        }

        size() {

            return this.items.length

        }

        bubbleUp( i ) {

            let array = this.items
            let item = array[ i ]
            let score = item.score

            while ( i > 0 ) {

                let parentN = Math.floor( ( i + 1 ) / 2 ) - 1
                let parent = array[ parentN ]

                if ( score >= parent.score ) break

                array[ parentN ] = item
                //item.index = parentN
                array[ i ] = parent
                //parent.index = i
                i = parentN

            }

        }

        sinkDown( i ) {

            let array = this.items
            let length = array.length
            let item = array[ i ]
            let elemScore = item.score

            while ( true ) {

                let child2N = ( i + 1 ) * 2, child1N = child2N - 1
                let swap = null
                let child1Score

                if ( child1N < length ) {

                    let child1 = array[ child1N ]
                    child1Score = child1.score
                    if ( child1Score < elemScore ) swap = child1N

                }

                if ( child2N < length ) {

                    let child2 = array[ child2N ]
                    let child2Score = child2.score
                    if ( child2Score < ( swap === null ? elemScore : child1Score ) ) swap = child2N

                }

                if ( swap === null ) break

                array[ i ] = array[ swap ]
                //array[ i ].index = i
                array[ swap ] = item
                //item.index = swap
                i = swap

            }

        }

    }


    const spacialVec2 = new Vec2()
    const spacialBoundingBox = new BoundingBox()

    const spacial = ( function () {

        const cellsize = 80
        const cells = []

        class Cell {

            constructor( position ) {

                this.position = position.clone()
                this.objects = []
                this.weight = 1

                if ( !cells[ position.x ] ) cells[ position.x ] = []
                cells[ position.x ][ position.y ] = this

                this.debugcell = new Sprite( "blank" )
                this.debugcell.setBorder( "#777799" )
                this.debugcell.resize( cellsize, cellsize )
                this.debugcell.translate( position.x * cellsize, position.y * cellsize )
                scene.add( this.debugcell )

            }

            add( obj ) {

                this.objects.push( obj )

            }

            remove( obj ) {

                let i = this.objects.indexOf( obj )
                if ( i > -1 ) this.objects.splice( i, 1 )

            }

        }

        function cellAt( x, y ) {

            spacialVec2.set( x, y ).divideScalar( cellsize ).round()

            if ( !cells[ spacialVec2.x ] || !cells[ spacialVec2.x ][ spacialVec2.y ] ) {

                return new Cell( spacialVec2 )

            }

            return cells[ spacialVec2.x ][ spacialVec2.y ]

        }

        function update( obj ) {

            let cell = cellAt( obj.position.x, obj.position.y )

            if ( obj.cell !== cell ) {

                if ( obj.cell ) obj.cell.remove( obj )

                cell.add( obj )
                obj.cell = cell

            }

        }

        function vacinity( obj, position, callback ) {

            for ( let y = position.y - cellsize, _y = position.y + cellsize; y <= _y; y += cellsize ) {

                for ( let x = position.x - cellsize, _x = position.x + cellsize; x <= _x; x += cellsize ) {

                    let objects = cellAt( x, y ).objects

                    for ( let i = 0, l = objects.length; i < l; i++ ) {

                        let obj2 = objects[ i ]
                        if ( obj2 !== obj && callback( obj2 ) ) return

                    }

                }

            }

        }

        function collision( obj, position, size ) {

            let collision

            spacialBoundingBox.set( position, size )

            vacinity( obj, position, obj2 => {

                print( obj2 )

                if ( obj2.boundingbox.overlaps( spacialBoundingBox ) ) {

                    collision = obj2
                    return true

                }

            } )

            return collision

        }

        function raytrace( v1, v2 ) {

            let dx = Math.abs( Math.round( v2.x - v1.x ) )
            let dy = Math.abs( Math.round( v2.y - v1.y ) )
            let n = 1 + dx + dy
            let error = dx - dy
            let array = []
            let east = ( v2.x > v1.x ) ? true : false
            let south = ( v2.y > v1.y ) ? true : false
            let cell = cellAt( v1.x, v1.y )

            dx *= 2
            dy *= 2

            for ( ; n > 0; n-- ) {

                if ( error > 0 ) {

                    if ( east ) cell = cellAt( cell.position.x + 1, cell.position.y )
                    else cell = cellAt( cell.position.x - 1, cell.position.y )
                    error -= dy

                } else {

                    if ( south ) cell = cellAt( cell.position.x, cell.position.y + 1 )
                    else cell = cellAt( cell.position.x, cell.position.y - 1 )
                    error += dx

                }

                cell.debugcell.setBorder( "#77ff77" )

                array.push( cell )

            }

            return array

        }

        const heuristics = {
            ignore: () => {
                return 1
            },
            manhattan: ( v1, v2 ) => {
                return Math.abs( v2.x - v1.x ) + Math.abs( v2.y - v1.y )
            },
            diagonal: ( v1, v2 ) => {
                let D = 1, D2 = 1.4142135623730951, // Math.sqrt(2)
                    d1 = Math.abs( v2.x - v1.x ),
                    d2 = Math.abs( v2.y - v1.y )
                return ( D * ( d1 + d2 ) ) + ( ( D2 - ( 2 * D ) ) * Math.min( d1, d2 ) )
            },
            square: ( v1, v2 ) => {
                let dx = Math.abs( v1.x - v2.x ),
                    dy = Math.abs( v1.y - v2.y );
                return ( dx * dx + dy * dy )
            },
            euclidian: ( v1, v2 ) => {
                var dx = Math.abs( v1.x - v2.x ),
                    dy = Math.abs( v1.y - v2.y );
                return Math.sqrt( dx * dx + dy * dy )
            }
        }

        function path( start, end, options ) {

            if ( start === end ) return { path: [ end ], success: true }

            options = options || {}

            let heap = new Heap()
            let heuristic = options.heuristic || heuristics.manhattan
            let closest = start

            start.parent = null
            start.h = heuristic( start.position, end.position )
            start.g = 0
            heap.push( start )

            while ( heap.size() ) {

                let cell = heap.pop()

                if ( cell === end ) return { path: pathTo( cell ), success: true }

                cell.closed = time

                let x = cell.position.x
                let y = cell.position.y

                let neighbours = [
                    cellAt( x - 1, y - 1 ),
                    cellAt( x, y - 1 ),
                    cellAt( x + 1, y - 1 ),
                    cellAt( x - 1, y ),
                    cellAt( x + 1, y ),
                    cellAt( x - 1, y + 1 ),
                    cellAt( x, y + 1 ),
                    cellAt( x + 1, y + 1 )
                ]

                for ( let i = 0; i < 8; i++ ) {

                    let neighbour = neighbours[ i ]
                    neighbour.debugcell.setBorder( '#00ff00' )

                    if ( neighbour.closed === time || neighbour.weight === 0 ) continue

                    let length = ( x === neighbour.position.x || y === neighbour.position.y ) ? 1.4142135623730951 : 1
                    let gScore = cell.g + length * neighbour.weight
                    let beenVisited = neighbour.visited

                    if ( beenVisited !== time ) {

                        neighbour.h = heuristic( neighbour, end )
                        neighbour.g = 0

                    }

                    if ( beenVisited !== time || gScore < neighbour.g ) {

                        neighbour.visited = time
                        neighbour.parent = cell
                        neighbour.g = gScore
                        neighbour.score = neighbour.g + neighbour.h

                        if ( neighbour.h < closest.h || ( neighbour.h === closest.h && neighbour.g < closest.g ) ) {

                            closest = neighbour

                        }

                        if ( beenVisited !== time ) {

                            heap.push( neighbour )

                        } else {

                            heap.sinkDown( heap.items.indexOf( neighbour ) )

                        }

                    }

                }

            }

        }

        function pathTo( cell ) {

            let path = []

            while ( cell.parent ) {
                path.push( cell )
                cell = cell.parent
            }

            return path.reverse()

        }

        return {
            update,
            vacinity,
            collision,
            raytrace,
            path,
            cellAt
        }

    } )()


    const sprites = ( function () {

        const asciimap = {
            "blank": " ",
            "trunk": "O",
            "person": "@"
        }

        const cache = {}

        function getImage( name, onready ) {

            if ( cache[ name ] !== undefined ) return onready( cache[ name ] )

            if ( false ) {

                let image = new Image()
                image.onload = () => {
                    cache[ name ] = image
                    onready( image )
                }
                image.src = "./assets/" + name + ".png"

            } else {

                let canvas = cache[ name ] = document.createElement( "canvas" )
                canvas.width = canvas.height = "32"
                let ctx = canvas.getContext( "2d" )
                ctx.font = canvas.height + "px Monospace"
                ctx.textAlign = "center"
                ctx.textBaseline = "bottom"
                ctx.fillStyle = "grey"
                ctx.fillText( asciimap[ name ], Math.round( canvas.width * 0.5 ), canvas.height )

                return onready( canvas )

            }

        }

        function onReady( onReady ) {

            let count = 0
            let array = Object.keys( asciimap )
            for ( let i = 0, l = array.length; i < l; i++ ) getImage( array[ i ], () => { ++count === array.length && onReady() } )

        }

        return {
            asciimap,
            getImage,
            onReady
        }

    } )()


    const animate = ( function () {

        const animations = []
        let time = 0

        function update( frametime ) {

            for ( let i = 0, l = animations.length; i < l; i++ ) {

                let obj = animations[ i ]
                let lerp = obj.animation
                let t = ( frametime - lerp.start ) / lerp.duration

                if ( t >= 1 ) t = 1

                if ( !obj.translate( lerp.from.x + t * ( lerp.to.x - lerp.from.x ), lerp.from.y + t * ( lerp.to.y - lerp.from.y ) ) || t === 1 ) {

                    animations.splice( i--, 1 )
                    l--

                }

            }

            time = frametime

        }

        function start( obj, x, y, duration ) {

            obj.animation.from.copy( obj.position )
            obj.animation.to.set( x, y )
            obj.animation.start = time
            obj.animation.duration = duration
            animations.push( obj )

        }

        function stop( obj ) {

            let i = animations.indexOf( obj )
            if ( i !== -1 ) animations.splice( i, 1 )

        }

        return {
            start,
            stop,
            update
        }

    } )()


    const scene = ( () => {

        class Scene extends Sprite {

            constructor() {

                super()
                this.needsUpdate = true

            }

            update() {

                if ( !scene.needsUpdate ) return

                scene.needsUpdate = false
                this.canvas.width = this.canvas.width
                let ctx = this.ctx
                ctx.save()

                ctx.translate( Math.round( this.size.x * 0.5 - this.position.x ), Math.round( this.size.y * 0.5 - this.position.y ) )
                let array = this.children
                for ( let i = 0, l = array.length; i < l; i++ ) array[ i ].update( ctx )
                ctx.restore()

            }

        }

        let scene = new Scene()

        scene.resize( window.innerWidth, window.innerHeight )

        const focusedTranslateListener = e => {

            let position = e.context.position
            scene.position.set( position.x, position.y )
            scene.needsUpdate = true

        }

        scene.focus = obj => {

            if ( scene.focused ) scene.focused.removeEventListener( "translate", focusedTranslateListener )
            obj.addEventListener( "translate", focusedTranslateListener )
            scene.focused = obj

        }

        const collisionListener = e => { print( e.context.name + " collided with " + e.obj.name ) }

        const needsUpdateListener = e => { scene.needsUpdate = true }

        const addListener = e => {

            scene.needsUpdate = true
            e.obj.addEventListener( "collision", collisionListener )

        }

        scene.addEventListener( "add", addListener )

        scene.addEventListener( "remove", needsUpdateListener )
        scene.addEventListener( "translate", needsUpdateListener )
        scene.addEventListener( "resize", needsUpdateListener )

        const resizeListener = debounce( () => { scene.resize( window.innerWidth, window.innerHeight ) }, 250 )
        window.addEventListener( "resize", resizeListener )
        document.body.appendChild( scene.canvas )

        return scene

    } )()

    // end of general function and class definitions

    // start of game specific setup

    const KeyMap = {
        "i": "interact",
        "Escape": "escape"
    };


    ( function () {
        let obj = new Entity( "trunk" )
        obj.resize( 50, 50 )
        obj.translate( -70, 70 )
        scene.add( obj )
    } )()

    const player = new Entity( "player" )
    let sprite = new Sprite( "person" )
    player.add( sprite )
    player.resize( sprite.size.x, sprite.size.y )
    scene.add( player )
    scene.focus( player )

    sprites.onReady( () => { scene.needsUpdate = true } )


    const keys = ( function () {

        const down = {}

        function onKeyDown( event ) {

            let key = event.key

            down[ key ] = true

        }

        function onKeyUp( event ) {

            let key = event.key

            down[ key ] = false

        }

        document.addEventListener( "keydown", onKeyDown )
        document.addEventListener( "keyup", onKeyUp )

        function isDown( key ) {

            return down[ key ]

        }

        return {
            isDown
        }

    } )()


    let mode = "normal"

    document.addEventListener( "keyup", event => {

        let key = event.key

        if ( KeyMap[ key ] === undefined ) return

        let command = KeyMap[ key ]

        if ( mode === "normal" && command === "interact" ) {

            mode = "interact"

        } else if ( mode !== "normal" && command === "escape" ) {

            mode = "normal"

        }

    } )

    const mouse = new Vec2()

    document.addEventListener( "mousemove", event => {

        mouse.set( event.x - scene.size.x * 0.5 + scene.position.x, event.y - scene.size.y * 0.5 + scene.position.y )
        if ( mouse.down ) player.moveTo( mouse.x, mouse.y )

    } )

    document.addEventListener( "mousedown", event => {

        mouse.down = true
        player.moveTo( mouse.x, mouse.y )

    } )

    document.addEventListener( "mouseup", event => {

        mouse.down = false

    } )

    document.addEventListener( "contextmenu", event => {

        player.moveTo( mouse.x, mouse.y )
        event.preventDefault()

    } )


    function update( frametime ) {

        requestAnimationFrame( update )
        time = frametime
        animate.update( frametime )
        scene.update()

    }

    let time = 0

    update()

} )()