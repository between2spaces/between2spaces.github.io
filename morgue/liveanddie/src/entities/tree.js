import app from '../app/app'
import Entity from '../app/entity'
import Vec3 from '../app/vec3'

import '../properties'

Entity.type('TREE', (entity, fromString) => {

  // on Entity create

  entity.image = Math.random() > 0.5 ? '/soba/builds/0.7.0/models/tree/sprite.png' : '/soba/builds/0.7.0/models/tree2/sprite.png'
  entity.anchor.x = 0.01
  entity.anchor.y = -0.45
  entity.collide = Vec3({x: 0.23, y: 0.1})

  let height = 3 * app.global.AVERAGE_HEIGHT_OF_AN_ADULT

  entity.size.x = height 
  entity.size.y = height
  entity.baseMovementSpeed = 0

  return entity

}, (entity, toString) => {

  // Entity toString
  return [
    toString
  ].join('"')

}, (entity) => {

  // Entity update 
 
}, (entity) => {

  // on Entity destroy

})

