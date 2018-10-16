import './continuous'
import vec3 from './vec3'
import cells from './cells'
import effect from './effect'
import config from './config'
import display from './display'


/**
 * Returns a new {entity}.
 * @param {entity=} ent
 * @return {entity}
 */
let entity = (ent) => {

  ent = ent || {}

  let fromString = ent.fromString

  if (fromString) {
    fromString = fromString.split('"')
    ent.type = fromString[0]
    ent.offset = vec3.fromString(fromString[1])
    ent.size = vec3.fromString(fromString[2])
    ent.baseMovementSpeed = parseFloat(fromString[3])
  }
 
  if (!my.creates.hasOwnProperty(ent.type)) {
    console.warn(ent.type + ' is not a known type of entity')
    return
  }

  ent = {

    id: /**{number}*/null,

    type: /**{string}*/ent.type,

    // the {cell} this ent is anchored to
    cell: /**{cell}*/ent.cell,

    // offset is the position of the entities relative to its cells centre 
    // distances greater than 0.5 will move the ent to the appropriate neighbour
    offset: /**{vec3}*/vec3(ent.offset),

    rotation: /**{number}*/0,

    // size relative to the size of a cell. i.e. 1.0, 1.0 matches the dimensions of one whole cell
    size: /**{vec3}*/ent.size ? vec3(ent.size) : vec3.unit(),

    // anchor is centre of entities image relative to the offset. i.e. 0.0, 0.0 is centre
    anchor: /**{vec3}*/vec3(ent.anchor),

    // collide is the dimensions of the entities collision space. i.e. 0.5, 0.5 is half width, half height
    // collide can be null for not collidable
    collide: /**{vec3=}*/ent.collide ? vec3(ent.collide) : null,

    collisionArea: /**{cell[]}*/[],
 
    image: /**{string}*/'/data/sprite/' + ent.type + '.png',

    baseMovementSpeed: /**{number}*/ent.baseMovementSpeed || 0,
    movementSpeedModifiers: /**[function]*/[],
    movementSpeed: /**{number}*/ent.baseMovementSpeed || 0,

    effects: /**{effect[]}*/[]

  }

  // if the create function doesn't want it created; than abort
  if (!my.creates[ent.type](ent, fromString)) return

  // ensure unique id
  while (!ent.id || my.entities.hasOwnProperty(ent.id)) {
    ent.id = ~~(Math.random()*16777216)
  }

  // add new entity to map
  my.entities[ent.id] = ent
 
  // add entity to cells 
  if (ent.cell && !cells.addEntity(ent.cell.owner, ent, ent.cell)) {
    console.warn(ent.type + ' was not added to cell due to collision')
  }

  return ent

}


/**
 * Registers a type of entity.
 * @param {string} type
 * @param {functon} create function
 * @param {function} toString function
 * @param {function} update function
 * @param {function} destroy function
 */
entity.type = (type, create, toString, update, destroy) => {

  my.creates[type] = create
  my.toStrings[type] = toString
  my.updates[type] = update
  my.destroys[type] = destroy

  display.register('/data/sprite/' + type + '.png')

}


/**
 * Returns a string representation of the given entity.
 * @param {entity} ent
 * @return {string}
 */
entity.toString = (ent) => {

  return my.toStrings[ent.type](ent, [
    ent.type,
    vec3.toString(ent.offset),
    vec3.toString(ent.size),
    ~~(ent.baseMovementSpeed)
  ].join('"'))

}


/**
 * Returns a new entity constructed from the given string description and added to the {cell} if provided.
 * @param {string} str
 * @param {cell} cll
 * @return {entity}
 */
entity.fromString = (str, cll) => {
  return entity({fromString: str, cell: cll})
}


/**
 * Updates the given entities state.
 * @param {entity} ent
 */
entity.update = (ent) => {

  for (let eft in ent.effects) {
    effect.update(ent.effects[eft])
  }

  my.updates[ent.type](ent)

}


/**
 * Destroys the given entity.
 * @param {entity} ent
 */
entity.destroy = (ent) => {

  if (!my.entities.hasOwnProperty(ent.id)) {
    console.warn(ent.id + ' is not a known entity')
    return
  }

  delete my.entities[ent.id]
  my.destroys[ent.type](ent) 
  cells.removeEntity(ent)
  ent.destroyed = true

}


/**
 * Destroy all entities.
 */
entity.destroyAll = () => {
  let entityIds = Object.getOwnPropertyNames(my.entities)
  while (entityIds.length) {
    entity.destroy(my.entities[entityIds.pop()])
  }
}


 
let my = val('ent')

my.entities = my.entities || {}
my.creates = my.creates || {}
my.toStrings = my.toStrings || {}
my.updates = my.updates || {}
my.destroys = my.destroys || {}



export default entity

