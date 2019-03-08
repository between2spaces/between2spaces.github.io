( function () {
    'use strict'
    class Vec2 {
        constructor( a, b ) {
            this.x = a || 0
            this.y = b || 0
        }
        set( a, b ) {
            this.x = a
            this.y = b
            return this
        }
        clone() {
            return new this.constructor( this.x, this.y )
        }
        copy( a ) {
            this.x = a.x
            this.y = a.y
            return this
        }
        equals( a ) {
            return !( this.x !== a.x || this.y !== a.y )
        }
        get width() {
            return this.x
        }
        get height() {
            return this.y
        }
        add( a ) {
            this.x += a.x
            this.y += a.y
            return this
        }
        addVectors( a, b ) {
            this.x = a.x + b.x
            this.y = a.y + b.y
            return this
        }
        addScalar( a ) {
            this.x += a
            this.y += a
            return this
        }
        sub( a ) {
            this.x -= a.x
            this.y -= a.y
            return this
        }
        subVectors( a, b ) {
            this.x = a.x - b.x
            this.y = a.y - b.y
            return this
        }
        multiply( a ) {
            this.x *= a.x
            this.y *= a.y
            return this
        }
        multiplyScalar( a ) {
            this.x *= a
            this.y *= a
            return this
        }
        divide( a ) {
            this.x /= a.x
            this.y /= a.y
            return this
        }
        divideScalar( a ) {
            this.x /= a
            this.y /= a
            return this
        }
        rotate( radians, a ) {
            let s = Math.sin( radians )
            let c = Math.cos( radians )
            this.sub( a )
            let x = this.x
            let y = this.y
            this.set( x * c - y * s, x * s + y * c )
            this.add( a )
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
        distanceTo( a ) {
            let b = this.x - a.x
            a = this.y - a.y
            return Math.sqrt( b * b + a * a )
        }
        toString() {
            return this.x + ',' + this.y
        }
    }
    class EventListener {
        addEventListener( type, listener ) {
            void 0 === this._listeners && ( this._listeners = {} )
            let arr = this._listeners
            void 0 === arr[ type ] && ( arr[ type ] = [] )
            arr[ type ].push( listener )
        }
        hasEventListener( type, listener ) {
            if ( void 0 === this._listeners ) return false
            let arr = this._listeners
            return void 0 !== arr[ type ] && -1 !== arr[ type ].indexOf( listener )
        }
        removeEventListener( type, listener ) {
            if ( void 0 !== this._listeners ) {
                let arr = this._listeners[ type ]
                if ( void 0 === arr ) return
                let i = arr.indexOf( listener )
                if ( - 1 === i ) return
                arr.splice( i, 1 )
            }
        }
        dispatchEvent( type, ...args ) {
            if ( void 0 !== this._listeners ) {
                var arr = this._listeners[ type ]
                if ( void 0 !== arr ) {
                    arr = arr.slice( 0 )
                    setTimeout( () => {
                        for ( let i = 0, l = arr.length; i < l; i++ )
                            arr[ i ].call( this, ...args )
                    }, 0 )
                }
            }
        }
    }
    let nextBoundingBoxId = 0
    class BoundingBox extends EventListener {
        constructor( params ) {
            super()
            params = params || {}
            this.id = nextBoundingBoxId++
            this.name = params.name || 'BoundingBox'
            this.position = new Vec2( typeof params.x !== 'undefined' ? params.x : 0, typeof params.y !== 'undefined' ? params.y : 0 )
            this.rotation = typeof params.rotation !== 'undefined' ? params.rotation : 0
            this.width = typeof params.width !== 'undefined' ? params.width : Infinity
            this.height = typeof params.height !== 'undefined' ? params.height : Infinity
            this.scale = new Vec2( typeof params.sx !== 'undefined' ? params.sx : 1, typeof params.sy !== 'undefined' ? params.sy : 1 )
            this.zorder = params.zorder || 0
            this.spatial = params.spatial ? true : false
            this.physical = params.physical ? true : false
            this.debug = params.debug ? params.debug : {}
            this.a = new Vec2( -Infinity, -Infinity )
            this.b = new Vec2( Infinity, -Infinity )
            this.c = new Vec2( -Infinity, Infinity )
            this.d = new Vec2( Infinity, Infinity )
            this.min = new Vec2( -Infinity, -Infinity )
            this.max = new Vec2( Infinity, Infinity )
            this.update()
        }
        set( x, y, width, height, radians, sx, sy ) {
            this.position.set( x, y )
            this.width = typeof width !== 'undefined' ? width : this.width
            this.height = typeof height !== 'undefined' ? height : this.height
            this.rotation = typeof radians !== 'undefined' ? radians : this.radians
            this.scale.set( typeof sx !== 'undefined' ? sx : this.scale.x, typeof sy !== 'undefined' ? sy : this.scale.y )
            this.update()
        }
        setPosition( x, y ) {
            this.position.set( x, y )
            this.update()
        }
        setSize( width, height ) {
            this.width = width
            this.height = height
            this.update()
        }
        setRotation( radians ) {
            this.rotation = radians
            this.update()
        }
        setScale( sx, sy ) {
            this.scale.set( sx, sy )
            this.update()
        }
        setZOrder( zorder ) {
            this.zorder = zorder
        }
        update() {
            let position = this.position
            let x = position.x
            let y = position.y
            let hx = .5 * this.width * this.scale.x
            let hy = .5 * this.height * this.scale.y
            let sin = Math.sin( this.rotation )
            let cos = Math.cos( this.rotation )
            let hxcos = hx * cos
            let hysin = hy * sin
            let hxsin = hx * sin
            let hycos = hy * cos
            this.a.set( - hxcos + hysin + x + 1, - hxsin - hycos + y + 1 )
            this.b.set( hxcos + hysin + x - 1, hxsin - hycos + y + 1 )
            this.c.set( - hxcos - hysin + x + 1, - hxsin + hycos + y - 1 )
            this.d.set( hxcos - hysin + x - 1, hxsin + hycos + y - 1 )
            this.min.set( Math.min( this.a.x, this.b.x, this.c.x, this.d.x ), Math.min( this.a.y, this.b.y, this.c.y, this.d.y ) )
            this.max.set( Math.max( this.a.x, this.b.x, this.c.x, this.d.x ), Math.max( this.a.y, this.b.y, this.c.y, this.d.y ) )
            if ( this.debug.boundingbox ) {
                if ( !this.debug.boundingbox_min )
                    this.debug.boundingbox_min = new Object2D( { name: 'BoundingBox.Min', sprite: boundingboxdebug_sprite, x: this.min.x, y: this.min.y, physical: false, zorder: this.zorder + 1, sx: .2, sy: .2 } )
                else
                    this.debug.boundingbox_min.setPosition( this.min.x, this.min.y )
                if ( !this.debug.boundingbox_max )
                    this.debug.boundingbox_max = new Object2D( { name: 'BoundingBox.Max', sprite: boundingboxdebug_sprite, x: this.max.x, y: this.max.y, physical: false, zorder: this.zorder + 1, sx: .2, sy: .2 } )
                else
                    this.debug.boundingbox_max.setPosition( this.max.x, this.max.y )
            }
            if ( !scene.cells || !this.spatial ) return
            let lastoccupiedcells = this.occupiedcells
            let currentoccupiedcells = this.cells()
            for ( let i = 0, l = currentoccupiedcells.length; i < l; i++ ) {
                let cell = currentoccupiedcells[ i ]
                let t = lastoccupiedcells ? lastoccupiedcells.indexOf( cell ) : -1
                if ( -1 === t ) {
                    binarySearchInsert( cell.object2ds, this, object2dComparator )
                    if ( this.physical ) cell.collidables.push( this )
                    //if ( this.name === 'Obstacle' ) console.log( 'occupyCell ' + cell.grid.toString(), cell.collidables, this.physical )
                    ENGINE.dispatchEvent( 'occupyCell', cell, this )
                } else {
                    lastoccupiedcells.splice( t, 1 )
                }
            }
            for ( let i = 0, l = lastoccupiedcells ? lastoccupiedcells.length : 0; i < l; i++ ) {
                let cell = lastoccupiedcells[ i ]
                let object2ds = cell.object2ds
                let t = object2ds.indexOf( this )
                if ( - 1 !== t ) object2ds.splice( t, 1 )
                if ( this.physical ) {
                    let collidables = cell.collidables
                    t = collidables.indexOf( this )
                    if ( - 1 !== t ) collidables.splice( t, 1 )
                }
                //if ( this.name === 'Obstacle' ) console.log( 'unoccupyCell ' + cell.grid.toString() )
                ENGINE.dispatchEvent( 'unoccupyCell', cell, this )
            }
            this.occupiedcells = currentoccupiedcells
            //if ( this.name === 'Obstacle' ) console.log( this.occupiedcells.length )
        }
        overlaps( a ) {
            return this.max.x < a.min.x || this.min.x > a.max.x || this.max.y < a.min.y || this.min.y > a.max.y ? false : true
        }
        contains( vec2 ) {
            return vec2.x <= this.min.x || vec2.x >= this.max.x || vec2.y <= this.min.y || vec2.y >= this.max.y ? false : true
        }
        cells( object2dCanOccupy ) {
            let cells = []
            let min = cellAtXY( this.min.x, this.min.y ).grid
            let max = cellAtXY( this.max.x, this.max.y ).grid
            for ( let x = min.x, lx = max.x; x <= lx; x++ ) {
                let col = scene.cells[ x ]
                for ( let y = min.y, ly = max.y; y <= ly; y++ ) {
                    let cell = col[ y ]
                    if ( object2dCanOccupy && 0 === cell.weight( object2dCanOccupy ) ) return false
                    cells.push( cell )
                }
            }
            return object2dCanOccupy ? true : cells
        }
        toString() {
            return this.min.toString() + 'x' + this.max.toString()
        }
    }
    class Cell extends BoundingBox {
        constructor( x, y ) {
            super( { name: 'Cell', spatial: false } )
            this.grid = new Vec2( x, y )
            this.object2ds = []
            this.collidables = []
            let segmentsize = scene.segmentsize
            this.setPosition( x * segmentsize - scene.halfwidth, y * segmentsize - scene.halfheight )
            this.setSize( segmentsize, segmentsize )
        }
        weight( object2d ) {
            let value = ( this.collidables.length > ( this.collidables.indexOf( object2d ) > -1 ? 1 : 0 ) ) ? 0 : 1
            ENGINE.dispatchEvent( 'weight', this, value )
            return value
        }
        /**
         * Returns a list of neighbouring cells in the order [ N, E, S, W (, NE, SE, SW, NW)? ]
         * @param {*} options 
         *          options.nodiagonal (default False) 
         */
        neighbours( options ) {
            options = options || {}
            let grid = this.grid
            let x = grid.x
            let y = grid.y
            let neighbours = [
                cellAtGrid( x, y - 1 ),
                cellAtGrid( x + 1, y ),
                cellAtGrid( x, y + 1 ),
                cellAtGrid( x - 1, y )
            ]
            if ( !options.nodiagonal ) {
                neighbours.push( cellAtGrid( x + 1, y - 1 ) )
                neighbours.push( cellAtGrid( x + 1, y + 1 ) )
                neighbours.push( cellAtGrid( x - 1, y + 1 ) )
                neighbours.push( cellAtGrid( x - 1, y - 1 ) )
            }
            return neighbours
        }
    }
    const scene = {}
    function setScene( options ) {
        options = options || {}
        scene.width = options.width || 512
        scene.height = options.height || 512
        scene.segmentsize = options.segmentsize || 32
        scene.segments = new Vec2( Math.ceil( scene.width / scene.segmentsize ), Math.ceil( scene.height / scene.segmentsize ) )
        scene.halfwidth = .5 * scene.segments.width * scene.segmentsize - .5 * scene.segmentsize
        scene.halfheight = .5 * scene.segments.height * scene.segmentsize - .5 * scene.segmentsize
        scene.cells = new Array( scene.segments.width )
        for ( let x = 0; x < scene.segments.width; x++ ) {
            let col = scene.cells[ x ] = new Array( scene.segments.height )
            for ( let y = 0; y < scene.segments.height; y++ ) {
                col[ y ] = new Cell( x, y )
            }
        }
        if ( options.debug ) {
            if ( options.debug.cells ) {
                debug_cell_blank_sprite.onReady( () => {
                    let sx = scene.segmentsize / debug_cell_blank_sprite.width
                    let sy = scene.segmentsize / debug_cell_blank_sprite.height
                    for ( let x = 0; x < scene.segments.width; x++ ) {
                        let col = scene.cells[ x ]
                        for ( let y = 0; y < scene.segments.height; y++ ) {
                            let cell = col[ y ]
                            cell.object = new Object2D( { name: 'CellDebug ' + x + ',' + y, sprite: debug_cell_blank_sprite, x: cell.position.x, y: cell.position.y, zorder: 999, physical: false } )//, debug: { boundingbox: true } } )
                            cell.object.setScale( sx, sy )
                        }
                    }
                } )
            }
            ENGINE.removeEventListener( 'pathpushcell', debug_path_push )
            ENGINE.removeEventListener( 'pathpopcell', debug_occupy_cell )
            ENGINE.removeEventListener( 'occupyCell', debug_occupy_cell )
            ENGINE.removeEventListener( 'unoccupyCell', debug_occupy_cell )
            if ( options.debug.paths ) {
                ENGINE.addEventListener( 'pathpushcell', debug_path_push )
                ENGINE.addEventListener( 'pathpopcell', debug_occupy_cell )
                ENGINE.addEventListener( 'occupyCell', debug_occupy_cell )
                ENGINE.addEventListener( 'unoccupyCell', debug_occupy_cell )
            }
        }
        camera.setScale( 1, 1 )
        return scene
    }
    function cellAtXY( x, y ) {
        let segmentsize = scene.segmentsize
        if ( !segmentsize ) return null
        x = Math.round( ( scene.halfwidth + x ) / segmentsize )
        y = Math.round( ( scene.halfheight + y ) / segmentsize )
        return cellAtGrid( x, y )
    }
    function cellAtGrid( x, y ) {
        let segments = scene.segments
        return segments ? scene.cells[ Math.min( Math.max( 0, x ), segments.width - 1 ) ][ Math.min( Math.max( 0, y ), segments.height - 1 ) ] : null
    }
    function unoccupyCells( object2d, suppressEvent ) {
        let lastoccupiedcells = object2d.occupiedcells
        if ( !lastoccupiedcells ) return
        for ( let i = 0, l = lastoccupiedcells.length; i < l; i++ ) {
            let cell = lastoccupiedcells[ i ]
            let object2ds = cell.object2ds
            let t = object2ds.indexOf( object2d )
            if ( - 1 !== t ) object2ds.splice( t, 1 )
            if ( object2d.physical ) {
                let collidables = cell.collidables
                t = collidables.indexOf( object2d )
                if ( - 1 !== t ) collidables.splice( t, 1 )
            }
            ENGINE.dispatchEvent( 'unoccupyCell', cell, object2d )
        }
        object2d.occupiedcells = null
    }
    function canOccupy( object2d, x, y ) {
        _BoundingBox.set( x, y, object2d.width, object2d.height, 0, object2d.scale.x, object2d.scale.y )
        return _BoundingBox.cells( object2d )
    }
    function findpath( object2d, start, end, options ) {
        findpath.id = findpath.id ? findpath.id + 1 : 1
        let startcell = cellAtXY( start.x, start.y )
        let endcell = cellAtXY( end.x, end.y )
        if ( startcell === endcell ) {
            ENGINE.dispatchEvent( 'pathpushcell', endcell, object2d )
            return [ end ]
        }
        let endcell_weight = endcell.weight( object2d )
        options = options || {}
        let heap = new Heap
        startcell.parent = null
        startcell.h = heuristic( startcell.grid, endcell.grid )
        startcell.g = 0
        let cell = startcell
        let best = startcell
        let n
        for ( heap.push( startcell ); heap.size(); ) {
            cell = heap.pop()
            if ( cell.h < best.h ) best = cell
            if ( cell === endcell ) break
            cell.closed = findpath.id
            let x = cell.grid.x
            let y = cell.grid.y
            let neighbours = cell.neighbours( options )
            for ( let i = 0, l = neighbours.length; i < l; i++ ) {
                n = neighbours[ i ]
                let grid = n.grid
                let g = canOccupy( object2d, n.position.x, n.position.y ) ? 1 : 0
                if ( 0 === g || n.closed === findpath.id ) continue
                if ( n === endcell && 0 === endcell_weight ) { best = n; break }
                // skip diagonal neighbour if either adjoining neighbour is blocked
                if ( i === 4 && ( 0 === neighbours[ 0 ].weight( object2d ) || 0 === neighbours[ 1 ].weight( object2d ) ) ) continue
                if ( i === 5 && ( 0 === neighbours[ 2 ].weight( object2d ) || 0 === neighbours[ 1 ].weight( object2d ) ) ) continue
                if ( i === 6 && ( 0 === neighbours[ 2 ].weight( object2d ) || 0 === neighbours[ 3 ].weight( object2d ) ) ) continue
                if ( i === 7 && ( 0 === neighbours[ 0 ].weight( object2d ) || 0 === neighbours[ 3 ].weight( object2d ) ) ) continue
                g = cell.g + ( i < 4 ? 1 : 1.4142135623730951 ) * g
                let visited = n.visited
                visited !== findpath.id && ( n.h = heuristic( grid, endcell.grid ), n.g = 0 )
                if ( visited !== findpath.id || g < n.g ) {
                    n.visited = findpath.id
                    n.parent = cell
                    n.g = g
                    n.score = n.g + n.h
                    visited !== findpath.id ? heap.push( n ) : heap.sinkDown( n.index )
                }
            }
            if ( n === endcell && 0 === endcell_weight ) break
        }
        ENGINE.dispatchEvent( 'pathpushcell', best, object2d )
        let path = [ best === endcell ? end : best.position ]
        cell = best.parent
        while ( cell && cell.parent ) {
            ENGINE.dispatchEvent( 'pathpushcell', cell, object2d )
            path.push( cell.position )
            cell = cell.parent
        }
        return path
    }
    class Heap {
        constructor() {
            this.items = []
        }
        push( item ) {
            item.index = this.items.length
            this.items.push( item )
            this.bubbleUp( this.items.length - 1 )
        }
        pop() {
            let items = this.items
            let result = items[ 0 ]
            let end = items.pop()
            0 < items.length && ( items[ 0 ] = end, this.sinkDown( 0 ) )
            return result
        }
        remove( item ) {
            let items = this.items
            let l = items.length
            for ( let i = 0; i < l; i++ )
                if ( items[ i ] == item ) {
                    item = items.pop()
                    if ( i == l - 1 ) break
                    items[ i ] = item
                    this.bubbleUp( i )
                    this.sinkDown( i )
                    break
                }
        }
        size() {
            return this.items.length
        }
        bubbleUp( index ) {
            let items = this.items
            let item = items[ index ]
            let score = item.score
            for ( ; 0 < index; ) {
                let i = Math.floor( ( index + 1 ) / 2 ) - 1
                let parent = items[ i ]
                if ( score >= parent.score ) break
                items[ i ] = item
                item.index = i
                items[ index ] = parent
                parent.index = index
                index = i
            }
        }
        sinkDown( index ) {
            for ( let items = this.items, l = items.length, item = items[ index ], score = item.score; ; ) {
                //    while ( true ) {
                let child2 = 2 * ( index + 1 )
                let child1 = child2 - 1
                let swap = null
                let child1Score
                child1 < l && ( child1Score = items[ child1 ].score, child1Score < score && ( swap = child1 ) )
                child2 < l && items[ child2 ].score < ( null === swap ? score : child1Score ) && ( swap = child2 )
                if ( null === swap ) break
                items[ index ] = items[ swap ]
                items[ index ].index = index
                items[ swap ] = item
                index = item.index = swap
            }
        }
    }
    function heuristic( a, b ) {
        return Math.abs( b.x - a.x ) + Math.abs( b.y - a.y )
    }
    function debounce( func, wait, delayed ) {
        let timeout = 0
        let context
        let args
        return function () {
            context = this
            args = arguments
            let now = performance.now()
            if ( now < timeout ) return
            timeout = now + wait
            !delayed && func.apply( context, args )
            setTimeout( () => {
                timeout > 0 && func.apply( context, args )
                timeout = 0
            }, wait )
        }
    }
    ////////////////////////////////////////////////////////////////////////////
    class Sprite extends EventListener {
        constructor( name, options ) {
            super()
            options = options || {}
            this.canvas = document.createElement( 'canvas' )
            this.ctx = this.canvas.getContext( '2d' )
            let _this = this
            let onload = image => {
                _this.image = image
                _this.canvas.width = image.width
                _this.canvas.height = image.height
                _this.repaint()
                options.onReady && options.onReady( _this )
                _this.dispatchEvent( 'ready', _this )
            }
            if ( image_cache[ name ] )
                onload( image_cache[ name ] )
            else {
                let image = new Image
                image_cache[ name ] = null
                image.onload = () => {
                    image_cache[ name ] = image
                    onload( image )
                }
                image.src = name ? './assets/' + name + '.png' : 'data:image/bmp;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAAH0lEQVR42mNkoBAwjhowasCoAaMGjBowasCoAcPNAACOMAAhOO/A7wAAAABJRU5ErkJggg=='
            }
            options.background && this.setBackground( options.background )
            options.border && this.setBorder( options.border )
        }
        onReady( callback ) {
            if ( this.image ) return callback( this )
            this.addEventListener( 'ready', callback )
        }
        get width() {
            return this.canvas.width
        }
        get height() {
            return this.canvas.height
        }
        setBorder( colour ) {
            this.border = colour
            this.repaint()
        }
        setBackground( colour ) {
            this.background = colour
            this.repaint()
        }
        repaint() {
            this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height )
            this.background && ( this.ctx.fillStyle = this.background, this.ctx.fillRect( 0, 0, this.canvas.width, this.canvas.height ) )
            this.image && this.ctx.drawImage( this.image, 0, 0, this.canvas.width, this.canvas.height )
            this.border && ( this.ctx.beginPath(), this.ctx.strokeStyle = this.border, this.ctx.lineWidth = .5, this.ctx.rect( .5, .5, this.canvas.width -
                1, this.canvas.height - 1 ), this.ctx.stroke() )
        }
        draw( object2d ) {
            let position = object2d.position
            ctx.translate( position.x, position.y )
            object2d.rotation && ctx.rotate( object2d.rotation )
            let scale = object2d.scale
            ctx.scale( scale.x, scale.y )
            let canvas = this.canvas
            let width = canvas.width
            let height = canvas.height
            ctx.drawImage( canvas, .5 * -width, .5 * -height, width, height )
        }
    }
    const image_cache = {}
    ////////////////////////////////////////////////////////////////////////////
    class Object2D extends BoundingBox {
        constructor( params ) {
            params = params || {}
            params.name = typeof params.name === 'string' ? params.name : 'Object2D'
            params.x = typeof params.x !== 'undefined' ? params.x : 0
            params.y = typeof params.y !== 'undefined' ? params.y : 0
            params.width = typeof params.width !== 'undefined' ? params.width : 1
            params.height = typeof params.height !== 'undefined' ? params.height : 1
            params.rotation = typeof params.rotation !== 'undefined' ? params.rotation : 0
            params.sx = typeof params.sx !== 'undefined' ? params.sx : 1
            params.sy = typeof params.sy !== 'undefined' ? params.sy : 1
            params.spatial = typeof params.spatial !== 'undefined' ? params.spatial : true
            params.physical = typeof params.physical !== 'undefined' ? params.physical : true
            super( params )
            this.sprite = params.sprite ? params.sprite : new Sprite( 'blank' )
            this.parent = null
            this.children = []
            this.speed = params.speed || 0.3
            this.debug = params.debug || false
            let _this = this
            let spriteready = () => {
                _this.setSize( _this.sprite.width, _this.sprite.height )
                _this.dispatchEvent( 'ready', _this )
            }
            this.sprite.image ? spriteready() : this.sprite.addEventListener( 'ready', spriteready )
        }
        setSprite( sprite ) {
            this.sprite = sprite
            this.setSize( sprite.width, sprite.height )
        }
        destroy() {
            unoccupyCells( this )
        }
        add( object2d ) {
            binarySearchInsert( this.children, object2d, object2dComparator )
            object2d.parent = this
        }
        remove( object2d ) {
            let children = this.children
            let i = children.indexOf( object2d )
            if ( - 1 !== i ) {
                children.splice( i, 1 )
                object2d.parent = null
            }
        }
        setSpeed( speed ) {
            this.speed = speed
        }
        setPosition( x, y ) {
            super.setPosition( x, y )
            this.dispatchEvent( 'translate', this )
        }
        setRotation( radians ) {
            super.setRotation( radians )
            this.dispatchEvent( 'rotation', this )
        }
        setSize( width, height ) {
            super.setSize( width, height )
            this.dispatchEvent( 'size', this )
        }
        setScale( sx, sy ) {
            super.setScale( sx, sy )
            this.dispatchEvent( 'scale', this )
        }
        move( dx, dy, onComplete ) {
            this.moveAnimationId && stopAnimation( this.moveAnimationId )
            let sx = this.position.x
            let sy = this.position.y
            if ( 0 === this.speed ) { onComplete && onComplete(); return }
            this.setRotation( Math.atan2( dy, dx ) )
            let duration = Math.sqrt( dx * dx + dy * dy ) / ( .1 * this.speed )
            if ( 0 === duration ) return this.setPosition( sx + dx, sy + dy )
            let _this = this
            this.moveAnimationId = startAnimation( duration, lerp => { _this.setPosition( sx + lerp * dx, sy + lerp * dy ) }, onComplete )
        }
        moveTo( position ) {
            let destination = position.clone()
            let _this = this
            function followpath() {
                if ( _this.followingpath && _this.followingpath.length > 0 ) {
                    while ( _this.followingpath.length ) {
                        let position = _this.followingpath.pop()
                        let cell = cellAtXY( position.x, position.y )
                        ENGINE.dispatchEvent( 'pathpopcell', cell, _this )
                    }
                }
                if ( _this.position.equals( destination ) ) return
                _this.followingpath = findpath( _this, _this.position, destination )
                if ( _this.followingpath.length ) {
                    let position = _this.followingpath.pop()
                    let cell = cellAtXY( position.x, position.y )
                    ENGINE.dispatchEvent( 'pathpopcell', cell, _this )
                    let dx = position.x - _this.position.x
                    let dy = position.y - _this.position.y
                    if ( 0 === dx && 0 === dy )
                        _this.followingpath.length && setTimeout( followpath, 0 )
                    else
                        _this.move( dx, dy, followpath )
                }
            }
            followpath()
        }
        draw() {
            ctx.save()
            this.sprite && this.sprite.draw( this )
            let children = this.children
            for ( let i = 0, l = children.length; i < l; i++ )
                children[ i ].draw()
            ctx.restore()
        }
    }
    ////////////////////////////////////////////////////////////////////////////
    class Matrix {
        constructor( translate, rotate, scale ) {
            this.set( translate || new Vec2, rotate || 0, scale || new Vec2( 1, 1 ) )
        }
        set( translate, rotate, scale ) {
            let cos = Math.cos( rotate )
            let sin = Math.sin( rotate )
            this.a = cos * scale.x
            this.b = sin * scale.x
            this.c = - sin * scale.y
            this.d = cos * scale.y
            this.e = translate.x
            this.f = translate.y
        }
        transform( vec2 ) {
            vec2.set( vec2.x * this.a + vec2.y * this.c + this.e, vec2.x * this.b + vec2.y * this.d + this.f )
        }
        toString() {
            return '[ ' + this.a + ', ' + this.b + ', ' + this.c + ', ' + this.d + ', ' + this.e + ', ' + this.f + ' ]'
        }
    }
    ////////////////////////////////////////////////////////////////////////////
    const canvas = document.createElement( 'canvas' )
    let canvas_centre = new Vec2
    const ctx = canvas.getContext( '2d' )
    const mouse = new Vec2
    mouse.button = [ false, false, false ]
    const visible_position_min = new Vec2
    const visible_position_max = new Vec2
    let visible_grid_min
    let visible_grid_max
    const camera = new Object2D( { name: 'Camera', spatial: false, physical: false } )
    const camera_transform = new Matrix()
    function updateCameraTransform() {
        camera_transform.set( camera.position, camera.rotation, camera.scale.clone().set( 1 / camera.scale.x, 1 / camera.scale.y ) )
        this.dispatchEvent( 'transform', this )
    }
    function updateVisibleMinMax() {
        if ( !scene.segmentsize ) return
        camera_transform.transform( visible_position_min.set( - canvas_centre.x, - canvas_centre.y ) )
        camera_transform.transform( visible_position_max.set( canvas_centre.x, canvas_centre.y ) )
        visible_grid_min = cellAtXY( visible_position_min.x, visible_position_min.y ).grid
        visible_grid_max = cellAtXY( visible_position_max.x, visible_position_max.y ).grid
    }
    camera.addEventListener( 'translate', updateCameraTransform )
    camera.addEventListener( 'rotate', updateCameraTransform )
    camera.addEventListener( 'scale', updateCameraTransform )
    camera.addEventListener( 'transform', updateVisibleMinMax )
    function resize() {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        canvas_centre.set( .5 * canvas.width, .5 * canvas.height )
        updateVisibleMinMax()
    }
    resize()
    document.body.appendChild( canvas )
    window.addEventListener( 'resize', resize )
    ////////////////////////////////////////////////////////////////////////////
    const animations = []
    let time = 0
    let nextAnimationId = 0
    function startAnimation( duration, stepCallback, onComplete ) {
        let animation = {
            id: nextAnimationId++,
            start: time,
            duration: duration,
            stepCallback: stepCallback,
            onComplete: onComplete
        }
        animations.push( animation )
        return animation.id
    }
    function stopAnimation( id ) {
        for ( let i = 0; i < animations.length; i++ )
            if ( animations[ i ].id === id ) return animations.splice( i, 1 )
    }
    ////////////////////////////////////////////////////////////////////////////
    function binarySearchInsert( array, item, comparator, noduplicates ) {
        if ( !array.length ) return array.push( item )
        let high = array.length - 1
        let cmp = comparator( array[ high ], item )
        if ( cmp < 0 || ( cmp === 0 && !noduplicates ) ) return array.push( item )
        cmp = comparator( array[ 0 ], item )
        if ( cmp > 0 || ( cmp === 0 && !noduplicates ) ) return array.splice( 0, 0, item )
        let i
        for ( let low = 0; low <= high && ( i = ( low + high ) / 2 | 0, cmp = comparator( array[ i ], item ), cmp !== 0 ); )
            cmp < 0 ? low = i + 1 : high = i - 1
        if ( noduplicates ) {
            do {
                cmp = comparator( array[ i ], item )
                if ( cmp !== 0 ) break
                if ( array[ i ] === item ) return
            } while ( ++i < array.length )
        }
        array.splice( i, 0, item )
    }
    function object2dComparator( a, b ) {
        return a.zorder === b.zorder ? a.position.y - b.position.y : a.zorder - b.zorder
    }
    const _BoundingBox = new BoundingBox( 'Calc' )
    ////////////////////////////////////////////////////////////////////////////
    window.ENGINE = new EventListener
    ////////////////////////////////////////////////////////////////////////////
    const debug_cell_blank_sprite = new Sprite( null, { background: 'rgba(0,0,0,0)', border: '#3d3d3d' } )
    const debug_cell_blocked_sprite = new Sprite( null, { background: 'rgba(0,0,0,0.2)', border: '#7d7d7d' } )
    const debug_cell_path_sprite = new Sprite( null, { background: 'rgba(0,0,255,0.2)', border: '#000077' } )
    function debug_path_push( cell ) {
        cell.object && cell.object.setSprite( debug_cell_path_sprite )
    }
    function debug_occupy_cell( cell, object2d ) {
        cell.object && cell.object.setSprite( 0 === cell.weight() ? debug_cell_blocked_sprite : debug_cell_blank_sprite )
    }
    ////////////////////////////////////////////////////////////////////////////
    ENGINE.visible_object2ds = []
    function render() {
        ctx.save()
        canvas.width = canvas.width
        ctx.translate( canvas_centre.x, canvas_centre.y )
        camera.rotation && ctx.rotate( camera.rotation )
        ctx.scale( camera.scale.x, camera.scale.y )
        ctx.translate( - camera.position.x, - camera.position.y )
        ENGINE.last_visible_object2ds_length = ENGINE.visible_object2ds.length
        ENGINE.visible_object2ds.length = 0
        ENGINE.visible_cells = 0
        if ( typeof visible_grid_min !== 'undefined' ) {
            for ( let x = visible_grid_min.x; x <= visible_grid_max.x; x++ ) {
                let row = scene.cells[ x ]
                for ( let y = visible_grid_min.y; y <= visible_grid_max.y; y++ ) {
                    ENGINE.visible_cells++
                    let object2ds = row[ y ].object2ds
                    for ( let i = 0, l = object2ds.length; i < l; i++ )
                        binarySearchInsert( ENGINE.visible_object2ds, object2ds[ i ], object2dComparator, true )
                }
            }
            // if ( ENGINE.last_visible_object2ds_length !== ENGINE.visible_object2ds.length )
            //     console.log( 'visible object2ds: ' + ENGINE.visible_object2ds.length )
            for ( let i = 0, l = ENGINE.visible_object2ds.length; i < l; i++ )
                ENGINE.visible_object2ds[ i ].draw()
        }
        ctx.restore()
    }
    function updateAnimation( t ) {
        requestAnimationFrame( updateAnimation )
        time = t
        for ( let i = 0; i < animations.length; i++ ) {
            let animation = animations[ i ]
            let lerp = ( t - animation.start ) / animation.duration
            if ( 0 >= animation.duration || 1 <= lerp ) lerp = 1
            if ( animation.stepCallback && animation.stepCallback( lerp ) || 1 === lerp )
                if ( animations.splice( i--, 1 ), animation.onComplete ) animation.onComplete()
        }
        render()
    }
    updateAnimation( 0 )
    function mousemove( e ) {
        mouse.screen_x = e.x
        mouse.screen_y = e.y
        mouse.set( mouse.screen_x - canvas_centre.x, mouse.screen_y - canvas_centre.y )
        camera_transform.transform( mouse )
        ENGINE.dispatchEvent( 'mousemove', mouse )
    }
    window.addEventListener( 'mousemove', debounce( mousemove, 500 ) )
    window.addEventListener( 'mousedown', e => {
        mousemove( e )
        mouse.button[ e.button ] = true
        ENGINE.dispatchEvent( 'mousedown', mouse )
    } )
    window.addEventListener( 'mouseup', e => {
        mouse.button[ e.button ] = false
        ENGINE.dispatchEvent( 'mouseup', mouse )
    } )
    window.addEventListener( 'contextmenu', e => {
        mousemove( e )
        ENGINE.dispatchEvent( 'contextmenu', mouse )
        e.preventDefault()
    } )
    window.addEventListener( 'wheel', e => {
        e.preventDefault()
        e.stopPropagation()
        let delta = ( e.deltaY > 0 ? -1 : 1 ) * .05
        camera.setScale( camera.scale.x + delta, camera.scale.y + delta )
        ENGINE.dispatchEvent( 'wheel', e )
    } )
    ENGINE.canvas = canvas
    ENGINE.mouse = mouse
    ENGINE.debounce = debounce
    ENGINE.setScene = setScene
    ENGINE.camera = camera
    ENGINE.Vec2 = Vec2
    ENGINE.Sprite = Sprite
    ENGINE.Object2D = Object2D
    ENGINE.cellAtXY = cellAtXY
    const boundingboxdebug_sprite = new Sprite( 'blank', { background: '#ff0000', border: '#ff7777' } )
} )()