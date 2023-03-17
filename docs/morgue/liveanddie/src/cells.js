import './continuous'
import vec3 from './vec3'
import config from './config'
import entity from './entity'


/**
 * Returns a new {cells}.
 * @param {cells=} clls {
 *            size: {vec3} [default {x: 1000, y: 1000, z: 0}],
 *            regionSize: {number} [default 32],
 *          } 
 * @return {cells}
 */
let cells = (clls) => {

  clls = clls || {}

  clls = {
    size: (!clls.size) ? {x: 1000, y: 1000, z: 0} : vec3(clls.size),
    regionSize: (!clls.regionSize) ? 32 : clls.regionSize,
    cell: [],
    regions: {},
    dirtyRegions: {},
    unregionedCells: [],
    dirtyCells: []
  }

  let maxx = clls.size.x - 1
  let maxy = clls.size.y - 1

  for (let y = 0; y <= maxy; ++y) {
    for (let x = 0; x <= maxx; ++x) {
      clls.cell[y * clls.size.x + x] = cell(clls, x, y)
    }
  }

  for (let y = 0; y <= maxy; ++y) {
    for (let x = 0; x <= maxx; ++x) {
      let cll = clls.cell[y * clls.size.x + x]
      if (y > 0) cll.north = clls.cell[(y - 1) * clls.size.x + x]
      if (x < maxx) cll.east = clls.cell[y * clls.size.x + x + 1]
      if (y < maxy) cll.south = clls.cell[(y + 1) * clls.size.x + x]
      if (x > 0) cll.west = clls.cell[y * clls.size.x + x - 1]
      cll.region = region({owner: clls, id: cll.regionHash})
      cll.region.cells.push(cll)
    }
  }

  let regionIds = Object.getOwnPropertyNames(clls.regions)
  for (let i in regionIds) clls.dirtyRegions[regionIds[i]] = null
  region.updateDirty(clls)

  return clls

}


/**
 * Returns the {cell} at x, y of the given {cells}.
 * @param {cells} clls
 * @param {number} x
 * @param {number} y
 * @return {cell}
 */
cells.getCell = (clls, x, y) => {
  if (x < 0 || x >= clls.size.x || y < 0 || y >= clls.size.y) return
  return clls.cell[y * clls.size.x + x]
}


/**
 * Returns true if the given {cell} is open; otherwise false.
 * @param {cell} cll
 * @return {boolean}
 */
cells.isOpen = (cll) => {
  if (!cll || cll.collision) return false
  return true
}


/**
 * Returns the type code of the region the given {cell} is in.
 * @param {cell} cll
 * @return {number}
 *    0 - open region
 *    1 - obsticle
 */
cells.regionType = (cll) => {
  if (cll.collision) return 1
  return 0
}


/**
 * Returns true if both {cell}'s can be in the same {region}.
 * @param {cell} a
 * @param {cell} b
 * @return {boolean}
 */
cells.canShareSameRegion = (a, b) => {
  return a.regionHash === b.regionHash && a.collision === b.collision
}


/**
 * Adds the given {entity} to the given {cells}.
 * If a {cell} is not specified the {entity} is position relative to the centre cell of {cells}.
 * @param {cells} clls
 * @param {entity} ent
 * @param {cell=} cll
 */
cells.addEntity = (clls, ent, cll) => {

  if (!cll) cll = ent.cell

  // find centre cell if we were not given a cell and the entity is not already assigned a cell
  if (!cll) {
    cll = clls.cell[clls.size.y * 0.5 * clls.size.x + clls.size.x * 0.5]
  }

  // make a copy of the entities offset so we are not manipulating the original
  let offset = vec3(ent.offset)

  // find cell after normalising offset
  cll = cells.findCellFromNormalisedOffset(cll, offset)

  // find the entities collision area
  let collisionArea = cells.collisionArea(ent, cll)

  // don't continue if entity would collide
  if (ent.collide && cells.collides(ent, collisionArea)) return
   
  // update entities offset
  ent.offset = offset
 
  // add entity to cell
  cll.entities.push(ent)
  ent.cell = cll

  // add entity to its collision area
  ent.collisionArea = collisionArea
  for (let i in collisionArea) collisionArea[i].collision = ent

  // re-region cell and similar neighbours 
  region.reRegion(cll.region)

  return ent

}

 
/**
 * Removes an {entity} from its {cells} if attached.
 * @param {entity} ent
 */
