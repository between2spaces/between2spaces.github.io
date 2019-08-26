const jwt = require( 'jsonwebtoken' )
// dev only; no cache
delete require.cache[ require.resolve( './account' ) ]
delete require.cache[ require.resolve( './admin' ) ]
delete require.cache[ require.resolve( './utils' ) ]
delete require.cache[ require.resolve( './guest' ) ]
const account = require( './account' )
const admin = require( './admin' )
const utils = require( './utils' )
const guest = require( './guest' )

module.exports.message = ( global, ws, message ) => {
    if ( !global.token_username ) global.token_username = {}
    if ( !global.secret ) global.secret = utils.randomString( 32 )
    const response = ( res ) => {
        if ( res.error ) {
            Object.assign( message, res )
            global.log( message )
        }
        ws.send( JSON.stringify( res ) )
    }
    switch ( message.type ) {
        case "signup":
            return account.create( message.username, message.password, ( err, res ) => {
                response( err ? { error: err } : { type: 'signup', success: true } )
            } )
        case "login":
            return account.login( message.username, message.password, ( err, account ) => {
                if ( err ) return response( { error: err } )
                let token = jwt.sign( { username: message.username }, global.secret )
                global.token_username[ token ] = message.username
                response( { type: 'login', username: message.username, token: token } )
            } )
    }
    if ( !message.token ) guest( global, message, null, ( res ) => { response( res ) } )
    let username = global.token_username[ message.token ]
    if ( !username ) return guest( global, message, 'Auth token not recognised', ( res ) => { response( res ) } )
    jwt.verify( message.token, global.secret, err => {
        if ( err ) return guest( global, message, 'Auth token not valid', ( res ) => { response( res ) } )
        if ( !message.type ) return response( { type: 'connected', username: username, token: message.token } )
        if ( message.type.startsWith( 'admin.' ) ) {
            if ( username !== 'admin' ) return response( { error: 'Restricted access' } )
            return admin( global, message, ( err ) => {
                if ( err ) return response( { error: err } )
                response( Object.assign( message, { success: true } ) )
            } )
        }
        switch ( message.type ) {
            case "say":
                global.log( message.username + ' says ' + message.message )
                break
        }
    } )
}