import Vec3 from './vec3'

let Entity = (/**{Entity}*/entity) => {
  let copy = entity
  let entity = {
    offset: /**{Vec3}*/(!copy) ? Vec3(copy.offset) : Vec3()
  }
  return entity
}

export default Entity
