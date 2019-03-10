( function () {
    'use strict'
    const scene = ENGINE.setScene( { width: 2048, height: 2048, segmentsize: 36, debug: { cells: true, paths: true } } )
    const object_sprite = new ENGINE.Sprite( null, { background: '#eeffee', border: '#aaffaa' } )
    const player = new ENGINE.Object2D( { name: 'Player', sprite: object_sprite, x: 0, y: 0, width: 100, height: 100, zorder: 5, speed: .5, physical: true, debug: { boundingbox: true } } )
    ENGINE.camera.setPosition( player.x, player.y )
    let last_mousemove_cell
    const mousemove = () => {
        let cell = ENGINE.cellAtXY( ENGINE.mouse.x, ENGINE.mouse.y )
        if ( cell !== last_mousemove_cell ) {
            last_mousemove_cell = cell
            player.moveTo( ENGINE.mouse )
        }
    }
    ENGINE.addEventListener( 'mousemove', () => { ENGINE.mouse.button[ 2 ] && mousemove() } )
    ENGINE.addEventListener( 'contextmenu', mousemove )
    player.addEventListener( 'translate', () => { ENGINE.camera.setPosition( player.x, player.y ) } )
    function mousedown( e ) {
        if ( ENGINE.mouse.button[ 0 ] ) {
            //console.log( ENGINE.cellAtXY( ENGINE.mouse.x, ENGINE.mouse.y ) )
            new ENGINE.Object2D( { name: 'Obstacle', sprite: object_sprite, zorder: 5, speed: .5, x: ENGINE.mouse.x, y: ENGINE.mouse.y, physical: true, debug: { boundingbox: true } } )
        }
    }
    ENGINE.addEventListener( 'mousedown', mousedown )

} )()