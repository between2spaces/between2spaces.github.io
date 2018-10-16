import '../continuous'
import effect from '../effect'
import vec3 from '../vec3'
import cells from '../cells'
import path from '../path'


const TYPE = 'movefindpath'


effect.type(TYPE, (eft) => {
  // on effect create

  // cancel creation if a destination wasn't given in extras
  if (!eft.extras.hasOwnProperty('destination')) return

  // remove an existing 'movefindpath' eft from the entity
  for (let i in eft.entity.effects) {
    if (eft.entity.effects[i].type === TYPE) {
      effect.destroy(eft.entity.effects[i])
      break
    }
  }

  eft.extras.path = path(eft.entity, eft.extras['destination'])

  return eft

}, (eft) => {
  // on effect update

  if (eft.extras.path.length === 0) {
    effect.destroy(eft)
    return
  }

  let absolutePosition = vec3.addVectors(eft.entity.cell.position, eft.entity.offset)
  let offsetDelta = vec3.subtractVectors(eft.extras.path[0].position, absolutePosition)
  let length = vec3.len(offsetDelta)
  let s = (global.timestamp - eft.timestamp) * 0.001
  let traveled = s * eft.entity.movementSpeed

  if (traveled < length) {
    vec3.multiplyScalar(offsetDelta, traveled / length) 
  } else {
    eft.extras.path.splice(0, 1)
  }

  let collision = cells.moveEntity(eft.entity, offsetDelta)

  if (collision) {
    eft.entity.offset.x = eft.entity.offset.y = 0
    // reCalculate path around collision
    eft.extras.path = path(eft.entity, eft.extras['destination'])
  }

}, (eft) => {
  // on effect destroyed  
  
})


let global = val('global')


export default (eft) => {
  // create helper 
  
  eft = eft || {} 
  eft.type = TYPE
  eft.extras = eft.extras || {}
  eft.extras['destination'] = eft['destination']
  return effect(eft)

}

