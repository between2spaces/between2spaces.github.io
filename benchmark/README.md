# Benchmark

A template for comparing performance using the [Benchmark.js](https://benchmarkjs.com/) library.

[main](main.js) defines two methods, methodA and methodB that are run through a default performance test cycle.

```

const methodA = () => {

}

const methodB = () => {

}

;( new Benchmark.Suite )

.add( 'methodA', () => {

    methodA()

} )

.add( 'methodB', () => {

    methodB()

} )

.on( 'cycle', event => {

    log( event.target )

} )

.on( 'complete', () => {

    log( '\nFastest is ' + this.filter( 'fastest' ).map( 'name' ) )

} )

.run( { 'async': true } )

```

<canvas id="0" width="256" height="256"></canvas>
<canvas id="1" width="256" height="256"></canvas>

```

```

![script](/benchmark/lodash.js)
![script](/benchmark/benchmark.js)
![script](/benchmark/bundle.js)