cells.removeEntity = (ent) => {

  if (!ent.cell) return

  let clearedCells = []

  // remove entity from its collision area
  for (let cll in ent.collisionArea) {
    cll = ent.collisionArea[cll]
    clearedCells.push(cll)
    cll.collision = null
  }

  ent.collisionArea = []

  // remove entity from its cell
  let cll = ent.cell
  ent.cell = null
  let index = cll.entities.indexOf(ent)
  if (index > -1) cll.entities.splice(index, 1)
  
  // re-region cell and similar neighbours 
  region.reRegion(cll.region)

  let exitCleared = {}

  for (let cll in clearedCells) {
    cll = clearedCells[cll]
    if (cll.regionExitNorth && cll.north.region) exitCleared[cll.north.region.id] = cll.north.region
    if (cll.regionExitEast && cll.east.region) exitCleared[cll.east.region.id] = cll.east.region
    if (cll.regionExitSouth && cll.south.region) exitCleared[cll.south.region.id] = cll.south.region
    if (cll.regionExitWest && cll.west.region) exitCleared[cll.west.region.id] = cll.west.region
  }
 
  for (let id in exitCleared) {
    region.reRegion(exitCleared[id])
  }

}



/**
 * Updates the given {entity}'s offset and associated {cell} given an offset delta.
 * @param {entity} ent
 * @param {vec3} offsetDelta
 */
cells.moveEntity = (ent, offsetDelta) => {  
  
  // create a new offset from the addition of the entities offset and the delta
  let offset = vec3.addVectors(ent.offset, offsetDelta)
  
  // find what cell the entity would be in after offset normalisation
  let cll = cells.findCellFromNormalisedOffset(ent.cell, offset)

  // if cell is same as current cell, we only need to update offset and we're done
  if (cll === ent.cell) {
    ent.offset = offset
    return
  }

  // otherwise we need to test for collision before allowing the move
  let collisionArea
  if (ent.collide) {
    collisionArea = cells.collisionArea(ent, cll)
    let collision = cells.collides(ent, collisionArea)
    if (collision) return collision
  }

  // remove entity from its current cell
  cells.removeEntity(ent)
  
  // update entities offset
  ent.offset = offset
 
  // add entity to new cell
  cll.entities.push(ent)
  ent.cell = cll

  // add entity to its collision area
  ent.collisionArea = collisionArea
  for (let i in collisionArea) {
    collisionArea[i].collision = ent
  }

  // re-region cell and similar neighbours 
  region.reRegion(cll.region)

}



/**
 * Returns the {cell} offset distance away from the given {cell}'s centre.
 * @param {cell} cll
 * @param {vec3] offset
 * @return {cll}
 */
cells.findCellFromNormalisedOffset = (cll, offset) => {

  while (cll.west && offset.x <= -0.5) {cll = cll.west; ++offset.x;}
  while (cll.east && offset.x > 0.5) {cll = cll.east; --offset.x;}
  while (cll.north && offset.y <= -0.5) {cll = cll.north; ++offset.y;}
  while (cll.south && offset.y > 0.5) {cll = cll.south; --offset.y;}

  return cll

}



/**
 * Returns the first collision found in the array of {cell}'s that is not against the {entity}.
 * If no collision if found a null is returned
 * @param {entity} ent
 * @param {cell[]} list
 * @return {entity=}
 */
cells.collides = (ent, list) => {

  for (let cll in list) {
    let collision = list[cll].collision
    if (collision && collision !== ent) return collision
  }

  return null
   
}



