import entity from '../../entity'
import config from '../../config'

const TYPE = 'cell/blank'

entity.type(TYPE, (ent, fromString) => {
  // on entity create

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
