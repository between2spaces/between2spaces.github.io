import './continuous'

/**
 * Creates a new {effect}.
 * @param {entity} eft
 * @return {effect}
 */
let effect = (eft) => {

  eft = eft || {}

  if (!my.creates.hasOwnProperty(eft.type)) return

  eft = {
    id: /**{number}*/null,
    type: /**{string}*/eft.type,
    entity: /**{entity}*/eft.entity,
    extras: /**{object}*/eft.extras,
    timestamp: /**{number}*/global.timestamp,
    destroyed: false
  }

  // if the create function doesn't want it created; than abort
  if (!my.creates[eft.type](eft)) return

  // ensure unique id
  while (!eft.id || my.effects.hasOwnProperty(eft.id)) {
    eft.id = ~~(Math.random()*16777216)
  }

  // add new effect to map
  my.effects[eft.id] = eft

  // add effect to entities own list of Effects applied to it
  eft.entity.effects.push(eft)

  return eft

}


effect.type = (type, create, update, destroy) => {
  my.creates[type] = create
  my.updates[type] = update
  my.destroys[type] = destroy
}


effect.update = (eft) => {
  my.updates[eft.type](eft)
  eft.timestamp = global.timestamp
}


effect.destroy = (eft) => {
  if (!my.effects.hasOwnProperty(eft.id)) return
  delete my.effects[eft.id]
  my.destroys[eft.type](eft) 
  let index = eft.entity.effects.indexOf(eft)
  if (index > -1) eft.entity.effects.splice(index, 1)
  eft.destroyed = true
}


let my = val('effect')
let global = val('global')

my.effects = my.effects || {}
my.creates = my.creates || {}
my.updates = my.updates || {}
my.destroys = my.destroys || {}


export default effect