/**
 * Returns an array of {cell}s in the given {entity}s collision area.
 * @param {entity} ent
 * @param {cell=} cll
 * @return {cell[]}
 */
cells.collisionArea = (ent, cll) => {

  let collisionArea = []

  if (!ent.collide) return collisionArea
  if (!cll) cll = ent.cell

  let last = cll
  let max = vec3.multiply(vec3.multiply({x: 0.5, y: 0.5, z: 0}, ent.size), ent.collide)
  let min = {x: -max.x, y: -max.y, z: 0}
  let area = {x: 1, y: 1, z: 0}

  while (cll.west && min.x++ <= -0.9) {cll = cll.west; ++area.x;}
  while (cll.north && min.y++ <= -0.9) {cll = cll.north; ++area.y;}
  while (last.east && max.x-- > 0.9) {last = last.east; ++area.x;}
  while (last.south && max.y-- > 0.9) {last = last.south; ++area.y;}


  let row = cll

  while (area.y--) {
    let x = area.x
    while (x--) { 
      collisionArea.push(cll)
      if (cll.east) cll = cll.east
    }
    if (row.south) {
      row = row.south
      cll = row
    }
  }

  return collisionArea

}



/**
 * Returns true if the given {entity} can travel in a straight line between both {cell}s.
 * If an {entity} is not specified; only {cell}s covered by zero width line are considered.
 * @param {cell} a
 * @param {cell} b
 * @param {entity=} ent
 * @return {boolean}
 */
cells.canStraightLineTravel = (a, b, ent) => {

  if (!ent) {
    // direct cell only collision test; no entity collisionArea to consider
    let line = cells.raytrace(a, b)
    for (let cll in line) {
      if (line[cll].collision) return false
    }
    return true
  }

  if (!ent.collide) return true
  
  let line = cells.raytrace(a, b)

  for (let cll in line) {
    // collision area testing
    if (cells.collides(ent, cells.collisionArea(ent, line[cll]))) return false
  }

  return true

}



/**
 * Returns array of {cell}s touched by a straight line between {cell}s a and b.
 * @param {cell} a
 * @param {cell} b
 * @return {cell[]}
 */
cells.raytrace = (a, b) => {

  let dx = Math.abs(b.position.x - a.position.x)
  let dy = Math.abs(b.position.y - a.position.y)
  let n = 1 + dx + dy
  let east = (b.position.x > a.position.x) ? true : false
  let south = (b.position.y > a.position.y) ? true : false
  let error = dx - dy
  let cll = a
  let line = []

  dx *= 2
  dy *= 2

  for (; n > 0; n--) {
    line.push(cll)
    if (error > 0) {
      if (east && cll.east) cll = cll.east
      else if (!east && cll.west) cll = cll.west
      error -= dy
    } else {
      if (south && cll.south) cll = cll.south
      else if (!south && cll.north) cll = cll.north
      error += dx
    }
  }

  return line
  
}



/**
 * Clears path information from all {cell}s in the given {cells}.
 */
cells.cleanDirtyPathInfo = (clls) => {

  for (let dirtyCell in clls.dirtyCells) {
    dirtyCell = clls.dirtyCells[dirtyCell]
    dirtyCell.score = dirtyCell.g = dirtyCell.h = 0
    dirtyCell.visited = dirtyCell.closed = dirtyCell.parent = dirtyCell.path = null
  }

}



/**
 * Returns a new {cell} with position {x: x, y: y, z: 0}
 * @param {cells} clls
 * @param {number} x
 * @param {number} y
 * @return {cell}
 */
let cell = (clls, x, y) => {

  return {

    owner: /**{cells}*/clls,
    position: /**{vec3}*/{x: x, y: y, z: 0},

    region: /**{region}*/null,
    regionHash: (~~(y/clls.regionSize)+1) << 8 | (~~(x/clls.regionSize)+1),

    entities: /**{entity[]}*/[],
    collision: /**{entity=}*/null,

    north: /**{cell}*/null,
    east: /**{cell}*/null,
    south: /**{cell}*/null,
    west: /**{cell}*/null,

    regionBoundary: /**{boolean}*/false,
    regionExitNorth: /**{boolean}*/false,
    regionExitEast: /**{boolean}*/false,
    regionExitSouth: /**{boolean}*/false,
    regionExitWest: /**{boolean}*/false

  }

}




