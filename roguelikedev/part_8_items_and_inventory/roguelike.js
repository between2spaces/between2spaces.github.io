(function () {
	'use strict';

	/**
	 * An implementation of Alea algorithm; (C) 2010 Johannes Baagøe.
	 */

	const FRAC = 2.3283064365386963e-10; /* 2^-32 */

	var s0;
	var s1;
	var s2;
	var c;

	/**
	 * @param seed {number}
	 */
	function rngSeed( seed ) {
	    seed = ( seed < 1 ? 1 / seed : seed );
	    s0 = ( seed >>> 0 ) * FRAC;
	    seed = ( seed * 69069 + 1 ) >>> 0;
	    s1 = seed * FRAC;
	    seed = ( seed * 69069 + 1 ) >>> 0;
	    s2 = seed * FRAC;
	    c = 1;
	}

	rngSeed( Date.now() );

	/**
	 * @returns {float} Pseudorandom value [0,1), uniformly distributed
	 */
	function rngUniform() {
	    var t = 2091639 * s0 + c * FRAC;
	    s0 = s1;
	    s1 = s2;
	    c = t | 0;
	    s2 = t - c;
	    return s2
	}

	/**
	 * @param {int} lowerBound The lower end of the range to return a value from, inclusive
	 * @param {int} upperBound The upper end of the range to return a value from, inclusive
	 * @returns {int} Pseudorandom value [lowerBound, upperBound], using getUniform() to distribute the value
	 */
	function rngUniformInt( lowerBound, upperBound ) {
	    var max = Math.max( lowerBound, upperBound );
	    var min = Math.min( lowerBound, upperBound );
	    return Math.floor( rngUniform() * ( max - min + 1 ) ) + min
	}

	/**
	 * A simple 2d implementation of simplex noise by Ondrej Zara
	 *
	 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
	 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
	 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
	 * Better rank ordering method by Stefan Gustavson in 2012.
	 */

	const count = 256;
	const F2 = 0.5 * ( Math.sqrt( 3 ) - 1 );
	const G2 = ( 3 - Math.sqrt( 3 ) ) / 6;
	const gradients = [ [ 0, -1 ], [ 1, -1 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ], [ -1, 1 ], [ -1, 0 ], [ -1, -1 ] ];
	const perms = [];
	const indexes = [];( function() {
	    var ordered = [];
	    while ( ordered.length < count ) ordered.push( ordered.length );
	    var shuffled = [];
	    while ( ordered.length ) shuffled.push( ordered.splice( Math.floor( rngUniform() * ordered.length ), 1 )[ 0 ] );
	    for ( var i = 0; i < 2 * count; i++ ) {
	        perms.push( shuffled[ i % count ] );
	        indexes.push( perms[ i ] % gradients.length );
	    }
	} )();

	/**
	 * @param xin
	 * @param yin
	 * @return {number}
	 */
	function noise( xin, yin ) {
	    var n0 =0, n1 = 0, n2 = 0, gi; // Noise contributions from the three corners

	    // Skew the input space to determine which simplex cell we're in
	    var s = ( xin + yin ) * F2; // Hairy factor for 2D
	    var i = Math.floor( xin + s);
	    var j = Math.floor( yin + s);
	    var t = ( i + j ) * G2;
	    var X0 = i - t; // Unskew the cell origin back to (x,y) space
	    var Y0 = j - t;
	    var x0 = xin - X0; // The x,y distances from the cell origin
	    var y0 = yin - Y0;

	    // For the 2D case, the simplex shape is an equilateral triangle.
	    // Determine which simplex we are in.
	    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
	    if ( x0 > y0 ) {
	        i1 = 1;
	        j1 = 0;
	    } else { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
	        i1 = 0;
	        j1 = 1;
	    } // upper triangle, YX order: (0,0)->(0,1)->(1,1)

	    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
	    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
	    // c = (3-sqrt(3))/6
	    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
	    var y1 = y0 - j1 + G2;
	    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
	    var y2 = y0 - 1 + 2 * G2;

	    // Work out the hashed gradient indices of the three simplex corners
	    var ii = ( ( i % count ) + count ) % count;
	    var jj = ( ( j % count ) + count ) % count;

	    // Calculate the contribution from the three corners
	    var t0 = 0.5 - x0*x0 - y0 * y0;
	    if ( t0 >= 0 ) {
	        t0 *= t0;
	        gi = indexes[ ii + perms[ jj ] ];
	        var grad = gradients[ gi ];
	        n0 = t0 * t0 * ( grad[ 0 ] * x0 + grad[ 1 ] * y0 );
	    }
	    
	    var t1 = 0.5 - x1 * x1 - y1 * y1;
	    if ( t1 >= 0 ) {
	        t1 *= t1;
	        gi = indexes[ ii + i1 + perms[ jj + j1 ] ];
	        var grad = gradients[ gi ];
	        n1 = t1 * t1 * ( grad[ 0 ] * x1 + grad[ 1 ] * y1 );
	    }
	    
	    var t2 = 0.5 - x2 * x2 - y2 * y2;
	    if ( t2 >= 0 ) {
	        t2 *= t2;
	        gi = indexes[ ii + 1 + perms[ jj + 1 ] ];
	        var grad = gradients[ gi ];
	        n2 = t2 * t2 * ( grad[ 0 ] * x2 + grad[ 1 ] * y2 );
	    }

	    // Add contributions from each corner to get the final noise value.
	    // The result is scaled to return values in the interval [-1,1].
	    return 70 * ( n0 + n1 + n2 )
	}

	/**
	 * Simplified A* algorithm: all edges have a value of 1
	 */

	const TOPOLOGY = 8;

	const DIRS = {
	    '4': [ { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 } ],
	    '8': [ { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 } ],
	    '6': [ { x: -1, y: -1 }, { x: 1, y: -1 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -2, y: 0 } ]
	}[ TOPOLOGY ];

	const DISTANCE = {
	    '4': function( x0, y0, x1, y1 ) {
	        return Math.abs( x1 - x0 ) + Math.abs( y1 - y0 )
	    },
	    '6': function( x0, y0, x1, y1 ) {
	        var dy = Math.abs( y1 - y0 );
	        return dy + Math.max(  0, ( Math.abs( x1 - x0 ) - dy ) / 2 )
	    },
	    '8': function( x0, y0, x1, y1 ) {
	        return Math.max( Math.abs( x1 - x0), Math.abs( y1 - y0 ) )
	    }
	}[ TOPOLOGY ];

	/**
	 * Returns the first Tile on an A* path.
	 */
	function nextTileOnPath( fromX, fromY, toX, toY, passable ) {
	    var queue = [];
	    var id = toX + ',' + toY;
	    var visited = { id: insert( queue, fromX, fromY, toX, toY, null ) };
	    while ( queue.length ) {
	        var item = queue.shift();
	        if ( item.x === fromX && item.y === fromY ) break
	        for ( var i = 0; i < DIRS.length; i++ ) {
	            var dir = DIRS[ i ];
	            var x = item.x + dir.x;
	            var y = item.y + dir.y;
	            if ( ! passable( x, y ) ) continue
	            id = x + ',' + y;
	            if ( id in visited ) continue
	            visited[ id ] = insert( queue, fromX, fromY, x, y, item );
	        }
	    }
	    var item = visited[ fromX + ',' + fromY ];
	    if ( ! item || ! item.prev ) return
	    return item.prev
	}

	function insert( queue, x0, y0, x1, y1, prev ) {
	    var h = DISTANCE( x0, y0, x1, y1 );
	    var obj = {
	        x: x1,
	        y: y1,
	        prev: prev,
	        g: ( prev ? prev.g + 1 : 0 ),
	        h: h
	    };
	    var f = obj.g + obj.h;
	    for ( var i = 0; i < queue.length; i++ ) {
	        var item = queue[ i ];
	        var itemF = item.g + item.h;
	        if ( f < itemF || ( f === itemF && h < item.h ) ) {
	            queue.splice( i, 0, obj );
	            return obj
	        }
	    }
	    queue.push( obj );
	    return obj
	}

	/**
	 * Calculates visibility.
	 * @param {Tile} startTile The starting Tile
	 * @param {int} row The row to render
	 * @param {float} visSlopeStart The slope to start at
	 * @param {float} visSlopeEnd The slope to end at
	 * @param {int} radius The radius to reach out to
	 * @param {int} xx 
	 * @param {int} xy 
	 * @param {int} yx 
	 * @param {int} yy 
	 */
	function castVisibility( startTile, row, visSlopeStart, visSlopeEnd, radius, xx, xy, yx, yy ) {

	    for( var i = row; i <= radius; i++ ) {

	        var dx = -i - 1;
	        var dy = -i;
	        var blocked = false;
	        var newStart = 0;

	        // 'Row' could be column, names here assume octant 0 and would be flipped for half the octants
	        while ( dx <= 0 ) {
	            dx += 1;

	            // Translate from relative coordinates to map coordinates
	            var mapX = startTile.x + dx * xx + dy * xy;
	            var mapY = startTile.y + dx * yx + dy * yy;

	            var tile = getTile( mapX, mapY );

	            // Reaching the edge of the map means we can stop
	            if ( ! tile ) return
	 
	            // Range of the row
	            var slopeStart = ( dx - 0.5 ) / ( dy + 0.5 );
	            var slopeEnd = ( dx + 0.5 ) / ( dy - 0.5 );
	        
	            // Ignore if not yet at left edge of Octant
	            if ( slopeEnd > visSlopeStart ) continue
	            
	            // Done if past right edge
	            if ( slopeStart < visSlopeEnd ) break
	            	
	            // If it's in range, it's visible
	            if ( (dx * dx + dy * dy ) < ( radius * radius ) ) {
	                tile.fov = true;
	                tile.fow = false;
	                tile.r = tile.g = tile.b = 1.5;
	                fovtiles.push( tile );
	            }

	            var visible = contains( tile, treeglyphs ) ? length( subtract( tile, startTile ) ) <= 0.5 : ! contains( tile, blocksfov );
	    
	            if ( blocked ) {
	            	// Keep narrowing if scanning across a block
	            	if( ! visible ) {
	            		newStart = slopeEnd;
	            		continue
	            	}
	            	// Block has ended
	            	blocked = false;
	            	visSlopeStart = newStart;
	 
	            } else {
	            	// If tile is a blocking tile, cast around it
	            	if ( ! visible && i < radius ) {
	            		blocked = true;
	                    if ( visSlopeStart >= visSlopeEnd ) {
	            		    castVisibility( startTile, i + 1, visSlopeStart, slopeStart, radius, xx, xy, yx, yy );
	                    }
	            		newStart = slopeEnd;
	            	}
	 
	            }
	        }
	        if ( blocked ) break
	    }
	}



	const noon = { r: 292 / 255.0, g: 291 / 255.0, b: 273 / 255.0 };
	const sun = noon;


	const map = [];
	map.width = 200;
	map.height = 200;

	const actors = [];
	function Glyph( ch, name, r, g, b ) {
	    return {
	        ch: ch,
	        name: name,
	        r: r / 255.0,
	        g: g / 255.0,
	        b: b / 255.0
	    }
	}

	const glyphs = {
	    VOID: Glyph( ' ', 'void', 0, 0, 0 ),
	    PC: Glyph( '@', 'you', 245, 3, 255 ),
	    CORPSE: Glyph( '☠', 'corpse', 200, 150, 150 ),
	    GRASS1: Glyph( ';', 'tall grass', 46, 100, 0 ),
	    GRASS2: Glyph( "'", 'short grass', 56, 100, 0 ),
	    GRASS3: Glyph( '"', 'thick grass', 60, 100, 0 ),
	    PAVING: Glyph( '⬛', 'paving', 40, 40, 40 ),
	    WALL: Glyph( '#', 'wall', 164, 164, 164 ),
	    WATER: Glyph( "〜", 'water', 120, 154, 235 ),
	    TREE1: Glyph( '♠', 'tree', 0, 25, 0 ),
	    TREE2: Glyph( '♣', 'tree', 0, 40, 0 ),
	    RAT: Glyph( 'r', 'rat', 150, 150, 150 ),
	    TIGER: Glyph( 't', 'tiger', 200, 200, 0 ),
	    HEALINGPOTION: Glyph( '!', 'healing potion', 255, 60, 60 ),
	};

	const draw_outof_fov = [];
	const grassglyphs = [ glyphs.GRASS1, glyphs.GRASS2, glyphs.GRASS3 ];
	const treeglyphs = [ glyphs.TREE1, glyphs.TREE2 ];
	const blocksfov = [ glyphs.VOID, glyphs.WALL ];
	Array.prototype.push.apply( blocksfov, treeglyphs );
	Array.prototype.push.apply( draw_outof_fov, treeglyphs );
	const monsterglyphs = [ glyphs.RAT, glyphs.TIGER ];
	const blocksmove = [ glyphs.VOID, glyphs.WALL ];
	const blocksactorpath = [];
	const blockspcpath = [];
	Array.prototype.push.apply( blocksactorpath, blocksmove );
	Array.prototype.push.apply( blockspcpath, blocksmove );
	Array.prototype.push.apply( blockspcpath, monsterglyphs );
	Array.prototype.push.apply( blocksmove, monsterglyphs );

	const ui = {};

	function E( tag, attribs, contents ) {
	    var element = document.createElement( tag );
	    for ( var name in attribs ) {
	        if ( name === 'class' ) {
	            element.className = attribs[ name ];
	        } else if ( name === 'style' ) {
	            element.style = attribs[ name ];
	        } else {
	            element.setAttribute[ name ] = attribs[ name ];
	        }
	    }
	    if ( typeof contents !== 'undefined' ) {
	        if ( contents.constructor !== Array ) contents = [ contents ];
	        for ( var i = 0; i < contents.length; i++ ) {
	            var content = contents[ i ];
	            if ( typeof content === 'undefined' ) continue
	            var node = ( content instanceof HTMLElement ) ? content : document.createTextNode( content );
	            element.appendChild( node );
	        }
	    }
	    return element
	}

	const style = document.createElement( 'style' );
	document.head.appendChild( style );

	function css( text ) {
	    style.textContent += text;
	}

	css( '.ui { position: absolute; z-index: 1; overflow: hidden; background: #111; border: 1px solid #464; }' );
	css( '.item { font-size: 200%; min-width: 1em; background: #000; }' );
	css( '.focuseditem { background: #00f; }' );


	ui.log = document.body.appendChild( E( 'div', { class: 'ui', style: 'left: 1%; bottom: 1%; width: 50%; height: 15%;' } ) );

	function log( msg, colour ) {
	    while( ui.log.childNodes.length > 6 ) ui.log.removeChild( ui.log.childNodes[ 0 ] );
	    var opacity = 1;
	    for ( var i = ui.log.childNodes.length; i--; ) ui.log.childNodes[ i ].style.opacity = '' + ( opacity -= 0.2 );
	    var entry = document.createElement( 'div' );
	    entry.style.color = colour ? colour: 'white';
	    entry.innerHTML = msg;
	    ui.log.appendChild( entry );
	    entry.scrollIntoView();
	}

	log( 'r/roguelikedev does the complete roguelike tutorial' );
	log( 'Week 6 - Part 8: Items and inventory', 'yellow' );

	ui.targetinfo = document.body.appendChild( E( 'div', { class: 'ui', style: 'top: 1%; left: 1%; width: 50%; height: 1.5em; color: white;' } ) );
	ui.healthlbl = E( 'div', { class: 'ui', style: 'bottom: 0; width: 100%; height: 1em; color: white; font-size: 10pt; z-index: 2;' } );
	ui.healthloss = E( 'div', { class: 'ui', style: 'top: 0; width: 100%; height: 10%; color: red;' }, '░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░' );
	ui.healthbar = document.body.appendChild( E( 'div', { class: 'ui', style: 'right: 1%; bottom: 1%; width: 1em; height: 15%; color: green; font-size: 80pt; text-align: center;' }, [ '░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░\n░', ui.healthlbl, ui.healthloss ] ) );

	function updateui() {
	    ui.healthlbl.textContent = health( pc );
	    ui.healthloss.style.height = Math.round( 100 * ( pc.fighter.maxhealth - pc.fighter.health ) / pc.fighter.maxhealth ) + '%';
	    var tile = getTile( minx + mouse.x, miny + mouse.y );
	    if ( ! tile ) return
	    var targetmsg = tile.fow ? '' : tile.glyph.name;
	    if ( ! tile.fow ) {
	        var things = tile.things;
	        for ( var i = things.length; i--; ) targetmsg += ', ' + things[ i ].glyph.name;
	    }
	    ui.targetinfo.textContent = '👁 ' + targetmsg;
	}

	ui.inventory = ( function() {
	    var tbody = E( 'tbody' );
	    var div = document.body.appendChild( E( 'div', {
	            id: 'inventory',
	            class: 'ui',
	            style: 'right: 0; top: 0; bottom: 0; display: none;'
	        },
	        [ E( 'table', {}, tbody ) ]
	    ) );
	    for ( var r = 0; r < 5; r++ ) {
	        var row = E( 'tr' );
	        for ( var c = 0; c < 10; c++ ) {
	            var cell = E( 'td' );
	            cell.className = 'item';
	            row.appendChild( cell );
	        }
	        tbody.appendChild( row );
	    }
	    return div
	} )();

	function showInventory() {
	    ui.inventory.style.display = 'block';
	}

	function closeInventory() {
	    ui.inventory.style.display = 'none';
	}

	ui.items = document.body.appendChild( E( 'div', {
	    id: 'items',
	    class: 'ui',
	    style: 'left: 0; top: 0; bottom: 0; display: none;'
	} ) );

	const shownItems = [];
	const shownItemsCols = 10;
	var shownItemFocus = null;
	var shownItemFocusDescription = null; 

	function showItems( items ) {
	    var cols = Math.min( shownItemsCols, Math.max( shownItemsCols, Math.sqrt( items.length ) ) );
	    var rows = Math.min( 15, Math.max( 15, Math.sqrt( items.length ) ) );
	    var index = 0;
	    shownItems.length = 0;
	    shownItemFocus = null;
	    var table = document.createElement( 'table' );
	    var tbody = document.createElement( 'tbody' );
	    table.appendChild( tbody );
	    for ( var row = 0; row < rows; row++ ) {
	        var tr = document.createElement( 'tr' );
	        for ( var col = 0; col < cols; col++ ) {
	            var td = document.createElement( 'td' );
	            td.innerHTML = ( index < items.length ) ? items[ index ].glyph.ch : '&nbsp;';
	            td.className = 'item';
	            tr.appendChild( td );
	            shownItems.push( { td: td, item: items[ index ], row: row, col: col } );
	            index++;
	        }
	        tbody.appendChild( tr );
	    } 
	    ui.items.innerHTML = '';
	    ui.items.appendChild( table );
	    ui.items.style.display = 'block';
	    moveItemFocus( 0, 0 );
	}

	function closeItems() {
	    ui.items.style.display = 'none';
	    if ( shownItemFocusDescription ) shownItemFocusDescription.style.display = 'none';
	}

	function moveItemFocus( col, row ) {
	    var index = row * shownItemsCols + col;
	    if ( index < 0 || index >= shownItems.length ) return
	    if ( shownItemFocus ) shownItemFocus.td.classList.remove( 'focuseditem' );
	    shownItemFocus = shownItems[ index ];
	    shownItemFocus.td.classList.add( 'focuseditem' );

	    if ( ! shownItemFocusDescription ) {
	        shownItemFocusDescription = document.body.appendChild( E( 'div', {
	            class: 'ui',
	            style: 'background: black; border: 1px solid #666; padding: 3px;'
	        } ) );
	    }
	    if ( ! shownItemFocus.item ) {
	        shownItemFocusDescription.style.display = 'none';
	    } else {
	        var td = shownItemFocus.td;
	        var style = shownItemFocusDescription.style;
	        style.left = ( td.offsetLeft + td.offsetWidth ) + 'px';
	        style.top = ( td.offsetTop + 6 ) + 'px';
	        shownItemFocusDescription.innerHTML = shownItemFocus.item.glyph.name;
	        style.display = 'block';
	    }
	}

	function moveItemFocusUp() {
	    moveItemFocus( shownItemFocus.col, shownItemFocus.row - 1 );
	}

	function moveItemFocusDown() {
	    moveItemFocus( shownItemFocus.col, shownItemFocus.row + 1 );
	}

	function moveItemFocusLeft() {
	    moveItemFocus( shownItemFocus.col - 1, shownItemFocus.row );
	}

	function moveItemFocusRight() {
	    moveItemFocus( shownItemFocus.col + 1, shownItemFocus.row );
	}

	function Tile( glyph, x, y ) {
	    return {
	        glyph: glyph,
	        r: 0.1,
	        g: 0.1,
	        b: 0.1,
	        x: x,
	        y: y,
	        things: [],
	        fov: false,
	        fow: true,
	    }
	}

	function Thing( glyph, x, y, z, components ) {
	    var thing = Object.assign( {}, components );
	    thing.glyph = glyph;
	    thing.tile = getTile( x, y );
	    thing.z = z;
	    return thing
	}

	function Fighter( health, defense, power ) {
	    return {
	        health: health,
	        maxhealth: health,
	        defense: defense,
	        power: power
	    }
	}

	function Item( weight ) {
	    return {
	        weight: weight
	    }
	}

	function Actor( glyph, x, y, z, components ) {
	    var actor = Thing( glyph, x, y, z, components );
	    actors.push( actor );
	    return actor
	}

	function act() {
	    var moved = [];
	    for ( var i = fovtiles.length; i--; ) {
	        var tile = fovtiles[ i ];
	        var things = tile.things;
	        for ( var t = things.length; t--; ) {
	            var thing = things[ t ];
	            if ( moved.indexOf( thing ) > -1 ) continue
	            if ( actors.indexOf( thing ) > -1 ) {
	                var path = nextTileOnPath( tile.x, tile.y, pc.tile.x, pc.tile.y, actorpathfind );
	                if ( path ) moveto( thing, path.x, path.y );
	                moved.push( thing );
	            }
	        }
	    }
	}

	for ( var y = map.height; y--; ) {
	    for ( var x = map.width; x--; ) {
	        map[ y * map.width + x ] = Tile( glyphs.VOID, x, y );
	    }
	}

	function getTile( x, y ) {
	    if ( x < 0 || y < 0 || x >= map.width || y >= map.height ) return null
	    return map[ y * map.width + x ]
	}

	function contains( tile, glyphlist ) {
	    if ( ! tile ) return null
	    if ( glyphlist.indexOf( tile.glyph ) > -1 ) return tile.glyph
	    var things = tile.things;
	    for ( var i = things.length; i--; ) {
	        if ( glyphlist.indexOf( things[ i ].glyph ) > -1 ) return things[ i ].glyph
	    }
	    return null
	}

	function push( thing, tile ) {
	    pop( thing );
	    thing.tile = tile;
	    var things = tile.things;
	    var i = things.indexOf( thing );
	    if ( i > -1 ) return
	    things.splice( sortedIndex( things, thing.z ), 0, thing );
	}

	function pop( thing ) {
	    if ( ! thing.tile ) return null
	    var things = thing.tile.things;
	    var i = things.indexOf( thing );
	    if ( i > -1 ) things.splice( i, 1 );
	    thing.tile = null;
	}

	function sortedIndex( things, z ) {
	    var low = 0;
	    var high = things.length;
	    while ( low < high ) {
	        var mid = ( low + high ) >>> 1;
	        if ( things[ mid ].z > z ) low = mid + 1;
	        else high = mid;
	    }
	    return low
	}

	function moveto( thing, x, y ) {
	    var to = getTile( x, y );
	    if ( to ) {
	        if ( blocksmove.indexOf( to.glyph ) > -1 ) return
	        var things = to.things;
	        for ( var i = things.length; i--; ) {
	        	var to_thing = things[ i ];
	        	if ( ( thing === pc && monsterglyphs.indexOf( to_thing.glyph ) > -1 ) || to_thing == pc ) {
	        		attack( thing, to_thing );
	        		return
	        	}
	        	if ( blocksmove.indexOf( to_thing.glyph ) > -1 ) return
	        }
	        push( thing, to );
	    }
	}

	function randomTile( thing /*, ([Glyph,...]|Glyph,Glyph,...)*/ ) {
	    var exceptions = [];
	    for ( var i = 1; i < arguments.length; i++ ) {
	        var argument = arguments[ i ];
	        if ( typeof argument === 'undefined' ) continue
	        if ( argument.constructor === Array ) Array.prototype.push.apply( exceptions, argument );
	        else exceptions.push( argument );
	    }
	    var tile;
	    do {
	        tile = getTile( rngUniformInt( 0, map.width - 1 ), rngUniformInt( 0, map.height - 1 ) );
	    } while ( contains( tile, exceptions ) )
	    return tile
	}

	function subtract( xy0, xy1 ) {
	    return { x: xy1.x - xy0.x, y: xy1.y - xy0.y }
	}

	function length( xy ) {
	    return Math.sqrt( xy.x * xy.x + xy.y * xy.y )
	}

	function actorpathfind( x, y ) {
	    var tile = getTile( x, y );
	    if ( ! tile ) return false
	    if ( fovtiles.indexOf( tile ) === -1 ) return false
	    return ! contains( tile, blocksactorpath )
	}

	function pcpathfind( x, y ) {
	    var tile = getTile( x, y );
	    if ( ! tile ) return false
	    return ! contains( tile, blockspcpath )
	}

	function health( thing ) {
	    if ( ! thing.fighter ) return 'n/a'
	    return '' + thing.fighter.health + '/' + thing.fighter.maxhealth
	}

	function attack( thing, target ) {
	    if ( ! thing.fighter || ! target.fighter ) return
	    var damage = thing.fighter.power - target.fighter.defense;
	    if ( damage > 0 ) {
	        log( thing.glyph.name + ' hits ' + target.glyph.name + ' for -' + damage, target === pc ? 'red' : 'white' );
	        target.fighter.health -= damage;
	    } else {
	        log( thing.glyph.name + ' attacks ' + target.glyph.name + ' but fails to do damage' );
	    }
	    if ( target !== pc && target.fighter.health <= 0 ) killed( thing, target );
	}

	function killed( thing, target ) {
	    log( ( thing === pc ? 'you  kill ' : thing.glyph.name + ' kills ' ) + ' a ' + target.glyph.name, thing === pc ? 'green' : 'white' );
	    target.glyph = glyphs.CORPSE;
	    delete target.fighter;
	    target.item = Item( 0 );
	    var i = actors.indexOf( target );
	    if ( i > -1 ) actors.splice( i, 1 );
	}

	const drawinfo = [ 0/*x*/, 1/*y*/, 2/*ch*/, 3/*colour*/ ];

	const fovtiles = [];

	function fov() {
	    for ( var i = fovtiles.length; i--; ) fovtiles[ i ].fov = false;
	    fovtiles.length = 0;
	    var tile = pc.tile;
	    tile.fov = true;
	    tile.fow = false;
	    tile.r = tile.g = tile.b = 1.5;
	    fovtiles.push( tile );
	    castVisibility( tile, 1, 1.0, 0.0, visibility, -1,  0,  0,  1 );
	    castVisibility( tile, 1, 1.0, 0.0, visibility,  0, -1,  1,  0 );
	    castVisibility( tile, 1, 1.0, 0.0, visibility,  0, -1, -1,  0 );
	    castVisibility( tile, 1, 1.0, 0.0, visibility, -1,  0,  0, -1 );
	    castVisibility( tile, 1, 1.0, 0.0, visibility,  1,  0,  0, -1 );
	    castVisibility( tile, 1, 1.0, 0.0, visibility,  0,  1, -1,  0 );
	    castVisibility( tile, 1, 1.0, 0.0, visibility,  0,  1,  1,  0 );
	    castVisibility( tile, 1, 1.0, 0.0, visibility,  1,  0,  0,  1 );
	}


	var minx;
	var miny;


	const display = {
	    fontsize: 30,
	    spacing: 0.8,
	};
	display.canvas = document.createElement( 'canvas' ),
	display.canvas.style.position = 'absolute';
	display.canvas.style.width = display.canvas.style.height = '100%';
	document.body.appendChild( display.canvas );

	var visibility = 1;

	function fit() {
	    display.canvas.width = window.innerWidth;
	    display.canvas.height = window.innerHeight;
	    display.rect = display.canvas.getBoundingClientRect();
	    display.ctx = display.canvas.getContext( '2d' );
	    display.ctx.font = display.fontsize + 'px monospace';
	    display.ctx.textAlign = 'center';
	    display.ctx.textBaseline = 'middle';
	    display.spacingX = Math.ceil( display.spacing * Math.ceil( display.ctx.measureText( '▔' ).width ) );
	    display.spacingY = Math.ceil( display.spacing * display.fontsize );
	    display.spacingX = display.spacingY = Math.max( display.spacingX, display.spacingY );
	    display.width = Math.ceil( display.canvas.width / display.spacingX );
	    display.height = Math.ceil( display.canvas.height / display.spacingY );
	    display.centreX = Math.floor( display.width * 0.5 );
	    display.centreY = Math.floor( display.height * 0.5 );
	    visibility = Math.max( display.centreX, display.centreY );
	}

	function show( scene ) {
	    function ready() {
	        fit()
	        ;( function ( timeout, blocked ) {
	            var handler = function() {
	                blocked = timeout;
	                timeout || ( fit(), render(), timeout = setTimeout( function() {
	                	timeout = null;
	                	blocked && handler();
	                }, 500 ) );
	            };
	            window.addEventListener( 'resize', handler );
	        } )();
	        if ( scene.ready ) scene.ready( scene );
	        document.addEventListener( 'mousemove', mousemove );
	        if ( scene.update ) scene.update( scene );
	    }
	    if ( scene.assets && Object.getOwnPropertyNames( scene.assets ).length > 0 ) {
	        var remaining = Object.getOwnPropertyNames( scene.assets ).length;
	        for ( var name in scene.assets ) {
	            ( function ( name ) {
	            	var src = scene.assets[ name ];
	            	var image = scene.assets[ name ] = new Image();
	            	image.onload = function() { if ( ! --remaining ) ready(); };
	            	image.src = src;
	            } )( name );
	        }
	    } else {
	        ready();
	    }
	}

	function render() {
	    minx = Math.min( Math.max( pc.tile.x - display.centreX, 0 ), map.width - display.width );
	    miny = Math.min( Math.max( pc.tile.y - display.centreY, 0 ), map.height - display.height );

	    fov();

	    display.ctx.clearRect( 0, 0, window.innerWidth, window.innerHeight );
	    var endx = minx + display.width;
	    var endy = miny + display.height;
	    var y = miny;
	    while ( y < endy ) {
	        drawinfo[ 1 ] = ( y - miny );
	        var ctxy = Math.floor( ( y - miny + 0.5 ) * display.spacingY );
	        var x = minx;
	        while ( x < endx ) {
	        	var tile = getTile( x, y );
	        	var ctxx = Math.floor( ( x - minx + 0.5 ) * display.spacingX );
	       	//if ( ! tile.fow ) {
	        		var glyph = tile.glyph;
	 
	        		display.ctx.fillStyle = rgb( glyph.r * tile.r * sun.r * 0.1, glyph.g * tile.g * sun.g * 0.1, glyph.b * tile.b * sun.b * 0.1 );
	        		display.ctx.fillRect( Math.floor( ctxx - display.spacingX * 0.5 ), Math.floor( ctxy - display.spacingY * 0.5 ), display.spacingX, display.spacingY );
	        		display.ctx.fillStyle = rgb( glyph.r * tile.r * sun.r, glyph.g * tile.g * sun.g, glyph.b * tile.b * sun.b );
	                display.ctx.fillText( glyph.ch, ctxx, ctxy );
	            if ( ! tile.fow ) {
	        			var things = tile.things;
	        			for ( var i = things.length; i--; ) {
	        				var thing = things[ i ];
	        				glyph = thing.glyph;
	                        if ( ! glyph ) console.log( thing );
	                        if ( tile.fov || draw_outof_fov.indexOf( glyph ) > -1 ) {
	                            display.ctx.fillStyle = rgb( glyph.r * tile.r * sun.r, glyph.g * tile.g * sun.g, glyph.b * tile.b * sun.b );
	                            display.ctx.fillText( glyph.ch, ctxx, ctxy );
	                        }
	        			}
	        	}
	        	if ( tile.fow || ! tile.fov ) {
	        		display.ctx.fillStyle = fowstyle;
	        		display.ctx.fillRect( Math.floor( ctxx - display.spacingX * 0.5 ), Math.floor( ctxy - display.spacingY * 0.5 ), display.spacingX, display.spacingY );
	        	}
	        	x++;
	        }
	        y++;
	    }
	}

	const perfs = {};

	function rgb( r, g, b ) {
	    return 'rgb( ' + Math.min( 255, Math.max( 0, Math.round( r * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( g * 255 ) ) ) + ', ' + Math.min( 255, Math.max( 0, Math.round( b * 255 ) ) ) + ' )'
	}

	const actions = {
	    NONE: 0,
	    NORTH: 1,
	    SOUTH: 2,
	    WEST: 3,
	    EAST: 4,
	    NORTHWEST: 5,
	    NORTHEAST: 6,
	    SOUTHWEST: 7,
	    SOUTHEAST: 8,
	    PATHTO: { x: 0, y: 0 },
	    SKIPTURN: 9,
	    PICKITEMS: 10,
	    SHOWINVENTORY: 11
	};

	function input( resolve ) {
	    input.resolve = function ( action ) {
	        var endturn = false;
	        var x = pc.tile.x;
	        var y = pc.tile.y;
	        if ( action === actions.SKIPTURN ) {
	            endturn = true;
	        } else if ( action === actions.PATHTO ) {
	            x = action.x;
	            y = action.y;
	            endturn = true;
	        } else if ( action === actions.PICKITEMS ) {
	            showItems( itemsAt( x, y ) ); 
	        } else if ( action === actions.SHOWINVENTORY ) {
	            showInventory(); 
	        } else {
	            if ( action === actions.NORTH || action == actions.NORTHWEST || action === actions.NORTHEAST ) y--;
	            if ( action === actions.SOUTH || action == actions.SOUTHWEST || action === actions.SOUTHEAST ) y++;
	            if ( action === actions.WEST || action == actions.NORTHWEST || action === actions.SOUTHWEST ) x--;
	            if ( action === actions.EAST || action == actions.NORTHEAST || action === actions.SOUTHEAST ) x++;
	        }
	        if ( x !== pc.tile.x || y !== pc.tile.y ) {
	            var path = nextTileOnPath( pc.tile.x, pc.tile.y, x, y, pcpathfind );
	            if ( path ) moveto( pc, path.x, path.y );
	            endturn = true;
	        }
	        if ( endturn ) {
	            document.removeEventListener( 'keydown', keydown );
	            document.removeEventListener( 'mousedown', mousedown );
	        	resolve();
	       }
	    };
	    document.addEventListener( 'keydown', keydown );
	    document.addEventListener( 'mousedown', mousedown );
	}

	const mouse = { x: 0, y: 0, clientX: 0, clientY: 0 };

	function mousemove( event ) {
	    var x = event.clientX;
	    var y = event.clientY;
	    x -= display.rect.left;
	    y -= display.rect.top;
	    x *= display.canvas.width / display.canvas.clientWidth;
	    y *= display.canvas.height / display.canvas.clientHeight;
	    if ( x < 0 || y < 0 || x >= display.canvas.width || y >= display.canvas.height ) return
	    mouse.x = Math.floor( x / display.spacingX  );
	    mouse.y = Math.floor( y / display.spacingY );
	    updateui();
	}



	function mousedown( event ) {
	    var action = actions.PATHTO;
	    action.x = minx + mouse.x;
	    action.y = miny + mouse.y;
	    input.resolve( action );
	}

	function keydown( event ) {
	    if ( event.altKey || event.metaKey ) return
	    var key = event.key;

	    if ( ui.items.style.display === 'block' || ui.inventory.style.display === 'block' ) {
	        if ( key === 'Escape' ) {
	            closeItems();
	            closeInventory();
	        } else if ( [ 'ArrowUp', 'k' ].indexOf( key ) > - 1 ) {
	            moveItemFocusUp();
	        } else if ( [ 'ArrowDown', 'j' ].indexOf( key ) > - 1 ) {
	            moveItemFocusDown();
	        } else if ( [ 'ArrowRight', 'l' ].indexOf( key ) > - 1 ) {
	            moveItemFocusRight();
	        } else if ( [ 'ArrowLeft', 'h' ].indexOf( key ) > - 1 ) {
	            moveItemFocusLeft();
	        } else if ( key === 'g' ) {
	            closeItems();
	            if ( shownItemFocus && shownItemFocus.item ) {
	                pickup( shownItemFocus.item );
	            }
	            shownItemFocus = null;
	        } else if ( key === 'i' ) {
	            closeInventory();
	        }

	        return
	    }

	    var action = actions.NONE;
	    if ( key === '.' ) {
	        action = actions.SKIPTURN;
	    } else if ( key === ' ' ) {
	        action = actions.PATHTO;
	        action.x = minx + mouse.x;
	        action.y = miny + mouse.y;
	    } else if ( key === 'g' ) {
	        action = actions.PICKITEMS;
	    } else if ( key === 'i' ) {
	        action = actions.SHOWINVENTORY;
	    } else if ( [ 'ArrowUp', 'k' ].indexOf( key ) > - 1) {
	        action = event.shiftKey ? actions.NORTHEAST : actions.NORTH;
	    } else if ( [ 'K' ].indexOf( key ) > - 1) {
	        action = actions.NORTHEAST;
	    } else if ( [ 'ArrowDown', 'j' ].indexOf( key ) > - 1) {
	        action = event.shiftKey ? actions.SOUTHWEST : actions.SOUTH;
	    } else if ( [ 'J' ].indexOf( key ) > - 1) {
	        action = actions.NORTHWEST;
	    } else if ( [ 'ArrowRight', 'l' ].indexOf( key ) > - 1) {
	        action = event.shiftKey ? actions.SOUTHEAST: actions.EAST;
	    } else if ( [ 'L' ].indexOf( key ) > - 1) {
	        action = actions.SOUTHEAST;
	    } else if ( [ 'ArrowLeft', 'h' ].indexOf( key ) > - 1) {
	        action = event.shiftKey ? actions.NORTHWEST: actions.WEST;
	    } else if ( [ 'H' ].indexOf( key ) > - 1) {
	        action = actions.SOUTHWEST;
	    }
	    input.resolve( action );
	}

	function area( x0, y0, x1, y1, callback ) {
	    var sx = x0 < x1 ? 1 : -1;
	    var sy = y0 < y1 ? 1 : -1;
	    var x = x0;
	    while ( true ) {
	        callback( x, y0 );
	        if ( x === x1 && y0 === y1 ) break
	        if ( x === x1 ) { x = x0; y0 += sy; }
	        else { x += sx; }
	    }
	}

	function grass_and_trees( x0, y0, x1, y1 ) {
	    area( x0, y0, x1, y1, function( x, y ) {
	        var tile = getTile( x, y );
	        var high = noise( x, y );
	        var low1 = noise( x * 0.05, y * 0.05 );
	        var low2 = noise( ( x + 133 ) * 0.07, ( y - 261 ) * 0.07 );
	        var n = ( low2 + 1 ) * 0.4 + ( low1 + 1 ) * 0.1;
	      	tile.glyph = grassglyphs[ Math.floor( n * grassglyphs.length ) ];
	       	if ( n * high > 0.3 ) tile.glyph = grassglyphs[ 0 ];
	        if ( low1 > - 0.8 && low2 < 0 ) {
	            push( Thing( treeglyphs[ Math.floor( ( high + 1 ) * 0.5 * treeglyphs.length ) ], 0, 0, 0 ), tile );
	        }
	    } );
	}

	grass_and_trees( 0, 0, map.height - 1, map.width - 1 );

	const pc = Thing( glyphs.PC, 0, 0, 0, { fighter: Fighter( 100, 10, 40 ) } );
	push( pc, randomTile( blocksmove, blocksfov ) );

	for ( var i = 300; i--; ) {
	    var glyph = monsterglyphs[ rngUniformInt( 0, monsterglyphs.length - 1 ) ];
	    push( Actor( glyph, 0, 0, 0, { fighter: Fighter( glyph === glyphs.RAT ? 50 : 100, 10, glyph === glyphs.RAT ? 12 : 18 ) } ), randomTile( blocksmove ) );
	}

	for ( var i = 200; i--; ) {
	    push( Thing( glyphs.HEALINGPOTION, 1, 1, 1, { item: Item( 0 ) } ), randomTile( blocksmove ) );
	}

	const inventory = [];
	inventory.limit = 10;

	function pickup( thing ) {
	    if ( ! thing.item ) {
	        log( thing.glyph.name + ' cannot be picked up', 'red' );
	        return
	    }
	    if ( inventory.length >= inventory.limit ) {
	        log( 'your inventory is full, cannot pick up ' + thing.glyph.name, 'red' );
	    } else {
	        pop( thing );
	        inventory.push( thing );
	        log( 'you picked up a ' + thing.glyph.name, 'green' );
	    }
	}

	function itemsAt( x, y ) {
	    var items = [];
	    var tile = getTile( x, y );
	    if ( ! tile.fov ) return items
	    var things = tile.things;
	    for ( var i = things.length; i--; ) {
	        var thing = things[ i ];
	        if ( thing.item ) items.push( thing );
	    }
	    return items
	}

	var fowstyle;

	function update( scene ) {
	    act();
	    render();
	    updateui();
	    input( function() { setTimeout( update, 0 ); } );
	}

	const scene = {
	    assets: {
	        fowimg: "assets/fov.png"
	    },
	    ready: function( scene ) {
	        fowstyle = display.ctx.createPattern( scene.assets.fowimg, 'repeat' );
	    },
	    update: update
	};

	show( scene );

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm9ndWVsaWtlLmpzIiwic291cmNlcyI6WyJzcmMvcm5nLmpzIiwic3JjL25vaXNlLmpzIiwic3JjL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBbiBpbXBsZW1lbnRhdGlvbiBvZiBBbGVhIGFsZ29yaXRobTsgKEMpIDIwMTAgSm9oYW5uZXMgQmFhZ8O4ZS5cbiAqL1xuXG5jb25zdCBGUkFDID0gMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMCAvKiAyXi0zMiAqL1xuXG52YXIgczBcbnZhciBzMVxudmFyIHMyXG52YXIgY1xuXG4vKipcbiAqIEBwYXJhbSBzZWVkIHtudW1iZXJ9XG4gKi9cbmZ1bmN0aW9uIHJuZ1NlZWQoIHNlZWQgKSB7XG4gICAgc2VlZCA9ICggc2VlZCA8IDEgPyAxIC8gc2VlZCA6IHNlZWQgKVxuICAgIHMwID0gKCBzZWVkID4+PiAwICkgKiBGUkFDXG4gICAgc2VlZCA9ICggc2VlZCAqIDY5MDY5ICsgMSApID4+PiAwXG4gICAgczEgPSBzZWVkICogRlJBQ1xuICAgIHNlZWQgPSAoIHNlZWQgKiA2OTA2OSArIDEgKSA+Pj4gMFxuICAgIHMyID0gc2VlZCAqIEZSQUNcbiAgICBjID0gMVxufVxuXG5ybmdTZWVkKCBEYXRlLm5vdygpIClcblxuLyoqXG4gKiBAcmV0dXJucyB7ZmxvYXR9IFBzZXVkb3JhbmRvbSB2YWx1ZSBbMCwxKSwgdW5pZm9ybWx5IGRpc3RyaWJ1dGVkXG4gKi9cbmZ1bmN0aW9uIHJuZ1VuaWZvcm0oKSB7XG4gICAgdmFyIHQgPSAyMDkxNjM5ICogczAgKyBjICogRlJBQ1xuICAgIHMwID0gczFcbiAgICBzMSA9IHMyXG4gICAgYyA9IHQgfCAwXG4gICAgczIgPSB0IC0gY1xuICAgIHJldHVybiBzMlxufVxuXG4vKipcbiAqIEBwYXJhbSB7aW50fSBsb3dlckJvdW5kIFRoZSBsb3dlciBlbmQgb2YgdGhlIHJhbmdlIHRvIHJldHVybiBhIHZhbHVlIGZyb20sIGluY2x1c2l2ZVxuICogQHBhcmFtIHtpbnR9IHVwcGVyQm91bmQgVGhlIHVwcGVyIGVuZCBvZiB0aGUgcmFuZ2UgdG8gcmV0dXJuIGEgdmFsdWUgZnJvbSwgaW5jbHVzaXZlXG4gKiBAcmV0dXJucyB7aW50fSBQc2V1ZG9yYW5kb20gdmFsdWUgW2xvd2VyQm91bmQsIHVwcGVyQm91bmRdLCB1c2luZyBnZXRVbmlmb3JtKCkgdG8gZGlzdHJpYnV0ZSB0aGUgdmFsdWVcbiAqL1xuZnVuY3Rpb24gcm5nVW5pZm9ybUludCggbG93ZXJCb3VuZCwgdXBwZXJCb3VuZCApIHtcbiAgICB2YXIgbWF4ID0gTWF0aC5tYXgoIGxvd2VyQm91bmQsIHVwcGVyQm91bmQgKVxuICAgIHZhciBtaW4gPSBNYXRoLm1pbiggbG93ZXJCb3VuZCwgdXBwZXJCb3VuZCApXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoIHJuZ1VuaWZvcm0oKSAqICggbWF4IC0gbWluICsgMSApICkgKyBtaW5cbn1cblxuZXhwb3J0IHsgcm5nU2VlZCwgcm5nVW5pZm9ybSwgcm5nVW5pZm9ybUludCB9XG5cbiIsImltcG9ydCB7IHJuZ1VuaWZvcm0gfSBmcm9tICcuL3JuZydcblxuLyoqXG4gKiBBIHNpbXBsZSAyZCBpbXBsZW1lbnRhdGlvbiBvZiBzaW1wbGV4IG5vaXNlIGJ5IE9uZHJlaiBaYXJhXG4gKlxuICogQmFzZWQgb24gYSBzcGVlZC1pbXByb3ZlZCBzaW1wbGV4IG5vaXNlIGFsZ29yaXRobSBmb3IgMkQsIDNEIGFuZCA0RCBpbiBKYXZhLlxuICogV2hpY2ggaXMgYmFzZWQgb24gZXhhbXBsZSBjb2RlIGJ5IFN0ZWZhbiBHdXN0YXZzb24gKHN0ZWd1QGl0bi5saXUuc2UpLlxuICogV2l0aCBPcHRpbWlzYXRpb25zIGJ5IFBldGVyIEVhc3RtYW4gKHBlYXN0bWFuQGRyaXp6bGUuc3RhbmZvcmQuZWR1KS5cbiAqIEJldHRlciByYW5rIG9yZGVyaW5nIG1ldGhvZCBieSBTdGVmYW4gR3VzdGF2c29uIGluIDIwMTIuXG4gKi9cblxuY29uc3QgY291bnQgPSAyNTZcbmNvbnN0IEYyID0gMC41ICogKCBNYXRoLnNxcnQoIDMgKSAtIDEgKVxuY29uc3QgRzIgPSAoIDMgLSBNYXRoLnNxcnQoIDMgKSApIC8gNlxuY29uc3QgZ3JhZGllbnRzID0gWyBbIDAsIC0xIF0sIFsgMSwgLTEgXSwgWyAxLCAwIF0sIFsgMSwgMSBdLCBbIDAsIDEgXSwgWyAtMSwgMSBdLCBbIC0xLCAwIF0sIFsgLTEsIC0xIF0gXVxuY29uc3QgcGVybXMgPSBbXVxuY29uc3QgaW5kZXhlcyA9IFtdXG5cbjsoIGZ1bmN0aW9uKCkge1xuICAgIHZhciBvcmRlcmVkID0gW11cbiAgICB3aGlsZSAoIG9yZGVyZWQubGVuZ3RoIDwgY291bnQgKSBvcmRlcmVkLnB1c2goIG9yZGVyZWQubGVuZ3RoIClcbiAgICB2YXIgc2h1ZmZsZWQgPSBbXVxuICAgIHdoaWxlICggb3JkZXJlZC5sZW5ndGggKSBzaHVmZmxlZC5wdXNoKCBvcmRlcmVkLnNwbGljZSggTWF0aC5mbG9vciggcm5nVW5pZm9ybSgpICogb3JkZXJlZC5sZW5ndGggKSwgMSApWyAwIF0gKVxuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IDIgKiBjb3VudDsgaSsrICkge1xuICAgICAgICBwZXJtcy5wdXNoKCBzaHVmZmxlZFsgaSAlIGNvdW50IF0gKVxuICAgICAgICBpbmRleGVzLnB1c2goIHBlcm1zWyBpIF0gJSBncmFkaWVudHMubGVuZ3RoIClcbiAgICB9XG59ICkoKVxuXG4vKipcbiAqIEBwYXJhbSB4aW5cbiAqIEBwYXJhbSB5aW5cbiAqIEByZXR1cm4ge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gbm9pc2UoIHhpbiwgeWluICkge1xuICAgIHZhciBuMCA9MCwgbjEgPSAwLCBuMiA9IDAsIGdpIC8vIE5vaXNlIGNvbnRyaWJ1dGlvbnMgZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuXG4gICAgLy8gU2tldyB0aGUgaW5wdXQgc3BhY2UgdG8gZGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggY2VsbCB3ZSdyZSBpblxuICAgIHZhciBzID0gKCB4aW4gKyB5aW4gKSAqIEYyIC8vIEhhaXJ5IGZhY3RvciBmb3IgMkRcbiAgICB2YXIgaSA9IE1hdGguZmxvb3IoIHhpbiArIHMpXG4gICAgdmFyIGogPSBNYXRoLmZsb29yKCB5aW4gKyBzKVxuICAgIHZhciB0ID0gKCBpICsgaiApICogRzJcbiAgICB2YXIgWDAgPSBpIC0gdCAvLyBVbnNrZXcgdGhlIGNlbGwgb3JpZ2luIGJhY2sgdG8gKHgseSkgc3BhY2VcbiAgICB2YXIgWTAgPSBqIC0gdFxuICAgIHZhciB4MCA9IHhpbiAtIFgwIC8vIFRoZSB4LHkgZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgdmFyIHkwID0geWluIC0gWTBcblxuICAgIC8vIEZvciB0aGUgMkQgY2FzZSwgdGhlIHNpbXBsZXggc2hhcGUgaXMgYW4gZXF1aWxhdGVyYWwgdHJpYW5nbGUuXG4gICAgLy8gRGV0ZXJtaW5lIHdoaWNoIHNpbXBsZXggd2UgYXJlIGluLlxuICAgIHZhciBpMSwgajEgLy8gT2Zmc2V0cyBmb3Igc2Vjb25kIChtaWRkbGUpIGNvcm5lciBvZiBzaW1wbGV4IGluIChpLGopIGNvb3Jkc1xuICAgIGlmICggeDAgPiB5MCApIHtcbiAgICAgICAgaTEgPSAxXG4gICAgICAgIGoxID0gMFxuICAgIH0gZWxzZSB7IC8vIGxvd2VyIHRyaWFuZ2xlLCBYWSBvcmRlcjogKDAsMCktPigxLDApLT4oMSwxKVxuICAgICAgICBpMSA9IDBcbiAgICAgICAgajEgPSAxXG4gICAgfSAvLyB1cHBlciB0cmlhbmdsZSwgWVggb3JkZXI6ICgwLDApLT4oMCwxKS0+KDEsMSlcblxuICAgIC8vIEEgc3RlcCBvZiAoMSwwKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKDEtYywtYykgaW4gKHgseSksIGFuZFxuICAgIC8vIGEgc3RlcCBvZiAoMCwxKSBpbiAoaSxqKSBtZWFucyBhIHN0ZXAgb2YgKC1jLDEtYykgaW4gKHgseSksIHdoZXJlXG4gICAgLy8gYyA9ICgzLXNxcnQoMykpLzZcbiAgICB2YXIgeDEgPSB4MCAtIGkxICsgRzIgLy8gT2Zmc2V0cyBmb3IgbWlkZGxlIGNvcm5lciBpbiAoeCx5KSB1bnNrZXdlZCBjb29yZHNcbiAgICB2YXIgeTEgPSB5MCAtIGoxICsgRzJcbiAgICB2YXIgeDIgPSB4MCAtIDEgKyAyICogRzIgLy8gT2Zmc2V0cyBmb3IgbGFzdCBjb3JuZXIgaW4gKHgseSkgdW5za2V3ZWQgY29vcmRzXG4gICAgdmFyIHkyID0geTAgLSAxICsgMiAqIEcyXG5cbiAgICAvLyBXb3JrIG91dCB0aGUgaGFzaGVkIGdyYWRpZW50IGluZGljZXMgb2YgdGhlIHRocmVlIHNpbXBsZXggY29ybmVyc1xuICAgIHZhciBpaSA9ICggKCBpICUgY291bnQgKSArIGNvdW50ICkgJSBjb3VudFxuICAgIHZhciBqaiA9ICggKCBqICUgY291bnQgKSArIGNvdW50ICkgJSBjb3VudFxuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgIHZhciB0MCA9IDAuNSAtIHgwKngwIC0geTAgKiB5MFxuICAgIGlmICggdDAgPj0gMCApIHtcbiAgICAgICAgdDAgKj0gdDBcbiAgICAgICAgZ2kgPSBpbmRleGVzWyBpaSArIHBlcm1zWyBqaiBdIF1cbiAgICAgICAgdmFyIGdyYWQgPSBncmFkaWVudHNbIGdpIF1cbiAgICAgICAgbjAgPSB0MCAqIHQwICogKCBncmFkWyAwIF0gKiB4MCArIGdyYWRbIDEgXSAqIHkwIClcbiAgICB9XG4gICAgXG4gICAgdmFyIHQxID0gMC41IC0geDEgKiB4MSAtIHkxICogeTFcbiAgICBpZiAoIHQxID49IDAgKSB7XG4gICAgICAgIHQxICo9IHQxXG4gICAgICAgIGdpID0gaW5kZXhlc1sgaWkgKyBpMSArIHBlcm1zWyBqaiArIGoxIF0gXVxuICAgICAgICB2YXIgZ3JhZCA9IGdyYWRpZW50c1sgZ2kgXVxuICAgICAgICBuMSA9IHQxICogdDEgKiAoIGdyYWRbIDAgXSAqIHgxICsgZ3JhZFsgMSBdICogeTEgKVxuICAgIH1cbiAgICBcbiAgICB2YXIgdDIgPSAwLjUgLSB4MiAqIHgyIC0geTIgKiB5MlxuICAgIGlmICggdDIgPj0gMCApIHtcbiAgICAgICAgdDIgKj0gdDJcbiAgICAgICAgZ2kgPSBpbmRleGVzWyBpaSArIDEgKyBwZXJtc1sgamogKyAxIF0gXVxuICAgICAgICB2YXIgZ3JhZCA9IGdyYWRpZW50c1sgZ2kgXVxuICAgICAgICBuMiA9IHQyICogdDIgKiAoIGdyYWRbIDAgXSAqIHgyICsgZ3JhZFsgMSBdICogeTIgKVxuICAgIH1cblxuICAgIC8vIEFkZCBjb250cmlidXRpb25zIGZyb20gZWFjaCBjb3JuZXIgdG8gZ2V0IHRoZSBmaW5hbCBub2lzZSB2YWx1ZS5cbiAgICAvLyBUaGUgcmVzdWx0IGlzIHNjYWxlZCB0byByZXR1cm4gdmFsdWVzIGluIHRoZSBpbnRlcnZhbCBbLTEsMV0uXG4gICAgcmV0dXJuIDcwICogKCBuMCArIG4xICsgbjIgKVxufVxuXG5leHBvcnQgeyBub2lzZSB9XG5cbiIsImltcG9ydCB7IHJuZ1VuaWZvcm1JbnQgfSBmcm9tICcuL3JuZydcbmltcG9ydCB7IG5vaXNlIH0gZnJvbSAnLi9ub2lzZSdcblxuLyoqXG4gKiBTaW1wbGlmaWVkIEEqIGFsZ29yaXRobTogYWxsIGVkZ2VzIGhhdmUgYSB2YWx1ZSBvZiAxXG4gKi9cblxuY29uc3QgVE9QT0xPR1kgPSA4XG5cbmNvbnN0IERJUlMgPSB7XG4gICAgJzQnOiBbIHsgeDogMCwgeTogLTEgfSwgeyB4OiAxLCB5OiAwIH0sIHsgeDogMCwgeTogMSB9LCB7IHg6IC0xLCB5OiAwIH0gXSxcbiAgICAnOCc6IFsgeyB4OiAwLCB5OiAtMSB9LCB7IHg6IDEsIHk6IDAgfSwgeyB4OiAwLCB5OiAxIH0sIHsgeDogLTEsIHk6IDAgfSwgeyB4OiAxLCB5OiAtMSB9LCB7IHg6IDEsIHk6IDEgfSwgeyB4OiAtMSwgeTogMSB9LCB7IHg6IC0xLCB5OiAtMSB9IF0sXG4gICAgJzYnOiBbIHsgeDogLTEsIHk6IC0xIH0sIHsgeDogMSwgeTogLTEgfSwgeyB4OiAyLCB5OiAwIH0sIHsgeDogMSwgeTogMSB9LCB7IHg6IC0xLCB5OiAxIH0sIHsgeDogLTIsIHk6IDAgfSBdXG59WyBUT1BPTE9HWSBdXG5cbmNvbnN0IERJU1RBTkNFID0ge1xuICAgICc0JzogZnVuY3Rpb24oIHgwLCB5MCwgeDEsIHkxICkge1xuICAgICAgICByZXR1cm4gTWF0aC5hYnMoIHgxIC0geDAgKSArIE1hdGguYWJzKCB5MSAtIHkwIClcbiAgICB9LFxuICAgICc2JzogZnVuY3Rpb24oIHgwLCB5MCwgeDEsIHkxICkge1xuICAgICAgICB2YXIgZHkgPSBNYXRoLmFicyggeTEgLSB5MCApXG4gICAgICAgIHJldHVybiBkeSArIE1hdGgubWF4KCAgMCwgKCBNYXRoLmFicyggeDEgLSB4MCApIC0gZHkgKSAvIDIgKVxuICAgIH0sXG4gICAgJzgnOiBmdW5jdGlvbiggeDAsIHkwLCB4MSwgeTEgKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heCggTWF0aC5hYnMoIHgxIC0geDApLCBNYXRoLmFicyggeTEgLSB5MCApIClcbiAgICB9XG59WyBUT1BPTE9HWSBdXG5cbmNvbnN0IENJUkNMRV9DT1VOVEZBQ1RPUiA9IHtcbiAgICAnNCc6IDEsXG4gICAgJzYnOiAxLFxuICAgICc4JzogMlxufVsgVE9QT0xPR1kgXVxuXG5jb25zdCBDSVJDTEVfU1RBUlRPRkZTRVQgPSB7XG4gICAgJzQnOiBbIDAsIDEgXSxcbiAgICAnNic6IFsgLTEsIDEgXSxcbiAgICAnOCc6IFsgLTEsIDEgXVxufVsgVE9QT0xPR1kgXVxuXG5jb25zdCBDSVJDTEVfRElSUyA9IHtcbiAgICAnNCc6IFsgWy0xLCAtMV0sIFsgMSwgLTFdLCBbIDEsICAxXSwgWy0xLCAgMV0gXSxcbiAgICAnNic6IFsgWy0xLCAtMV0sIFsgMSwgLTFdLCBbIDIsICAwXSwgWyAxLCAgMV0sIFstMSwgIDFdLCBbLTIsICAwXSBdLFxuICAgICc4JzogWyBbIDAsIC0xXSwgWyAxLCAgMF0sIFsgMCwgIDFdLCBbLTEsICAwXSBdXG59WyBUT1BPTE9HWSBdXG4gXG5cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IFRpbGUgb24gYW4gQSogcGF0aC5cbiAqL1xuZnVuY3Rpb24gbmV4dFRpbGVPblBhdGgoIGZyb21YLCBmcm9tWSwgdG9YLCB0b1ksIHBhc3NhYmxlICkge1xuICAgIHZhciBxdWV1ZSA9IFtdXG4gICAgdmFyIGlkID0gdG9YICsgJywnICsgdG9ZXG4gICAgdmFyIHZpc2l0ZWQgPSB7IGlkOiBpbnNlcnQoIHF1ZXVlLCBmcm9tWCwgZnJvbVksIHRvWCwgdG9ZLCBudWxsICkgfVxuICAgIHdoaWxlICggcXVldWUubGVuZ3RoICkge1xuICAgICAgICB2YXIgaXRlbSA9IHF1ZXVlLnNoaWZ0KClcbiAgICAgICAgaWYgKCBpdGVtLnggPT09IGZyb21YICYmIGl0ZW0ueSA9PT0gZnJvbVkgKSBicmVha1xuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBESVJTLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgdmFyIGRpciA9IERJUlNbIGkgXVxuICAgICAgICAgICAgdmFyIHggPSBpdGVtLnggKyBkaXIueFxuICAgICAgICAgICAgdmFyIHkgPSBpdGVtLnkgKyBkaXIueVxuICAgICAgICAgICAgaWYgKCAhIHBhc3NhYmxlKCB4LCB5ICkgKSBjb250aW51ZVxuICAgICAgICAgICAgaWQgPSB4ICsgJywnICsgeVxuICAgICAgICAgICAgaWYgKCBpZCBpbiB2aXNpdGVkICkgY29udGludWVcbiAgICAgICAgICAgIHZpc2l0ZWRbIGlkIF0gPSBpbnNlcnQoIHF1ZXVlLCBmcm9tWCwgZnJvbVksIHgsIHksIGl0ZW0gKVxuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBpdGVtID0gdmlzaXRlZFsgZnJvbVggKyAnLCcgKyBmcm9tWSBdXG4gICAgaWYgKCAhIGl0ZW0gfHwgISBpdGVtLnByZXYgKSByZXR1cm5cbiAgICByZXR1cm4gaXRlbS5wcmV2XG59XG5cbmZ1bmN0aW9uIGluc2VydCggcXVldWUsIHgwLCB5MCwgeDEsIHkxLCBwcmV2ICkge1xuICAgIHZhciBoID0gRElTVEFOQ0UoIHgwLCB5MCwgeDEsIHkxIClcbiAgICB2YXIgb2JqID0ge1xuICAgICAgICB4OiB4MSxcbiAgICAgICAgeTogeTEsXG4gICAgICAgIHByZXY6IHByZXYsXG4gICAgICAgIGc6ICggcHJldiA/IHByZXYuZyArIDEgOiAwICksXG4gICAgICAgIGg6IGhcbiAgICB9XG4gICAgdmFyIGYgPSBvYmouZyArIG9iai5oXG4gICAgZm9yICggdmFyIGkgPSAwOyBpIDwgcXVldWUubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIHZhciBpdGVtID0gcXVldWVbIGkgXVxuICAgICAgICB2YXIgaXRlbUYgPSBpdGVtLmcgKyBpdGVtLmhcbiAgICAgICAgaWYgKCBmIDwgaXRlbUYgfHwgKCBmID09PSBpdGVtRiAmJiBoIDwgaXRlbS5oICkgKSB7XG4gICAgICAgICAgICBxdWV1ZS5zcGxpY2UoIGksIDAsIG9iaiApXG4gICAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaCggb2JqIClcbiAgICByZXR1cm4gb2JqXG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB2aXNpYmlsaXR5LlxuICogQHBhcmFtIHtUaWxlfSBzdGFydFRpbGUgVGhlIHN0YXJ0aW5nIFRpbGVcbiAqIEBwYXJhbSB7aW50fSByb3cgVGhlIHJvdyB0byByZW5kZXJcbiAqIEBwYXJhbSB7ZmxvYXR9IHZpc1Nsb3BlU3RhcnQgVGhlIHNsb3BlIHRvIHN0YXJ0IGF0XG4gKiBAcGFyYW0ge2Zsb2F0fSB2aXNTbG9wZUVuZCBUaGUgc2xvcGUgdG8gZW5kIGF0XG4gKiBAcGFyYW0ge2ludH0gcmFkaXVzIFRoZSByYWRpdXMgdG8gcmVhY2ggb3V0IHRvXG4gKiBAcGFyYW0ge2ludH0geHggXG4gKiBAcGFyYW0ge2ludH0geHkgXG4gKiBAcGFyYW0ge2ludH0geXggXG4gKiBAcGFyYW0ge2ludH0geXkgXG4gKi9cbmZ1bmN0aW9uIGNhc3RWaXNpYmlsaXR5KCBzdGFydFRpbGUsIHJvdywgdmlzU2xvcGVTdGFydCwgdmlzU2xvcGVFbmQsIHJhZGl1cywgeHgsIHh5LCB5eCwgeXkgKSB7XG5cbiAgICBmb3IoIHZhciBpID0gcm93OyBpIDw9IHJhZGl1czsgaSsrICkge1xuXG4gICAgICAgIHZhciBkeCA9IC1pIC0gMVxuICAgICAgICB2YXIgZHkgPSAtaVxuICAgICAgICB2YXIgYmxvY2tlZCA9IGZhbHNlXG4gICAgICAgIHZhciBuZXdTdGFydCA9IDBcblxuICAgICAgICAvLyAnUm93JyBjb3VsZCBiZSBjb2x1bW4sIG5hbWVzIGhlcmUgYXNzdW1lIG9jdGFudCAwIGFuZCB3b3VsZCBiZSBmbGlwcGVkIGZvciBoYWxmIHRoZSBvY3RhbnRzXG4gICAgICAgIHdoaWxlICggZHggPD0gMCApIHtcbiAgICAgICAgICAgIGR4ICs9IDFcblxuICAgICAgICAgICAgLy8gVHJhbnNsYXRlIGZyb20gcmVsYXRpdmUgY29vcmRpbmF0ZXMgdG8gbWFwIGNvb3JkaW5hdGVzXG4gICAgICAgICAgICB2YXIgbWFwWCA9IHN0YXJ0VGlsZS54ICsgZHggKiB4eCArIGR5ICogeHlcbiAgICAgICAgICAgIHZhciBtYXBZID0gc3RhcnRUaWxlLnkgKyBkeCAqIHl4ICsgZHkgKiB5eVxuXG4gICAgICAgICAgICB2YXIgdGlsZSA9IGdldFRpbGUoIG1hcFgsIG1hcFkgKVxuXG4gICAgICAgICAgICAvLyBSZWFjaGluZyB0aGUgZWRnZSBvZiB0aGUgbWFwIG1lYW5zIHdlIGNhbiBzdG9wXG4gICAgICAgICAgICBpZiAoICEgdGlsZSApIHJldHVyblxuIFxuICAgICAgICAgICAgLy8gUmFuZ2Ugb2YgdGhlIHJvd1xuICAgICAgICAgICAgdmFyIHNsb3BlU3RhcnQgPSAoIGR4IC0gMC41ICkgLyAoIGR5ICsgMC41IClcbiAgICAgICAgICAgIHZhciBzbG9wZUVuZCA9ICggZHggKyAwLjUgKSAvICggZHkgLSAwLjUgKVxuICAgICAgICBcbiAgICAgICAgICAgIC8vIElnbm9yZSBpZiBub3QgeWV0IGF0IGxlZnQgZWRnZSBvZiBPY3RhbnRcbiAgICAgICAgICAgIGlmICggc2xvcGVFbmQgPiB2aXNTbG9wZVN0YXJ0ICkgY29udGludWVcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gRG9uZSBpZiBwYXN0IHJpZ2h0IGVkZ2VcbiAgICAgICAgICAgIGlmICggc2xvcGVTdGFydCA8IHZpc1Nsb3BlRW5kICkgYnJlYWtcbiAgICAgICAgICAgIFx0XG4gICAgICAgICAgICAvLyBJZiBpdCdzIGluIHJhbmdlLCBpdCdzIHZpc2libGVcbiAgICAgICAgICAgIGlmICggKGR4ICogZHggKyBkeSAqIGR5ICkgPCAoIHJhZGl1cyAqIHJhZGl1cyApICkge1xuICAgICAgICAgICAgICAgIHRpbGUuZm92ID0gdHJ1ZVxuICAgICAgICAgICAgICAgIHRpbGUuZm93ID0gZmFsc2VcbiAgICAgICAgICAgICAgICB0aWxlLnIgPSB0aWxlLmcgPSB0aWxlLmIgPSAxLjVcbiAgICAgICAgICAgICAgICBmb3Z0aWxlcy5wdXNoKCB0aWxlIClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHZpc2libGUgPSBjb250YWlucyggdGlsZSwgdHJlZWdseXBocyApID8gbGVuZ3RoKCBzdWJ0cmFjdCggdGlsZSwgc3RhcnRUaWxlICkgKSA8PSAwLjUgOiAhIGNvbnRhaW5zKCB0aWxlLCBibG9ja3Nmb3YgKVxuICAgIFxuICAgICAgICAgICAgaWYgKCBibG9ja2VkICkge1xuICAgICAgICAgICAgXHQvLyBLZWVwIG5hcnJvd2luZyBpZiBzY2FubmluZyBhY3Jvc3MgYSBibG9ja1xuICAgICAgICAgICAgXHRpZiggISB2aXNpYmxlICkge1xuICAgICAgICAgICAgXHRcdG5ld1N0YXJ0ID0gc2xvcGVFbmRcbiAgICAgICAgICAgIFx0XHRjb250aW51ZVxuICAgICAgICAgICAgXHR9XG4gICAgICAgICAgICBcdC8vIEJsb2NrIGhhcyBlbmRlZFxuICAgICAgICAgICAgXHRibG9ja2VkID0gZmFsc2VcbiAgICAgICAgICAgIFx0dmlzU2xvcGVTdGFydCA9IG5ld1N0YXJ0XG4gXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgXHQvLyBJZiB0aWxlIGlzIGEgYmxvY2tpbmcgdGlsZSwgY2FzdCBhcm91bmQgaXRcbiAgICAgICAgICAgIFx0aWYgKCAhIHZpc2libGUgJiYgaSA8IHJhZGl1cyApIHtcbiAgICAgICAgICAgIFx0XHRibG9ja2VkID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBpZiAoIHZpc1Nsb3BlU3RhcnQgPj0gdmlzU2xvcGVFbmQgKSB7XG4gICAgICAgICAgICBcdFx0ICAgIGNhc3RWaXNpYmlsaXR5KCBzdGFydFRpbGUsIGkgKyAxLCB2aXNTbG9wZVN0YXJ0LCBzbG9wZVN0YXJ0LCByYWRpdXMsIHh4LCB4eSwgeXgsIHl5IClcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXHRcdG5ld1N0YXJ0ID0gc2xvcGVFbmRcbiAgICAgICAgICAgIFx0fVxuIFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICggYmxvY2tlZCApIGJyZWFrXG4gICAgfVxufVxuXG5cblxuY29uc3Qgc3VucmlzZSA9IHsgcjogMjgyIC8gMjU1LjAsIGc6IDIyNiAvIDI1NS4wLCBiOiAxOTEgLyAyNTUuMCB9XG5jb25zdCBub29uID0geyByOiAyOTIgLyAyNTUuMCwgZzogMjkxIC8gMjU1LjAsIGI6IDI3MyAvIDI1NS4wIH1cbmNvbnN0IGNsb3VkcyA9IHsgcjogMjg5IC8gMjU1LjAsIGc6IDI5MCAvIDI1NS4wLCBiOiAyOTIgLyAyNTUuMCB9XG5jb25zdCBvdmVyY2FzdCA9IHsgcjogMjc0IC8gMjU1LjAsIGc6IDI4MyAvIDI1NS4wLCBiOiAyOTAgLyAyNTUuMCB9XG5cbmNvbnN0IHN1biA9IG5vb25cblxuXG5jb25zdCBtYXAgPSBbXVxubWFwLndpZHRoID0gMjAwXG5tYXAuaGVpZ2h0ID0gMjAwXG5cbmNvbnN0IGFjdG9ycyA9IFtdXG5jb25zdCBjZW50cmUgPSB7IHg6IDAsIHk6IDAgfVxuXG5mdW5jdGlvbiBHbHlwaCggY2gsIG5hbWUsIHIsIGcsIGIgKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2g6IGNoLFxuICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICByOiByIC8gMjU1LjAsXG4gICAgICAgIGc6IGcgLyAyNTUuMCxcbiAgICAgICAgYjogYiAvIDI1NS4wXG4gICAgfVxufVxuXG5jb25zdCBnbHlwaHMgPSB7XG4gICAgVk9JRDogR2x5cGgoICcgJywgJ3ZvaWQnLCAwLCAwLCAwICksXG4gICAgUEM6IEdseXBoKCAnQCcsICd5b3UnLCAyNDUsIDMsIDI1NSApLFxuICAgIENPUlBTRTogR2x5cGgoICfimKAnLCAnY29ycHNlJywgMjAwLCAxNTAsIDE1MCApLFxuICAgIEdSQVNTMTogR2x5cGgoICc7JywgJ3RhbGwgZ3Jhc3MnLCA0NiwgMTAwLCAwICksXG4gICAgR1JBU1MyOiBHbHlwaCggXCInXCIsICdzaG9ydCBncmFzcycsIDU2LCAxMDAsIDAgKSxcbiAgICBHUkFTUzM6IEdseXBoKCAnXCInLCAndGhpY2sgZ3Jhc3MnLCA2MCwgMTAwLCAwICksXG4gICAgUEFWSU5HOiBHbHlwaCggJ+KsmycsICdwYXZpbmcnLCA0MCwgNDAsIDQwICksXG4gICAgV0FMTDogR2x5cGgoICcjJywgJ3dhbGwnLCAxNjQsIDE2NCwgMTY0ICksXG4gICAgV0FURVI6IEdseXBoKCBcIuOAnFwiLCAnd2F0ZXInLCAxMjAsIDE1NCwgMjM1ICksXG4gICAgVFJFRTE6IEdseXBoKCAn4pmgJywgJ3RyZWUnLCAwLCAyNSwgMCApLFxuICAgIFRSRUUyOiBHbHlwaCggJ+KZoycsICd0cmVlJywgMCwgNDAsIDAgKSxcbiAgICBSQVQ6IEdseXBoKCAncicsICdyYXQnLCAxNTAsIDE1MCwgMTUwICksXG4gICAgVElHRVI6IEdseXBoKCAndCcsICd0aWdlcicsIDIwMCwgMjAwLCAwICksXG4gICAgSEVBTElOR1BPVElPTjogR2x5cGgoICchJywgJ2hlYWxpbmcgcG90aW9uJywgMjU1LCA2MCwgNjAgKSxcbn1cblxuY29uc3QgZHJhd19vdXRvZl9mb3YgPSBbXVxuY29uc3QgZ3Jhc3NnbHlwaHMgPSBbIGdseXBocy5HUkFTUzEsIGdseXBocy5HUkFTUzIsIGdseXBocy5HUkFTUzMgXVxuY29uc3QgdHJlZWdseXBocyA9IFsgZ2x5cGhzLlRSRUUxLCBnbHlwaHMuVFJFRTIgXVxuY29uc3QgYmxvY2tzZm92ID0gWyBnbHlwaHMuVk9JRCwgZ2x5cGhzLldBTEwgXVxuQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIGJsb2Nrc2ZvdiwgdHJlZWdseXBocyApXG5BcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggZHJhd19vdXRvZl9mb3YsIHRyZWVnbHlwaHMgKVxuY29uc3QgbW9uc3RlcmdseXBocyA9IFsgZ2x5cGhzLlJBVCwgZ2x5cGhzLlRJR0VSIF1cbmNvbnN0IGJsb2Nrc21vdmUgPSBbIGdseXBocy5WT0lELCBnbHlwaHMuV0FMTCBdXG5jb25zdCBibG9ja3NhY3RvcnBhdGggPSBbXVxuY29uc3QgYmxvY2tzcGNwYXRoID0gW11cbkFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KCBibG9ja3NhY3RvcnBhdGgsIGJsb2Nrc21vdmUgKVxuQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoIGJsb2Nrc3BjcGF0aCwgYmxvY2tzbW92ZSApXG5BcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSggYmxvY2tzcGNwYXRoLCBtb25zdGVyZ2x5cGhzIClcbkFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KCBibG9ja3Ntb3ZlLCBtb25zdGVyZ2x5cGhzIClcblxuY29uc3QgdWkgPSB7fVxuXG5mdW5jdGlvbiBFKCB0YWcsIGF0dHJpYnMsIGNvbnRlbnRzICkge1xuICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggdGFnIClcbiAgICBmb3IgKCB2YXIgbmFtZSBpbiBhdHRyaWJzICkge1xuICAgICAgICBpZiAoIG5hbWUgPT09ICdjbGFzcycgKSB7XG4gICAgICAgICAgICBlbGVtZW50LmNsYXNzTmFtZSA9IGF0dHJpYnNbIG5hbWUgXVxuICAgICAgICB9IGVsc2UgaWYgKCBuYW1lID09PSAnc3R5bGUnICkge1xuICAgICAgICAgICAgZWxlbWVudC5zdHlsZSA9IGF0dHJpYnNbIG5hbWUgXVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGVbIG5hbWUgXSA9IGF0dHJpYnNbIG5hbWUgXVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmICggdHlwZW9mIGNvbnRlbnRzICE9PSAndW5kZWZpbmVkJyApIHtcbiAgICAgICAgaWYgKCBjb250ZW50cy5jb25zdHJ1Y3RvciAhPT0gQXJyYXkgKSBjb250ZW50cyA9IFsgY29udGVudHMgXVxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBjb250ZW50cy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgIHZhciBjb250ZW50ID0gY29udGVudHNbIGkgXVxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgY29udGVudCA9PT0gJ3VuZGVmaW5lZCcgKSBjb250aW51ZVxuICAgICAgICAgICAgdmFyIG5vZGUgPSAoIGNvbnRlbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCApID8gY29udGVudCA6IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCBjb250ZW50IClcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoIG5vZGUgKVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlbGVtZW50XG59XG5cbmNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3N0eWxlJyApXG5kb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKCBzdHlsZSApXG5cbmZ1bmN0aW9uIGNzcyggdGV4dCApIHtcbiAgICBzdHlsZS50ZXh0Q29udGVudCArPSB0ZXh0XG59XG5cbmNzcyggJy51aSB7IHBvc2l0aW9uOiBhYnNvbHV0ZTsgei1pbmRleDogMTsgb3ZlcmZsb3c6IGhpZGRlbjsgYmFja2dyb3VuZDogIzExMTsgYm9yZGVyOiAxcHggc29saWQgIzQ2NDsgfScgKVxuY3NzKCAnLml0ZW0geyBmb250LXNpemU6IDIwMCU7IG1pbi13aWR0aDogMWVtOyBiYWNrZ3JvdW5kOiAjMDAwOyB9JyApXG5jc3MoICcuZm9jdXNlZGl0ZW0geyBiYWNrZ3JvdW5kOiAjMDBmOyB9JyApXG5cblxudWkubG9nID0gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggRSggJ2RpdicsIHsgY2xhc3M6ICd1aScsIHN0eWxlOiAnbGVmdDogMSU7IGJvdHRvbTogMSU7IHdpZHRoOiA1MCU7IGhlaWdodDogMTUlOycgfSApIClcblxuZnVuY3Rpb24gbG9nKCBtc2csIGNvbG91ciApIHtcbiAgICB3aGlsZSggdWkubG9nLmNoaWxkTm9kZXMubGVuZ3RoID4gNiApIHVpLmxvZy5yZW1vdmVDaGlsZCggdWkubG9nLmNoaWxkTm9kZXNbIDAgXSApXG4gICAgdmFyIG9wYWNpdHkgPSAxXG4gICAgZm9yICggdmFyIGkgPSB1aS5sb2cuY2hpbGROb2Rlcy5sZW5ndGg7IGktLTsgKSB1aS5sb2cuY2hpbGROb2Rlc1sgaSBdLnN0eWxlLm9wYWNpdHkgPSAnJyArICggb3BhY2l0eSAtPSAwLjIgKVxuICAgIHZhciBlbnRyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICdkaXYnIClcbiAgICBlbnRyeS5zdHlsZS5jb2xvciA9IGNvbG91ciA/IGNvbG91cjogJ3doaXRlJ1xuICAgIGVudHJ5LmlubmVySFRNTCA9IG1zZ1xuICAgIHVpLmxvZy5hcHBlbmRDaGlsZCggZW50cnkgKVxuICAgIGVudHJ5LnNjcm9sbEludG9WaWV3KClcbn1cblxubG9nKCAnci9yb2d1ZWxpa2VkZXYgZG9lcyB0aGUgY29tcGxldGUgcm9ndWVsaWtlIHR1dG9yaWFsJyApXG5sb2coICdXZWVrIDYgLSBQYXJ0IDg6IEl0ZW1zIGFuZCBpbnZlbnRvcnknLCAneWVsbG93JyApXG5cbnVpLnRhcmdldGluZm8gPSBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBFKCAnZGl2JywgeyBjbGFzczogJ3VpJywgc3R5bGU6ICd0b3A6IDElOyBsZWZ0OiAxJTsgd2lkdGg6IDUwJTsgaGVpZ2h0OiAxLjVlbTsgY29sb3I6IHdoaXRlOycgfSApIClcbnVpLmhlYWx0aGxibCA9IEUoICdkaXYnLCB7IGNsYXNzOiAndWknLCBzdHlsZTogJ2JvdHRvbTogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMWVtOyBjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMTBwdDsgei1pbmRleDogMjsnIH0gKVxudWkuaGVhbHRobG9zcyA9IEUoICdkaXYnLCB7IGNsYXNzOiAndWknLCBzdHlsZTogJ3RvcDogMDsgd2lkdGg6IDEwMCU7IGhlaWdodDogMTAlOyBjb2xvcjogcmVkOycgfSwgJ+KWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkScgKVxudWkuaGVhbHRoYmFyID0gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggRSggJ2RpdicsIHsgY2xhc3M6ICd1aScsIHN0eWxlOiAncmlnaHQ6IDElOyBib3R0b206IDElOyB3aWR0aDogMWVtOyBoZWlnaHQ6IDE1JTsgY29sb3I6IGdyZWVuOyBmb250LXNpemU6IDgwcHQ7IHRleHQtYWxpZ246IGNlbnRlcjsnIH0sIFsgJ+KWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkVxcbuKWkScsIHVpLmhlYWx0aGxibCwgdWkuaGVhbHRobG9zcyBdICkgKVxuXG5mdW5jdGlvbiB1cGRhdGV1aSgpIHtcbiAgICB1aS5oZWFsdGhsYmwudGV4dENvbnRlbnQgPSBoZWFsdGgoIHBjIClcbiAgICB1aS5oZWFsdGhsb3NzLnN0eWxlLmhlaWdodCA9IE1hdGgucm91bmQoIDEwMCAqICggcGMuZmlnaHRlci5tYXhoZWFsdGggLSBwYy5maWdodGVyLmhlYWx0aCApIC8gcGMuZmlnaHRlci5tYXhoZWFsdGggKSArICclJ1xuICAgIHZhciB0aWxlID0gZ2V0VGlsZSggbWlueCArIG1vdXNlLngsIG1pbnkgKyBtb3VzZS55IClcbiAgICBpZiAoICEgdGlsZSApIHJldHVyblxuICAgIHZhciB0YXJnZXRtc2cgPSB0aWxlLmZvdyA/ICcnIDogdGlsZS5nbHlwaC5uYW1lXG4gICAgaWYgKCAhIHRpbGUuZm93ICkge1xuICAgICAgICB2YXIgdGhpbmdzID0gdGlsZS50aGluZ3NcbiAgICAgICAgZm9yICggdmFyIGkgPSB0aGluZ3MubGVuZ3RoOyBpLS07ICkgdGFyZ2V0bXNnICs9ICcsICcgKyB0aGluZ3NbIGkgXS5nbHlwaC5uYW1lXG4gICAgfVxuICAgIHVpLnRhcmdldGluZm8udGV4dENvbnRlbnQgPSAn8J+RgSAnICsgdGFyZ2V0bXNnXG59XG5cbnVpLmludmVudG9yeSA9ICggZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRib2R5ID0gRSggJ3Rib2R5JyApXG4gICAgdmFyIGRpdiA9IGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIEUoICdkaXYnLCB7XG4gICAgICAgICAgICBpZDogJ2ludmVudG9yeScsXG4gICAgICAgICAgICBjbGFzczogJ3VpJyxcbiAgICAgICAgICAgIHN0eWxlOiAncmlnaHQ6IDA7IHRvcDogMDsgYm90dG9tOiAwOyBkaXNwbGF5OiBub25lOydcbiAgICAgICAgfSxcbiAgICAgICAgWyBFKCAndGFibGUnLCB7fSwgdGJvZHkgKSBdXG4gICAgKSApXG4gICAgZm9yICggdmFyIHIgPSAwOyByIDwgNTsgcisrICkge1xuICAgICAgICB2YXIgcm93ID0gRSggJ3RyJyApXG4gICAgICAgIGZvciAoIHZhciBjID0gMDsgYyA8IDEwOyBjKysgKSB7XG4gICAgICAgICAgICB2YXIgY2VsbCA9IEUoICd0ZCcgKVxuICAgICAgICAgICAgY2VsbC5jbGFzc05hbWUgPSAnaXRlbSdcbiAgICAgICAgICAgIHJvdy5hcHBlbmRDaGlsZCggY2VsbCApXG4gICAgICAgIH1cbiAgICAgICAgdGJvZHkuYXBwZW5kQ2hpbGQoIHJvdyApXG4gICAgfVxuICAgIHJldHVybiBkaXZcbn0gKSgpXG5cbmZ1bmN0aW9uIHNob3dJbnZlbnRvcnkoKSB7XG4gICAgdWkuaW52ZW50b3J5LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snXG59XG5cbmZ1bmN0aW9uIGNsb3NlSW52ZW50b3J5KCkge1xuICAgIHVpLmludmVudG9yeS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG59XG5cbnVpLml0ZW1zID0gZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggRSggJ2RpdicsIHtcbiAgICBpZDogJ2l0ZW1zJyxcbiAgICBjbGFzczogJ3VpJyxcbiAgICBzdHlsZTogJ2xlZnQ6IDA7IHRvcDogMDsgYm90dG9tOiAwOyBkaXNwbGF5OiBub25lOydcbn0gKSApXG5cbmZ1bmN0aW9uIGRlcG9zaXQoIGludmVudG9yeSwgaXRlbSApIHtcbiAgICBpZiAoIGludmVudG9yeS5saW1pdCAhPT0gLTEgJiBpbnZlbnRvcnkubGltaXQgPD0gaW52ZW50b3J5Lml0ZW1zLmxlbmd0aCApIHJldHVyblxuICAgIGludmVudG9yeS5pdGVtcy5wdXNoKCBpdGVtIClcbn1cblxuZnVuY3Rpb24gd2l0aGRyYXcoIGludmVudG9yeSwgaXRlbSApIHtcbiAgICB2YXIgaSA9IGludmVudG9yeS5pdGVtcy5pbmRleE9mKCBpdGVtIClcbiAgICBpZiAoIGkgPiAtMSApIGludmVudG9yeS5pdGVtcy5zcGxpY2UoIGksIDEgKVxufVxuXG5jb25zdCBzaG93bkl0ZW1zID0gW11cbmNvbnN0IHNob3duSXRlbXNDb2xzID0gMTBcbnZhciBzaG93bkl0ZW1Gb2N1cyA9IG51bGxcbnZhciBzaG93bkl0ZW1Gb2N1c0Rlc2NyaXB0aW9uID0gbnVsbCBcblxuZnVuY3Rpb24gc2hvd0l0ZW1zKCBpdGVtcyApIHtcbiAgICB2YXIgY29scyA9IE1hdGgubWluKCBzaG93bkl0ZW1zQ29scywgTWF0aC5tYXgoIHNob3duSXRlbXNDb2xzLCBNYXRoLnNxcnQoIGl0ZW1zLmxlbmd0aCApICkgKVxuICAgIHZhciByb3dzID0gTWF0aC5taW4oIDE1LCBNYXRoLm1heCggMTUsIE1hdGguc3FydCggaXRlbXMubGVuZ3RoICkgKSApXG4gICAgdmFyIGluZGV4ID0gMFxuICAgIHNob3duSXRlbXMubGVuZ3RoID0gMFxuICAgIHNob3duSXRlbUZvY3VzID0gbnVsbFxuICAgIHZhciB0YWJsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICd0YWJsZScgKVxuICAgIHZhciB0Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoICd0Ym9keScgKVxuICAgIHRhYmxlLmFwcGVuZENoaWxkKCB0Ym9keSApXG4gICAgZm9yICggdmFyIHJvdyA9IDA7IHJvdyA8IHJvd3M7IHJvdysrICkge1xuICAgICAgICB2YXIgdHIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAndHInIClcbiAgICAgICAgZm9yICggdmFyIGNvbCA9IDA7IGNvbCA8IGNvbHM7IGNvbCsrICkge1xuICAgICAgICAgICAgdmFyIHRkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ3RkJyApXG4gICAgICAgICAgICB0ZC5pbm5lckhUTUwgPSAoIGluZGV4IDwgaXRlbXMubGVuZ3RoICkgPyBpdGVtc1sgaW5kZXggXS5nbHlwaC5jaCA6ICcmbmJzcDsnXG4gICAgICAgICAgICB0ZC5jbGFzc05hbWUgPSAnaXRlbSdcbiAgICAgICAgICAgIHRyLmFwcGVuZENoaWxkKCB0ZCApXG4gICAgICAgICAgICBzaG93bkl0ZW1zLnB1c2goIHsgdGQ6IHRkLCBpdGVtOiBpdGVtc1sgaW5kZXggXSwgcm93OiByb3csIGNvbDogY29sIH0gKVxuICAgICAgICAgICAgaW5kZXgrK1xuICAgICAgICB9XG4gICAgICAgIHRib2R5LmFwcGVuZENoaWxkKCB0ciApXG4gICAgfSBcbiAgICB1aS5pdGVtcy5pbm5lckhUTUwgPSAnJ1xuICAgIHVpLml0ZW1zLmFwcGVuZENoaWxkKCB0YWJsZSApXG4gICAgdWkuaXRlbXMuc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICBtb3ZlSXRlbUZvY3VzKCAwLCAwIClcbn1cblxuZnVuY3Rpb24gY2xvc2VJdGVtcygpIHtcbiAgICB1aS5pdGVtcy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG4gICAgaWYgKCBzaG93bkl0ZW1Gb2N1c0Rlc2NyaXB0aW9uICkgc2hvd25JdGVtRm9jdXNEZXNjcmlwdGlvbi5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnXG59XG5cbmZ1bmN0aW9uIG1vdmVJdGVtRm9jdXMoIGNvbCwgcm93ICkge1xuICAgIHZhciBpbmRleCA9IHJvdyAqIHNob3duSXRlbXNDb2xzICsgY29sXG4gICAgaWYgKCBpbmRleCA8IDAgfHwgaW5kZXggPj0gc2hvd25JdGVtcy5sZW5ndGggKSByZXR1cm5cbiAgICBpZiAoIHNob3duSXRlbUZvY3VzICkgc2hvd25JdGVtRm9jdXMudGQuY2xhc3NMaXN0LnJlbW92ZSggJ2ZvY3VzZWRpdGVtJyApXG4gICAgc2hvd25JdGVtRm9jdXMgPSBzaG93bkl0ZW1zWyBpbmRleCBdXG4gICAgc2hvd25JdGVtRm9jdXMudGQuY2xhc3NMaXN0LmFkZCggJ2ZvY3VzZWRpdGVtJyApXG5cbiAgICBpZiAoICEgc2hvd25JdGVtRm9jdXNEZXNjcmlwdGlvbiApIHtcbiAgICAgICAgc2hvd25JdGVtRm9jdXNEZXNjcmlwdGlvbiA9IGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIEUoICdkaXYnLCB7XG4gICAgICAgICAgICBjbGFzczogJ3VpJyxcbiAgICAgICAgICAgIHN0eWxlOiAnYmFja2dyb3VuZDogYmxhY2s7IGJvcmRlcjogMXB4IHNvbGlkICM2NjY7IHBhZGRpbmc6IDNweDsnXG4gICAgICAgIH0gKSApXG4gICAgfVxuICAgIGlmICggISBzaG93bkl0ZW1Gb2N1cy5pdGVtICkge1xuICAgICAgICBzaG93bkl0ZW1Gb2N1c0Rlc2NyaXB0aW9uLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSdcbiAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgdGQgPSBzaG93bkl0ZW1Gb2N1cy50ZFxuICAgICAgICB2YXIgc3R5bGUgPSBzaG93bkl0ZW1Gb2N1c0Rlc2NyaXB0aW9uLnN0eWxlXG4gICAgICAgIHN0eWxlLmxlZnQgPSAoIHRkLm9mZnNldExlZnQgKyB0ZC5vZmZzZXRXaWR0aCApICsgJ3B4J1xuICAgICAgICBzdHlsZS50b3AgPSAoIHRkLm9mZnNldFRvcCArIDYgKSArICdweCdcbiAgICAgICAgc2hvd25JdGVtRm9jdXNEZXNjcmlwdGlvbi5pbm5lckhUTUwgPSBzaG93bkl0ZW1Gb2N1cy5pdGVtLmdseXBoLm5hbWVcbiAgICAgICAgc3R5bGUuZGlzcGxheSA9ICdibG9jaydcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1vdmVJdGVtRm9jdXNVcCgpIHtcbiAgICBtb3ZlSXRlbUZvY3VzKCBzaG93bkl0ZW1Gb2N1cy5jb2wsIHNob3duSXRlbUZvY3VzLnJvdyAtIDEgKVxufVxuXG5mdW5jdGlvbiBtb3ZlSXRlbUZvY3VzRG93bigpIHtcbiAgICBtb3ZlSXRlbUZvY3VzKCBzaG93bkl0ZW1Gb2N1cy5jb2wsIHNob3duSXRlbUZvY3VzLnJvdyArIDEgKVxufVxuXG5mdW5jdGlvbiBtb3ZlSXRlbUZvY3VzTGVmdCgpIHtcbiAgICBtb3ZlSXRlbUZvY3VzKCBzaG93bkl0ZW1Gb2N1cy5jb2wgLSAxLCBzaG93bkl0ZW1Gb2N1cy5yb3cgKVxufVxuXG5mdW5jdGlvbiBtb3ZlSXRlbUZvY3VzUmlnaHQoKSB7XG4gICAgbW92ZUl0ZW1Gb2N1cyggc2hvd25JdGVtRm9jdXMuY29sICsgMSwgc2hvd25JdGVtRm9jdXMucm93IClcbn1cblxuZnVuY3Rpb24gVGlsZSggZ2x5cGgsIHgsIHkgKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2x5cGg6IGdseXBoLFxuICAgICAgICByOiAwLjEsXG4gICAgICAgIGc6IDAuMSxcbiAgICAgICAgYjogMC4xLFxuICAgICAgICB4OiB4LFxuICAgICAgICB5OiB5LFxuICAgICAgICB0aGluZ3M6IFtdLFxuICAgICAgICBmb3Y6IGZhbHNlLFxuICAgICAgICBmb3c6IHRydWUsXG4gICAgfVxufVxuXG5mdW5jdGlvbiBUaGluZyggZ2x5cGgsIHgsIHksIHosIGNvbXBvbmVudHMgKSB7XG4gICAgdmFyIHRoaW5nID0gT2JqZWN0LmFzc2lnbigge30sIGNvbXBvbmVudHMgKVxuICAgIHRoaW5nLmdseXBoID0gZ2x5cGhcbiAgICB0aGluZy50aWxlID0gZ2V0VGlsZSggeCwgeSApXG4gICAgdGhpbmcueiA9IHpcbiAgICByZXR1cm4gdGhpbmdcbn1cblxuZnVuY3Rpb24gRmlnaHRlciggaGVhbHRoLCBkZWZlbnNlLCBwb3dlciApIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBoZWFsdGg6IGhlYWx0aCxcbiAgICAgICAgbWF4aGVhbHRoOiBoZWFsdGgsXG4gICAgICAgIGRlZmVuc2U6IGRlZmVuc2UsXG4gICAgICAgIHBvd2VyOiBwb3dlclxuICAgIH1cbn1cblxuZnVuY3Rpb24gSXRlbSggd2VpZ2h0ICkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHdlaWdodDogd2VpZ2h0XG4gICAgfVxufVxuXG5mdW5jdGlvbiBBY3RvciggZ2x5cGgsIHgsIHksIHosIGNvbXBvbmVudHMgKSB7XG4gICAgdmFyIGFjdG9yID0gVGhpbmcoIGdseXBoLCB4LCB5LCB6LCBjb21wb25lbnRzIClcbiAgICBhY3RvcnMucHVzaCggYWN0b3IgKVxuICAgIHJldHVybiBhY3RvclxufVxuXG5mdW5jdGlvbiBhY3QoKSB7XG4gICAgdmFyIG1vdmVkID0gW11cbiAgICBmb3IgKCB2YXIgaSA9IGZvdnRpbGVzLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgICAgdmFyIHRpbGUgPSBmb3Z0aWxlc1sgaSBdXG4gICAgICAgIHZhciB0aGluZ3MgPSB0aWxlLnRoaW5nc1xuICAgICAgICBmb3IgKCB2YXIgdCA9IHRoaW5ncy5sZW5ndGg7IHQtLTsgKSB7XG4gICAgICAgICAgICB2YXIgdGhpbmcgPSB0aGluZ3NbIHQgXVxuICAgICAgICAgICAgaWYgKCBtb3ZlZC5pbmRleE9mKCB0aGluZyApID4gLTEgKSBjb250aW51ZVxuICAgICAgICAgICAgaWYgKCBhY3RvcnMuaW5kZXhPZiggdGhpbmcgKSA+IC0xICkge1xuICAgICAgICAgICAgICAgIHZhciBwYXRoID0gbmV4dFRpbGVPblBhdGgoIHRpbGUueCwgdGlsZS55LCBwYy50aWxlLngsIHBjLnRpbGUueSwgYWN0b3JwYXRoZmluZCApXG4gICAgICAgICAgICAgICAgaWYgKCBwYXRoICkgbW92ZXRvKCB0aGluZywgcGF0aC54LCBwYXRoLnkgKVxuICAgICAgICAgICAgICAgIG1vdmVkLnB1c2goIHRoaW5nIClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuZm9yICggdmFyIHkgPSBtYXAuaGVpZ2h0OyB5LS07ICkge1xuICAgIGZvciAoIHZhciB4ID0gbWFwLndpZHRoOyB4LS07ICkge1xuICAgICAgICBtYXBbIHkgKiBtYXAud2lkdGggKyB4IF0gPSBUaWxlKCBnbHlwaHMuVk9JRCwgeCwgeSApXG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZXRUaWxlKCB4LCB5ICkge1xuICAgIGlmICggeCA8IDAgfHwgeSA8IDAgfHwgeCA+PSBtYXAud2lkdGggfHwgeSA+PSBtYXAuaGVpZ2h0ICkgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gbWFwWyB5ICogbWFwLndpZHRoICsgeCBdXG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5zKCB0aWxlLCBnbHlwaGxpc3QgKSB7XG4gICAgaWYgKCAhIHRpbGUgKSByZXR1cm4gbnVsbFxuICAgIGlmICggZ2x5cGhsaXN0LmluZGV4T2YoIHRpbGUuZ2x5cGggKSA+IC0xICkgcmV0dXJuIHRpbGUuZ2x5cGhcbiAgICB2YXIgdGhpbmdzID0gdGlsZS50aGluZ3NcbiAgICBmb3IgKCB2YXIgaSA9IHRoaW5ncy5sZW5ndGg7IGktLTsgKSB7XG4gICAgICAgIGlmICggZ2x5cGhsaXN0LmluZGV4T2YoIHRoaW5nc1sgaSBdLmdseXBoICkgPiAtMSApIHJldHVybiB0aGluZ3NbIGkgXS5nbHlwaFxuICAgIH1cbiAgICByZXR1cm4gbnVsbFxufVxuXG5mdW5jdGlvbiBwdXNoKCB0aGluZywgdGlsZSApIHtcbiAgICBwb3AoIHRoaW5nIClcbiAgICB0aGluZy50aWxlID0gdGlsZVxuICAgIHZhciB0aGluZ3MgPSB0aWxlLnRoaW5nc1xuICAgIHZhciBpID0gdGhpbmdzLmluZGV4T2YoIHRoaW5nIClcbiAgICBpZiAoIGkgPiAtMSApIHJldHVyblxuICAgIHRoaW5ncy5zcGxpY2UoIHNvcnRlZEluZGV4KCB0aGluZ3MsIHRoaW5nLnogKSwgMCwgdGhpbmcgKVxufVxuXG5mdW5jdGlvbiBwb3AoIHRoaW5nICkge1xuICAgIGlmICggISB0aGluZy50aWxlICkgcmV0dXJuIG51bGxcbiAgICB2YXIgdGhpbmdzID0gdGhpbmcudGlsZS50aGluZ3NcbiAgICB2YXIgaSA9IHRoaW5ncy5pbmRleE9mKCB0aGluZyApXG4gICAgaWYgKCBpID4gLTEgKSB0aGluZ3Muc3BsaWNlKCBpLCAxIClcbiAgICB0aGluZy50aWxlID0gbnVsbFxufVxuXG5mdW5jdGlvbiBzb3J0ZWRJbmRleCggdGhpbmdzLCB6ICkge1xuICAgIHZhciBsb3cgPSAwXG4gICAgdmFyIGhpZ2ggPSB0aGluZ3MubGVuZ3RoXG4gICAgd2hpbGUgKCBsb3cgPCBoaWdoICkge1xuICAgICAgICB2YXIgbWlkID0gKCBsb3cgKyBoaWdoICkgPj4+IDFcbiAgICAgICAgaWYgKCB0aGluZ3NbIG1pZCBdLnogPiB6ICkgbG93ID0gbWlkICsgMVxuICAgICAgICBlbHNlIGhpZ2ggPSBtaWRcbiAgICB9XG4gICAgcmV0dXJuIGxvd1xufVxuXG5mdW5jdGlvbiBtb3ZldG8oIHRoaW5nLCB4LCB5ICkge1xuICAgIHZhciB0byA9IGdldFRpbGUoIHgsIHkgKVxuICAgIGlmICggdG8gKSB7XG4gICAgICAgIGlmICggYmxvY2tzbW92ZS5pbmRleE9mKCB0by5nbHlwaCApID4gLTEgKSByZXR1cm5cbiAgICAgICAgdmFyIHRoaW5ncyA9IHRvLnRoaW5nc1xuICAgICAgICBmb3IgKCB2YXIgaSA9IHRoaW5ncy5sZW5ndGg7IGktLTsgKSB7XG4gICAgICAgIFx0dmFyIHRvX3RoaW5nID0gdGhpbmdzWyBpIF1cbiAgICAgICAgXHRpZiAoICggdGhpbmcgPT09IHBjICYmIG1vbnN0ZXJnbHlwaHMuaW5kZXhPZiggdG9fdGhpbmcuZ2x5cGggKSA+IC0xICkgfHwgdG9fdGhpbmcgPT0gcGMgKSB7XG4gICAgICAgIFx0XHRhdHRhY2soIHRoaW5nLCB0b190aGluZyApXG4gICAgICAgIFx0XHRyZXR1cm5cbiAgICAgICAgXHR9XG4gICAgICAgIFx0aWYgKCBibG9ja3Ntb3ZlLmluZGV4T2YoIHRvX3RoaW5nLmdseXBoICkgPiAtMSApIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHB1c2goIHRoaW5nLCB0byApXG4gICAgfVxufVxuXG5mdW5jdGlvbiByYW5kb21UaWxlKCB0aGluZyAvKiwgKFtHbHlwaCwuLi5dfEdseXBoLEdseXBoLC4uLikqLyApIHtcbiAgICB2YXIgZXhjZXB0aW9ucyA9IFtdXG4gICAgZm9yICggdmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICB2YXIgYXJndW1lbnQgPSBhcmd1bWVudHNbIGkgXVxuICAgICAgICBpZiAoIHR5cGVvZiBhcmd1bWVudCA9PT0gJ3VuZGVmaW5lZCcgKSBjb250aW51ZVxuICAgICAgICBpZiAoIGFyZ3VtZW50LmNvbnN0cnVjdG9yID09PSBBcnJheSApIEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KCBleGNlcHRpb25zLCBhcmd1bWVudCApXG4gICAgICAgIGVsc2UgZXhjZXB0aW9ucy5wdXNoKCBhcmd1bWVudCApXG4gICAgfVxuICAgIHZhciB0aWxlXG4gICAgZG8ge1xuICAgICAgICB0aWxlID0gZ2V0VGlsZSggcm5nVW5pZm9ybUludCggMCwgbWFwLndpZHRoIC0gMSApLCBybmdVbmlmb3JtSW50KCAwLCBtYXAuaGVpZ2h0IC0gMSApIClcbiAgICB9IHdoaWxlICggY29udGFpbnMoIHRpbGUsIGV4Y2VwdGlvbnMgKSApXG4gICAgcmV0dXJuIHRpbGVcbn1cblxuZnVuY3Rpb24gc3VidHJhY3QoIHh5MCwgeHkxICkge1xuICAgIHJldHVybiB7IHg6IHh5MS54IC0geHkwLngsIHk6IHh5MS55IC0geHkwLnkgfVxufVxuXG5mdW5jdGlvbiBsZW5ndGgoIHh5ICkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoIHh5LnggKiB4eS54ICsgeHkueSAqIHh5LnkgKVxufVxuXG5mdW5jdGlvbiB1bml0KCB4eSApIHtcbiAgICB2YXIgbGVuID0gbGVuZ3RoKCB4eSApXG4gICAgcmV0dXJuIHsgeDogeHkueCAvIGxlbiwgeTogeHkueSAvIGxlbiB9XG59XG5cbmZ1bmN0aW9uIGFjdG9ycGF0aGZpbmQoIHgsIHkgKSB7XG4gICAgdmFyIHRpbGUgPSBnZXRUaWxlKCB4LCB5IClcbiAgICBpZiAoICEgdGlsZSApIHJldHVybiBmYWxzZVxuICAgIGlmICggZm92dGlsZXMuaW5kZXhPZiggdGlsZSApID09PSAtMSApIHJldHVybiBmYWxzZVxuICAgIHJldHVybiAhIGNvbnRhaW5zKCB0aWxlLCBibG9ja3NhY3RvcnBhdGggKVxufVxuXG5mdW5jdGlvbiBwY3BhdGhmaW5kKCB4LCB5ICkge1xuICAgIHZhciB0aWxlID0gZ2V0VGlsZSggeCwgeSApXG4gICAgaWYgKCAhIHRpbGUgKSByZXR1cm4gZmFsc2VcbiAgICByZXR1cm4gISBjb250YWlucyggdGlsZSwgYmxvY2tzcGNwYXRoIClcbn1cblxuZnVuY3Rpb24gaGVhbHRoKCB0aGluZyApIHtcbiAgICBpZiAoICEgdGhpbmcuZmlnaHRlciApIHJldHVybiAnbi9hJ1xuICAgIHJldHVybiAnJyArIHRoaW5nLmZpZ2h0ZXIuaGVhbHRoICsgJy8nICsgdGhpbmcuZmlnaHRlci5tYXhoZWFsdGhcbn1cblxuZnVuY3Rpb24gYXR0YWNrKCB0aGluZywgdGFyZ2V0ICkge1xuICAgIGlmICggISB0aGluZy5maWdodGVyIHx8ICEgdGFyZ2V0LmZpZ2h0ZXIgKSByZXR1cm5cbiAgICB2YXIgZGFtYWdlID0gdGhpbmcuZmlnaHRlci5wb3dlciAtIHRhcmdldC5maWdodGVyLmRlZmVuc2VcbiAgICBpZiAoIGRhbWFnZSA+IDAgKSB7XG4gICAgICAgIGxvZyggdGhpbmcuZ2x5cGgubmFtZSArICcgaGl0cyAnICsgdGFyZ2V0LmdseXBoLm5hbWUgKyAnIGZvciAtJyArIGRhbWFnZSwgdGFyZ2V0ID09PSBwYyA/ICdyZWQnIDogJ3doaXRlJyApXG4gICAgICAgIHRhcmdldC5maWdodGVyLmhlYWx0aCAtPSBkYW1hZ2VcbiAgICB9IGVsc2Uge1xuICAgICAgICBsb2coIHRoaW5nLmdseXBoLm5hbWUgKyAnIGF0dGFja3MgJyArIHRhcmdldC5nbHlwaC5uYW1lICsgJyBidXQgZmFpbHMgdG8gZG8gZGFtYWdlJyApXG4gICAgfVxuICAgIGlmICggdGFyZ2V0ICE9PSBwYyAmJiB0YXJnZXQuZmlnaHRlci5oZWFsdGggPD0gMCApIGtpbGxlZCggdGhpbmcsIHRhcmdldCApXG59XG5cbmZ1bmN0aW9uIGtpbGxlZCggdGhpbmcsIHRhcmdldCApIHtcbiAgICBsb2coICggdGhpbmcgPT09IHBjID8gJ3lvdSAga2lsbCAnIDogdGhpbmcuZ2x5cGgubmFtZSArICcga2lsbHMgJyApICsgJyBhICcgKyB0YXJnZXQuZ2x5cGgubmFtZSwgdGhpbmcgPT09IHBjID8gJ2dyZWVuJyA6ICd3aGl0ZScgKVxuICAgIHRhcmdldC5nbHlwaCA9IGdseXBocy5DT1JQU0VcbiAgICBkZWxldGUgdGFyZ2V0LmZpZ2h0ZXJcbiAgICB0YXJnZXQuaXRlbSA9IEl0ZW0oIDAgKVxuICAgIHZhciBpID0gYWN0b3JzLmluZGV4T2YoIHRhcmdldCApXG4gICAgaWYgKCBpID4gLTEgKSBhY3RvcnMuc3BsaWNlKCBpLCAxIClcbn1cblxuY29uc3QgZHJhd2luZm8gPSBbIDAvKngqLywgMS8qeSovLCAyLypjaCovLCAzLypjb2xvdXIqLyBdXG5cbmNvbnN0IGZvdnRpbGVzID0gW11cblxuZnVuY3Rpb24gZm92KCkge1xuICAgIGZvciAoIHZhciBpID0gZm92dGlsZXMubGVuZ3RoOyBpLS07ICkgZm92dGlsZXNbIGkgXS5mb3YgPSBmYWxzZVxuICAgIGZvdnRpbGVzLmxlbmd0aCA9IDBcbiAgICB2YXIgdGlsZSA9IHBjLnRpbGVcbiAgICB0aWxlLmZvdiA9IHRydWVcbiAgICB0aWxlLmZvdyA9IGZhbHNlXG4gICAgdGlsZS5yID0gdGlsZS5nID0gdGlsZS5iID0gMS41XG4gICAgZm92dGlsZXMucHVzaCggdGlsZSApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAtMSwgIDAsICAwLCAgMSApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAgMCwgLTEsICAxLCAgMCApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAgMCwgLTEsIC0xLCAgMCApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAtMSwgIDAsICAwLCAtMSApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAgMSwgIDAsICAwLCAtMSApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAgMCwgIDEsIC0xLCAgMCApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAgMCwgIDEsICAxLCAgMCApXG4gICAgY2FzdFZpc2liaWxpdHkoIHRpbGUsIDEsIDEuMCwgMC4wLCB2aXNpYmlsaXR5LCAgMSwgIDAsICAwLCAgMSApXG59XG5cblxudmFyIG1pbnhcbnZhciBtaW55XG5cblxuY29uc3QgZGlzcGxheSA9IHtcbiAgICBmb250c2l6ZTogMzAsXG4gICAgc3BhY2luZzogMC44LFxufVxuZGlzcGxheS5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApLFxuZGlzcGxheS5jYW52YXMuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnXG5kaXNwbGF5LmNhbnZhcy5zdHlsZS53aWR0aCA9IGRpc3BsYXkuY2FudmFzLnN0eWxlLmhlaWdodCA9ICcxMDAlJ1xuZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggZGlzcGxheS5jYW52YXMgKVxuXG52YXIgdmlzaWJpbGl0eSA9IDFcblxuZnVuY3Rpb24gZml0KCkge1xuICAgIGRpc3BsYXkuY2FudmFzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGhcbiAgICBkaXNwbGF5LmNhbnZhcy5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHRcbiAgICBkaXNwbGF5LnJlY3QgPSBkaXNwbGF5LmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICAgIGRpc3BsYXkuY3R4ID0gZGlzcGxheS5jYW52YXMuZ2V0Q29udGV4dCggJzJkJyApXG4gICAgZGlzcGxheS5jdHguZm9udCA9IGRpc3BsYXkuZm9udHNpemUgKyAncHggbW9ub3NwYWNlJ1xuICAgIGRpc3BsYXkuY3R4LnRleHRBbGlnbiA9ICdjZW50ZXInXG4gICAgZGlzcGxheS5jdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSdcbiAgICBkaXNwbGF5LnNwYWNpbmdYID0gTWF0aC5jZWlsKCBkaXNwbGF5LnNwYWNpbmcgKiBNYXRoLmNlaWwoIGRpc3BsYXkuY3R4Lm1lYXN1cmVUZXh0KCAn4paUJyApLndpZHRoICkgKVxuICAgIGRpc3BsYXkuc3BhY2luZ1kgPSBNYXRoLmNlaWwoIGRpc3BsYXkuc3BhY2luZyAqIGRpc3BsYXkuZm9udHNpemUgKVxuICAgIGRpc3BsYXkuc3BhY2luZ1ggPSBkaXNwbGF5LnNwYWNpbmdZID0gTWF0aC5tYXgoIGRpc3BsYXkuc3BhY2luZ1gsIGRpc3BsYXkuc3BhY2luZ1kgKVxuICAgIGRpc3BsYXkud2lkdGggPSBNYXRoLmNlaWwoIGRpc3BsYXkuY2FudmFzLndpZHRoIC8gZGlzcGxheS5zcGFjaW5nWCApXG4gICAgZGlzcGxheS5oZWlnaHQgPSBNYXRoLmNlaWwoIGRpc3BsYXkuY2FudmFzLmhlaWdodCAvIGRpc3BsYXkuc3BhY2luZ1kgKVxuICAgIGRpc3BsYXkuY2VudHJlWCA9IE1hdGguZmxvb3IoIGRpc3BsYXkud2lkdGggKiAwLjUgKVxuICAgIGRpc3BsYXkuY2VudHJlWSA9IE1hdGguZmxvb3IoIGRpc3BsYXkuaGVpZ2h0ICogMC41IClcbiAgICB2aXNpYmlsaXR5ID0gTWF0aC5tYXgoIGRpc3BsYXkuY2VudHJlWCwgZGlzcGxheS5jZW50cmVZIClcbn1cblxuZnVuY3Rpb24gc2hvdyggc2NlbmUgKSB7XG4gICAgZnVuY3Rpb24gcmVhZHkoKSB7XG4gICAgICAgIGZpdCgpXG4gICAgICAgIDsoIGZ1bmN0aW9uICggdGltZW91dCwgYmxvY2tlZCApIHtcbiAgICAgICAgICAgIHZhciBoYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgYmxvY2tlZCA9IHRpbWVvdXRcbiAgICAgICAgICAgICAgICB0aW1lb3V0IHx8ICggZml0KCksIHJlbmRlcigpLCB0aW1lb3V0ID0gc2V0VGltZW91dCggZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgXHR0aW1lb3V0ID0gbnVsbFxuICAgICAgICAgICAgICAgIFx0YmxvY2tlZCAmJiBoYW5kbGVyKClcbiAgICAgICAgICAgICAgICB9LCA1MDAgKSApXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lciggJ3Jlc2l6ZScsIGhhbmRsZXIgKVxuICAgICAgICB9ICkoKVxuICAgICAgICBpZiAoIHNjZW5lLnJlYWR5ICkgc2NlbmUucmVhZHkoIHNjZW5lIClcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lciggJ21vdXNlbW92ZScsIG1vdXNlbW92ZSApXG4gICAgICAgIGlmICggc2NlbmUudXBkYXRlICkgc2NlbmUudXBkYXRlKCBzY2VuZSApXG4gICAgfVxuICAgIGlmICggc2NlbmUuYXNzZXRzICYmIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKCBzY2VuZS5hc3NldHMgKS5sZW5ndGggPiAwICkge1xuICAgICAgICB2YXIgcmVtYWluaW5nID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoIHNjZW5lLmFzc2V0cyApLmxlbmd0aFxuICAgICAgICBmb3IgKCB2YXIgbmFtZSBpbiBzY2VuZS5hc3NldHMgKSB7XG4gICAgICAgICAgICA7KCBmdW5jdGlvbiAoIG5hbWUgKSB7XG4gICAgICAgICAgICBcdHZhciBzcmMgPSBzY2VuZS5hc3NldHNbIG5hbWUgXVxuICAgICAgICAgICAgXHR2YXIgaW1hZ2UgPSBzY2VuZS5hc3NldHNbIG5hbWUgXSA9IG5ldyBJbWFnZSgpXG4gICAgICAgICAgICBcdGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyBpZiAoICEgLS1yZW1haW5pbmcgKSByZWFkeSgpIH1cbiAgICAgICAgICAgIFx0aW1hZ2Uuc3JjID0gc3JjXG4gICAgICAgICAgICB9ICkoIG5hbWUgKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmVhZHkoKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIG1pbnggPSBNYXRoLm1pbiggTWF0aC5tYXgoIHBjLnRpbGUueCAtIGRpc3BsYXkuY2VudHJlWCwgMCApLCBtYXAud2lkdGggLSBkaXNwbGF5LndpZHRoIClcbiAgICBtaW55ID0gTWF0aC5taW4oIE1hdGgubWF4KCBwYy50aWxlLnkgLSBkaXNwbGF5LmNlbnRyZVksIDAgKSwgbWFwLmhlaWdodCAtIGRpc3BsYXkuaGVpZ2h0IClcblxuICAgIGZvdigpXG5cbiAgICBkaXNwbGF5LmN0eC5jbGVhclJlY3QoIDAsIDAsIHdpbmRvdy5pbm5lcldpZHRoLCB3aW5kb3cuaW5uZXJIZWlnaHQgKVxuICAgIHZhciBlbmR4ID0gbWlueCArIGRpc3BsYXkud2lkdGhcbiAgICB2YXIgZW5keSA9IG1pbnkgKyBkaXNwbGF5LmhlaWdodFxuICAgIHZhciB5ID0gbWlueVxuICAgIHdoaWxlICggeSA8IGVuZHkgKSB7XG4gICAgICAgIGRyYXdpbmZvWyAxIF0gPSAoIHkgLSBtaW55IClcbiAgICAgICAgdmFyIGN0eHkgPSBNYXRoLmZsb29yKCAoIHkgLSBtaW55ICsgMC41ICkgKiBkaXNwbGF5LnNwYWNpbmdZIClcbiAgICAgICAgdmFyIHggPSBtaW54XG4gICAgICAgIHdoaWxlICggeCA8IGVuZHggKSB7XG4gICAgICAgIFx0dmFyIHRpbGUgPSBnZXRUaWxlKCB4LCB5IClcbiAgICAgICAgXHR2YXIgY3R4eCA9IE1hdGguZmxvb3IoICggeCAtIG1pbnggKyAwLjUgKSAqIGRpc3BsYXkuc3BhY2luZ1ggKVxuICAgICAgIFx0Ly9pZiAoICEgdGlsZS5mb3cgKSB7XG4gICAgICAgIFx0XHR2YXIgZ2x5cGggPSB0aWxlLmdseXBoXG4gXG4gICAgICAgIFx0XHRkaXNwbGF5LmN0eC5maWxsU3R5bGUgPSByZ2IoIGdseXBoLnIgKiB0aWxlLnIgKiBzdW4uciAqIDAuMSwgZ2x5cGguZyAqIHRpbGUuZyAqIHN1bi5nICogMC4xLCBnbHlwaC5iICogdGlsZS5iICogc3VuLmIgKiAwLjEgKVxuICAgICAgICBcdFx0ZGlzcGxheS5jdHguZmlsbFJlY3QoIE1hdGguZmxvb3IoIGN0eHggLSBkaXNwbGF5LnNwYWNpbmdYICogMC41ICksIE1hdGguZmxvb3IoIGN0eHkgLSBkaXNwbGF5LnNwYWNpbmdZICogMC41ICksIGRpc3BsYXkuc3BhY2luZ1gsIGRpc3BsYXkuc3BhY2luZ1kgKVxuICAgICAgICBcdFx0ZGlzcGxheS5jdHguZmlsbFN0eWxlID0gcmdiKCBnbHlwaC5yICogdGlsZS5yICogc3VuLnIsIGdseXBoLmcgKiB0aWxlLmcgKiBzdW4uZywgZ2x5cGguYiAqIHRpbGUuYiAqIHN1bi5iIClcbiAgICAgICAgICAgICAgICBkaXNwbGF5LmN0eC5maWxsVGV4dCggZ2x5cGguY2gsIGN0eHgsIGN0eHkgKVxuICAgICAgICAgICAgaWYgKCAhIHRpbGUuZm93ICkge1xuICAgICAgICBcdFx0XHR2YXIgdGhpbmdzID0gdGlsZS50aGluZ3NcbiAgICAgICAgXHRcdFx0Zm9yICggdmFyIGkgPSB0aGluZ3MubGVuZ3RoOyBpLS07ICkge1xuICAgICAgICBcdFx0XHRcdHZhciB0aGluZyA9IHRoaW5nc1sgaSBdXG4gICAgICAgIFx0XHRcdFx0Z2x5cGggPSB0aGluZy5nbHlwaFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGdseXBoICkgY29uc29sZS5sb2coIHRoaW5nIClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggdGlsZS5mb3YgfHwgZHJhd19vdXRvZl9mb3YuaW5kZXhPZiggZ2x5cGggKSA+IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXkuY3R4LmZpbGxTdHlsZSA9IHJnYiggZ2x5cGguciAqIHRpbGUuciAqIHN1bi5yLCBnbHlwaC5nICogdGlsZS5nICogc3VuLmcsIGdseXBoLmIgKiB0aWxlLmIgKiBzdW4uYiApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheS5jdHguZmlsbFRleHQoIGdseXBoLmNoLCBjdHh4LCBjdHh5IClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgXHRcdFx0fVxuICAgICAgICBcdH1cbiAgICAgICAgXHRpZiAoIHRpbGUuZm93IHx8ICEgdGlsZS5mb3YgKSB7XG4gICAgICAgIFx0XHRkaXNwbGF5LmN0eC5maWxsU3R5bGUgPSBmb3dzdHlsZVxuICAgICAgICBcdFx0ZGlzcGxheS5jdHguZmlsbFJlY3QoIE1hdGguZmxvb3IoIGN0eHggLSBkaXNwbGF5LnNwYWNpbmdYICogMC41ICksIE1hdGguZmxvb3IoIGN0eHkgLSBkaXNwbGF5LnNwYWNpbmdZICogMC41ICksIGRpc3BsYXkuc3BhY2luZ1gsIGRpc3BsYXkuc3BhY2luZ1kgKVxuICAgICAgICBcdH1cbiAgICAgICAgXHR4KytcbiAgICAgICAgfVxuICAgICAgICB5KytcbiAgICB9XG59XG5cbmNvbnN0IHBlcmZzID0ge31cblxuZnVuY3Rpb24gcGVyZiggbmFtZSwgZnJvbSApIHtcbiAgICB2YXIgcCA9IHBlcmZzWyBuYW1lIF0gPSBwZXJmcy5oYXNPd25Qcm9wZXJ0eSggbmFtZSApID8gcGVyZnNbIG5hbWUgXSA6IFtdXG4gICAgcC5wdXNoKCBwZXJmb3JtYW5jZS5ub3coKSAtIGZyb20gKVxuICAgIGlmICggcC5sZW5ndGggPT09IDEwICkge1xuICAgICAgICB2YXIgc3VtID0gMFxuICAgICAgICBmb3IgKCB2YXIgaSA9IHAubGVuZ3RoOyBpLS07ICkgc3VtICs9IHBbIGkgXVxuICAgICAgICBjb25zb2xlLmxvZyggbmFtZSArICc6ICcgKyBzdW0gKVxuICAgICAgICBwLmxlbmd0aCA9IDBcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGxpZ2h0aW5nKCkge1xuICAgIHZhciB3aWR0aCA9IGRpc3BsYXkuY2FudmFzLndpZHRoXG4gICAgdmFyIGltYWdlZGF0YSA9IGRpc3BsYXkuY3R4LmdldEltYWdlRGF0YSggMCwgMCwgd2lkdGgsIGRpc3BsYXkuY2FudmFzLmhlaWdodCApXG4gICAgdmFyIGRhdGEgPSBpbWFnZWRhdGEuZGF0YVxuICAgIGZvciAoIHZhciBpID0gZm92dGlsZXMubGVuZ3RoOyBpLS07ICkge1xuICAgICAgICB2YXIgdGlsZSA9IGZvdnRpbGVzWyBpIF1cbiAgICAgICAgdmFyIGN0eHggPSAoIHRpbGUueCAtIG1pbnggKSAqIGRpc3BsYXkuc3BhY2luZ1hcbiAgICAgICAgdmFyIGN0eHkgPSAoIHRpbGUueSAtIG1pbnkgKSAqIGRpc3BsYXkuc3BhY2luZ1lcbiAgICAgICAgZm9yICggdmFyIHkgPSBjdHh5ICsgZGlzcGxheS5zcGFjaW5nWTsgeSA+PSBjdHh5OyB5LS0gKSB7XG4gICAgICAgIFx0Zm9yICggdmFyIHggPSBjdHh4ICsgZGlzcGxheS5zcGFjaW5nWDsgeCA+PSBjdHh4OyB4LS0gKSB7XG4gICAgICAgIFx0XHR2YXIgZCA9ICggeSAqIHdpZHRoICsgeCApICogNFxuICAgICAgICBcdFx0ZGF0YVsgZCBdID0gTWF0aC5taW4oIDI1NSwgTWF0aC5tYXgoIDAsIE1hdGgucm91bmQoIGRhdGFbIGQgXSAqICggc3VuLnIgKiB0aWxlLnIgKSApICkgKVxuICAgICAgICBcdFx0ZCsrXG4gICAgICAgIFx0XHRkYXRhWyBkIF0gPSBNYXRoLm1pbiggMjU1LCBNYXRoLm1heCggMCwgTWF0aC5yb3VuZCggZGF0YVsgZCBdICogKCBzdW4uZyAqIHRpbGUuZyApICkgKSApXG4gICAgICAgIFx0XHRkKytcbiAgICAgICAgXHRcdGRhdGFbIGQgXSA9IE1hdGgubWluKCAyNTUsIE1hdGgubWF4KCAwLCBNYXRoLnJvdW5kKCBkYXRhWyBkIF0gKiAoIHN1bi5iICogdGlsZS5iICkgKSApIClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZGlzcGxheS5jdHgucHV0SW1hZ2VEYXRhKCBpbWFnZWRhdGEsIDAsIDAgKVxufVxuXG5mdW5jdGlvbiByZ2IoIHIsIGcsIGIgKSB7XG4gICAgcmV0dXJuICdyZ2IoICcgKyBNYXRoLm1pbiggMjU1LCBNYXRoLm1heCggMCwgTWF0aC5yb3VuZCggciAqIDI1NSApICkgKSArICcsICcgKyBNYXRoLm1pbiggMjU1LCBNYXRoLm1heCggMCwgTWF0aC5yb3VuZCggZyAqIDI1NSApICkgKSArICcsICcgKyBNYXRoLm1pbiggMjU1LCBNYXRoLm1heCggMCwgTWF0aC5yb3VuZCggYiAqIDI1NSApICkgKSArICcgKSdcbn1cblxuY29uc3QgYWN0aW9ucyA9IHtcbiAgICBOT05FOiAwLFxuICAgIE5PUlRIOiAxLFxuICAgIFNPVVRIOiAyLFxuICAgIFdFU1Q6IDMsXG4gICAgRUFTVDogNCxcbiAgICBOT1JUSFdFU1Q6IDUsXG4gICAgTk9SVEhFQVNUOiA2LFxuICAgIFNPVVRIV0VTVDogNyxcbiAgICBTT1VUSEVBU1Q6IDgsXG4gICAgUEFUSFRPOiB7IHg6IDAsIHk6IDAgfSxcbiAgICBTS0lQVFVSTjogOSxcbiAgICBQSUNLSVRFTVM6IDEwLFxuICAgIFNIT1dJTlZFTlRPUlk6IDExXG59XG5cbmZ1bmN0aW9uIGlucHV0KCByZXNvbHZlICkge1xuICAgIGlucHV0LnJlc29sdmUgPSBmdW5jdGlvbiAoIGFjdGlvbiApIHtcbiAgICAgICAgdmFyIGVuZHR1cm4gPSBmYWxzZVxuICAgICAgICB2YXIgeCA9IHBjLnRpbGUueFxuICAgICAgICB2YXIgeSA9IHBjLnRpbGUueVxuICAgICAgICBpZiAoIGFjdGlvbiA9PT0gYWN0aW9ucy5TS0lQVFVSTiApIHtcbiAgICAgICAgICAgIGVuZHR1cm4gPSB0cnVlXG4gICAgICAgIH0gZWxzZSBpZiAoIGFjdGlvbiA9PT0gYWN0aW9ucy5QQVRIVE8gKSB7XG4gICAgICAgICAgICB4ID0gYWN0aW9uLnhcbiAgICAgICAgICAgIHkgPSBhY3Rpb24ueVxuICAgICAgICAgICAgZW5kdHVybiA9IHRydWVcbiAgICAgICAgfSBlbHNlIGlmICggYWN0aW9uID09PSBhY3Rpb25zLlBJQ0tJVEVNUyApIHtcbiAgICAgICAgICAgIHNob3dJdGVtcyggaXRlbXNBdCggeCwgeSApICkgXG4gICAgICAgIH0gZWxzZSBpZiAoIGFjdGlvbiA9PT0gYWN0aW9ucy5TSE9XSU5WRU5UT1JZICkge1xuICAgICAgICAgICAgc2hvd0ludmVudG9yeSgpIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKCBhY3Rpb24gPT09IGFjdGlvbnMuTk9SVEggfHwgYWN0aW9uID09IGFjdGlvbnMuTk9SVEhXRVNUIHx8IGFjdGlvbiA9PT0gYWN0aW9ucy5OT1JUSEVBU1QgKSB5LS1cbiAgICAgICAgICAgIGlmICggYWN0aW9uID09PSBhY3Rpb25zLlNPVVRIIHx8IGFjdGlvbiA9PSBhY3Rpb25zLlNPVVRIV0VTVCB8fCBhY3Rpb24gPT09IGFjdGlvbnMuU09VVEhFQVNUICkgeSsrXG4gICAgICAgICAgICBpZiAoIGFjdGlvbiA9PT0gYWN0aW9ucy5XRVNUIHx8IGFjdGlvbiA9PSBhY3Rpb25zLk5PUlRIV0VTVCB8fCBhY3Rpb24gPT09IGFjdGlvbnMuU09VVEhXRVNUICkgeC0tXG4gICAgICAgICAgICBpZiAoIGFjdGlvbiA9PT0gYWN0aW9ucy5FQVNUIHx8IGFjdGlvbiA9PSBhY3Rpb25zLk5PUlRIRUFTVCB8fCBhY3Rpb24gPT09IGFjdGlvbnMuU09VVEhFQVNUICkgeCsrXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCB4ICE9PSBwYy50aWxlLnggfHwgeSAhPT0gcGMudGlsZS55ICkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBuZXh0VGlsZU9uUGF0aCggcGMudGlsZS54LCBwYy50aWxlLnksIHgsIHksIHBjcGF0aGZpbmQgKVxuICAgICAgICAgICAgaWYgKCBwYXRoICkgbW92ZXRvKCBwYywgcGF0aC54LCBwYXRoLnkgKVxuICAgICAgICAgICAgZW5kdHVybiA9IHRydWVcbiAgICAgICAgfVxuICAgICAgICBpZiAoIGVuZHR1cm4gKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIGtleWRvd24gKVxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lciggJ21vdXNlZG93bicsIG1vdXNlZG93biApXG4gICAgICAgIFx0cmVzb2x2ZSgpXG4gICAgICAgfVxuICAgIH1cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCAna2V5ZG93bicsIGtleWRvd24gKVxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoICdtb3VzZWRvd24nLCBtb3VzZWRvd24gKVxufVxuXG5jb25zdCBtb3VzZSA9IHsgeDogMCwgeTogMCwgY2xpZW50WDogMCwgY2xpZW50WTogMCB9XG5cbmZ1bmN0aW9uIG1vdXNlbW92ZSggZXZlbnQgKSB7XG4gICAgdmFyIHggPSBldmVudC5jbGllbnRYXG4gICAgdmFyIHkgPSBldmVudC5jbGllbnRZXG4gICAgeCAtPSBkaXNwbGF5LnJlY3QubGVmdFxuICAgIHkgLT0gZGlzcGxheS5yZWN0LnRvcFxuICAgIHggKj0gZGlzcGxheS5jYW52YXMud2lkdGggLyBkaXNwbGF5LmNhbnZhcy5jbGllbnRXaWR0aFxuICAgIHkgKj0gZGlzcGxheS5jYW52YXMuaGVpZ2h0IC8gZGlzcGxheS5jYW52YXMuY2xpZW50SGVpZ2h0XG4gICAgaWYgKCB4IDwgMCB8fCB5IDwgMCB8fCB4ID49IGRpc3BsYXkuY2FudmFzLndpZHRoIHx8IHkgPj0gZGlzcGxheS5jYW52YXMuaGVpZ2h0ICkgcmV0dXJuXG4gICAgbW91c2UueCA9IE1hdGguZmxvb3IoIHggLyBkaXNwbGF5LnNwYWNpbmdYICApXG4gICAgbW91c2UueSA9IE1hdGguZmxvb3IoIHkgLyBkaXNwbGF5LnNwYWNpbmdZIClcbiAgICB1cGRhdGV1aSgpXG59XG5cblxuXG5mdW5jdGlvbiBtb3VzZWRvd24oIGV2ZW50ICkge1xuICAgIHZhciBhY3Rpb24gPSBhY3Rpb25zLlBBVEhUT1xuICAgIGFjdGlvbi54ID0gbWlueCArIG1vdXNlLnhcbiAgICBhY3Rpb24ueSA9IG1pbnkgKyBtb3VzZS55XG4gICAgaW5wdXQucmVzb2x2ZSggYWN0aW9uIClcbn1cblxuZnVuY3Rpb24ga2V5ZG93biggZXZlbnQgKSB7XG4gICAgaWYgKCBldmVudC5hbHRLZXkgfHwgZXZlbnQubWV0YUtleSApIHJldHVyblxuICAgIHZhciBrZXkgPSBldmVudC5rZXlcblxuICAgIGlmICggdWkuaXRlbXMuc3R5bGUuZGlzcGxheSA9PT0gJ2Jsb2NrJyB8fCB1aS5pbnZlbnRvcnkuc3R5bGUuZGlzcGxheSA9PT0gJ2Jsb2NrJyApIHtcbiAgICAgICAgaWYgKCBrZXkgPT09ICdFc2NhcGUnICkge1xuICAgICAgICAgICAgY2xvc2VJdGVtcygpXG4gICAgICAgICAgICBjbG9zZUludmVudG9yeSgpXG4gICAgICAgIH0gZWxzZSBpZiAoIFsgJ0Fycm93VXAnLCAnaycgXS5pbmRleE9mKCBrZXkgKSA+IC0gMSApIHtcbiAgICAgICAgICAgIG1vdmVJdGVtRm9jdXNVcCgpXG4gICAgICAgIH0gZWxzZSBpZiAoIFsgJ0Fycm93RG93bicsICdqJyBdLmluZGV4T2YoIGtleSApID4gLSAxICkge1xuICAgICAgICAgICAgbW92ZUl0ZW1Gb2N1c0Rvd24oKVxuICAgICAgICB9IGVsc2UgaWYgKCBbICdBcnJvd1JpZ2h0JywgJ2wnIF0uaW5kZXhPZigga2V5ICkgPiAtIDEgKSB7XG4gICAgICAgICAgICBtb3ZlSXRlbUZvY3VzUmlnaHQoKVxuICAgICAgICB9IGVsc2UgaWYgKCBbICdBcnJvd0xlZnQnLCAnaCcgXS5pbmRleE9mKCBrZXkgKSA+IC0gMSApIHtcbiAgICAgICAgICAgIG1vdmVJdGVtRm9jdXNMZWZ0KClcbiAgICAgICAgfSBlbHNlIGlmICgga2V5ID09PSAnZycgKSB7XG4gICAgICAgICAgICBjbG9zZUl0ZW1zKClcbiAgICAgICAgICAgIGlmICggc2hvd25JdGVtRm9jdXMgJiYgc2hvd25JdGVtRm9jdXMuaXRlbSApIHtcbiAgICAgICAgICAgICAgICBwaWNrdXAoIHNob3duSXRlbUZvY3VzLml0ZW0gKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2hvd25JdGVtRm9jdXMgPSBudWxsXG4gICAgICAgIH0gZWxzZSBpZiAoIGtleSA9PT0gJ2knICkge1xuICAgICAgICAgICAgY2xvc2VJbnZlbnRvcnkoKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdmFyIGFjdGlvbiA9IGFjdGlvbnMuTk9ORVxuICAgIGlmICgga2V5ID09PSAnLicgKSB7XG4gICAgICAgIGFjdGlvbiA9IGFjdGlvbnMuU0tJUFRVUk5cbiAgICB9IGVsc2UgaWYgKCBrZXkgPT09ICcgJyApIHtcbiAgICAgICAgYWN0aW9uID0gYWN0aW9ucy5QQVRIVE9cbiAgICAgICAgYWN0aW9uLnggPSBtaW54ICsgbW91c2UueFxuICAgICAgICBhY3Rpb24ueSA9IG1pbnkgKyBtb3VzZS55XG4gICAgfSBlbHNlIGlmICgga2V5ID09PSAnZycgKSB7XG4gICAgICAgIGFjdGlvbiA9IGFjdGlvbnMuUElDS0lURU1TXG4gICAgfSBlbHNlIGlmICgga2V5ID09PSAnaScgKSB7XG4gICAgICAgIGFjdGlvbiA9IGFjdGlvbnMuU0hPV0lOVkVOVE9SWVxuICAgIH0gZWxzZSBpZiAoIFsgJ0Fycm93VXAnLCAnaycgXS5pbmRleE9mKCBrZXkgKSA+IC0gMSkge1xuICAgICAgICBhY3Rpb24gPSBldmVudC5zaGlmdEtleSA/IGFjdGlvbnMuTk9SVEhFQVNUIDogYWN0aW9ucy5OT1JUSFxuICAgIH0gZWxzZSBpZiAoIFsgJ0snIF0uaW5kZXhPZigga2V5ICkgPiAtIDEpIHtcbiAgICAgICAgYWN0aW9uID0gYWN0aW9ucy5OT1JUSEVBU1RcbiAgICB9IGVsc2UgaWYgKCBbICdBcnJvd0Rvd24nLCAnaicgXS5pbmRleE9mKCBrZXkgKSA+IC0gMSkge1xuICAgICAgICBhY3Rpb24gPSBldmVudC5zaGlmdEtleSA/IGFjdGlvbnMuU09VVEhXRVNUIDogYWN0aW9ucy5TT1VUSFxuICAgIH0gZWxzZSBpZiAoIFsgJ0onIF0uaW5kZXhPZigga2V5ICkgPiAtIDEpIHtcbiAgICAgICAgYWN0aW9uID0gYWN0aW9ucy5OT1JUSFdFU1RcbiAgICB9IGVsc2UgaWYgKCBbICdBcnJvd1JpZ2h0JywgJ2wnIF0uaW5kZXhPZigga2V5ICkgPiAtIDEpIHtcbiAgICAgICAgYWN0aW9uID0gZXZlbnQuc2hpZnRLZXkgPyBhY3Rpb25zLlNPVVRIRUFTVDogYWN0aW9ucy5FQVNUXG4gICAgfSBlbHNlIGlmICggWyAnTCcgXS5pbmRleE9mKCBrZXkgKSA+IC0gMSkge1xuICAgICAgICBhY3Rpb24gPSBhY3Rpb25zLlNPVVRIRUFTVFxuICAgIH0gZWxzZSBpZiAoIFsgJ0Fycm93TGVmdCcsICdoJyBdLmluZGV4T2YoIGtleSApID4gLSAxKSB7XG4gICAgICAgIGFjdGlvbiA9IGV2ZW50LnNoaWZ0S2V5ID8gYWN0aW9ucy5OT1JUSFdFU1Q6IGFjdGlvbnMuV0VTVFxuICAgIH0gZWxzZSBpZiAoIFsgJ0gnIF0uaW5kZXhPZigga2V5ICkgPiAtIDEpIHtcbiAgICAgICAgYWN0aW9uID0gYWN0aW9ucy5TT1VUSFdFU1RcbiAgICB9XG4gICAgaW5wdXQucmVzb2x2ZSggYWN0aW9uIClcbn1cblxuZnVuY3Rpb24gbGluZSggeDAsIHkwLCB4MSwgeTEsIGNhbGxiYWNrICkge1xuICAgIHZhciBkeCA9IE1hdGguYWJzKCB4MSAtIHgwICksIHN4ID0geDAgPCB4MSA/IDEgOiAtMVxuICAgIHZhciBkeSA9IE1hdGguYWJzKCB5MSAtIHkwICksIHN5ID0geTAgPCB5MSA/IDEgOiAtMVxuICAgIHZhciBlcnIgPSAoIGR4ID4gZHkgPyBkeCA6IC1keSkgLyAyXG4gICAgd2hpbGUgKCB0cnVlICkge1xuICAgICAgICBjYWxsYmFjayggeDAsIHkwIClcbiAgICAgICAgaWYgKCB4MCA9PT0geDEgJiYgeTAgPT09IHkxICkgYnJlYWtcbiAgICAgICAgdmFyIGUyID0gZXJyXG4gICAgICAgIGlmICggZTIgPiAtZHggKSB7IGVyciAtPSBkeTsgeDAgKz0gc3g7IH1cbiAgICAgICAgaWYgKCBlMiA8IGR5ICkgeyBlcnIgKz0gZHg7IHkwICs9IHN5OyB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhcmVhKCB4MCwgeTAsIHgxLCB5MSwgY2FsbGJhY2sgKSB7XG4gICAgdmFyIHN4ID0geDAgPCB4MSA/IDEgOiAtMVxuICAgIHZhciBzeSA9IHkwIDwgeTEgPyAxIDogLTFcbiAgICB2YXIgeCA9IHgwXG4gICAgd2hpbGUgKCB0cnVlICkge1xuICAgICAgICBjYWxsYmFjayggeCwgeTAgKVxuICAgICAgICBpZiAoIHggPT09IHgxICYmIHkwID09PSB5MSApIGJyZWFrXG4gICAgICAgIGlmICggeCA9PT0geDEgKSB7IHggPSB4MDsgeTAgKz0gc3k7IH1cbiAgICAgICAgZWxzZSB7IHggKz0gc3g7IH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdyYXNzX2FuZF90cmVlcyggeDAsIHkwLCB4MSwgeTEgKSB7XG4gICAgYXJlYSggeDAsIHkwLCB4MSwgeTEsIGZ1bmN0aW9uKCB4LCB5ICkge1xuICAgICAgICB2YXIgdGlsZSA9IGdldFRpbGUoIHgsIHkgKVxuICAgICAgICB2YXIgaGlnaCA9IG5vaXNlKCB4LCB5IClcbiAgICAgICAgdmFyIGxvdzEgPSBub2lzZSggeCAqIDAuMDUsIHkgKiAwLjA1IClcbiAgICAgICAgdmFyIGxvdzIgPSBub2lzZSggKCB4ICsgMTMzICkgKiAwLjA3LCAoIHkgLSAyNjEgKSAqIDAuMDcgKVxuICAgICAgICB2YXIgbiA9ICggbG93MiArIDEgKSAqIDAuNCArICggbG93MSArIDEgKSAqIDAuMVxuICAgICAgXHR0aWxlLmdseXBoID0gZ3Jhc3NnbHlwaHNbIE1hdGguZmxvb3IoIG4gKiBncmFzc2dseXBocy5sZW5ndGggKSBdXG4gICAgICAgXHRpZiAoIG4gKiBoaWdoID4gMC4zICkgdGlsZS5nbHlwaCA9IGdyYXNzZ2x5cGhzWyAwIF1cbiAgICAgICAgaWYgKCBsb3cxID4gLSAwLjggJiYgbG93MiA8IDAgKSB7XG4gICAgICAgICAgICBwdXNoKCBUaGluZyggdHJlZWdseXBoc1sgTWF0aC5mbG9vciggKCBoaWdoICsgMSApICogMC41ICogdHJlZWdseXBocy5sZW5ndGggKSBdLCAwLCAwLCAwICksIHRpbGUgKVxuICAgICAgICB9XG4gICAgfSApXG59XG5cbmdyYXNzX2FuZF90cmVlcyggMCwgMCwgbWFwLmhlaWdodCAtIDEsIG1hcC53aWR0aCAtIDEgKVxuXG5jb25zdCBwYyA9IFRoaW5nKCBnbHlwaHMuUEMsIDAsIDAsIDAsIHsgZmlnaHRlcjogRmlnaHRlciggMTAwLCAxMCwgNDAgKSB9IClcbnB1c2goIHBjLCByYW5kb21UaWxlKCBibG9ja3Ntb3ZlLCBibG9ja3Nmb3YgKSApXG5cbmZvciAoIHZhciBpID0gMzAwOyBpLS07ICkge1xuICAgIHZhciBnbHlwaCA9IG1vbnN0ZXJnbHlwaHNbIHJuZ1VuaWZvcm1JbnQoIDAsIG1vbnN0ZXJnbHlwaHMubGVuZ3RoIC0gMSApIF1cbiAgICBwdXNoKCBBY3RvciggZ2x5cGgsIDAsIDAsIDAsIHsgZmlnaHRlcjogRmlnaHRlciggZ2x5cGggPT09IGdseXBocy5SQVQgPyA1MCA6IDEwMCwgMTAsIGdseXBoID09PSBnbHlwaHMuUkFUID8gMTIgOiAxOCApIH0gKSwgcmFuZG9tVGlsZSggYmxvY2tzbW92ZSApIClcbn1cblxuZm9yICggdmFyIGkgPSAyMDA7IGktLTsgKSB7XG4gICAgcHVzaCggVGhpbmcoIGdseXBocy5IRUFMSU5HUE9USU9OLCAxLCAxLCAxLCB7IGl0ZW06IEl0ZW0oIDAgKSB9ICksIHJhbmRvbVRpbGUoIGJsb2Nrc21vdmUgKSApXG59XG5cbmNvbnN0IGludmVudG9yeSA9IFtdXG5pbnZlbnRvcnkubGltaXQgPSAxMFxuXG5mdW5jdGlvbiBwaWNrdXAoIHRoaW5nICkge1xuICAgIGlmICggISB0aGluZy5pdGVtICkge1xuICAgICAgICBsb2coIHRoaW5nLmdseXBoLm5hbWUgKyAnIGNhbm5vdCBiZSBwaWNrZWQgdXAnLCAncmVkJyApXG4gICAgICAgIHJldHVyblxuICAgIH1cbiAgICBpZiAoIGludmVudG9yeS5sZW5ndGggPj0gaW52ZW50b3J5LmxpbWl0ICkge1xuICAgICAgICBsb2coICd5b3VyIGludmVudG9yeSBpcyBmdWxsLCBjYW5ub3QgcGljayB1cCAnICsgdGhpbmcuZ2x5cGgubmFtZSwgJ3JlZCcgKVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHBvcCggdGhpbmcgKVxuICAgICAgICBpbnZlbnRvcnkucHVzaCggdGhpbmcgKVxuICAgICAgICBsb2coICd5b3UgcGlja2VkIHVwIGEgJyArIHRoaW5nLmdseXBoLm5hbWUsICdncmVlbicgKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gaXRlbXNBdCggeCwgeSApIHtcbiAgICB2YXIgaXRlbXMgPSBbXVxuICAgIHZhciB0aWxlID0gZ2V0VGlsZSggeCwgeSApXG4gICAgaWYgKCAhIHRpbGUuZm92ICkgcmV0dXJuIGl0ZW1zXG4gICAgdmFyIHRoaW5ncyA9IHRpbGUudGhpbmdzXG4gICAgZm9yICggdmFyIGkgPSB0aGluZ3MubGVuZ3RoOyBpLS07ICkge1xuICAgICAgICB2YXIgdGhpbmcgPSB0aGluZ3NbIGkgXVxuICAgICAgICBpZiAoIHRoaW5nLml0ZW0gKSBpdGVtcy5wdXNoKCB0aGluZyApXG4gICAgfVxuICAgIHJldHVybiBpdGVtc1xufVxuXG52YXIgZm93c3R5bGVcblxuZnVuY3Rpb24gdXBkYXRlKCBzY2VuZSApIHtcbiAgICBhY3QoKVxuICAgIHJlbmRlcigpXG4gICAgdXBkYXRldWkoKVxuICAgIGlucHV0KCBmdW5jdGlvbigpIHsgc2V0VGltZW91dCggdXBkYXRlLCAwICkgfSApXG59XG5cbmNvbnN0IHNjZW5lID0ge1xuICAgIGFzc2V0czoge1xuICAgICAgICBmb3dpbWc6IFwiYXNzZXRzL2Zvdi5wbmdcIlxuICAgIH0sXG4gICAgcmVhZHk6IGZ1bmN0aW9uKCBzY2VuZSApIHtcbiAgICAgICAgZm93c3R5bGUgPSBkaXNwbGF5LmN0eC5jcmVhdGVQYXR0ZXJuKCBzY2VuZS5hc3NldHMuZm93aW1nLCAncmVwZWF0JyApXG4gICAgfSxcbiAgICB1cGRhdGU6IHVwZGF0ZVxufVxuXG5zaG93KCBzY2VuZSApXG5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Q0FBQTtDQUNBO0NBQ0E7O0FBRUEsT0FBTSxJQUFJLEdBQUcsdUJBQXNCOztBQUVuQyxLQUFJLEdBQUU7QUFDTixLQUFJLEdBQUU7QUFDTixLQUFJLEdBQUU7QUFDTixLQUFJLEVBQUM7O0NBRUw7Q0FDQTtDQUNBO0NBQ0EsU0FBUyxPQUFPLEVBQUUsSUFBSSxHQUFHO0NBQ3pCLElBQUksSUFBSSxLQUFLLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUU7Q0FDekMsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUk7Q0FDOUIsSUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEdBQUcsS0FBSyxHQUFHLENBQUMsT0FBTyxFQUFDO0NBQ3JDLElBQUksRUFBRSxHQUFHLElBQUksR0FBRyxLQUFJO0NBQ3BCLElBQUksSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEtBQUssR0FBRyxDQUFDLE9BQU8sRUFBQztDQUNyQyxJQUFJLEVBQUUsR0FB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Q0FFTDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0EsU0FBUyxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRztDQUMzQixJQUFJLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsR0FBRTs7Q0FFakM7Q0FDQSxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFFO0NBQzlCLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFDO0NBQ2hDLElBQUksSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEdBQUcsQ0FBQyxFQUFDO0NBQ2hDLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUU7Q0FDMUIsSUFBSSxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsRUFBQztDQUNsQixJQUFJLElBQUksRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFDO0NBQ2xCLElBQUksSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUU7Q0FDckIsSUFBSSxJQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRTs7Q0FFckI7Q0FDQTtDQUNBLElBQUksSUFBSSxFQUFFLEVBQUUsR0FBRTtDQUNkLElBQUksS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHO0NBQ25CLFFBQVEsRUFBRSxHQUFHLEVBQUM7Q0FDZCxRQUFRLEVBQUUsR0FBRyxFQUFDO0NBQ2QsS0FBSyxNQUFNO0NBQ1gsUUFBUSxFQUFFLEdBQUcsRUFBQztDQUNkLFFBQVEsRUFBRSxHQUFHLEVBQUM7Q0FDZCxLQUFLOztDQUVMO0NBQ0E7Q0FDQTtDQUNBLElBQUksSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFFO0NBQ3pCLElBQUksSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxHQUFFO0NBQ3pCLElBQUksSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRTtDQUM1QixJQUFJLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUU7O0NBRTVCO0NBQ0EsSUFBSSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBSztDQUM5QyxJQUFJLElBQUksRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxLQUFLLEtBQUssS0FBSyxNQUFLOztDQUU5QztDQUNBLElBQUksSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUU7Q0FDbEMsSUFBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUc7Q0FDbkIsUUFBUSxFQUFFLElBQUksR0FBRTtDQUNoQixRQUFRLEVBQUUsR0FBRyxPQUFPLEVBQUUsRUFBRSxHQUFHLEtBQUssRUFBRSxFQUFFLEVBQUUsR0FBRTtDQUN4QyxRQUFRLElBQUksSUFBSSxHQUFHLFNBQVMsRUFBRSxFQUFFLEdBQUU7Q0FDbEMsUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUU7Q0FDMUQsS0FBSztDQUNMO0NBQ0EsSUFBSSxJQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRTtDQUNwQyxJQUFJLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRztDQUNuQixRQUFRLEVBQUUsSUFBSSxHQUFFO0NBQ2hCLFFBQVEsRUFBRSxHQUFHLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUU7Q0FDbEQsUUFBUSxJQUFJLElBQUksR0FBRyxTQUFTLEVBQUUsRUFBRSxHQUFFO0NBQ2xDLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFFO0NBQzFELEtBQUs7Q0FDTDtDQUNBLElBQUksSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEdBQUU7Q0FDcEMsSUFBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUc7Q0FDbkIsUUFBUSxFQUFFLElBQUksR0FBRTtDQUNoQixRQUFRLEVBQUUsR0FBRyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUMsR0FBRyxLQUFLLEVBQUUsRUFBRSxHQUFHLENBQUMsRUFBRSxHQUFFO0NBQ2hELFFBQVEsSUFBSSxJQUFJLEdBQUcsU0FBUyxFQUFFLEVBQUUsR0FBRTtDQUNsQyxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxLQUFLLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRTtDQUMxRCxLQUFLOztDQUVMO0NBQ0E7Q0FDQSxJQUFJLE9BQU8sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFO0NBQ2hDLENBQUM7O0NDL0ZEO0NBQ0E7Q0FDQTs7QUFFQSxPQUFNLFFBQVEsR0FBRyxFQUFDOztBQUVsQixPQUFNLElBQUksR0FBRztDQUNiLElBQUksR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Q0FDN0UsSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUU7Q0FDakosSUFBSSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Q0FDaEgsQ0FBQyxFQUFFLFFBQVEsR0FBRTs7QUFFYixPQUFNLFFBQVEsR0FBRztDQUNqQixJQUFJLEdBQUcsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRztDQUNwQyxRQUFRLE9BQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFO0NBQ3hELEtBQUs7Q0FDTCxJQUFJLEdBQUcsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsR0FBRztDQUNwQyxRQUFRLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRTtDQUNwQyxRQUFRLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRTtDQUNwRSxLQUFLO0NBQ0wsSUFBSSxHQUFHLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUc7Q0FDcEMsUUFBUSxPQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUU7Q0FDbEUsS0FBSztDQUNMLENBQUMsRUFBRSxRQUFRLEdBQUU7O0FBRWIsQ0FxQkE7Q0FDQTtDQUNBO0NBQ0EsU0FBUyxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFFBQVEsR0FBRztDQUM1RCxJQUFJLElBQUksS0FBSyxHQUFHLEdBQUU7Q0FDbEIsSUFBSSxJQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUc7Q0FDNUIsSUFBSSxJQUFJLE9BQU8sR0FBRyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsR0FBRTtD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QUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtDQUNqRCxJQUFJLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUNsRCxJQUFJLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUNuRCxJQUFJLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUNuRCxJQUFJLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRTtDQUM5QyxJQUFJLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtDQUM3QyxJQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtDQUMvQyxJQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtDQUN6QyxJQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRTtDQUN6QyxJQUFJLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtDQUMzQyxJQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUM3QyxJQUFJLGFBQWEsRUFBRSxLQUFLLEVBQUUsR0FBRyxF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RyxHQUFHLE1BQUs7Q0FDcEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFHO0NBQ2xDLElBQUksUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLEdBQUU7Q0FDekIsSUFBSSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRTtDQUNuRSxJQUFJLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFFO0NBQ25FLElBQUksY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxVQUFVLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRTtDQUNuRSxJQUFJLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUU7Q0FDbkUsSUFBSSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFVBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRTtDQUNuRSxJQUFJLGNBQWMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFFO0NBQ25FLElBQUksY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFFO0NBQ25FLElBQUksY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFFO0NBQ25FLENBQUM7OztBQUdELEtBQUksS0FBSTtBQUNSLEtBQUksS0FBSTs7O0FBR1IsT0FBTSxPQUFPLEdBQUc7Q0FDaEIsSUFBSSxRQUFRLEVBQUUsRUFBRTtDQUNoQixJQUFJLE9BQU8sRUFBRSxHQUFHO0NBQ2hCLEVBQUM7Q0FDRCxPQUFPLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFO0NBQ25ELE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxXQUFVO0NBQzFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTTtDQUNqRSxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsTUFBTSxHQUFFOztBQUUzQyxLQUFJLFVBQVUsR0FBRyxFQUFDOztDQUVsQixTQUFTLEdBQUcsR0FBRztDQUNmLElBQUksT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLFdBQVU7Q0FDNUMsSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsWUFBVztDQUM5QyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxxQkFBcUIsR0FBRTtDQUN6RCxJQUFJLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsSUFBSSxHQUFFO0NBQ25ELElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBRyxlQUFjO0NBQ3hELElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsU0FBUTtDQUNwQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLFNBQVE7Q0FDdkMsSUFBSSxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFFO0NBQ3ZHLElBQUksT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBRTtDQUN0RSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVEsR0FBRTtDQUN4RixJQUFJLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsUUFBUSxHQUFFO0NBQ3hFLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEdBQUU7Q0FDMUUsSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssR0FBRyxHQUFHLEdBQUU7Q0FDdkQsSUFBSSxPQUFPLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUU7Q0FDeEQsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPLEdBQUU7Q0FDN0QsQ0FBQzs7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QU8sQ0FBQyxPQUFNO0NBQ3BDLElBQUksSUFBSSxDQUFDLEdBQUcsS0FBSTtDQUNoQixJQUFJLFFBQVEsQ0FBQyxHQUFHLElBQUksR0FBRztDQUN2QixRQUFRLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLEdBQUcsSUFBSSxHQUFFO0NBQ3BDLFFBQVEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsR0FBRyxLQUFLLE9BQU8sQ0FBQyxRQUFRLEdBQUU7Q0FDdEUsUUFBUSxJQUFJLENBQUMsR0FBRyxLQUFJO0NBQ3BCLFFBQVEsUUFBUSxDQUFDLEdBQUcsSUFBSSxHQUFHO0NBQzNCLFNBQVMsSUFBSSxJQUFJLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUU7Q0FDbkMsU0FBUyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLElBQUksR0FBRyxHQUFHLEtBQUssT0FBTyxDQUFDLFFBQVEsR0FBRTtDQUN2RTtDQUNBLFVBQVUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQUs7Q0FDaEM7Q0FDQSxVQUFVLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRTtDQUN2SSxVQUFVLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLEdBQUcsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJ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RSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUM5QyxRQUFRLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBUztDQUNsQyxLQUFLLE1BQU0sS0FBSyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7Q0FDNUQsUUFBUSxNQUFNLEdBQUcsS0FBSyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxLQUFJO0NBQ2pFLEtBQUssTUFBTSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFO0NBQzlDLFFBQVEsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFTO0NBQ2xDLEtBQUssTUFBTSxLQUFLLEVBQUUsV0FBVyxFQUFFLEdBQUcsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRTtDQUMzRCxRQUFRLE1BQU0sR0FBRyxLQUFLLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEtBQUk7Q0FDakUsS0FBSyxNQUFNLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUU7Q0FDOUMsUUFBUSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVM7Q0FDbEMsS0FBSztDQUNMLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLEdBQUU7Q0FDM0IsQ0FBQzs7QUFFRCxDQWFBLFNBQVMsSUFBSSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxRQUFRLEdBQUc7Q0FDMUMsSUFBSSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUM7Q0FDN0IsSUFBSSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUM7Q0FDN0IsSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFFO0NBQ2QsSUFBSSxRQUFRLElBQUksR0FBRztDQUNuQixRQUFRLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFFO0NBQ3pCLFFBQVEsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsS0FBSztDQUMxQyxRQUFRLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7Q0FDN0MsYUFBYSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRTtDQUN6QixLQUFLO0NBQ0wsQ0FBQzs7Q0FFRCxTQUFTLGVBQWUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUc7Q0FDM0MsSUFBSSxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRztDQUMzQyxRQUFRLElBQUksSUFBSSxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFFO0NBQ2xDLFFBQVEsSUFBSSxJQUFJLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUU7Q0FDaEMsUUFBUSxJQUFJLElBQUksR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLElBQUksRUFBRSxDQUFDLEdBQUcsSUFBSSxHQUFFO0NBQzlDLFFBQVEsSUFBSSxJQUFJLEdBQUcsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsS0FBSyxJQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxLQUFLLElBQUksR0FBRTtDQUNsRSxRQUFRLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQyxLQUFLLElBQUc7Q0FDdkQsT0FBTyxJQUFJLENBQUMsS0FBSyxHQUFHLFdBQVcsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLEdBQUU7Q0FDdkUsUUFBUSxLQUFLLENBQUMsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxFQUFFLENBQUMsR0FBRTtDQUMzRCxRQUFRLEtBQUssSUFBSSxHQUFHLEVBQUUsR0FBRyxJQUFJLElBQUksR0FBRyxDQUFDLEdBQUc7Q0FDeEMsWUFBWSxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLEdBQUU7Q0FDOUcsU0FBUztDQUNULEtBQUssR0FBRTtDQUNQLENBQUM7O0NBRUQsZUFBZSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLEdBQUU7O0FBRXRELE9BQU0sRUFBRSxHQUFHLEtBQUssRUFBRSxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEdBQUU7Q0FDM0UsSUFBSSxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxHQUFFOztDQUUvQyxNQUFNLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSTtDQUMxQixJQUFJLElBQUksS0FBSyxHQUFHLGFBQWEsRUFBRSxhQUFhLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEdBQUU7Q0FDN0UsSUFBSSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFB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
