import cells from './cells'
import binaryheap from './binaryheap'


/**
 * Returns a list of staight line waypoints that avoid collisions from ent's current cell to destination.
 *
 * @param {Entity} ent
 * @param {Cell} destination
 * @return {Cell[]}
 */
let path = (ent, destination) => {

  let clls = destination.owner
  let cost
  let gScore

  if (ent.collide && cells.collides(ent, cells.collisionArea(ent, destination))) {
    // destination is in a collision; adjust to nearest cell on straight line that doesn't collide
    let line = cells.raytrace(destination, ent.cell)
    for (let cll in line) {
      destination = line[cll]
      // continue path finding with destination set at current cell if no collision found
      if (!cells.collides(ent, cells.collisionArea(ent, destination))) break
    }
  }


  if (ent.collide && cells.collides(ent, cells.collisionArea(ent))) {
    console.log('error: ent is already colliding; need an unstick step here')
    return []
  }

  // clean dirty nodes
  cells.cleanDirtyPathInfo(clls)

  let startCell = ent.cell
  let endCell = destination

  clls.dirtyCells = [startCell]

  startCell.g = 0
  startCell.score = 0

  let heap = binaryheap()
  binaryheap.push(heap, startCell)

  while (binaryheap.size(heap)) {

    // pop the lowest scored cell off the heap
    let currentCell = binaryheap.pop(heap)

    // end condition -- result has been found, return the traced path
    if (currentCell === endCell || binaryheap.size(heap) > 100) {
      return tracePath(currentCell)
    }

    // move currentCell from open to closed, process each of its neighbours
    currentCell.closed = true

    let neighbours = [currentCell.north, currentCell.east, currentCell.south, currentCell.west]

    for (let neighbour in neighbours) {

      neighbour = neighbours[neighbour]

      if (!neighbour || neighbour.closed) continue

      // close and continue if a collision would occur
      if (ent.collide && cells.collides(ent, cells.collisionArea(ent, neighbour))) {
        neighbour.closed = true
        clls.dirtyCells.push(neighbour)
        continue
      }

      let beenVisited = neighbour.visited
      let neighbourParent = currentCell

      // make neighbours parent the parent of currentCell if traveled in a straight line does not collide
      if (currentCell.parent && cells.canStraightLineTravel(currentCell.parent, neighbour, ent)) {
        neighbourParent = currentCell.parent
      }

      gScore = neighbourParent.g + 1

      // check if neighbour has not been visited yet, or can be reached with a smaller cost from current
      if (!neighbour.visited || gScore < neighbour.g) {

        neighbour.parent = neighbourParent
        neighbour.h = neighbour.h || heuristic(neighbour, endCell)
        neighbour.g = gScore
        neighbour.score = neighbour.g + neighbour.h

        clls.dirtyCells.push(neighbour)

        if (!beenVisited) {
          // pushing to heap will put it in proper place based on the 'f' value.
          binaryheap.push(heap, neighbour)
          neighbour.visited = true
        } else {
          // already seen the node, but since it has been rescored we need to reorder it in the heap
          binaryheap.rescore(heap, neighbour)
        }

      }

    }

  }

  return []

}


/**
 * Manhattan distance
 */
let heuristic = (start, end) => {

  let dx = Math.abs(start.position.x - end.position.x)
  let dy = Math.abs(start.position.y - end.position.y)

  return dx + dy

}


let tracePath = (cll) => {

    let curr = cll
    var path = []

    while (curr.parent) {
      curr.path = true
      path.push(curr)
      curr = curr.parent
    }

    return path.reverse()

}


export default path

