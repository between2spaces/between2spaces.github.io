import * as display from '../display.js'
import * as materials from '../materials.js'
import * as object from '../object.js'
import { Mesh } from '../threejs/objects/Mesh.js'
import { BoxGeometry } from '../threejs/geometries/BoxGeometry.js'


export function Cell() {

    let cell = object.Object()

    cell.update = update

    object.addMesh( cell, new Mesh( new BoxGeometry( 1, 0.1, 1 ), materials.GRASS ) )

    //display.scene.add( cell.object )

    return cell

}


/**
 * Cell's update task.
 * @param {Cell} cell 
 */
function update( cell ) {

}
