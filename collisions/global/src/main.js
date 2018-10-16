import * as display from './display.js'
import * as world from './world.js'
import * as object from './object.js'
import { Vector3 } from './threejs/math/Vector3.js'
import { Person } from './objects/person.js'

let person = Person()
world.add( person )

object.move( person, object.position( world.cell( -5, -5 ) ) )

