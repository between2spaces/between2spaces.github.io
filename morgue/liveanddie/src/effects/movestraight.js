import app from '../app/app'
import Effect from '../app/effect'
import Vec3 from '../app/vec3'
import Cells from '../app/cells'


const TYPE = 'movestraight'


Effect.type(TYPE, (effect) => {

  // on Effect create
  
  // cancel creation if a destination wasn't given in extras
  if (!effect.extras.hasOwnProperty('destination')) return

  // remove an existing 'movefindpath' effect from the entity
  for (let i in effect.entity.effects) {
    if (effect.entity.effects[i].type === TYPE) {
      Effect.destroy(effect.entity.effects[i])
      break
    }
  }

  return effect

}, (effect) => {

  // on Effect update
  
  let absolutePosition = Vec3.addVectors(effect.entity.cell.position, effect.entity.offset)
  let offsetDelta = Vec3.subtractVectors(effect.extras['destination'].position, absolutePosition)
  let length = Vec3.len(offsetDelta)
  let s = (app.global.timestamp - effect.timestamp) * 0.001
  let traveled = s * effect.entity.movementSpeed

  if (traveled < length) {
    Vec3.multiplyScalar(offsetDelta, traveled / length) 
  } else {
    Effect.destroy(effect)
  }

  let collision = Cells.moveEntity(effect.entity, offsetDelta)

  if (collision) {
    console.log('collided with ' + collision.id)
    Effect.destroy(effect)
  }

}, (effect) => {

  // on Effect destroyed  
  
})

