import './continuous'
import config from './config'
import rect3 from './rect3'

/* : green
 * : bbb
 * 
 */
let ui = {}


/**
 * A terminal UI
 */
ui.terminal = {}

/**
 * Writes a message to the terminal.
 * @param {string} message
 */
ui.terminal.print = (message) => {

  //TODO: Not timestamping message at the moment
  //let now = new Date
  //let hours = ('00' + now.getHours()).slice(-2)
  //let minutes = ('00' + now.getMinutes()).slice(-2)
  //let seconds = ('00' + now.getSeconds()).slice(-2)

  if (my.messagesBody.childNodes.length === my.messages_buffer_size) {
    my.messagesBody.removeChild(my.messagesBody.firstChild)
  }

  let scroll = my.messagesScroll.style
  scroll.overflowY = 'scroll'
 
  let td

  ui.E(my.messagesBody, 'tr', [
    //ui.E('td', {color: my.messages_prompt, verticalAlign: 'top' }, '>'),
    td = ui.E('td', {color: my.messages_fg }, message)
  ])

  td.scrollIntoView(false)

  scroll.overflowY = 'hidden'

  for (let regex in my.commands) {
    // match only works on string, '' + messages, ensures the value is a string
    let args = ('' + message).match(regex)
    if (args) {
      for (let listen in my.commands[regex]) {
        my.commands[regex][listen](args)
      }
    }
  }

}

/**
 * Say a message as if entered from the prompt.
 * @param {string} message
 */
ui.terminal.say = (message) => {
  
  ui.terminal.print('> ' + message)
  
}

 
/**
 * Focuses the terminal.
 */
ui.terminal.focus = () => {

  my.messagesScroll.style.overflowY = 'scroll'
  let terminal = my.terminalEl.style
  terminal.background = my.messages_bg_focused
  terminal.opacity = config.work_mode ? '0.2' : '1.0'
  my.sayEl.style.background = my.prompt_bg_focused
  my.sayEl.focus()

}


/**
 * Unfocuses the terminal.
 */
ui.terminal.blur = () => {

  my.messagesScroll.style.overflowY = 'hidden'
  let terminal = my.terminalEl.style
  terminal.overflowY = 'hidden'
  terminal.background = my.messages_bg_unfocused
  terminal.opacity = config.work_mode ? '0.1' : '0.5'
  my.sayEl.style.background = my.prompt_bg_unfocused
  my.sayEl.blur()

}



/**
 * Registers a command with the terminal.
 * @param {command} command
 */
ui.terminal.command = (command) => {

  let regex = command.regex

  if (!my.commands.hasOwnProperty(regex)) my.commands[regex] = {}
  my.commands[regex][command.context] = command.fn
  if (command.help) my.help[command.command] = command.help

}





/**
 * Updates the displayed cell information.
 * @param {cell} cll
 */
ui.cell = (cll) => {

  let info = '' 

  if (cll.collision) {
    let ent = cll.collision
    info = '&#128082; ' + (ent.name || ent.type)
    info += '<div style="font-size: 10pt">movement speed: ' + ent.movementSpeed + '</div>'
  } else {
    info = 'x ' + cll.position.x + ', ' + cll.position.y
  }

  my.cellEl.innerHTML = info

}


/**
 * Updates the displayed view information.
 * @param {rect3} view
 */
ui.view = (view) => {

  let width = rect3.width(view)
  let height = rect3.height(view)
  let centre = rect3.centre(view)
   
  my.view.innerText = '(' + centre.x + ',' + centre.y + ') ' + width + 'x' + height

}



/**
 * Makes an Element and attaches any of the optionally specified parent, style, children.
 *
 * @param {Element=} parent
 * @param {string=} name
 * @param {object=} style
 * @param {object=} children
 * @return {Element}
 */
ui.E = (parent, name, style, children) => {

  if (typeof parent === 'string') {
    children = style
    style = name
    name = parent
  }

  let element = document.createElement(name)

  if (style instanceof Array || style instanceof Element || typeof style === 'string') {
    children = style
  } else if (style) {
    for (let key in style) {
      element.style[key] = style[key]
    }
  }

  if (children) {
    if (!(children instanceof Array)) children = [children]
    for (let index = 0; index < children.length; ++index) {
      let child = children[index]
      let childType = typeof child
      if (childType === 'string' || childType === 'number') {
        element.appendChild(document.createTextNode(child))
      } else {
        element.appendChild(child)
      }
    }
  }

  if (parent instanceof Element) parent.appendChild(element)

  return element

}


