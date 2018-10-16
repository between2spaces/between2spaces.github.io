# #336 [Easy] Cannibal numbers
[r/dailyprogrammer post](https://www.reddit.com/r/dailyprogrammer/comments/76qk58/20171016_challenge_336_easy_cannibal_numbers/)

**JavaScript**

*+hidden bonus*

[GitHub](https://github.com/between2spaces/between2spaces.github.io/tree/master/dailyprogrammer/336/Easy)
&bull;
[CodePen](https://codepen.io/between2spaces/pen/GMPrzz?editors=0012)

Feedback is welcome.

This is my revised solution after discovering that u/snow_in_march's test case `3 3 3 2 2 2 1 1 1 >= 4` should equal 4 but my previous solution was only finding 3. I know some people are pointing out that the challenge uses the word "set" to describe the input but I like to think of this as the **hidden bonus**.

**UPDATE**: u/mn-haskell-guy has a good test case for `4, 4, 4, 4, 4, 4, 4 >= 5` which should equal 0. I've made a fix to my cannibalisation and added this test to my list of results.


**How my solution works**

1) First remove numbers from the sequence that have already reached the target (singles). This helps reduce the work for the next step.

2) Calculate combinations of all remaining numbers

3) Remove combinations that don't reach the target through cannibalisation

4) Calculate combinations of combinations that form subsets of the remaining numbers (cannibals)

5) The answer becomes the singles count plus the longest cannibals combination found

**Solution**

```javascript
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
```

Example Input // Ouput
```
21 9 5 8 10 1 3 >= 10      // 4
21 9 5 8 10 1 3 >= 15      // 2
```

u/rabuf's Test #1 // Output
```
21 9 5 8 10 1 3 >= 10      // 4
21 9 5 8 10 1 3 >= 15      // 2
```

u/rabuf's Test #2 // Output
```
1 2 3 4 5 >= 5             // 2
```

u/FunWithCthulhu3's Input // Ouput
```
9 10 14 15 18 21 4 3 7 8 10 12 >= 9       // 9
9 10 14 15 18 21 4 3 7 8 10 12 >= 10      // 9
9 10 14 15 18 21 4 3 7 8 10 12 >= 11      // 8
9 10 14 15 18 21 4 3 7 8 10 12 >= 12      // 7
9 10 14 15 18 21 4 3 7 8 10 12 >= 13      // 6
```

u/mn-haskell-guy's Input // Ouput
```
4, 4, 4, 4, 4, 4, 4 >= 5   // 0
```

u/snow_in_march's Input // Ouput (slow to calculate)
```
3 3 3 2 2 2 1 1 1 >= 4     // 4
```