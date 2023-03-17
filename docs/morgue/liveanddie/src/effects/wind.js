import app from '../app/app'
import Effect from '../app/effect'
import Vec3 from '../app/vec3'
import math from '../app/math'


const TYPE = 'wind'


Effect.type(TYPE, (effect) => {

  // on Effect create

  // remove an existing 'wind' effect from the entity
  for (let i in effect.entity.effects) {
    if (effect.entity.effects[i].type === TYPE) {
      Effect.destroy(effect.entity.effects[i])
      break
    }
  }

  effect.extras = effect.extras || {}

  return effect

}, (effect) => {

  // on Effect update
  let p = effect.entity.cell.position
  let windyness = 0.0001
  let t = app.global.timestamp * windyness
  let s = 0.1
  let a = math.noise(t + p.x * s, t + p.y * s) 
  if (a < 0) a = 0
  effect.entity.rotation = (a - 0.5) * 0.1

}, (effect) => {

  // on Effect destroyed  
  
})

