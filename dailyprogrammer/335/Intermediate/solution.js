/**
 * Prints out the hand and it's points with a summary of how the points are calculated.
 * @param {string} hand a space separated string of cards
 */
function cribbage( hand ) {
    let rank = card => ' A234567891JQK'.indexOf( card[ 0 ] )
    let unsorted = hand.replace( /\|/, '' ).replace( /[ ,]+/g, ' ' ).split( ' ' )
    let sorted = unsorted.concat().sort( ( a, b ) => rank( a ) - rank( b ) )
    let combos = [[]]
    sorted.forEach( card => combos.concat().forEach( combo => combos.push( combo.concat( card ) ) ) )
    combos = combos.filter( combo => combo.length > 1 )
    let fifteens = combos.filter( combo => combo.map( card => Math.min( rank( card ), 10 ) ).reduce( ( a , b ) => a + b, 0 ) === 15 ).length
    let total = 0
    let pts = n => ( '' + ( total - ( total += n ) ) ).replace( '-', ' - ')
    let summary = fifteens ? ' (' + fifteens + ' fifteens' + pts( fifteens * 2 ) : ' ('
    let runs = combos.filter( combo => combo.length > 2 && combo.reduce( ( a, b ) => rank( b ) == rank( a ) + 1 ? b : false ) ).sort( ( a, b ) => b.length - a.length ).filter( ( r, i, a ) => r.length == a[ 0 ].length )
    summary += runs.length > 3 ? ', a double-double-run' + pts( 12 ) : runs.length > 2 ? ', a triple-run' + pts( 9 ) : runs.length > 1 ? ', a double-run of ' + runs[ 0 ].length + pts( runs[ 0 ].length * 2 ) : runs.length > 0 ? ', a run of ' + runs[ 0 ].length + pts( runs[ 0 ].length ) : ''
    let pairs = combos.filter( ( combo, i, a ) => combo.filter( ( c, i, a ) => i > 0 && c[ 0 ] == a[ 0 ][ 0 ] ).length == combo.length - 1 ).sort( ( a, b ) => b.length - a.length ).filter( ( r, i, a ) => r.length == a[ 0 ].length )
    summary += pairs.length > 1 ? ', 2 pair' + pts( 4 ) : pairs.length < 1 ? '' : pairs[ 0 ].length > 3 ? ', a double pair royal' + pts( 12 ) : pairs[ 0 ].length > 2 ? ', a pair royal' + pts( 6 ) : ', a pair' + pts( 2 )
    let flush = unsorted.map( c => c.replace(/10/,'1') ).reduce( ( a, b ) => a[ 1 ] == b[ 1 ] ? b : false )
    summary += flush ? ', a five-card flush' + pts( 5 ) : unsorted.slice( 0, 4 ).map( c => c.replace(/10/,'1') ).reduce( ( a, b ) => a[ 1 ] == b[ 1 ] ? b : false ) ? ', a four-card flush' + pts( 4 ) : ''
    let nob = unsorted.filter( ( c, i, a ) => c[ 0 ] == 'J' && a[ 4 ].replace(/10/,'1')[ 1 ] == c.replace(/10/,'1')[ 1 ] )
    summary += nob.length < 1 ? '' : ', one for nobs' + pts( 1 )
    summary = ( summary + ')' ).replace( /\(, /, '(' ).replace( / \(\)/, '' )
    console.log( hand.padEnd( 20 ) + total + ' points' + summary )
}

console.log( '// u/between2space Inputs -> Outputs' )
cribbage( '5D QS JC KH | AC' )  //    10 points (3 fifteens - 6, a run of 3 - 3, one for nobs - 1)
cribbage( '8C AD 10C 6H | 7S' )  //   7 points (2 fifteens - 4, a run of 3 - 3)
cribbage( 'AC 6D 5C 10C | 8C' )  //   4 points (2 fifteens - 4)
cribbage( '8H 6D QC 7C | 8C' )  //    12 points (2 fifteens - 4, a double-run of 3 - 6, a pair - 2)
cribbage( '9C JD QC 10C | 8C' )  //   5 points (a run of 5 - 5)
cribbage( '9C 9D QC 9H | 8C' )  //    6 points (a pair royal - 6)
cribbage( '9C AD QC JH | 8C' )  //    0 points
cribbage( '9C 9D QC 9H | 9S' )  //    12 points (a double pair royal - 12)
cribbage( 'AS AC 2H 3H | JD' )  //    13 points (2 fifteens - 4, a double-run of 3 - 6, a pair - 2, one for nobs - 1)
cribbage( 'AS AC 2H 3H | 4D' )  //    10 points (a double-run of 4 - 8, a pair - 2)
cribbage( 'AS AC 2H 3H | 3D' )  //    20 points (a double-double-run - 16, 2 pair - 4)
cribbage( 'AS AC AD 2H | 3D' )  //    21 points (a triple-run - 15, a pair royal - 6)
cribbage( '9S 2S QS 9S | KC' )  //    6 points (a pair - 2, a four-card flush - 4)
cribbage( '9S 2S QS 9C | QS' )  //    4 points (2 pair - 4)
cribbage( 'JH 7H 10H AH | 9H' )  //   9 points (a run of 3 - 3, a five-card flush - 5, one for nobs - 1)
cribbage( '9C 9S QC 7H | JS' )  //    3 points (a pair - 2, one for nobs - 1)

console.log( '\nu/gabyjunior Inputs -> Results' )
cribbage( '5D,QS,JC,KH,AC' )   //      10 points (3 fifteens - 6, a run of 3 - 3, one for nobs - 1)
cribbage( '8C,AD,10C,6H,7S' )   //     7 points (2 fifteens - 4, a run of 3 - 3)
cribbage( 'AC,6D,5C,10C,8C' )   //     4 points (2 fifteens - 4)
cribbage( '6D,JH,4H,7S,5H' )   //      9 points (2 fifteens - 4, a run of 4 - 4, one for nobs - 1)
cribbage( '5C,4C,2C,6H,5H' )   //      12 points (2 fifteens - 4, a double-run of 3 - 6, a pair - 2)
cribbage( '10C,8D,KS,8S,5H' )   //     6 points (2 fifteens - 4, a pair - 2)
cribbage( '10C,5C,4C,7S,3H' )   //     7 points (2 fifteens - 4, a run of 3 - 3)
cribbage( '7D,3D,10H,5S,3H' )   //     8 points (3 fifteens - 6, a pair - 2)
cribbage( '7C,KD,9D,8H,3H' )   //      5 points (1 fifteens - 2, a run of 3 - 3)
cribbage( '8S,AC,QH,2H,3H' )   //      5 points (1 fifteens - 2, a run of 3 - 3)
cribbage( '5H,5C,5S,JD,5D' )   //      29 points (8 fifteens - 16, a double pair royal - 12, one for nobs - 1)