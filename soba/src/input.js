import app from './app'
import Vec3 from './vec3'


/**@struct*/
let InputState = () => {
	return {
		lastDown: /**{number}*/-1,
		lastUp: /**{number}*/-1
	}
}


let input = {}

input.isDown = (inputstate) => {
	return inputstate.lastDown > inputstate.lastUp
}

input.wasDown = (inputstate, timestamp) => {
	if (typeof timestamp === 'undefined') return true
	return inputstate.lastDown > inputstate.lastUp || inputstate.lastDown > timestamp
}


input[' '] = input[' '] || InputState()
input['!'] = input['!'] || InputState()
input['"'] = input['"'] || InputState()
input['#'] = input['#'] || InputState()
input['$'] = input['$'] || InputState()
input['%'] = input['%'] || InputState()
input['&'] = input['&'] || InputState()
input["'"] = input["'"] || InputState()
input['('] = input['('] || InputState()
input[')'] = input[')'] || InputState()
input['*'] = input['*'] || InputState()
input['+'] = input['+'] || InputState()
input[','] = input[','] || InputState()
input['-'] = input['-'] || InputState()
input['.'] = input['.'] || InputState()
input['/'] = input['/'] || InputState()
input['0'] = input['0'] || InputState()
input['1'] = input['1'] || InputState()
input['2'] = input['2'] || InputState()
input['3'] = input['3'] || InputState()
input['4'] = input['4'] || InputState()
input['5'] = input['5'] || InputState()
input['6'] = input['6'] || InputState()
input['7'] = input['7'] || InputState()
input['8'] = input['8'] || InputState()
input['9'] = input['9'] || InputState()
input[':'] = input[':'] || InputState()
input[';'] = input[';'] || InputState()
input['<'] = input['<'] || InputState()
input['='] = input['='] || InputState()
input['>'] = input['>'] || InputState()
input['?'] = input['?'] || InputState()
input['@'] = input['@'] || InputState()
input['A'] = input['A'] || InputState()
input['B'] = input['B'] || InputState()
input['C'] = input['C'] || InputState()
input['D'] = input['D'] || InputState()
input['E'] = input['E'] || InputState()
input['F'] = input['F'] || InputState()
input['G'] = input['G'] || InputState()
input['H'] = input['H'] || InputState()
input['I'] = input['I'] || InputState()
input['J'] = input['J'] || InputState()
input['K'] = input['K'] || InputState()
input['L'] = input['L'] || InputState()
input['M'] = input['M'] || InputState()
input['N'] = input['N'] || InputState()
input['O'] = input['O'] || InputState()
input['P'] = input['P'] || InputState()
input['Q'] = input['Q'] || InputState()
input['R'] = input['R'] || InputState()
input['S'] = input['S'] || InputState()
input['T'] = input['T'] || InputState()
input['U'] = input['U'] || InputState()
input['V'] = input['V'] || InputState()
input['W'] = input['W'] || InputState()
input['X'] = input['X'] || InputState()
input['Y'] = input['Y'] || InputState()
input['Z'] = input['Z'] || InputState()
input['['] = input['['] || InputState()
input['\\'] = input['\\'] || InputState()
input[']'] = input[']'] || InputState()
input['^'] = input['^'] || InputState()
input['_'] = input['_'] || InputState()
input['`'] = input['`'] || InputState()
input['{'] = input['{'] || InputState()
input['|'] = input['|'] || InputState()
input['}'] = input['}'] || InputState()
input['~'] = input['~'] || InputState()

input.MOUSE_LBUTTON = input.MOUSE_LBUTTON || InputState()
input.MOUSE_MBUTTON = input.MOUSE_MBUTTON || InputState()
input.MOUSE_RBUTTON = input.MOUSE_RBUTTON || InputState()

input.MOUSE_OFFSET = Vec3()


app.listen('contextmenu', 100, (event) => { event.preventDefault() })


app.task('input', (global) => {

	app.listen('mousedown', 100, (event) => {
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

	app.listen('mouseup', 100, (event) => {
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

	app.listen('keydown', 0, (event) => {
		let char = String.fromCharCode(event.which)
		input[char] = input[char] || InputState()
		input[char].lastDown = global.timestamp
	})

	app.listen('keyup', 0, (event) => {
		let char = String.fromCharCode(event.which)
		input[char] = input[char] || InputState()
		input[char].lastUp = global.timestamp
	})

	app.listen('mousemove', 0, (event) => {
		input.MOUSE_OFFSET.x = (event.pageX / innerWidth) - 0.5
		input.MOUSE_OFFSET.y = (event.pageY / innerHeight) - 0.5
	})
})

export default input
