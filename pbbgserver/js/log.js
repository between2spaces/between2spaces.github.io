const fs = require( 'fs' )
const util = require( 'util' )
const utils = require( './utils' )

module.exports = ( msg ) => {
    fs.createWriteStream( './logs/' + utils.yyyymmdd() + '.log', { flags: 'a' } ).write( utils.yyyymmddTHHMMSS() + ' ' + util.format( msg ) + '\n' )
}
