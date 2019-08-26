PBBG.receive = ( event ) => {
    let message = JSON.parse( event.data )
    PBBG.debug( '<-' + JSON.stringify( message ) )
    if ( message.token && PBBG.store.token !== message.token ) {
        PBBG.set( 'token', message.token )
    }
    if ( message.username ) {
        let username = message.username
        let account_label = username
        if ( username.startsWith( 'Guest-' ) ) {
            account_label += ' | <a href="#">Sign up</a> / <a href="#">Log in</a>'
        } else {
            account_label += ' | <a href="#">Log out</a>'
        }
        if ( PBBG.store.username !== username ) {
            PBBG.set( 'username', username )
        }
    }
    switch ( message.type ) {
        case "guest":
            break
        case "login":
            break
    }
}


PBBG.send = ( json ) => {
    if ( !PBBG.ws || PBBG.ws.readyState === WebSocket.CLOSING || PBBG.ws.readyState === WebSocket.CLOSED ) {
        PBBG.ws = new WebSocket( 'ws://localhost:8108' ) // local
        // ws = new WebSocket( 'ws://desolate-stream-79243.herokuapp.com/' ) // public
        PBBG.ws.addEventListener( 'message', PBBG.receive )
    }
    json = json || {}
    function _send() {
        json.token = PBBG.store.token
        let message = JSON.stringify( json )
        PBBG.debug( '->' + message )
        PBBG.ws.send( message )
    }
    PBBG.ws.readyState === WebSocket.OPEN ? _send() : PBBG.ws.addEventListener( 'open', _send )
}


PBBG.send.signup = ( username, password ) => {
    PBBG.send( { type: 'signup', username: username, password: password } )
}


PBBG.send.login = ( username, password ) => {
    PBBG.send( { type: 'login', username: username, password: password } )
}

PBBG.send.say = ( message ) => {
    PBBG.send( { type: 'say', username: username, message: message } )
}

PBBG.send.admin = {}
PBBG.send.admin.account = {}
PBBG.send.admin.account.all = () => {
    PBBG.send( { type: 'admin.account.all' } )
}
PBBG.send.admin.account.remove = ( username ) => {
    PBBG.send( { type: 'admin.account.remove', username: username } )
}
