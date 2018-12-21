import Entity from './entity'
import Vec3 from './vec3'

/*global PIXI*/

var game = (function (game) {
	
	PIXI.utils._saidHello = true;
	PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;
	
	game.RESOLUTION_WIDTH = 800;
	game.RESOLUTION_HEIGHT = ~~(game.RESOLUTION_WIDTH / (innerWidth / innerHeight)); 
	game.PIXELS_PER_METRE = game.RESOLUTION_WIDTH / 20;
	game.VERTICAL_PARRALAX = 0.01;
	game.BEFORE_STARTTIME = -99999;
	
	
	game.debug = function (msg) {
		var now = new Date();
		console.log('[' + ('00' + now.getHours()).slice(-2) + ':' + ('00' + now.getMinutes()).slice(-2) + ':' + ('00' + now.getSeconds()).slice(-2) + '] ' + msg);
	};

	
	
	/**
	 * game.update
	 * @param {function} event
	 */
	game.update = function (purpose, event) {
		
		var events = internal.events;
		var index = events.length - 1;
		
		if (typeof purpose === 'function') {
			
			event = purpose;
			purpose = undefined;
			
		}
		
		event.purpose = purpose;
		
		if (typeof event.timestamp === 'undefined') {
			
			event.timestamp = game.timestamp;
			
		}
		
		if (typeof event.purpose !== 'undefined') {
			
			while (index > -1) {
				if (events[index].purpose === event.purpose) {
					internal.events.splice(index, 1, event);
					return;
				}
				--index;
			}
			
			index = events.length - 1;
			
		}
		
		while (index > -1 && events[index].timestamp < event.timestamp) --index;
		events.splice(index + 1, 0, event);
		
	};
	
	
	
	
	/**
	 * @struct game.InputState
	 * @param {game.InputState} obj
	 * @return {game.InputState}
	 */
	game.InputState = function (obj) {
	
		return {
			lastDown: /** {number} */(!obj || typeof obj.lastDown === 'undefined') ? game.BEFORE_STARTTIME : obj.lastDown,
			lastUp: /** {number} */(!obj || typeof obj.lastUp === 'undefined') ? game.BEFORE_STARTTIME : obj.lastUp
		};
	
	};
	
	
	
	
	/**
	 * game.input
	 * 
	 * @return {game.InputState}
	 */
	game.input = function (key) {
	
		if (!internal.inputStates.hasOwnProperty(key)) {
	
			internal.inputStates[key] = game.InputState();
	
		}
	
		return internal.inputStates[key];
	
	};
	
	
	
	
	// Predefined game.input keys
	game.KEY_ENTER = 13;
	game.KEY_ESC = 27;
	game.KEY_SPACE = 32;
	game.KEY_LEFT = 37;
	game.KEY_UP = 38;
	game.KEY_RIGHT = 39;
	game.KEY_DOWN = 40;
	game.MOUSE_LBUTTON = 0;
	game.MOUSE_MBUTTON = 1;
	game.MOUSE_RBUTTON = 2;
	game.MOUSE_OFFSET = -1;
	
	
	
	
	game.read = function (filename) {
	
		var contents = localStorage.getItem(filename);
	
		if (contents) {
			contents = JSON.parse(contents);
		}
	
		return contents;
	
	};
	
	
	
	game.write = function (filename, contents) {
	
		return localStorage.setItem(filename, JSON.stringify(contents));
	
	};
	
	
	
	internal.update = function (timestamp) {
	
		requestAnimationFrame(internal.update);
	
		game.elapsed = timestamp - game.timestamp;
		game.timestamp = timestamp;
	
		var events = internal.events;
	
		while (events.length && events[events.length - 1].timestamp <= game.timestamp) {
	
			var event = events.pop();
	
			event.call(event);
			
			if (event.timestamp > game.timestamp) {
				var index = events.length - 1;
				while (index > -1 && events[index].timestamp < event.timestamp) --index;
				events.splice(index + 1, 0, event);
			}
	
		}
	
		internal.renderer.render(internal.stage);
	
	};
	
	
	
	internal.keyDown = function (event) {
	
		if (internal.inputStates.hasOwnProperty(event.keyCode)) {
			
			internal.inputStates[event.keyCode].lastDown = game.timestamp;
	
		} else {
	
			internal.inputStates[event.keyCode] = game.InputState({ lastDown: game.timestamp });
	
		}
	
	};
	
	
	
	internal.keyUp = function (event) {
	
		if (internal.inputStates.hasOwnProperty(event.keyCode)) {
	
			internal.inputStates[event.keyCode].lastUp = game.timestamp;
	
		} else {
	
			internal.inputStates[event.keyCode] = game.InputState({ lastUp: game.timestamp });
	
		}
	
	};
	
	
	
	internal.mouseMove = function (event) {
		
		var offset = internal.inputStates[game.MOUSE_OFFSET];
		 
		offset.x = game.world.offset.x + (((event.pageX / innerWidth) - 0.5) * game.RESOLUTION_WIDTH) / game.PIXELS_PER_METRE;
		offset.y = game.world.offset.y + (((event.pageY / innerHeight) - 0.5) * game.RESOLUTION_HEIGHT) / game.PIXELS_PER_METRE;
		
	};
	
	
	
	internal.contextMenu = function (event) {
	
		event.preventDefault();
	
	};
	
	
	
	internal.mouseDown = function (event) {
	
		event.preventDefault();
		internal.inputStates[event.button].lastDown = game.timestamp;
	
	};
	
	
	
	internal.mouseUp = function (event) {
	
		event.preventDefault();
		internal.inputStates[event.button].lastUp = game.timestamp;
	
	};
	
	
	
	internal.resize = function () {
		
		game.RESOLUTION_HEIGHT = ~~(game.RESOLUTION_WIDTH / (innerWidth / innerHeight)); 
		
		internal.renderer.resize(game.RESOLUTION_WIDTH, game.RESOLUTION_HEIGHT);
		
		internal.stage.position.x = ~~(0.5 * game.RESOLUTION_WIDTH);
		internal.stage.position.y = ~~(0.5 * game.RESOLUTION_HEIGHT);
		
	};
	
	
	internal.listen = function (type, callback) {
	
		(function (t) {
			window.addEventListener(type, function (event) {
				if (!t) {
					callback(event);
					t = setTimeout(function () { t = null; }, 66);
				}
			}, false);
		} ());
	
	}
	
	if (!game.world) {
	
		document.body.style.overflow = 'hidden';
		document.body.style.margin = document.body.style.padding = '0';
		
		internal.events = internal.events || [];
		
		internal.inputStates = internal.inputStates || {};
		internal.inputStates[game.MOUSE_OFFSET] = Vec3();
		internal.inputStates[game.MOUSE_LBUTTON] = game.InputState();
		internal.inputStates[game.MOUSE_MBUTTON] = game.InputState();
		internal.inputStates[game.MOUSE_RBUTTON] = game.InputState();
	
		internal.listen('keydown', internal.keyDown);
		internal.listen('keyup', internal.keyUp);
	
		internal.listen('mousemove', internal.mouseMove);
		internal.listen('contextmenu', internal.contextMenu);
		internal.listen('mousedown', internal.mouseDown);
		internal.listen('mouseup', internal.mouseUp);
	
		internal.listen('resize', internal.resize);
	
		addEventListener("beforeunload", function () { game.write('Memory', game.memory); }, false);
		
		game.memory = game.memory || game.read('Memory') || {};
		game.timestamp = game.timestamp || 0;
		game.elapsed = game.elapsed || 0;
		
		internal.renderer = new PIXI.WebGLRenderer(game.RESOLUTION_WIDTH, game.RESOLUTION_HEIGHT, {transparent: true});
		internal.renderer.view.style.width = '100%';
		internal.renderer.view.style.height = '100%';
		document.body.appendChild(internal.renderer.view);
		
		game.world = Entity({ movement_speed: 2 });
		
		game.world.spriteContainer.alpha = 0.05;
		
		internal.stage = internal.stage || new PIXI.Container();
		internal.stage.position.x = ~~(0.5 * game.RESOLUTION_WIDTH);
		internal.stage.position.y = ~~(0.5 * game.RESOLUTION_HEIGHT);
		internal.stage.addChild(game.world.spriteContainer);
		
		requestAnimationFrame(function (timestamp) { internal.update(timestamp); });
		
		
	
		if (location.hostname === 'localhost') {
	
			setInterval(function () {
	
				var xhr = new XMLHttpRequest();
	
				xhr.open('GET', '/liveupdate');
	
				xhr.onload = function (e) {
	
					if (this.status !== 200) return;
	
					var updated = JSON.parse(this.response);
	
					for (var file in updated) {
	
						var parent = document.body;
						var script = document.createElement('script');
						file = updated[file];
						
						script.src = file;
	
						var exists = document.evaluate('//script[ @src="' + file + '" ]', document, null, XPathResult.ANY_TYPE, null).iterateNext();
						
						if (exists) {
							parent = exists.parentNode;
							parent.removeChild(exists);
							parent.appendChild(script);
							game.debug('liveupdate replaced ' + file);
						}
	
					}
	
				};
	
				xhr.send();
	
			}, 2000);
	
		}
	
	}
	
}(game || {}))

export default game