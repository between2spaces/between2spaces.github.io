module.exports.yyyymmddTHHMMSS = ( date ) => {
    let d = date || new Date
    return d.getFullYear() + '-' + pad0( d.getMonth() + 1 ) + '-' + pad0( d.getDate() ) + 'T' + pad0( d.getHours() ) + ':' + pad0( d.getMinutes() ) + ':' + pad0( d.getSeconds() )
}

module.exports.yyyymmdd = ( date ) => {
    let d = date || new Date
    return d.getFullYear() + '-' + pad0( d.getMonth() + 1 ) + '-' + pad0( d.getDate() )
}

const pad0 = ( number ) => {
    return number.toString().padStart( 2, '0' )
}
module.exports.pad0 = pad0

module.exports.randomString = ( length ) => {
    return Array( length ).join().split( ',' ).map( () => { return 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~!@#$%^&*()_+-={}[];":?/<>,.'.charAt( Math.floor( 90 * Math.random() ) ) } ).join( '' )
}
