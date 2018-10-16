import './continuous'
import vec3 from './vec3'


/**
 * Creates a new {InputState}.
 *
 * @param {string} key
 * @return {InputState}
 */
let InputState = (key) => {
    return input[key] || {
        key: key,
        lastDown: /**{number}*/-1,
        lastUp: /**{number}*/-1,
    }
}


let input = {}


input.isDown = (inputstate) => {
    return inputstate.lastDown > inputstate.lastUp
}


input.wasDown = (inputstate, timestamps) => {

    // if inputstate is currently down return true straight away
    if (inputstate.lastDown > inputstate.lastUp) return true

    // warn if a timestamps object was not provided
    if (!timestamps) {
        console.warn('timestamps is required')
        console.trace()
        return false
    }

    // test if the inputstate has been down since the given timestamps last record of it
    if (typeof timestamps[inputstate.key] === 'undefined' || inputstate.lastDown > timestamps[inputstate.key]) {
        timestamps[inputstate.key] = global.timestamp
        return true
    }

    return false

}


input[' '] = InputState(' ')
input['!'] = InputState('!')
input['"'] = InputState('"')
input['#'] = InputState('#')
input['$'] = InputState('$')
input['%'] = InputState('%')
input['&'] = InputState('&')
input['\''] = InputState('\'')
input['('] = InputState('(')
input[')'] = InputState(')')
input['*'] = InputState('*')
input['+'] = InputState('+')
input[','] = InputState(',')
input['-'] = InputState('-')
input['.'] = InputState('.')
input['/'] = InputState('/')
input['0'] = InputState('0')
input['1'] = InputState('1')
input['2'] = InputState('2')
input['3'] = InputState('3')
input['4'] = InputState('4')
input['5'] = InputState('5')
input['6'] = InputState('6')
input['7'] = InputState('7')
input['8'] = InputState('8')
input['9'] = InputState('9')
input[':'] = InputState(':')
input[';'] = InputState(';')
input['<'] = InputState('<')
input['='] = InputState('=')
input['>'] = InputState('>')
input['?'] = InputState('?')
input['@'] = InputState('@')
input['A'] = InputState('A')
input['B'] = InputState('B')
input['C'] = InputState('C')
input['D'] = InputState('D')
input['E'] = InputState('E')
input['F'] = InputState('F')
input['G'] = InputState('G')
input['H'] = InputState('H')
input['I'] = InputState('I')
input['J'] = InputState('J')
input['K'] = InputState('K')
input['L'] = InputState('L')
input['M'] = InputState('M')
input['N'] = InputState('N')
input['O'] = InputState('O')
input['P'] = InputState('P')
input['Q'] = InputState('Q')
input['R'] = InputState('R')
input['S'] = InputState('S')
input['T'] = InputState('T')
input['U'] = InputState('U')
input['V'] = InputState('V')
input['W'] = InputState('W')
input['X'] = InputState('X')
input['Y'] = InputState('Y')
input['Z'] = InputState('Z')
input['['] = InputState('[')
input['\\'] = InputState('\\')
input[']'] = InputState(']')
input['^'] = InputState('^')
input['_'] = InputState('_')
input['`'] = InputState('`')
input['{'] = InputState('{')
input['|'] = InputState('|')
input['}'] = InputState('}')
input['~'] = InputState('~')

input.ENTER = input[String.fromCharCode(13)] = InputState(String.fromCharCode(13))
input.ESC = input[String.fromCharCode(27)] = InputState(String.fromCharCode(27))

input.MOUSE_LBUTTON = InputState('MOUSE_LBUTTON')
input.MOUSE_MBUTTON = InputState('MOUSE_MBUTTON')
input.MOUSE_RBUTTON = InputState('MOUSE_RBUTTON')
input.MOUSE_WHEEL = InputState('MOUSE_WHEEL')
input.MOUSE_OFFSET = vec3.zero()



let global = val('global')


listen(window, 'contextmenu', 100, (event) => { event.preventDefault() })


listen(window, 'mousedown', 100, (event) => {
    event.preventDefault()
    switch (event.button) {
    case 0:
        input.MOUSE_LBUTTON.lastDown = global.timestamp
    break
    case 1:
        input.MOUSE_MBUTTON.lastDown = global.timestamp
    break
    case 2:
        input.MOUSE_RBUTTON.lastDown = global.timestamp
    break
    default:
    break
    }
})


listen(window, 'mouseup', 100, (event) => {
    event.preventDefault()
    switch (event.button) {
    case 0:
        input.MOUSE_LBUTTON.lastUp = global.timestamp
    break
    case 1:
        input.MOUSE_MBUTTON.lastUp = global.timestamp
    break
    case 2:
        input.MOUSE_RBUTTON.lastUp = global.timestamp
    break
    default:
    break
    }
})


document.addEventListener('keydown', (event) => {
    let char = String.fromCharCode(event.which)
    input[char] = InputState(char)
    input[char].lastDown = global.timestamp
}, false)

document.addEventListener('keyup', (event) => {
    let char = String.fromCharCode(event.which)
    input[char] = InputState(char)
    input[char].lastUp = global.timestamp
})


listen(window, 'mousemove', 0, (event) => {
    input.MOUSE_OFFSET.x = event.pageX
    input.MOUSE_OFFSET.y = event.pageY
})


listen(window, 'mousewheel', 0, (event) => {
    if (typeof input.MOUSE_WHEEL.delta === 'undefined') input.MOUSE_WHEEL.delta = 0
    input.MOUSE_WHEEL.delta += Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)))
    input.MOUSE_WHEEL.lastDown = global.timestamp
})


export default input

