window.PBBG = {
    debuglevel: 'INFO',
    store: {},
}
try {
    PBBG.store = JSON.parse( localStorage.getItem( 'store' ) ) || {}
} catch ( e ) { }
PBBG.set = ( key, value ) => {
    PBBG.store[ key ] = value
    localStorage.setItem( 'store', JSON.stringify( PBBG.store ) )
}
PBBG.debug = ( msg ) => {
    if ( PBBG.debuglevel === 'INFO' ) {
        console.log( msg )
    }
}