import './continuous'
import vec3 from './vec3'

/*global PIXI*/

let display = {}


display.width = window.innerWidth + 1
display.height = window.innerHeight + 1



/**
 * Registers an image for use as a sprite.
 * @param {string} image
 */
display.register = (image) => {

  if (!my.spritesBin.hasOwnProperty(image)) {
    my.spritesBin[image] = []
  }

  if (!my.spritesUsed.hasOwnProperty(image)) {
    my.spritesUsed[image] = []
  }

  my.nextSprite[image] = my.nextSprite[image] || 0

}



/**
 * Allocates a sprite to be displayed on the next display.update()
 * @param {entity} ent
 * @param {vec3} position
 * @param {number} opacity
 * @param {number} tint
 */ 
display.sprite = (ent, position, opacity, tint) => {

  let sprite
  let spritesUsed = my.spritesUsed[ent.image]
  let spriteIndex = my.nextSprite[ent.image]

  if (spriteIndex < spritesUsed.length) {
    sprite = spritesUsed[spriteIndex]
    ++my.nextSprite[ent.image]
  } else {
    if (my.spritesBin[ent.image].length) {
      sprite = my.spritesBin[ent.image].pop()
    } else {
      sprite = PIXI['Sprite']['fromImage'](ent.image)
      sprite.anchor.x = 0.5
      sprite.anchor.y = 0.5 
    }
    spritesUsed.push(sprite)
    ++my.nextSprite[ent.image]
    my.root['addChild'](sprite)
  }

  let size = vec3.multiplyVectors(global.pixels_per_cell, ent.size)

  sprite.width = size.x
  sprite.height = size.y

  let pos = vec3.multiply(vec3.addVectors(ent.offset, vec3.multiplyVectors(ent.anchor, ent.size)), global.pixels_per_cell)
  vec3.add(pos, position)

  sprite.position.x = pos.x
  sprite.position.y = pos.y

  if (typeof tint !== 'undefined') sprite['tint'] = tint
  if (typeof opacity !== 'undefined') sprite.alpha = opacity

}


/**
 * Updates all on-screen {display}s.
 */
display.update = () => {

  for (let image in my.spritesUsed) {

    let spritesBin = my.spritesBin[image]
    let spritesUsed = my.spritesUsed[image]
    let spriteIndex = my.nextSprite[image]

    while (spriteIndex < spritesUsed.length) {
      let sprite = spritesUsed.pop()
      my.root['removeChild'](sprite)
      spritesBin.push(sprite)
    }

    my.nextSprite[image] = 0

  }

  my.renderer['render'](my.root)

}



PIXI['SCALE_MODES']['DEFAULT'] = PIXI['SCALE_MODES']['NEAREST']
PIXI['utils']['_saidHello'] = true

let global = val('global')
let my = val('display')


my.renderer = my.renderer || new PIXI['WebGLRenderer'](display.width, display.height, {'transparent': true})
my.root = my.root || new PIXI['Sprite']()
my.spritesBin = my.spritesBin || {}
my.spritesUsed = my.spritesUsed ||  {}
my.nextSprite = my.nextSprite || {}


once('display', () => {

  let body = document.body.style
  body.overflow = 'hidden'
  body.margin = body.padding = '0'

  let renderer = my.renderer['view'].style
  renderer.position = 'absolute'
  renderer.width = '100%'
  renderer.height = '100%'
  document.body.appendChild(my.renderer['view'])

  listen(window, 'resize', 100, () => {
    my.renderer.resize(Math.max(0, window.innerWidth) + 1, Math.max(0, window.innerHeight) + 1)
  })

})


export default display

