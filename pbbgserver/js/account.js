const db = require( './db' )
module.exports.create = ( username, password, callback ) => {
    let account = db.get( 'account', username )
    if ( !db.isEmpty( account ) ) return callback( 'Account for username "' + username + '" already exists', false )
    require( 'bcrypt' ).hash( password, 10, ( err, hash ) => {
        if ( err ) callback( err )
        account.hash = hash
        db.commit( 'account', username )
        callback( null, account[ username ] )
    } )
}
module.exports.login = ( username, password, callback ) => {
    let account = db.get( 'account', username )
    if ( db.isEmpty( account ) ) return callback( 'Account for username "' + username + '" not found', false )
    require( 'bcrypt' ).compare( password, account.hash, ( err, res ) => {
        if ( err ) return callback( err )
        if ( !res ) return callback( 'Password incorrect' )
        callback( null, account )
    } )
}
