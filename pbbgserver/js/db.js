const fs = require( 'fs' )

const cache = {}

module.exports.get = ( type, id ) => {
    let key = type + '/' + id
    if ( !cache.hasOwnProperty( key ) ) {
        cache[ key ] = {}
        let path = './db/' + key + '.json'
        if ( fs.existsSync( path ) )
            cache[ key ] = JSON.parse( fs.readFileSync( path ) )
    }
    return cache[ key ]
}

module.exports.commit = ( type, id ) => {
    let dir = './db/' + type
    if ( !fs.existsSync( dir ) ) fs.mkdirSync( dir )
    let key = type + '/' + id
    fs.writeFileSync( './db/' + key + '.json', JSON.stringify( cache[ key ] || {}, null, '  ' ) )
}

module.exports.list = ( type, id, callback ) => {
    let key = type + '/' + id
    let path = './db/' + key + '.json'
    if ( !fs.existsSync( path ) ) {
        fs.unlinkSync( path )
        removed = true
    }
}

module.exports.remove = ( type, id, callback ) => {
    let removed = false
    let key = type + '/' + id
    if ( cache[ key ] ) {
        delete cache[ key ]
        removed = true
    }
    let path = './db/' + key + '.json'
    if ( fs.existsSync( path ) ) {
        fs.unlinkSync( path )
        removed = true
    }
    if ( removed ) return callback( null )
    callback( 'Object ' + type + '/' + id + ' not found' )
}

module.exports.isEmpty = ( db ) => {
    return 0 === Object.keys( db ).length
}
