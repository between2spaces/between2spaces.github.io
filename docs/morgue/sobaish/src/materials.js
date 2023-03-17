import * as world from './world.js'
import { MeshLambertMaterial } from './threejs/materials/MeshLambertMaterial.js.js'
import { Color } from './threejs/math/Color.js.js'

export const CURSOR = new MeshLambertMaterial( { color: new Color( 0x32cd32 ), transparent: true, opacity: 0.5 } )
export const SKIN = new MeshLambertMaterial( { color: new Color( 0xffcd94 ) } )
export const GRASS = new MeshLambertMaterial( { color: new Color( 0xffffff ) } )
export const WOOD = new MeshLambertMaterial( { color: new Color( 0x966F33 ) } )
export const METAL = new MeshLambertMaterial( { color: new Color( 0xbcc6cc ) } )