let my = val('ui')

my.fontfamily = 'Helvetica,Arial,sans-serif'
my.messages_bg_unfocused = 'none'
my.messages_bg_focused = 'rgba(0, 0, 0, 0.1)'
my.prompt_bg_unfocused = 'none'
my.prompt_bg_focused = "#ccf"
my.messages_fg = '#333'
my.messages_prompt = '#ccc'
my.messages_buffer_size = 50
my.terminal_fontsize = '16pt'
my.terminal_width = '20em'

my.commands = my.commands || {}
my.help = my.help || {}


document.body.style.fontFamily = my.fontfamily
document.body.style.fontSize = my.terminal_fontsize
document.body.style.lineHeight = '0.9'


my.terminalEl = my.terminalEl || ui.E(document.body, 'div', [
    my.messagesScroll = my.messagesScroll || ui.E('div', ui.E('table', my.messagesBody = ui.E('tbody'))),
    my.sayEl = ui.E('input')
  ])

my.terminalEl.style.background = my.messages_bg_unfocused
my.terminalEl.style.color = my.messages_fg
my.terminalEl.style.opacity = config.work_mode ? '0.1' : '0.5'
my.terminalEl.style.position = 'absolute'
my.terminalEl.style.bottom = '0'
my.terminalEl.style.left = '0'
my.terminalEl.style.width = my.terminal_width
my.terminalEl.style.zIndex = '999'
my.terminalEl.style.padding = '5px'
 
my.messagesScroll.style.overflowY = 'hidden'
my.messagesScroll.style.minHeight = '1.6em'
my.messagesScroll.style.maxHeight = '20em'

my.sayEl.style.background = my.prompt_bg_unfocused
my.sayEl.style.width = '100%'
my.sayEl.style.border = '2px solid transparent'
my.sayEl.style.borderRadius = '3px'
my.sayEl.style.marginTop = '2px'
my.sayEl.style.outline = 'none'
my.sayEl.style.fontFamily = my.fontfamily
my.sayEl.style.fontSize = my.terminal_fontsize
my.sayEl.style.lineHeight = '0.9em'
my.sayEl.style.paddingLeft = '2px'

 
my.cellEl = my.cellEl || ui.E(document.body, 'div')

my.cellEl.style.background = my.messages_bg_unfocused
my.cellEl.style.color = my.messages_fg
my.cellEl.style.position = 'absolute'
my.cellEl.style.bottom = '0.8em'
my.cellEl.style.right = '0.8em'
my.cellEl.style.minHeight = '1.4em'
my.cellEl.style.maxHeight = '1.4em'
my.cellEl.style.textAlign = 'right'
my.cellEl.style.zIndex = '999'



// register the 'help' command
ui.terminal.command({context: 'ui', command: 'help', regex: '^>[ ]+(help|\\?)[ ]*', fn: (args) => {

  if (Object.getOwnPropertyNames(my.help).length === 0) {
    ui.terminal.print('no commands available.')
  }
  for (let command in my.help) {
    ui.terminal.print(command + my.help[command])
  }

}})


once('ui', () => {

  // once off event listener registration
  
  my.sayEl.addEventListener('mouseenter', ui.terminal.focus, false)
  my.terminalEl.addEventListener('mouseleave', ui.terminal.blur, false)

  // listen for ENTER press
  my.sayEl.addEventListener('keypress', (event) => {
    let keyCode = event.keyCode || event.which
    let say = my.sayEl.value
    if (keyCode === 13 && say && say !== '') {
      ui.terminal.print('> ' + say)
      my.sayEl.value = ''
    }
  }, false)

  // listen for ESC up
  my.sayEl.addEventListener('keyup', (event) => {
    let keyCode = event.keyCode || event.which
    if (keyCode === 27) {
      my.sayEl.value = ''
      ui.terminal.blur()
    }
  }, false)  

})


export default ui

