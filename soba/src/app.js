let app = {}


let volatile = window.volatile = window.volatile || {}

volatile.memory = volatile.memory || {}

let memory = volatile.memory.app = volatile.memory.app || {}
let intervalIDs = volatile.intervalIDs = volatile.intervalIDs || {}
let input = volatile.input = volatile.input || {}
let global = memory.global = memory.global || {}


global.DEBUG = false
global.timestamp = global.timestamp || 0


app.debug = (
	/*{string}*/msg
) => {
	global.DEBUG && console.log(msg)
}


app.server = (
	/*{string}*/url,
	/*{boolean}*/json/*=true*/
) => {
	json = typeof json === 'undefined' ? true : json;

	return new Promise((resolve, reject) => {

		const xhr = new XMLHttpRequest()
		xhr.open('GET', url, true)
		xhr.addEventListener('load', () => {

			(xhr.status >= 200 || xhr.status < 300) || reject(xhr)
			xhr.responseText && resolve(json ? JSON.parse(xhr.responseText) : xhr.responseText)

		})

		xhr.addEventListener('abort', () => reject(xhr));
		xhr.addEventListener('error', () => reject(xhr));
		xhr.addEventListener('timeout', () => reject(xhr));

    	xhr.send()

	})
}


app.read = (
	/*{string}*/key
) => {
	let value = localStorage.getItem(key)
	return value ? JSON.parse(value) : value
}


app.write = (
	/*{string}*/key,
	/*{any}*/value
) => {
	return localStorage.setItem(key, JSON.stringify(value))
}


let storage = app.read('storage') || {}


app.task = (
	/**{string}*/id/*=undefined*/,
	/**{string}*/context/*=undefined*/,
	/**{number}*/delay/*=-1*/,
	/**{function}*/handler
) => {

	if (typeof id === 'number') {
		handler = context
		delay = id
		id = undefined
		context = undefined
	} else if (typeof context === 'number') {
		handler = delay
		delay = context
		context = undefined
	} else if (typeof id === 'function') {
		handler = id
		id = undefined
		context = undefined
	} else if (typeof context === 'function') {
		handler = context
		context = undefined
	}

	typeof delay === 'function' && (handler = delay)
	typeof delay !== 'number' && (delay = -1)
	typeof id === 'string' && intervalIDs[id] && clearInterval(intervalIDs[id])

	if (typeof handler !== 'function') return

	let _memory = {}
	let _storage = {}

	if (typeof context === 'string') {
		_memory = volatile.memory[context] = volatile.memory[context] || {}
	  _storage = storage[context] = storage[context] || {}
	}

	handler(global, _memory, _storage)

	if (delay === -1) return

  let intervalId = setInterval(() => { handler(global, _memory, _storage) }, delay)

	typeof id !== 'undefined' && (intervalIDs[id] = intervalId)

}


app.listen = (
	/**{string}*/type,
	/**{number}*/delay,
	/**{function}*/handler
) => {
	(function (t) {

		addEventListener(type, (event) => {

			if (!t) {
				handler(event)
				t = setTimeout(() => { t = null }, delay)
			}

		}, false)

	}())
}


if (location.hostname === 'localhost') {
	global.DEBUG = true
	app.task('liveupdate', 1000, () => {
		app.server('/liveupdate').then(res => {
			res.forEach( file => {
				let script = document.createElement('script')
				script.src = file
				let exists = document.evaluate('//script[@src="' + file + '"]', document, null, XPathResult.ANY_TYPE, null).iterateNext()

				if (exists) {
					var parent = exists.parentNode
					parent.removeChild(exists)
					parent.appendChild(script)
					app.debug('liveupdate replaced ' + file)
				}
			})
		})
	})
}


app.listen('beforeunload', 100, () => { app.write('storage', storage) })


let lastframe = 0


;(function run (timestamp) {
	requestAnimationFrame(run)
	global.timestamp += (timestamp - lastframe)
	lastframe = timestamp
}(0))


export default app
