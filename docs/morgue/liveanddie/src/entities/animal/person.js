import entity from '../../entity'
import config from '../../config'
import vec3 from '../../vec3'

const TYPE = 'animal/person'

entity.type(TYPE, (ent, fromString) => {
  // on entity create
  
  ent.anchor.x = 0.1
  ent.anchor.y = -0.32
  ent.collide = vec3({x: 0.7, y: 0.2})

  if (fromString) {

    ent.name = fromString[4]

  } else {

    ent.size.x = 0.66 * config.avg_adult_height
    ent.size.y = config.avg_adult_height

    ent.movementSpeed = ent.baseMovementSpeed = 2

  } 

  return ent

}, (ent, toString) => {
  // on entity toString
  
  return [
    toString,
    ent.name
  ].join('"')


}, (ent) => {
  // on entity update 
 
}, (ent) => {
  // on entity destroy

})


export default (ent) => {
  // create helper 
  
  ent = ent || {} 
  ent.type = TYPE
  ent.name = ent.name || 'unnamed'
  return entity(ent)

}
