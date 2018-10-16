import app from '../app/app'
import Entity from '../app/entity'
import Vec3 from '../app/vec3'
import editor from '../editor'

import '../properties'

Entity.type('PERSON', (entity, fromString) => {

  // Entity create
  
  entity.image = '/soba/builds/0.1.0/models/troubadour/sprite.png'
  entity.anchor.x = 0.1
  entity.anchor.y = -0.32
  entity.collide = Vec3({x: 0.7, y: 0.2})

  if (fromString) {

    entity.name = fromString[4]

  } else {

    let height = 1 * app.global.AVERAGE_HEIGHT_OF_AN_ADULT

    entity.size.x = 0.66 * height 
    entity.size.y = height

    entity.baseMovementSpeed = 10 

  }

  return entity

}, (entity, toString) => {

  // Entity toString
  
  return [
    toString,
    entity.name
  ].join('"')

}, (entity) => {

  // Entity update 
 
}, (entity) => {
  
  // Entity destroy
  
})