/**
 * Returns a new {region}.
 * @param {region=} rgn
 * @return {region}
 */
let region = (rgn) => {

  rgn = rgn || {}
  rgn.type = rgn.type || 0

  if (rgn.owner.regions.hasOwnProperty(rgn.id)) return rgn.owner.regions[rgn.id]

  rgn = {
    id: /**{number}*/rgn.id,
    type: /**{number}*/rgn.type,
    owner: /**{cells}*/rgn.owner,
    cells: /**{cell[]}*/[]
  }

  // ensure unique id
  while (!rgn.id || rgn.owner.regions.hasOwnProperty(rgn.id)) {
    rgn.id = ~~(Math.random()*255)<<16|~~(Math.random()*255)<<8|~~(Math.random()*255)
  }

  rgn.owner.regions[rgn.id] = rgn

  return rgn

}



/**
 * Re-evaluate the {region}s of {cell}s in the given {region}.
 * @param {region} rgn
 */
region.reRegion = (rgn) => {
  
  let dict = {}
  let list = [rgn.id]

  dict[rgn.id] = null
  
  while (list.length) {

    rgn = rgn.owner.regions[list.pop()]

    if (!rgn) continue

    for (let i in rgn.cells) {

      let cll = rgn.cells[i]

      if (cll.regionExitNorth && cll.north.region && cells.canShareSameRegion(cll, cll.north)) {
        let id = cll.north.region.id
        if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id)}
      }
      if (cll.regionExitEast && cll.east.region && cells.canShareSameRegion(cll, cll.east)) {
        let id = cll.east.region.id
        if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id)}
      }
      if (cll.regionExitSouth && cll.south.region && cells.canShareSameRegion(cll, cll.south)) {
        let id = cll.south.region.id
        if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id)}
      }
      if (cll.regionExitWest && cll.west.region && cells.canShareSameRegion(cll, cll.west)) {
        let id = cll.west.region.id
        if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id)}
      }

    }

    region.destroy(rgn)

  }

  // find regions for unregioned cells
  if (rgn) region.allocateRegions(rgn.owner)

}


/**
 * Allocate {region}s to unregioned {cell}s in the given {cells}.
 * @param {cells} clls
 */
region.allocateRegions = (clls) => {

  clls.dirtyRegions = {}

  while (clls.unregionedCells.length) {

    // pop one cell off as a starting point
    let unregionedCells = [clls.unregionedCells.pop()]

    // will refer to current groups region when one needs creating
    let rgn = null

    // flood fill unregioned cells into this region that share the same region type until there are none left
    while (unregionedCells.length) {
   
      let cll = unregionedCells.pop()
 
      // skip cells that already have a region
      if (cll.region) continue

      // if we haven't already created a new region for this group; create it
      if (!rgn) rgn = region({owner: clls, type: cells.regionType(cll)})

      cll.region = rgn
      rgn.cells.push(cll)

      if (cll.north && !cll.north.region && cells.canShareSameRegion(cll, cll.north)) unregionedCells.push(cll.north)
      if (cll.east && !cll.east.region && cells.canShareSameRegion(cll, cll.east)) unregionedCells.push(cll.east)
      if (cll.south && !cll.south.region && cells.canShareSameRegion(cll, cll.south)) unregionedCells.push(cll.south)
      if (cll.west && !cll.west.region && cells.canShareSameRegion(cll, cll.west)) unregionedCells.push(cll.west)
  
    }

    // flag region as dirty
    if (rgn) clls.dirtyRegions[rgn.id] = null

  }

  // update dirty regions
  region.updateDirty(clls)
 
}


