const jwt = require( 'jsonwebtoken' )
const utils = require( './utils' )
const account = require( './account' )
module.exports = ( global, message, error, callback ) => {
    let username
    while ( !username || global.token_username.hasOwnProperty( message.token ) )
        username = 'Guest-' + utils.randomString( 4 )
    let password = utils.randomString( 16 )
    account.create( username, password, ( err, res ) => {
        if ( err ) callback( { error: err } )
        let token = jwt.sign( { username: username }, global.secret )
        global.token_username[ token ] = username
        let response = { type: 'guest', username: username, token: token }
        if ( error ) response.error = error
        callback( response )
    }, true )
}