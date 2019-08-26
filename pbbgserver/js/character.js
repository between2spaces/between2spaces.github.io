const db = require( './db' )

module.exports.create = ( username, charactername, callback ) => {
    let character = db.get( 'character' )
    if ( character[ charactername ] ) callback( 'Error: Character ' + charactername + ' already exists', false )
    character[ charactername ] = { username: username }
    callback( null, character[ charactername ] )
}