/**
 * Updates the regionExit* and regionBoundary properties of dirty {cell}s in the given {cells}.
 * @param {cells} clls
 */
region.updateDirty = (clls) => {

  let regionIds = Object.getOwnPropertyNames(clls.dirtyRegions)

  for (let i in regionIds) {

    let rgn = clls.regions[regionIds[i]]
    let cll

    for (let i in rgn.cells) {

      cll = rgn.cells[i]

      let isOpen = cells.isOpen(cll)

      cll.regionBoundary = false
      cll.regionExitNorth = false
      cll.regionExitEast = false
      cll.regionExitSouth = false
      cll.regionExitWest = false

      if (!cll.north || cll.north.region.id !== rgn.id ||
          !cll.east || cll.east.region.id !== rgn.id ||
          !cll.south || cll.south.region.id !== rgn.id ||
          !cll.west || cll.west.region.id !== rgn.id) {
        cll.regionBoundary = true
      }

      if (cll.regionBoundary) {

        // update exits; both outbound and inbound
        
        let neighbour = cll.north
        if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
          cll.regionExitNorth = true
          if (!isOpen) neighbour.regionExitSouth = false
        }

        neighbour = cll.east
        if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
          cll.regionExitEast = true
          if (!isOpen) neighbour.regionExitWest = false
        }

        neighbour = cll.south
        if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
          cll.regionExitSouth = true
          if (!isOpen) neighbour.regionExitNorth = false
        }

        neighbour = cell.west
        if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
          cll.regionExitWest = true
          if (!isOpen) neighbour.regionExitEast = false
        }

      }

    }

    region.reevaluateUpdateFrequency(rgn)

  }

}



/**
 * Re-evaulates the update frequence for the given {region}.
 * @param {region} rgn
 */
region.reevaluateUpdateFrequency = (rgn) => {

  stop('region_update_' + rgn.id)

  if (rgn.cells.length > 0) {

    let distance = ~~(vec3.distanceTo(global.view_centre, rgn.cells[0].position) / config.aperture)
    let update_ms = config.region_updates_ms + config.region_attenuation_ms * distance

    if (update_ms < my.fastest_region_update_ms) {
      my.fastest_region_update_ms = update_ms
    } else if (update_ms > my.slowest_region_update_ms) {
      my.slowest_region_update_ms = update_ms
    }

    repeat('region_update_' + rgn.id, update_ms, () => {region.update(rgn)})

  }

}



/**
 * Destroy the given {region} moving all contianed {cell}s their {cells} unregioned list.
 * @param {region} rgn
 */
region.destroy = (rgn) => {

  stop('region_update_' + rgn.id)

  while (rgn.cells.length) {

    let cll = rgn.cells.pop()

    cll.region = null
    cll.regionBoundary = null
    cll.regionExitNorth = null
    cll.regionExitEast = null
    cll.regionExitSouth = null
    cll.regionExitWest = null

    rgn.owner.unregionedCells.push(cll)

  }

  delete rgn.owner.regions[rgn.id]

}



/**
 * Merge the {cell}s of the src {region} into the dst {region} and flag dst as dirty.
 * @param {region} src
 * @param {region} dst
 */
region.merge = (src, dst) => {

  while (src.cells.length) {
    let cll = src.cells.pop()
    cll.region = dst
    dst.cells.push(cll)
  }

  delete src.owner.regions[src.id]
  dst.owner.dirtyRegions[dst.id] = null

}



/**
 * Updates a region.
 * The update frequency is determined by the regions distance from the view.
 * @param {region} rgn
 */
region.update = (rgn) => {

  for (let cll in rgn.cells) {
    cll = rgn.cells[cll]
    for (let ent in cll.entities) {
      entity.update(cll.entities[ent])
    }
  }

  region.reevaluateUpdateFrequency(rgn)

}



let global = val('global')
let my = val('cells')

my.fastest_region_update_ms = 9999999
my.slowest_region_update_ms = 0


export default cells

