import entity from '../../entity'
import config from '../../config'

const TYPE = 'flora/grass'

entity.type(TYPE, (ent, fromString) => {
  // on entity create
  
  ent.anchor.x = 0.01
  ent.anchor.y = -0.45

  let size = 0.2 + 0.4 * config.avg_adult_height
  ent.size.x = size
  ent.size.y = size

  return ent

}, (ent, toString) => {
  // on entity toString
  
  return toString

}, (ent) => {
  // on entity update 
 
}, (ent) => {
  // on entity destroy

})


export default (ent) => {
  // create helper 
  
  ent = ent || {} 
  ent.type = TYPE
  return entity(ent)

}

