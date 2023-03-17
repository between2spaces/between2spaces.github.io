export class Heap {

    constructor() {

        this.length = 0
        this._list = new Array( 100 )

    }

    push( item, score ) {

        item.heapscore = score

        let idx = ++this.length
        let list = this._list

        list[ idx ] = item

        while ( idx > 1 ) {

            let parentidx = idx >> 1
            let parentitm = list[ parentidx ]

            if ( item.heapscore >= parentitm.heapscore ) break

            list[ idx ] = parentitm
            idx = parentidx

        }

        list[ idx ] = item

    }

    peek() {

        return this.length > 0 ? this._list[ 1 ] : undefined

    }

    pop() {

        if ( this.length < 1 ) return undefined

        let list = this._list
        let retitm = list[ 1 ]
        let itm = list[ this.length ]

        let r = 1
        let c = 2
        let curitm
        let length = this.length

        while ( c < length ) {

            curitm = list[ c ]

            if ( list[ c + 1 ].heapscore < curitm.heapscore ) {

                c = c + 1
                curitm = list[ c ]

            }

            if ( curitm.heapscore >= itm.heapscore ) break

            list[ r ] = curitm
            r = c
            c = c << 1

        }

        list[ length ] = 0
        this.length = --length
        if ( length ) list[ r ] = itm

        return retitm

    }

}