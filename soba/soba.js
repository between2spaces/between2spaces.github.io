( function () {
    'use strict'
    const scene = ENGINE.setScene( { width: 4096, height: 4096, segmentsize: 36, debug: { cells: true, paths: true } } )
    const object_sprite = new ENGINE.Sprite( null, { background: '#eeffee', border: '#aaffaa' } )
    const player = new ENGINE.Object2D( { name: 'Obstacle', sprite: object_sprite, zorder: 5, speed: .5, x: 100, y: 100, debug: { boundingbox: true } } )
    const mousemove = ENGINE.debounce( () => { player.moveTo( ENGINE.mouse ) }, 100 )
    ENGINE.addEventListener( 'mousemove', () => { ENGINE.mouse.button[ 2 ] && mousemove() } )
    ENGINE.addEventListener( 'contextmenu', mousemove )
    player.addEventListener( 'translate', () => { ENGINE.camera.setPosition( player.position.x, player.position.y ) } )
    function mousedown( e ) {
        if ( ENGINE.mouse.button[ 0 ] ) {
            //console.log( ENGINE.cellAtXY( ENGINE.mouse.x, ENGINE.mouse.y ) )
            new ENGINE.Object2D( { name: 'Obstacle', sprite: object_sprite, zorder: 5, speed: .5, x: ENGINE.mouse.x, y: ENGINE.mouse.y, debug: { boundingbox: true } } )
        }
    }
    ENGINE.addEventListener( 'mousedown', mousedown )

} )()