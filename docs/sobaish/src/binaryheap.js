let BinaryHeap = () => {
    let heap = {
        items: []
    }
    return heap
}


function push( heap, item ) {
    // add the new element to the end of the array
    heap.items.push( item )
    // allow it to bubble up
    bubbleUp( heap, heap.items.length - 1 )
}


function pop( heap ) {
    // store the first item so we can return it later
    let result = heap.items[ 0 ]
    // get the item at the end of the array
    let end = heap.items.pop()
    // if there are any items left, put the end element at the start, and let it sink down
    if ( heap.items.length > 0 ) {
        heap.items[ 0 ] = end
        sinkDown( heap, 0 )
    }
    return result
}


function rescore( heap, item ) {
    sinkDown( heap, heap.items.indexOf( item ) )
}


function remove( heap, item ) {

    let length = heap.items.length

    // to remove a value, we must search through the array to find it
    for ( let i = 0; i < length; i++ ) {
        if ( heap.items[ i ] != item ) continue
        // when it is found, the process seen in 'pop' is repeated to fill up the hole
        let end = heap.items.pop()
        // if the item we popped was the one we needed to remove, we're done
        if ( i == length - 1 ) break
        // otherwise, we replace the removed element with the popped
        // one, and allow it to float up or sink down as appropriate.
        heap.items[ i ] = end
        bubbleUp( heap, i )
        sinkDown( heap, i )
        break
    }

}


function size( heap ) {
    return heap.items.length
}


function bubbleUp( heap, i ) {
    // fetch the item that has to be moved
    let item = heap.items[ i ], score = item.score
    // when at 0, an item can not go up any further
    while ( i > 0 ) {
        // compute the parent item's index, and fetch it.
        let parentN = Math.floor( ( i + 1 ) / 2 ) - 1
        let parent = heap.items[ parentN ]
        // if the parent has a lesser score, things are in order and we are done
        if ( score >= parent.score ) break

        // otherwise, swap the parent with the current item and continue
        heap.items[ parentN ] = item
        heap.items[ i ] = parent
        i = parentN
    }
}


function sinkDown( heap, i ) {

    // look up the target item and its score
    let length = heap.items.length
    let item = heap.items[ i ]
    let elemScore = item.score

    while ( true ) {
        // compute the indices of the child items
        let child2N = ( i + 1 ) * 2, child1N = child2N - 1
        // this is used to store the new position of the item, if any
        let swap = null
        let child1Score
        // if the first child exists (is inside the array)...
        if ( child1N < length ) {
            // look it up and compute its score.
            let child1 = heap.items[ child1N ]
            child1Score = child1.score
            // if the score is less than our item's, we need to swap.
            if ( child1Score < elemScore ) swap = child1N
        }
        // do the same checks for the other child
        if ( child2N < length ) {
            let child2 = heap.items[ child2N ]
            let child2Score = child2.score
            if ( child2Score < ( swap === null ? elemScore : child1Score ) ) swap = child2N
        }

        // no need to swap further, we are done
        if ( swap === null ) break

        // otherwise, swap and continue
        heap.items[ i ] = heap.items[ swap ]
        heap.items[ swap ] = item
        i = swap
    }

}


export { BinaryHeap, push, pop, rescore, remove, size, bubbleUp, sinkDown }
