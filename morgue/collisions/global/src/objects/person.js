import * as materials from '../materials.js'
import * as object from '../object.js'
import { Mesh } from '../threejs/objects/Mesh.js'
import { SphereGeometry } from '../threejs/geometries/SphereGeometry.js'
import { CylinderGeometry } from '../threejs/geometries/CylinderGeometry.js'


export function Person() {

    let person = object.Object()
    
    person.speed = 0.001

    object.addMesh( person, new Mesh( new SphereGeometry( 0.15 ), materials.SKIN ) ).position.y = 1.6
    object.addMesh( person, new Mesh( new CylinderGeometry( 0.24, 0.03, 1.35 ), materials.SKIN ) ).position.y = 0.8

    return person

}
