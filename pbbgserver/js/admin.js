module.exports = ( global, message, callback ) => {
    switch ( message.type ) {
        case "admin.list":
            if ( !message.dbtype ) return callback( { error: 'dbtype not provided' } )
            if ( !message.id ) return callback( { error: 'id not provided' } )
            db.list( message.dbtype, message.id, callback )
            break
        case "admin.remove":
            if ( !message.dbtype ) return callback( { error: 'dbtype not provided' } )
            if ( !message.id ) return callback( { error: 'id not provided' } )
            db.remove( message.dbtype, message.id, callback )
            break
    }
}