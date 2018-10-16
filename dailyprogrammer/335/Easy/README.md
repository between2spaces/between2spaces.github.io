# #335 [Easy] Consecutive Distance Rating
[r/dailyprogrammer post](https://www.reddit.com/r/dailyprogrammer/comments/759fha/20171009_challenge_335_easy_consecutive_distance/)

```javascript
/**
 * Returns the consecutive distance rating of an integer sequence.
 * @param {string} sequence a space separated string of unique integers in the range 1 to 100 inclusive
 * @param {number=} gap the consecutive gap (default=1)
 * @return {number} the consecutive distance rating
 */
function consecutiveDistance( sequence, gap ) {
    gap = gap ? gap : 1
    let dist = ( v, i, a ) => a.indexOf( v, i + 1 ) > -1 ? a.indexOf( v, i + 1 ) - i : 0
    return sequence.split( ' ' ).map( v => parseInt( v ) ).reduce( ( v, c, i, a ) => v + dist( c + gap, i, a ) + dist( c - gap, i, a ), 0 )
}
```

### Example Input // Results
```javascript
31 63 53 56 96 62 73 25 54 55 64       // 26
77 39 35 38 41 42 76 73 40 31 10       // 20
30 63 57 87 37 31 58 83 34 76 38       // 15
18 62 55 92 88 57 90 10 11 96 12       // 3
26 8 7 25 52 17 45 64 11 35 12         // 6
89 57 21 55 56 81 54 100 22 62 50      // 13
```

### Challenge Input // Output
```
76 74 45 48 13 75 16 14 79 58 78 82 46 89 81 88 27 64 21 63       // 31
37 35 88 57 55 29 96 11 25 42 24 81 82 58 15 2 3 41 43 36         // 68
54 64 52 39 36 98 32 87 95 12 40 79 41 13 53 35 48 42 33 75       // 67
21 87 89 26 85 59 54 2 24 25 41 46 88 60 63 23 91 62 61 6         // 52
94 66 18 57 58 54 93 53 19 16 55 22 51 8 67 20 17 56 21 59        // 107
6 19 45 46 7 70 36 2 56 47 33 75 94 50 34 35 73 72 39 5           // 45
```
