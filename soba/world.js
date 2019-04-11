( ( WORLDJS ) => {
    'use strict'
    let nextGUID = 0
    WORLDJS.addEventListener = ( object, type, listener ) => {
        void 0 === object._listeners && ( object._listeners = {} )
        let arr = object._listeners
        void 0 === arr[ type ] && ( arr[ type ] = [] )
        arr[ type ].push( listener )
    }
    function hasEventListener( object, type, listener ) {
        if ( void 0 === object._listeners ) return false
        let arr = object._listeners
        return void 0 !== arr[ type ] && -1 !== arr[ type ].indexOf( listener )
    }
    WORLDJS.removeEventListener = ( object, type, listener ) => {
        if ( void 0 === object._listeners ) return
        let arr = object._listeners[ type ]
        if ( void 0 === arr ) return
        let i = arr.indexOf( listener )
        if ( - 1 === i ) return
        arr.splice( i, 1 )
    }
    WORLDJS.dispatchEvent = ( object, type, ...args ) => {
        if ( void 0 === object._listeners ) return
        let arr = object._listeners[ type ]
        if ( void 0 === arr ) return
        arr = arr.slice( 0 )
        for ( let i = 0, l = arr.length; i < l; i++ ) arr[ i ].call( object, ...args )
        //setTimeout( () => { }, 0 )
    }
    function set( vec, x, y ) {
        vec.x = x
        vec.y = y
        return vec
    }
    function rotate( vec, radians, origin ) {
        let sin = Math.sin( radians )
        let cos = Math.cos( radians )
        if ( origin ) {
            vec.x -= origin.x
            vec.y -= origin.y
        }
        let x = vec.x
        vec.x = vec.x * cos - vec.y * sin
        vec.y = x * sin + vec.y * cos
        if ( origin ) {
            vec.x += origin.x
            vec.y += origin.y
        }
    }
    function length( vec ) {
        return Math.sqrt( vec.x * vec.x + vec.y * vec.y )
    }
    function distance( a, b ) {
        let x = a.x - b.x
        let y = a.y - b.y
        return Math.sqrt( x * x + y * y )
    }
    function heuristic( a, b ) {
        return Math.abs( b.x - a.x ) + Math.abs( b.y - a.y )
    }
    WORLDJS.containsPoint = ( node, point ) => {
        let sin = Math.sin( -node.rotation )
        let cos = Math.cos( -node.rotation )
        let _x = point.x - node.x
        let y = point.y - node.y
        let x = _x * cos - y * sin
        y = _x * sin + y * cos
        let width = .5 * node.width
        let height = .5 * node.height
        return !( x < -width || x > width || y < -height || y > height )
    }
    WORLDJS.defineNode = options => {
        let node = Object.assign( {
            id: nextGUID++,
            ready: false,
            name: '',
            x: 0,
            y: 0,
            width: 1,
            height: 1,
            rotation: 0,
            rotation_delta: 0,
            layer: 0,
            spatial: true,
            physical: false,
            rotationLock: false,
            cells: [],
            children: [],
            speed: 0,
            inview: false,
            opacity: 1,
            sprite_scale: 1,
            sprite_scale_delta: 0
        },
            options
        )
        WORLDJS.setSprite( node, options.sprite )
        return node
    }
    WORLDJS.setSprite = ( node, sprite ) => {
        let name = sprite && sprite.name ? sprite.name : sprite && sprite.image ? sprite.image : null
        if ( !name ) { if ( node.sprite ) delete node.sprite; node.ready = true; return }
        node.sprite = { x: 0, y: 0, width: 1, height: 1 }
        Object.assign( node.sprite, sprite )
        node.sprite.name = name
        sprite = WORLDJS.sprites[ node.sprite.name ] || WORLDJS.defineSprite( sprite )
        function ready() {
            node.ready = true
            WORLDJS.dispatchEvent( node, 'ready', node )
        }
        sprite.image ? ready() : WORLDJS.addEventListener( sprite, 'ready', ready )
    }
    function comparator( node_a, node_b ) {
        let layer = node_a.layer - node_b.layer
        return layer === 0 ? node_a.y - node_b.y : layer
    }
    function insert( array, item, comparator, noduplicates ) {
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
    WORLDJS.add = ( parent, node ) => {
        if ( !node ) {
            node = typeof parent.id === 'undefined' ? WORLDJS.defineNode( parent ) : parent
            node.ready ? assignNodeToCells( node ) : WORLDJS.addEventListener( node, 'ready', () => { assignNodeToCells( node ) } )
            return node
        }
        node = typeof node.id === 'undefined' ? WORLDJS.defineNode( node ) : node
        if ( 0 > parent.children.indexOf( node ) ) {
            parent.children.push( node )
            WORLDJS.dispatchEvent( WORLDJS, 'cellchildrenchanged', parent )
        }
        return node
    }
    WORLDJS.remove = ( parent, node ) => {
        if ( !node ) {
            for ( let i = 0; i < parent.cells.length; i++ )
                WORLDJS.remove( parent.cells[ i ], parent )
            return
        }
        let i = parent.children.indexOf( node )
        if ( 0 > i ) return
        parent.children.splice( i, 1 )
        WORLDJS.dispatchEvent( WORLDJS, 'cellchildrenchanged', parent )
    }
    function assignNodeToCells( node ) {
        let cells = WORLDJS.cellsOccupiedBy( node, node )
        let nodecellschanged = false
        for ( let i = 0; i < node.cells.length; i++ ) {
            let cell = node.cells[ i ]
            let t = cells.indexOf( cell )
            if ( -1 < t ) {
                cells.splice( t, 1 )
                continue
            }
            node.cells.splice( i, 1 )
            nodecellschanged = true
            i--
            t = cell.children.indexOf( node )
            if ( - 1 < t ) {
                cell.children.splice( t, 1 )
                WORLDJS.dispatchEvent( WORLDJS, 'cellchildrenchanged', cell )
            }
        }
        for ( let i = 0, l = cells.length; i < l; i++ ) {
            let cell = cells[ i ]
            node.cells.push( cell )
            nodecellschanged = true
            if ( 0 > cell.children.indexOf( node ) ) {
                cell.children.push( node )
                WORLDJS.dispatchEvent( WORLDJS, 'cellchildrenchanged', cell )
            }
        }
        if ( nodecellschanged ) WORLDJS.dispatchEvent( node, 'nodecellschanged', node )
        let inview = false
        for ( let i = 0, l = node.cells.length; i < l; i++ )
            if ( node.cells[ i ].inview ) { inview = true; break }
        if ( inview !== node.inview ) {
            let t = inview_nodes.indexOf( node )
            if ( inview ) -1 === t && insert( inview_nodes, node, comparator )
            else -1 < t && inview_nodes.splice( t, 1 )
            node.inview = inview
        }
    }
    WORLDJS.translate = ( node, x, y, duration, onComplete ) => {
        if ( x === node.x && y === node.y ) { onComplete && onComplete(); return }
        let dx = x - node.x
        let dy = y - node.y
        node.rotationLock || ( node.rotation = Math.atan2( dy, dx ) )
        if ( !duration ) {
            WORLDJS.add( set( node, x, y ) )
            following === node && WORLDJS.follow( node )
            WORLDJS.dispatchEvent( node, 'translate', node )
            onComplete && onComplete()
            return
        }
        x = node.x
        y = node.y
        node.moveAnimationId = startAnimation( duration, lerp => {
            WORLDJS.add( set( node, x + lerp * dx, y + lerp * dy ) )
            following === node && WORLDJS.follow( node )
            WORLDJS.dispatchEvent( node, 'translate', node )
        }, onComplete )
    }
    WORLDJS.move = ( node, dx, dy, onComplete ) => {
        node.moveAnimationId && stopAnimation( node.moveAnimationId )
        if ( 0 === node.speed || ( 0 === dx && 0 === dy ) ) { onComplete && onComplete(); return }
        let x = node.x
        let y = node.y
        let hx = .5 * node.width
        let hy = .5 * node.height
        let corners
        if ( dx <= 0 && dy <= 0 )
            corners = [ { x: 0, y: 0 }, { x: -hx, y: -hy }, { x: hx, y: -hy }, { x: -hx, y: hy } ]
        else if ( dx <= 0 && dy > 0 )
            corners = [ { x: 0, y: 0 }, { x: -hx, y: -hy }, { x: -hx, y: hy }, { x: hx, y: hy } ]
        else if ( dx > 0 && dy <= 0 )
            corners = [ { x: 0, y: 0 }, { x: hx, y: -hy }, { x: -hx, y: -hy }, { x: hx, y: hy } ]
        else
            corners = [ { x: 0, y: 0 }, { x: hx, y: hy }, { x: -hx, y: hy }, { x: hx, y: -hy } ]
        for ( let i = 0; i < corners.length; i++ ) {
            let corner = corners[ i ]
            let b = { x: x + dx + corner.x, y: y + dy + corner.y }
            let cells = WORLDJS.ray( { x: x + corner.x, y: y + corner.y }, b, node, true )
            let l = cells.length
            if ( 0 === l ) continue
            let last = cells[ l - 1 ]
            if ( 0 !== last.weight ) continue
            let target = WORLDJS.cellXY( b.x, b.y, node )
            if ( 0 === target.weight && 2 > length( { x: target.col - last.col, y: target.row - last.row } ) ) {
                let min_hx_hy = Math.min( hx, hy )
                dx = -last._ray_info.dx
                dy = -last._ray_info.dy
                set( b, dx, dy )
                while ( length( b ) < min_hx_hy ) {
                    b.x += dx; b.y += dy
                }
                b.x += last._ray_info.x
                b.y += last._ray_info.y
                while ( WORLDJS.cellsOccupiedBy( node, b, true ) ) {
                    b.x += dx
                    b.y += dy
                }
                dx = b.x - x
                dy = b.y - y
                break
            }
            return path( node, x + dx, y + dy, onComplete )
        }
        let duration = Math.sqrt( dx * dx + dy * dy ) / node.speed
        WORLDJS.translate( node, x + dx, y + dy, duration, onComplete )
    }
    function path( node, x, y, onComplete ) {
        if ( x === node.x && y === node.y ) { onComplete && onComplete(); return }
        node.followingpath = findpath( node, x, y )
        function followpath() {
            if ( ( x === node.x && y === node.y ) || 0 === node.followingpath.length ) { onComplete && onComplete(); return }
            let p = node.followingpath.pop()
            let dx = p.x - node.x
            let dy = p.y - node.y
            if ( 0 === dx && 0 === dy ) return followpath()
            let duration = Math.sqrt( dx * dx + dy * dy ) / node.speed
            WORLDJS.translate( node, node.x + dx, node.y + dy, duration, followpath )
        }
        followpath()
    }
    function draw( node ) {
        ctx.save()
        ctx.translate( node.x, node.y )
        if ( node.rotation || node.rotation_delta ) ctx.rotate( node.rotation + node.rotation_delta )
        if ( node.sprite && node.sprite.name ) {
            let sprite = WORLDJS.sprites[ node.sprite.name ]
            if ( node.opacity < 1 ) ctx.globalAlpha = node.opacity
            let sprite_half_width = sprite.half_width * node.sprite_scale + node.sprite_scale_delta
            let sprite_half_height = sprite.half_height * node.sprite_scale + node.sprite_scale_delta
            ctx.drawImage( sprite.canvas, node.sprite.x * sprite_half_width - sprite_half_width, node.sprite.y * sprite_half_height - sprite_half_height, 2 * sprite_half_width, 2 * sprite_half_height )
        }
        for ( let i = 0, l = node.children.length; i < l; i++ ) draw( node.children[ i ] )
        ctx.restore()
    }
    WORLDJS.opacity = ( node, opacity ) => {
        node.opacity = opacity
        return node
    }
    WORLDJS.CELLSIZE = 32
    const cells = {}
    WORLDJS.cellCOLROW = ( col, row, weigh ) => {
        let key = col + ',' + row
        let exists = cells.hasOwnProperty( key )
        let cell = exists ? cells[ key ] : cells[ key ] = {
            col: col,
            row: row,
            x: col * WORLDJS.CELLSIZE,
            y: row * WORLDJS.CELLSIZE,
            children: [],
            inview: false
        }
        if ( weigh ) {
            cell.weight = 1
            for ( let i = 0, l = cell.children.length, node = cell.children[ i ]; i < l; node = cell.children[ ++i ] )
                if ( node.physical && node !== weigh ) { cell.weight = 0; break }
        }
        if ( !exists ) WORLDJS.dispatchEvent( WORLDJS, 'oncellnew', cell )
        return cell
    }
    WORLDJS.cellXY = ( x, y, weigh ) => {
        return WORLDJS.cellCOLROW( Math.floor( ( x / WORLDJS.CELLSIZE ) + .5 ), Math.floor( ( y / WORLDJS.CELLSIZE ) + .5 ), weigh )
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
    function findpath( node, x, y ) {
        findpath.id = findpath.id ? findpath.id + 1 : 1
        let start = { x: node.x, y: node.y }
        let end = { x: x, y: y }
        let startcell = WORLDJS.cellXY( start.x, start.y )
        let endcell = WORLDJS.cellXY( x, y, node )
        if ( startcell === endcell ) return [ end ]
        let heap = new Heap
        startcell.parent = null
        startcell.h = heuristic( startcell, endcell )
        startcell.g = 0
        let cell = startcell
        let best = startcell
        let neighbour
        let cap = 500 // caps the exploration to a limited number of cells; when reached the current best path is returned
        for ( heap.push( startcell ); heap.size(); ) {
            cell = heap.pop()
            if ( cell.h < best.h ) best = cell
            if ( cell === endcell || 0 === cap-- ) break
            cell.closed = findpath.id
            let col = cell.col
            let row = cell.row
            let neighbours = [
                WORLDJS.cellCOLROW( col, row - 1, node ),
                WORLDJS.cellCOLROW( col + 1, row, node ),
                WORLDJS.cellCOLROW( col, row + 1, node ),
                WORLDJS.cellCOLROW( col - 1, row, node ),
                WORLDJS.cellCOLROW( col + 1, row - 1, node ),
                WORLDJS.cellCOLROW( col + 1, row + 1, node ),
                WORLDJS.cellCOLROW( col - 1, row + 1, node ),
                WORLDJS.cellCOLROW( col - 1, row - 1, node )
            ]
            for ( let i = 0, l = neighbours.length; i < l; i++ ) {
                neighbour = neighbours[ i ]
                if ( neighbour.closed === findpath.id ) continue
                cell.debug1 && WORLDJS.setSprite( cell.debug1, { name: 'debugpathfind' } )
                let g = WORLDJS.cellsOccupiedBy( node, neighbour, true ) ? 0 : 1
                if ( 0 === g ) continue
                if ( neighbour === endcell && 0 === endcell.weight ) { best = neighbour; break }
                // skip diagonal neighbour if either adjoining neighbour is blocked
                if ( i === 4 && ( 0 === neighbours[ 0 ].weight || 0 === neighbours[ 1 ].weight ) ) continue
                if ( i === 5 && ( 0 === neighbours[ 2 ].weight || 0 === neighbours[ 1 ].weight ) ) continue
                if ( i === 6 && ( 0 === neighbours[ 2 ].weight || 0 === neighbours[ 3 ].weight ) ) continue
                if ( i === 7 && ( 0 === neighbours[ 0 ].weight || 0 === neighbours[ 3 ].weight ) ) continue
                g = cell.g + ( i < 4 ? 1 : 1.4142135623730951 ) * g
                let visited = neighbour.visited
                visited !== findpath.id && ( neighbour.h = heuristic( neighbour, endcell ), neighbour.g = 0 )
                if ( visited !== findpath.id || g < neighbour.g ) {
                    neighbour.visited = findpath.id
                    neighbour.parent = cell
                    neighbour.g = g
                    neighbour.score = neighbour.g + neighbour.h
                    visited !== findpath.id ? heap.push( neighbour ) : heap.sinkDown( neighbour.index )
                }
            }
            if ( neighbour === endcell && 0 === endcell.weight ) break
        }
        let path = [ best === endcell ? end : best ]
        cell = best.parent
        while ( cell && cell.parent ) {
            cell.debug0 && WORLDJS.setSprite( cell.debug0, { name: 'debugpath' } )
            path.push( cell )
            cell = cell.parent
        }
        return path
    }
    WORLDJS.ray = ( a, b, node, stoponcollision ) => {
        let x = a.x
        let y = a.y
        let vx = b.x - x
        let vy = b.y - y
        if ( 0 === vx && 0 === vy ) return [ WORLDJS.cellXY( x, y, node ) ]
        let l = vx * vx + vy * vy
        let cells = []
        // test every 13 pixels
        let dx = 13 * ( vx / Math.sqrt( l ) )
        let dy = 13 * ( vy / Math.sqrt( l ) )
        vx = 0
        vy = 0
        while ( true ) {
            let cell = WORLDJS.cellXY( x + vx, y + vy, node )
            //cell.debug1 && WORLDJS.setSprite( cell.debug1, { name: 'debugray' } )
            if ( cells.indexOf( cell ) < 0 ) cells.push( cell )
            if ( stoponcollision && 0 === cell.weight ) {
                cell._ray_info = { a: a, b: b, x: x + vx, y: y + vy, dx: dx, dy: dy }
                return cells
            }
            vx += dx
            vy += dy
            if ( vx * vx + vy * vy >= l ) {
                cell = WORLDJS.cellXY( b.x, b.y, node )
                //cell.debug1 && WORLDJS.setSprite( cell.debug1, { name: 'debugray' } )
                cells.indexOf( cell ) < 0 && cells.push( cell )
                if ( stoponcollision && 0 === cell.weight )
                    cell._ray_info = { a: a, b: b, x: x + vx, y: y + vy, dx: dx, dy: dy }
                break
            }
        }
        return cells
    }
    WORLDJS.cellsOccupiedBy = ( node, pos, testcollision, width, height ) => {
        let overlapped = [ WORLDJS.ray( pos, pos, node, true )[ 0 ] /* centrecell, topleftcell, ..., bottomrightcell */ ]
        width = typeof width !== 'undefined' ? width : node.width
        height = typeof height !== 'undefined' ? height : node.height
        if ( width <= WORLDJS.CELLSIZE && height <= WORLDJS.CELLSIZE ) return testcollision ? 0 === overlapped[ 0 ].weight : overlapped
        let a = { x: 0, y: 0 }
        let b = { x: 0, y: 0 }
        let hx = .5 * width
        let hy = .5 * height
        let i, l, cell, cells
        rotate( set( a, pos.x - hx, pos.y - hy ), node.rotation, pos )
        rotate( set( b, pos.x - hx, pos.y + hy - 1 ), node.rotation, pos )
        for ( cells = WORLDJS.ray( a, b, node, testcollision ), l = cells.length, i = 0, cell = cells[ i ]; i < l; cell = cells[ ++i ] )
            if ( testcollision && 0 === cell.weight ) return true; else 0 > overlapped.indexOf( cell ) && overlapped.push( cell )
        rotate( set( b, pos.x + hx - 1, pos.y - hy ), node.rotation, pos )
        for ( cells = WORLDJS.ray( a, b, node, testcollision ), l = cells.length, i = 0, cell = cells[ i ]; i < l; cell = cells[ ++i ] )
            if ( testcollision && 0 === cell.weight ) return true; else 0 > overlapped.indexOf( cell ) && overlapped.push( cell )
        rotate( set( a, pos.x + hx - 1, pos.y + hy - 1 ), node.rotation, pos )
        for ( cells = WORLDJS.ray( a, b, node, testcollision ), l = cells.length, i = 0, cell = cells[ i ]; i < l; cell = cells[ ++i ] )
            if ( testcollision && 0 === cell.weight ) return true; else 0 > overlapped.indexOf( cell ) && overlapped.push( cell )
        rotate( set( b, pos.x - hx, pos.y + hy - 1 ), node.rotation, pos )
        for ( cells = WORLDJS.ray( a, b, node, testcollision ), l = cells.length, i = 0, cell = cells[ i ]; i < l; cell = cells[ ++i ] )
            if ( testcollision && 0 === cell.weight ) return true; else 0 > overlapped.indexOf( cell ) && overlapped.push( cell )
        return testcollision ? false : overlapped
    }
    WORLDJS.debounce = ( wait, func, delayed ) => {
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
                timeout > 0 && delayed && func.apply( context, args )
                timeout = 0
            }, wait )
        }
    }
    WORLDJS.sprites = {}
    const images_ready = {}
    const images_loading = {}
    WORLDJS.defineSprite = ( options ) => {
        options = options || {}
        let name = options.name ? options.name : options.image ? options.image : undefined
        let imagename = options.image ? options.image : 'blank'
        if ( WORLDJS.sprites[ name || imagename ] ) return WORLDJS.sprites[ name || imagename ]
        let sprite = WORLDJS.sprites[ name || imagename ] = {
            name: name,
            canvas: document.createElement( 'canvas' ),
            ctx: null,
            width: 0,
            height: 0,
            fill: options.fill ? options.fill : null,
            border: options.border ? options.border : 0,
            bordercolour: options.bordercolour ? options.bordercolour : '#777777',
            ready: false
        }
        sprite.ctx = sprite.canvas.getContext( '2d' )
        sprite.ctx.imageSmoothingEnabled = false
        let ready = e => {
            if ( !images_ready[ imagename ] ) {
                delete images_loading[ imagename ]
                sprite.image = images_ready[ imagename ] = e.target
            }
            sprite.image = images_ready[ imagename ]
            sprite.canvas.width = sprite.image.width
            sprite.canvas.height = sprite.image.height
            sprite.half_width = .5 * Math.max( 1, typeof options.width !== 'undefined' ? options.width : sprite.image.width )
            sprite.half_height = .5 * Math.max( 1, typeof options.height !== 'undefined' ? options.height : sprite.image.height )
            sprite.ready = true
            repaint( sprite )
            if ( options.ready ) options.ready( sprite )
            WORLDJS.dispatchEvent( sprite, 'ready', sprite )
        }
        if ( images_ready[ imagename ] ) return ready()
        if ( !images_loading[ imagename ] ) {
            images_loading[ imagename ] = new Image
            images_loading[ imagename ].addEventListener( 'load', ready )
            images_loading[ imagename ].src = './assets/' + imagename + '.png'
        } else {
            images_loading[ imagename ].addEventListener( 'load', ready )
        }
        return sprite
    }
    function repaint( sprite ) {
        let width = sprite.canvas.width
        let height = sprite.canvas.height
        let ctx = sprite.ctx
        ctx.clearRect( 0, 0, width, height )
        sprite.fill && ( ctx.fillStyle = sprite.fill, ctx.fillRect( 0, 0, width, height ) )
        sprite.image && ctx.drawImage( sprite.image, 0, 0, width, height )
        sprite.border && ( ctx.beginPath(), ctx.strokeStyle = sprite.bordercolour, ctx.lineWidth = .5 * sprite.border, ctx.rect( .5, .5, width - 1, height - 1 ), ctx.stroke() )
    }
    const canvas = document.createElement( 'canvas' )
    document.body.appendChild( canvas )
    const ctx = canvas.getContext( '2d', { alpha: false } )
    ctx.imageSmoothingEnabled = false
    const viewport = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        rotation: 0,
        scale: 1,
        overdraw: 2 * WORLDJS.CELLSIZE
    }
    const inview_cells = []
    const inview_nodes = []
    function updateViewport() {
        viewport.width = canvas.width + viewport.overdraw * 2
        viewport.height = canvas.height + viewport.overdraw * 2
        let check_inview = []
        for ( let i = 0; i < inview_cells.length; i++ ) {
            let cell = inview_cells[ i ]
            if ( !WORLDJS.containsPoint( viewport, cell ) ) {
                cell.inview = false
                inview_cells.splice( i, 1 )
                i--
                for ( let t = 0, l = cell.children.length; t < l; t++ ) check_inview.push( cell.children[ t ] )
            }
        }
        let halfheight = .5 * viewport.height / viewport.scale
        let halfwidth = .5 * viewport.width / viewport.scale
        for ( let row = Math.round( ( viewport.y - halfheight ) / WORLDJS.CELLSIZE ), lastrow = Math.round( ( viewport.y + halfheight ) / WORLDJS.CELLSIZE ); row <= lastrow; row++ ) {
            for ( let col = Math.round( ( viewport.x - halfwidth ) / WORLDJS.CELLSIZE ), lastcol = Math.round( ( viewport.x + halfwidth ) / WORLDJS.CELLSIZE ); col <= lastcol; col++ ) {
                let cell = WORLDJS.cellCOLROW( col, row )
                if ( !cell.inview ) {
                    cell.inview = true
                    if ( inview_cells.indexOf( cell ) === -1 ) inview_cells.push( cell )
                    for ( let t = 0, l = cell.children.length; t < l; t++ ) {
                        let node = cell.children[ t ]
                        if ( !node.inview ) {
                            node.inview = true
                            inview_nodes.push( node )
                        }
                    }
                }
            }
        }
        for ( let i = 0, l = check_inview.length; i < l; i++ ) {
            let node = check_inview[ i ]
            let inview = false
            for ( let t = 0, l = node.cells.length; t < l; t++ ) {
                let cell = node.cells[ t ]
                if ( cell.inview ) {
                    inview = true
                    break
                }
            }
            if ( !inview ) {
                node.inview = false
                let t = inview_nodes.indexOf( node )
                t > -1 && inview_nodes.splice( t, 1 )
            }
        }
        inview_nodes.sort( comparator )
    }
    function resize() {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
        updateViewport()
    }
    WORLDJS.setOverdraw = overdraw => {
        viewport.overdraw = overdraw
        updateViewport()
    }
    let following = null
    WORLDJS.follow = node => {
        following = node
        viewport.x = node.x
        viewport.y = node.y
        updateViewport()
    }
    const animations = []
    WORLDJS.time = 0
    function startAnimation( duration, stepCallback, onComplete ) {
        let animation = {
            id: nextGUID++,
            start: WORLDJS.time,
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
    WORLDJS.render = () => {
        ctx.save()
        canvas.width = canvas.width
        ctx.fillStyle = '#382a08'
        ctx.fillRect( 0, 0, canvas.width, canvas.height )
        ctx.translate( .5 * canvas.width, .5 * canvas.height )
        viewport.rotation && ctx.rotate( viewport.rotation )
        ctx.scale( viewport.scale, viewport.scale )
        ctx.translate( - viewport.x, - viewport.y )
        for ( let i = 0, l = inview_nodes.length; i < l; i++ ) {
            let node = inview_nodes[ i ]
            _visibleUpdate( node )
            draw( node )
        }
        ctx.restore()
    }
    function updateAnimation( t ) {
        requestAnimationFrame( updateAnimation )
        WORLDJS.time = t
        _globalUpdate()
        for ( let i = 0; i < animations.length; i++ ) {
            let animation = animations[ i ]
            let lerp = ( t - animation.start ) / animation.duration
            if ( 0 >= animation.duration || 1 <= lerp ) lerp = 1
            if ( animation.stepCallback && animation.stepCallback( lerp ) || 1 === lerp )
                if ( animations.splice( i--, 1 ), animation.onComplete ) animation.onComplete()
        }
        WORLDJS.render()
    }
    let _globalUpdate = () => { }
    let _visibleUpdate = ( node ) => { }
    WORLDJS.start = ( globalUpdate, visibleUpdate ) => {
        _globalUpdate = globalUpdate
        _visibleUpdate = visibleUpdate
        resize()
        updateAnimation( 0 )
        window.addEventListener( 'resize', resize )
        WORLDJS.render()
    }
    WORLDJS.mouse = {
        screen: { x: 0, y: 0 },
        world: { x: 0, y: 0 },
        left: false,
        middle: false,
        right: false
    }
    window.addEventListener( 'mousemove', e => {
        if ( 0 === WORLDJS.mouse.screen.x - e.x && 0 === WORLDJS.mouse.screen.y - e.y ) return
        WORLDJS.mouse.screen.x = e.x
        WORLDJS.mouse.screen.y = e.y
        WORLDJS.mouse.world.x = ( WORLDJS.mouse.screen.x - .5 * canvas.width ) / viewport.scale + viewport.x
        WORLDJS.mouse.world.y = ( WORLDJS.mouse.screen.y - .5 * canvas.height ) / viewport.scale + viewport.y
        WORLDJS.dispatchEvent( WORLDJS, 'mousemove', WORLDJS.mouse )
    } )
    window.addEventListener( 'mousedown', e => {
        if ( 0 === e.button ) WORLDJS.mouse.left = true
        else if ( 1 === e.button ) WORLDJS.mouse.middle = true
        else if ( 2 === e.button ) WORLDJS.mouse.right = true
        WORLDJS.dispatchEvent( WORLDJS, 'mousedown', WORLDJS.mouse )
    } )
    window.addEventListener( 'touchstart', e => {
        let touchobj = e.changedTouches[ 0 ] // reference first touch point (ie: first finger)
        let x = parseInt( touchobj.clientX ) // get x position of touch point relative to left edge of browser
        let y = parseInt( touchobj.clientY ) // get x position of touch point relative to left edge of browser
        if ( 0 === WORLDJS.mouse.screen.x - x && 0 === WORLDJS.mouse.screen.y - y ) return
        WORLDJS.mouse.screen.x = x
        WORLDJS.mouse.screen.y = y
        WORLDJS.mouse.world.x = ( WORLDJS.mouse.screen.x - .5 * canvas.width ) / viewport.scale + viewport.x
        WORLDJS.mouse.world.y = ( WORLDJS.mouse.screen.y - .5 * canvas.height ) / viewport.scale + viewport.y
        WORLDJS.dispatchEvent( WORLDJS, 'mousemove', WORLDJS.mouse )
        WORLDJS.mouse.left = true
        WORLDJS.dispatchEvent( WORLDJS, 'mousedown', WORLDJS.mouse )
        e.preventDefault()
    }, false )
    window.addEventListener( 'touchend', function ( e ) {
        var touchobj = e.changedTouches[ 0 ] // reference first touch point for this event
        WORLDJS.mouse.left = false
        WORLDJS.dispatchEvent( WORLDJS, 'mouseup', WORLDJS.mouse )
        e.preventDefault()
    }, false )
    window.addEventListener( 'mouseup', e => {
        if ( 0 === e.button ) WORLDJS.mouse.left = false
        else if ( 1 === e.button ) WORLDJS.mouse.middle = false
        else if ( 2 === e.button ) WORLDJS.mouse.right = false
        WORLDJS.dispatchEvent( WORLDJS, 'mouseup', WORLDJS.mouse )
    } )
    window.addEventListener( 'contextmenu', e => {
        e.stopPropagation()
        e.preventDefault()
        WORLDJS.dispatchEvent( WORLDJS, 'contextmenu', WORLDJS.mouse )
    } )
    WORLDJS.zoom = zoom => {
        viewport.scale = zoom
    }
    WORLDJS.noise = ( x, y ) => {
        /* x and y should be in the range [ 0, 1 ] */
        /* returns [ -1, 1 ] */
        let a = WORLDJS.noise, c = a.g2, n = a.perm, p = a.perm123, e = a.grad3
        a = ( x + y ) * a.f2
        let f = x + a >> 0, b = y + a >> 0, d = ( f + b ) * c
        a = x - ( f - d )
        d = y - ( b - d )
        let q = 0, r = 1
        a > d && ( q = 1, r = 0 )
        let t = a - q + c, u = d - r + c, v = a - 1 + 2 * c
        c = d - 1 + 2 * c
        f &= 255
        let w = b & 255, g = .5 - a * a - d * d, h = .5 - t * t - u * u, k = .5 - v * v - c * c, l = 0, m = 0, z = 0
        0 <= g && ( b = p[ f + n[ w ] ], g *= g, l = g * g * ( e[ b ] * a + e[ b + 1 ] * d ) )
        0 <= h && ( b = p[ f + q + n[ w + r ] ], h *= h, m = h * h * ( e[ b ] * t + e[ b + 1 ] * u ) )
        0 <= k && ( b = p[ f + 1 + n[ w + 1 ] ], k *= k, z = k * k * ( e[ b ] * v + e[ b + 1 ] * c ) )
        return 70 * ( l + m + z )
    }
    WORLDJS.noise.f2 = 0.5 * ( Math.sqrt( 3.0 ) - 1.0 )
    WORLDJS.noise.g2 = ( 3.0 - Math.sqrt( 3.0 ) ) / 6.0
    WORLDJS.noise.perm = new Uint8Array( 512 )
    WORLDJS.noise.perm123 = new Uint8Array( 512 )
    WORLDJS.noise.grad3 = new Float32Array( [
        1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
        1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
        0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1
    ] )
    WORLDJS.seed = function ( seed ) {
        let d = WORLDJS.noise, e = d.perm, b = 0, c = 0
        d = d.perm123
        for ( ; c < seed.length; ++c ) b = ( b << 5 ) - b + seed.charCodeAt( c ), b |= 0
        seed = 256
        for ( c = new Uint8Array( 256 ); seed--; ) c[ seed ] = 256 * ( ( b = 1E4 * Math.sin( b ) ) - Math.floor( b ) ) | 0
        for ( seed = 512; seed--; ) e[ seed ] = c[ seed & 255 ], d[ seed ] = e[ seed ] % 12 * 3
    }
    WORLDJS.randomString = length => {
        return Array( length ).join().split( ',' ).map( () => { return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt( Math.floor( 62 * Math.random() ) ) } ).join( '' )
    }
    let initseed = WORLDJS.randomString( 16 )
    console.log( 'seed', initseed )
    WORLDJS.seed( initseed )
    WORLDJS.defineSprite( { name: 'debugpath', fill: '#229922', width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE } )
    WORLDJS.defineSprite( { name: 'debugweight', fill: '#000000', width: WORLDJS.CELLSIZE, height: WORLDJS.CELLSIZE } )
    WORLDJS.defineSprite( { name: 'debugintersecthit', fill: '#ff5500', width: 5, height: 5 } )
    WORLDJS.defineSprite( { name: 'debugintersectmiss', fill: '#55ff00', width: 5, height: 5 } )
    WORLDJS.defineSprite( { name: 'debugray', fill: '#0055ff', width: 5, height: 5 } )
    WORLDJS.defineSprite( { name: 'debugpathfind', fill: '#ff55ff', width: 5, height: 5 } )
    WORLDJS.addEventListener( WORLDJS, 'oncellnew', cell => {
        cell.debug0 = WORLDJS.add( { x: cell.x, y: cell.y, layer: 98, opacity: .5 } )
        cell.debug1 = WORLDJS.add( { x: cell.x, y: cell.y, layer: 99, opacity: .5 } )
    } )
    WORLDJS.addEventListener( WORLDJS, 'cellchildrenchanged', cell => {
        //cell.debug0 && WORLDJS.setSprite( cell.debug0, 0 === WORLDJS.cellCOLROW( cell.col, cell.row, true ).weight ? { name: 'debugweight' } : null )
    } )
} )( window.WORLDJS = {} )