import app from './app/app'
import ui from './app/ui'
import Cells from './app/cells'
import Entity from './app/entity'
import Vec3 from './app/vec3'
import Rect3 from './app/rect3'


let scene = {}


// terminal commands

// save <name>
ui.terminal.command({context: 'scene', command: 'save', regex: '^>[ ]+save[ ]+([A-Za-z0-9 ]+)[ ]*', help: ' <name> - saves scene', fn: (args) => {

  let name = args[1] 
  scene.saveScene(name)

}})


// list
ui.terminal.command({context: 'scene', command: 'list', regex: '^>[ ]+list[ ]*', help: ' - list saved scenes', fn: (args) => {
  scene.listSaved()
}})


// load <name>
ui.terminal.command({context: 'scene', command: 'load', regex: '^>[ ]+load[ ]+([A-Za-z0-9 ]+)[ ]*', help: ' <name> - load a saved scene', fn: (args) => {

  let name = args[1] 
  scene.loadScene(name)

}})


// new
ui.terminal.command({context: 'scene', command: 'new', regex: '^>[ ]+new[ ]*', help: ' - starts a new scene', fn: (args) => {

  scene.newScene()

}})


// delete <name>
ui.terminal.command({context: 'scene', command: 'delete', regex: '^>[ ]+delete[ ]+([A-Za-z0-9 ]+)[ ]*', help: ' <name> - delete a saved scene', fn: (args) => {

  let name = args[1] 
  scene.deleteScene(name)

}})


// dump <name>
ui.terminal.command({context: 'scene', command: 'dump', regex: '^>[ ]+dump[ ]+([A-Za-z0-9 ]+)[ ]*', help: ' <name> - dump a saved scene to console', fn: (args) => {

  let name = args[1] 
  let read = app.read('scene_' + name) 

  if (!read || read === '') {
    ui.terminal.print('no scene named "' + name + '"')
    return
  }

  console.log(read)

}})




/**
 * Saves the current scene to the scene store as the specified name.
 *
 * The scene format is a line per occupied cell starting with the cell coordinates followed by zero or more entity descriptors.
 * ie.
 * <cell.x>,<cell.y>(|<entity.type>"<offset.x>,<offset.y>"<size.x>,<size.y>"<baseMovementSpeed>("<property>)*)*
 * eg.
 * 500,500|TREE"0"19.8,30"0
 * 489,511|PERSON"0,0"3.96,6"10"YOU
 */
scene.saveScene = (name) => {

  let cells = []

  for (let y = 0; y < app.global.CELLS; ++y) {
    for (let x = 0; x < app.global.CELLS; ++x) {
      let cell = Cells.getCell(mainmem.cells, x, y)
      if (cell.entities.length) {
        let entities = [x +',' + y]
        for (let entity in cell.entities) {
          entity = cell.entities[entity]
          entities.push(Entity.toString(entity))
        }
        cells.push(entities.join('|'))
      }
    }
  }

  store.scenes[name] = cells.join('\n')
  store.lastsave = name

  document.title = name

}


scene.listSaved = () => {
  let names = Object.getOwnPropertyNames(store.scenes)
  for (let name in names) {
    ui.terminal.print(names[name])
  }
}


scene.loadScene = (name) => {

  let scene = app.read('scene_' + name) 

  if (!scene || scene === '') {
    ui.terminal.print('no scene named "' + name + '"')
    return
  }

  let cells = scene.split('\n')

  Entity.destroyAll()

  Cells.cleanDirtyPathInfo(mainmem.cells)

  for (let cell in cells) {
    cell = cells[cell]
    let entities = cell.split('|')
    let cellCoords = Vec3.fromString(entities.splice(0, 1)[0])
    cell = Cells.getCell(mainmem.cells, ~~cellCoords.x, ~~cellCoords.y)
    if (!cell) continue
    for (let entity in entities) {
      entity = Entity.fromString(entities[entity], cell)
      if (entity.name === 'YOU') mainmem.hero = entity
    }
  }

  document.title = name

}


scene.newScene = (name) => {

  Entity.destroyAll()

  Cells.cleanDirtyPathInfo(mainmem.cells)

  let centre = Rect3.centre(mainmem.view)

  mainmem.hero = Entity({type: 'PERSON', cell: Cells.getCell(mainmem.cells, ~~centre.x, ~~centre.y)})
  mainmem.hero.name = 'YOU'

  document.title = 'New scene'

}


scene.deleteScene = (name) => {

  if (store.lastsave === name) {
    delete store.lastsave
  }

  if (!store.scenes.hasOwnProperty(name)) {
    ui.terminal.print('no scene named "' + name + '"')
    return
  }

  delete store.scenes[name]

}


scene.lastSave = () => {
  return store.lastsave
}


let mem = app.mem('scene')
let mainmem = app.mem('main')
let store = app.store('scene')

const DEFAULT_SCENE_NAME = 'Default scene'


if (!mem.initialised) {

  mem.initialised = true

  store.scenes = {}
   
  store.scenes[DEFAULT_SCENE_NAME] = [
      '500,500|TREE"0"19.8,30"0',
      '480,520|PERSON"0,0"3.96,6"10"YOU'
    ].join('\n')

  store.lastsave = store.lastsave || DEFAULT_SCENE_NAME

}


export default scene

