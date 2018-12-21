/**
 * Returns the maximum number of numbers in a sequence that reach a desired target.
 * @param {string} seq a space separated string of integers
 * @param {number} target the desired number to reach
 * @return {number} the maximum number of numbers that reach the target
 */
let cannibalNumbers = ( seq, target ) => {
    let singles = 0
    seq = seq.replace( /[ ,]+/g, " " ).split( " " ).map( n => Number( n ) )
    seq = seq.filter( n => n >= target ? singles++ < 0 : true )
    let combos = [ [] ]
    seq.forEach( n => combos.concat().forEach( combo => combos.push( combo.concat( n ).sort( ( a, b ) => a - b ) ) ) )
    combos = combos.filter( combo => {
        if ( combo.length < 2 ) return false
        let last = combo.length - 1
        let sum = combo[ last ]
        for ( let i = 0; i < last; i++ ) {
            if ( combo[ i ] < sum ) {
                sum++
                if ( sum >= target ) return true
            }
        }
        return false
    } )
    let combos_of_combos = [ [] ]
    let cannibals = 0
    combos.forEach( combo => combos_of_combos.concat().forEach( coc => {
        let candidate = coc.concat( [ combo ] )
        if ( candidate.reduce( ( a, c ) => a + c.length, 0 ) <= seq.length ) {
            let tmp = seq.concat()
            for ( let c = 0; c < candidate.length; c++ ) {
                combo = candidate[ c ]
                for ( let i = 0; i < combo.length; i++ ) {
                    let exists = tmp.indexOf( combo[ i ] )
                    if ( exists == -1 ) return
                    tmp.splice( exists, 1 )
                }
            }
            if ( candidate.length > cannibals ) cannibals = candidate.length
            combos_of_combos.push( candidate )
        }
    } ) )
    return singles + cannibals
}


let tests = [
    {
        name: "u/mn-haskell-guy's Input // Ouput (slow to calculate)", input: `7 1
4, 4, 4, 4, 4, 4, 4
5` },
    {
        name: "u/snow_in_march's Input // Ouput", input: `9 1
3 3 3 2 2 2 1 1 1
4` },
    {
        name: "u/FunWithCthulhu3's Input // Ouput", input: `12 5
9 10 14 15 18 21 4 3 7 8 10 12
9 10 11 12 13` },
    {
        name: "u/rabuf's Test #2 // Output", input: `5 1
1 2 3 4 5
5` },
    {
        name: "u/rabuf's Test #1 // Output", input: `7 2
21 9 5 8 10 1 3
10 15` },
    {
        name: 'Example Input // Ouput', input: `7 2
21 9 5 8 10 1 3
10 15` }
]

// console > DOM duplicate log
; ( ( l, e ) => { e = e[ e.length - 1 ]; console.log = msg => { e.innerHTML += msg + '<br/>'; l( msg ) } } )( console.log, document.getElementsByTagName( 'code' ) )


let run_test = () => {
    let test = tests.pop()
    if ( !test ) return
    console.log( '' )
    console.log( test.name )
    setTimeout( () => {
        let sequence = null
        test.input.split( '\n' ).forEach( ( line, i ) => {
            if ( i == 1 ) { sequence = line; return; }
            if ( i == 2 ) line.split( ' ' ).forEach(
                desired => console.log( ( sequence + ' >= ' + desired ) + ' // ' + cannibalNumbers( sequence, desired ) )
            )
        } )
        setTimeout( run_test, 0 )
    }, 0 )
}

setTimeout( run_test, 0 )
