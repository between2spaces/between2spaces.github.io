(function () {
  'use strict';

  /**
   * continuous
   */
  if (typeof window !== 'undefined') {

      
      window.store = function (key) {
      
          return key ? store[key] = store[key] || {} : undefined
      
      };
      
      window.val = function (key) {
      
          return key ? vars[key] = vars[key] || {} : undefined
      
      };
      
      window.delay = function (delay, fn) {
      
          (typeof delay === 'number') ? setTimeout(fn, delay) : delay();
      
      };
      
      window.once = function (key, fn) {
      
          if (!key || my.onceKeys.hasOwnProperty(key)) return
          my.onceKeys[key] = null;
          fn();
      
      };
      
      window.repeat = function (key, ms, fn) {
     
          if (typeof fn !== 'function') return
      
          typeof ms !== 'number' && (ms = 1000);
      
          my.repeats[key] = {ms: ms, timestamp: global.timestamp + ms, fn: fn};
      
      };
      
      window.stop = function (key) {
    
          typeof key !== 'undefined' && my.repeats.hasOwnProperty(key) && (delete my.repeats[key]);
      
      };
      
      window.listen = function (object, type, delay, fn) {
      
          (function(t) {
      
              object.addEventListener(type, function (event) {
      
                  if (!t) {
      
                      fn(event);
                      t = setTimeout(function () {
      
                          t = null;
      
                      }, delay);
      
                  }
      
              }, false);
      
          }());
      
      };
      
      
      const STORE = 'store';
      
      var store = JSON.parse(localStorage.getItem(STORE) || '{}');
      var vars = window.vars = window.vars || {};
      
      var global = val('global');
      var my = val('continuous');
      
      my.repeats = my.repeats || {};
      my.onceKeys = my.onceKeys || {};
      my.loads = my.loads || 0;
      ++my.loads;

      
      once('continuous', function () {
      
          window.addEventListener('beforeunload', function () {
      
              localStorage.setItem(STORE, JSON.stringify(store));
      
          }, false);
      
      });
   

      var rAF = function (timestamp) {
      
          my.rAFId = requestAnimationFrame(rAF);
      
          global.timestamp = timestamp;
      
          for (var key in my.repeats) {

              var repeat = my.repeats[key];

              if (repeat.timestamp < timestamp) {
      
                  repeat.fn();
                  repeat.timestamp = timestamp + repeat.ms;
      
              }
      
          }
      
      };
     

      if (my.rAFId) {
      
          cancelAnimationFrame(my.rAFId);
          console.log('continuous reload #' + (my.loads - 1));
      
      }
      
      
      rAF(performance.now());

      
      if (location.hostname === 'localhost') {
      
          (function() {

              repeat('continuous', 1000, function () {
      
                  const http = new XMLHttpRequest();
      
                  http.open('GET', '/continuous', true);
      
                  http.addEventListener('load', function () {
      
                      if (!JSON.parse(http.responseText).update) return
                      var scripts = document.getElementsByTagName('script');
      
                      for (var i = 0; i < scripts.length; i++) {
      
                          var script = scripts[i];
      
                          if (!script.getAttribute('continuous')) continue
                          var update = document.createElement('script');
      
                          update.setAttribute('continuous', my.loads);
                          update.src = script.src;
                          var parent = script.parentNode;
      
                          parent.removeChild(script);
                          parent.appendChild(update);
      
                      }
      
                  });
      
      
                  http.send();
      
              });
      
          }());
      
      }
      
     
      
  } else {



      var cp = require('child_process');
      var watch = require('node-watch');
      var http = require('http');
  	var fs = require('fs');
  	var path = require('path');

      
      var PORT = 8080;
      var update = {};
      
      
      function build() {
      
          cp.exec('npm run rollup', function(err, stdout, stderr) {
      
              err && console.log(err);
              stderr && console.log(stderr);
      
              if (!err && !stderr) {
      
                  console.log('> rollup successful');
                  update = {update: true};
      
                  cp.exec('npm run closure', function(err, stdout, stderr) {
      
                      err && console.log(err);
                      stderr && console.log(stderr);
                      !err && console.log('> closure successful');
      
                  });
      
              }
      
          });
      
      }
      
      watch('src', function(filename) {
          if (!/\.js$/.test(filename)) return
          build();
      });
  	

      http.createServer(function (request, response) {
  		
  		if (request.url === '/continuous') {
  			
  			response.writeHead(200, { 'Content-Type': 'application/json' });
  			response.end(JSON.stringify(update), 'utf-8');
  			update = {};
  			return

  		}
  		
  		var filepath = request.url === '' ? './index.html' : request.url[request.url.length-1] === '/' ? '.' + request.url + 'index.html' : '.' + request.url;
  		var extname = path.extname(filepath);
  		var contentType = 'text/html';
  		
  		switch (extname) {
  		case '.js':
  			contentType = 'text/javascript';
  			break
  		case '.css':
  			contentType = 'text/css';
  			break
  		case '.json':
  			contentType = 'application/json';
  			break
  		case '.png':
  			contentType = 'image/png';
  			break    
  		case '.jpg':
  			contentType = 'image/jpg';
  			break
  		}

  		fs.readFile(filepath, function(error, content) {
  			if (error) {
  				if(error.code == 'ENOENT') {
  					fs.readFile('./404.html', function(error, content) {
  						response.writeHead(200, { 'Content-Type': contentType });
  						response.end(content, 'utf-8');
  					});
  				} else {
  					response.writeHead(500);
  					response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
  					response.end();
  				}
  			} else {
  				response.writeHead(200, { 'Content-Type': contentType });
  				response.end(content, 'utf-8');
  			}
  		});

  	}).listen(PORT);
  	
  	console.log('> listening @ http://localhost:' + PORT);
  	
      build();
   
  }

  let at_work = false;

  var config = {

    scene_opacity:    at_work ? 0.05 : 1.0,
    underlay_opacity: 0.2,

    cells:            1000, //1000,
    regions:          32,

    aperture:         30,

    overdraw_north:   3,
    overdraw_east:    3,
    overdraw_south:   8,
    overdraw_west:    3,

    /**
     * Regions
     */
    region_updates_ms: 15,
    region_attenuation_ms: 15,

    avg_adult_height: 6,

    /**
     * Terrain
     */
    ground_frequency: 0.04,
    water_altitude: -0.3,
    highland_altitude: 0.8,
    grass_altitude_min: -0.3,
    grass_altitude_max: 0.5,
    grass_density: 0.5,

  };

  /**
   * Returns a new {vec3}.
   * @param {vec3=} v
   * @return {vec3}
   */
  let vec3 = (v) => {
    return {x: (v && v.x) ? v.x : 0, y: (v && v.y) ? v.y : 0, z: (v && v.z) ? v.z : 0}
  };

   
  /**
   * Returns the zero vector <0, 0, 0>
   * @return {vec3}
   */
  vec3.zero = () => {
    return {x: 0, y: 0, z: 0}
  };


  /**
   * Returns the unit vector <1, 1, 1>
   * @return {vec3}
   */
  vec3.unit = () => {
    return {x: 1, y: 1, z: 1}
  };


  vec3.toString = (v) => {
    let str = ~~(v.x * 1000) / 1000;
    if (v.y !== 0) str += ',' + ~~(v.y * 1000) / 1000;
    if (v.z !== 0) str += ',' + ~~(v.z * 1000) / 1000;
    return str
  };


  vec3.fromString = (str) => {
    let xyz = str.split(',');
    return vec3({
      x: xyz.length > 0 ? parseFloat(xyz[0]) : 0,
      y: xyz.length > 1 ? parseFloat(xyz[1]) : 0,
      z: xyz.length > 2 ? parseFloat(xyz[2]) : 0
    })
  };


  vec3.equals = (v1, v2) => {
    return ((v2.x === v1.x) && (v2.y === v1.y) && (v2.z === v1.z))
  };


  vec3.add = (v1, v2) => {
    v1.x += v2.x;
    v1.y += v2.y;
    v1.z += v2.z;
    return v1
  };


  vec3.addVectors = (v1, v2) => {
    return vec3.add(vec3(v1), v2)
  };


  vec3.addScalar = (v, scalar) => {
    v.x += scalar;
    v.y += scalar;
    v.z += scalar;
    return v
  };


  vec3.subtract = (v1, v2) => {
    v1.x -= v2.x;
    v1.y -= v2.y;
    v1.z -= v2.z;
    return v1
  };


  vec3.subtractVectors = (v1, v2) => {
    return vec3.subtract(vec3(v1), v2)
  };


  vec3.multiply = (v1, v2) => {
    v1.x *= v2.x;
    v1.y *= v2.y;
    v1.z *= v2.z;
    return v1
  };


  vec3.multiplyVectors = (v1, v2) => {
    return vec3.multiply(vec3(v1), v2)
  };


  vec3.multiplyScalar = (v, scalar) => {
    v.x *= scalar;
    v.y *= scalar;
    v.z *= scalar;
    return v
  };


  vec3.divide = (v1, v2) => {
    v1.x /= v2.x;
    v1.y /= v2.y;
    v1.z /= v2.z;
    return v1
  };


  vec3.divideScalar = (v, scalar) => {
    if (scalar !== 0) {
      var inv = 1.0 / scalar;
      v.x *= inv;
      v.y *= inv;
      v.z *= inv;
    } else {
      v.x = 0;
      v.y = 0;
      v.z = 0;
    }
    return v
  };


  vec3.clamp = (v, min, max) => {
    if (v.x < min.x) {
      v.x = min.x;
    } else if (v.x > max.x) {
      v.x = max.x;
    }
    if (v.y < min.y) {
      v.y = min.y;
    } else if (v.y > max.y) {
      v.y = max.y;
    }
    if (v.z < min.z) {
      v.z = min.z;
    } else if (v.z > max.z) {
      v.z = max.z;
    }
    return v
  };


  vec3.floor = (v) => {
    v.x = Math.floor(v.x);
    v.y = Math.floor(v.y);
    v.z = Math.floor(v.z);
    return v
  };


  vec3.ceil = (v) => {
    v.x = Math.ceil(v.x);
    v.y = Math.ceil(v.y);
    v.z = Math.ceil(v.z);
    return v
  };


  vec3.round = (v) => {
    v.x = Math.round(v.x);
    v.y = Math.round(v.y);
    v.z = Math.round(v.z);
    return v
  };


  vec3.roundToZero = (v) => {
    v.x = (v.x < 0) ? Math.ceil(v.x) : Math.floor(v.x);
    v.y = (v.y < 0) ? Math.ceil(v.y) : Math.floor(v.y);
    v.z = (v.z < 0) ? Math.ceil(v.z) : Math.floor(v.z);
    return v
  };


  vec3.negate = (v) => {
    v.x = -v.x;
    v.y = -v.y;
    v.z = -v.z;
    return v
  };


  vec3.dot = (v1, v2) => {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z
  };


  vec3.lenSq = (v) => {
    return v.x * v.x + v.y * v.y + v.z * v.z
  };


  vec3.len = (v) => {
    return Math.sqrt(vec3.lenSq(v))
  };


  vec3.normalise = (v) => {
    return vec3.divideScalar(v, vec3.len(v))
  };


  vec3.distanceToSq = (v1, v2) => {
    var dx = v1.x - v2.x;
    var dy = v1.y - v2.y;
    var dz = v1.z - v2.z;
    return dx * dx + dy * dy + dz * dz
  };


  vec3.distanceTo = (v1, v2) => {
    return Math.sqrt(vec3.distanceToSq(v1, v2))
  };


  vec3.setLen = (v, length) => {
    var oldLength = vec3.len(v);
    if (oldLength !== 0 && length !== oldLength) {
      vec3.multiplyScalar(v, length / oldLength);
    }
    return v
  };


  vec3.lerp = (v1, v2, alpha) => {
    v1.x += (v2.x - v1.x) * alpha;
    v1.y += (v2.y - v1.y) * alpha;
    v1.z += (v2.z - v1.z) * alpha;
    return v1
  };

  /**
   * Returns a new {rect3}.
   * @param {rect3=} r
   * @return {rect3}
   */
  let rect3 = (r) => {
    return {
      min: r ? vec3(r.min) : vec3.zero(),
      max: r ? vec3(r.max) : vec3.zero()
    }
  };

   
  /**
   * Return the zero rectangle {min: {0, 0, 0}, max: {0, 0, 0}}
   * @return {rect3}
   */
  rect3.zero = () => {
    return {min: vec3.zero(), max: vec3.zero()}
  };


  rect3.fromMinMax = (/**{vec3}*/min, /**{vec3}*/max) => {
    return {
      min: vec3(min),
      max: vec3(max),
    }
  };


  rect3.fromMinDim = (/**{vec3}*/min, /**{vec3}*/dim) => {
    return {
      min: vec3(min),
      max: vec3.addVectors(min, dim),
    }
  };


  rect3.fromCentreDim = (/**{vec3}*/centre, /**{vec3}*/dim) => {
    let half = vec3.multiplyScalar(vec3(dim), 0.5);
    return {
      min: vec3.subtractVectors(centre, half),
      max: vec3.addVectors(centre, half),
    }
  };


  rect3.contains = (/**{vect3}*/r, /**{vec3}*/v) => {
    if (v.x < r.min.x || v.x > r.max.x) return false
    if (v.y < r.min.y || v.y > r.max.y) return false
    if (v.z < r.min.z || v.z > r.max.z) return false
    return true
  };


  rect3.width = (/**{rect3}*/r) => {
    return r.max.x - r.min.x + 1
  };


  rect3.height = (/**{rect3}*/r) => {
    return r.max.y - r.min.y + 1
  };


  rect3.intersects = (/**{rect3}*/a, /**{rect3}*/b) => {
    if (a.max.x < b.min.x || a.min.x > b.max.x || a.max.y < b.min.y || a.min.y > b.max.y || a.max.z < b.min.z || a.min.z > b.max.z) {
      return false
    }
    return true
  };


  rect3.centre = (/**{rect3}*/r) => {
    return vec3.multiplyScalar(vec3.addVectors(r.min, r.max), 0.5)
  };


  rect3.enlarge = (/**{rect3}*/r, /**{vec3}*/delta) => {
    let centre = rect3.centre(r);
    let dim = vec3.addVectors(vec3.subtractVectors(r.max, centre), delta);
    r.min = vec3.subtractVectors(centre, dim);
    r.max = vec3.addVectors(centre, dim);
    return r
  };

  /*global PIXI*/

  let display = {};


  display.width = window.innerWidth + 1;
  display.height = window.innerHeight + 1;



  /**
   * Registers an image for use as a sprite.
   * @param {string} image
   */
  display.register = (image) => {

    if (!my$1.spritesBin.hasOwnProperty(image)) {
      my$1.spritesBin[image] = [];
    }

    if (!my$1.spritesUsed.hasOwnProperty(image)) {
      my$1.spritesUsed[image] = [];
    }

    my$1.nextSprite[image] = my$1.nextSprite[image] || 0;

  };



  /**
   * Allocates a sprite to be displayed on the next display.update()
   * @param {entity} ent
   * @param {vec3} position
   * @param {number} opacity
   * @param {number} tint
   */ 
  display.sprite = (ent, position, opacity, tint) => {

    let sprite;
    let spritesUsed = my$1.spritesUsed[ent.image];
    let spriteIndex = my$1.nextSprite[ent.image];

    if (spriteIndex < spritesUsed.length) {
      sprite = spritesUsed[spriteIndex];
      ++my$1.nextSprite[ent.image];
    } else {
      if (my$1.spritesBin[ent.image].length) {
        sprite = my$1.spritesBin[ent.image].pop();
      } else {
        sprite = PIXI['Sprite']['fromImage'](ent.image);
        sprite.anchor.x = 0.5;
        sprite.anchor.y = 0.5; 
      }
      spritesUsed.push(sprite);
      ++my$1.nextSprite[ent.image];
      my$1.root['addChild'](sprite);
    }

    let size = vec3.multiplyVectors(global$1.pixels_per_cell, ent.size);

    sprite.width = size.x;
    sprite.height = size.y;

    let pos = vec3.multiply(vec3.addVectors(ent.offset, vec3.multiplyVectors(ent.anchor, ent.size)), global$1.pixels_per_cell);
    vec3.add(pos, position);

    sprite.position.x = pos.x;
    sprite.position.y = pos.y;

    if (typeof tint !== 'undefined') sprite['tint'] = tint;
    if (typeof opacity !== 'undefined') sprite.alpha = opacity;

  };


  /**
   * Updates all on-screen {display}s.
   */
  display.update = () => {

    for (let image in my$1.spritesUsed) {

      let spritesBin = my$1.spritesBin[image];
      let spritesUsed = my$1.spritesUsed[image];
      let spriteIndex = my$1.nextSprite[image];

      while (spriteIndex < spritesUsed.length) {
        let sprite = spritesUsed.pop();
        my$1.root['removeChild'](sprite);
        spritesBin.push(sprite);
      }

      my$1.nextSprite[image] = 0;

    }

    my$1.renderer['render'](my$1.root);

  };



  PIXI['SCALE_MODES']['DEFAULT'] = PIXI['SCALE_MODES']['NEAREST'];
  PIXI['utils']['_saidHello'] = true;

  let global$1 = val('global');
  let my$1 = val('display');


  my$1.renderer = my$1.renderer || new PIXI['WebGLRenderer'](display.width, display.height, {'transparent': true});
  my$1.root = my$1.root || new PIXI['Sprite']();
  my$1.spritesBin = my$1.spritesBin || {};
  my$1.spritesUsed = my$1.spritesUsed ||  {};
  my$1.nextSprite = my$1.nextSprite || {};


  once('display', () => {

    let body = document.body.style;
    body.overflow = 'hidden';
    body.margin = body.padding = '0';

    let renderer = my$1.renderer['view'].style;
    renderer.position = 'absolute';
    renderer.width = '100%';
    renderer.height = '100%';
    document.body.appendChild(my$1.renderer['view']);

    listen(window, 'resize', 100, () => {
      my$1.renderer.resize(Math.max(0, window.innerWidth) + 1, Math.max(0, window.innerHeight) + 1);
    });

  });

  /**
   * Creates a new {effect}.
   * @param {entity} eft
   * @return {effect}
   */
  let effect = (eft) => {

    eft = eft || {};

    if (!my$2.creates.hasOwnProperty(eft.type)) return

    eft = {
      id: /**{number}*/null,
      type: /**{string}*/eft.type,
      entity: /**{entity}*/eft.entity,
      extras: /**{object}*/eft.extras,
      timestamp: /**{number}*/global$2.timestamp,
      destroyed: false
    };

    // if the create function doesn't want it created; than abort
    if (!my$2.creates[eft.type](eft)) return

    // ensure unique id
    while (!eft.id || my$2.effects.hasOwnProperty(eft.id)) {
      eft.id = ~~(Math.random()*16777216);
    }

    // add new effect to map
    my$2.effects[eft.id] = eft;

    // add effect to entities own list of Effects applied to it
    eft.entity.effects.push(eft);

    return eft

  };


  effect.type = (type, create, update, destroy) => {
    my$2.creates[type] = create;
    my$2.updates[type] = update;
    my$2.destroys[type] = destroy;
  };


  effect.update = (eft) => {
    my$2.updates[eft.type](eft);
    eft.timestamp = global$2.timestamp;
  };


  effect.destroy = (eft) => {
    if (!my$2.effects.hasOwnProperty(eft.id)) return
    delete my$2.effects[eft.id];
    my$2.destroys[eft.type](eft); 
    let index = eft.entity.effects.indexOf(eft);
    if (index > -1) eft.entity.effects.splice(index, 1);
    eft.destroyed = true;
  };


  let my$2 = val('effect');
  let global$2 = val('global');

  my$2.effects = my$2.effects || {};
  my$2.creates = my$2.creates || {};
  my$2.updates = my$2.updates || {};
  my$2.destroys = my$2.destroys || {};

  /**
   * Returns a new {entity}.
   * @param {entity=} ent
   * @return {entity}
   */
  let entity = (ent) => {

    ent = ent || {};

    let fromString = ent.fromString;

    if (fromString) {
      fromString = fromString.split('"');
      ent.type = fromString[0];
      ent.offset = vec3.fromString(fromString[1]);
      ent.size = vec3.fromString(fromString[2]);
      ent.baseMovementSpeed = parseFloat(fromString[3]);
    }
   
    if (!my$3.creates.hasOwnProperty(ent.type)) {
      console.warn(ent.type + ' is not a known type of entity');
      return
    }

    ent = {

      id: /**{number}*/null,

      type: /**{string}*/ent.type,

      // the {cell} this ent is anchored to
      cell: /**{cell}*/ent.cell,

      // offset is the position of the entities relative to its cells centre 
      // distances greater than 0.5 will move the ent to the appropriate neighbour
      offset: /**{vec3}*/vec3(ent.offset),

      rotation: /**{number}*/0,

      // size relative to the size of a cell. i.e. 1.0, 1.0 matches the dimensions of one whole cell
      size: /**{vec3}*/ent.size ? vec3(ent.size) : vec3.unit(),

      // anchor is centre of entities image relative to the offset. i.e. 0.0, 0.0 is centre
      anchor: /**{vec3}*/vec3(ent.anchor),

      // collide is the dimensions of the entities collision space. i.e. 0.5, 0.5 is half width, half height
      // collide can be null for not collidable
      collide: /**{vec3=}*/ent.collide ? vec3(ent.collide) : null,

      collisionArea: /**{cell[]}*/[],
   
      image: /**{string}*/'/data/sprite/' + ent.type + '.png',

      baseMovementSpeed: /**{number}*/ent.baseMovementSpeed || 0,
      movementSpeedModifiers: /**[function]*/[],
      movementSpeed: /**{number}*/ent.baseMovementSpeed || 0,

      effects: /**{effect[]}*/[]

    };

    // if the create function doesn't want it created; than abort
    if (!my$3.creates[ent.type](ent, fromString)) return

    // ensure unique id
    while (!ent.id || my$3.entities.hasOwnProperty(ent.id)) {
      ent.id = ~~(Math.random()*16777216);
    }

    // add new entity to map
    my$3.entities[ent.id] = ent;
   
    // add entity to cells 
    if (ent.cell && !cells.addEntity(ent.cell.owner, ent, ent.cell)) {
      console.warn(ent.type + ' was not added to cell due to collision');
    }

    return ent

  };


  /**
   * Registers a type of entity.
   * @param {string} type
   * @param {functon} create function
   * @param {function} toString function
   * @param {function} update function
   * @param {function} destroy function
   */
  entity.type = (type, create, toString, update, destroy) => {

    my$3.creates[type] = create;
    my$3.toStrings[type] = toString;
    my$3.updates[type] = update;
    my$3.destroys[type] = destroy;

    display.register('/data/sprite/' + type + '.png');

  };


  /**
   * Returns a string representation of the given entity.
   * @param {entity} ent
   * @return {string}
   */
  entity.toString = (ent) => {

    return my$3.toStrings[ent.type](ent, [
      ent.type,
      vec3.toString(ent.offset),
      vec3.toString(ent.size),
      ~~(ent.baseMovementSpeed)
    ].join('"'))

  };


  /**
   * Returns a new entity constructed from the given string description and added to the {cell} if provided.
   * @param {string} str
   * @param {cell} cll
   * @return {entity}
   */
  entity.fromString = (str, cll) => {
    return entity({fromString: str, cell: cll})
  };


  /**
   * Updates the given entities state.
   * @param {entity} ent
   */
  entity.update = (ent) => {

    for (let eft in ent.effects) {
      effect.update(ent.effects[eft]);
    }

    my$3.updates[ent.type](ent);

  };


  /**
   * Destroys the given entity.
   * @param {entity} ent
   */
  entity.destroy = (ent) => {

    if (!my$3.entities.hasOwnProperty(ent.id)) {
      console.warn(ent.id + ' is not a known entity');
      return
    }

    delete my$3.entities[ent.id];
    my$3.destroys[ent.type](ent); 
    cells.removeEntity(ent);
    ent.destroyed = true;

  };


  /**
   * Destroy all entities.
   */
  entity.destroyAll = () => {
    let entityIds = Object.getOwnPropertyNames(my$3.entities);
    while (entityIds.length) {
      entity.destroy(my$3.entities[entityIds.pop()]);
    }
  };


   
  let my$3 = val('ent');

  my$3.entities = my$3.entities || {};
  my$3.creates = my$3.creates || {};
  my$3.toStrings = my$3.toStrings || {};
  my$3.updates = my$3.updates || {};
  my$3.destroys = my$3.destroys || {};

  /**
   * Returns a new {cells}.
   * @param {cells=} clls {
   *            size: {vec3} [default {x: 1000, y: 1000, z: 0}],
   *            regionSize: {number} [default 32],
   *          } 
   * @return {cells}
   */
  let cells = (clls) => {

    clls = clls || {};

    clls = {
      size: (!clls.size) ? {x: 1000, y: 1000, z: 0} : vec3(clls.size),
      regionSize: (!clls.regionSize) ? 32 : clls.regionSize,
      cell: [],
      regions: {},
      dirtyRegions: {},
      unregionedCells: [],
      dirtyCells: []
    };

    let maxx = clls.size.x - 1;
    let maxy = clls.size.y - 1;

    for (let y = 0; y <= maxy; ++y) {
      for (let x = 0; x <= maxx; ++x) {
        clls.cell[y * clls.size.x + x] = cell(clls, x, y);
      }
    }

    for (let y = 0; y <= maxy; ++y) {
      for (let x = 0; x <= maxx; ++x) {
        let cll = clls.cell[y * clls.size.x + x];
        if (y > 0) cll.north = clls.cell[(y - 1) * clls.size.x + x];
        if (x < maxx) cll.east = clls.cell[y * clls.size.x + x + 1];
        if (y < maxy) cll.south = clls.cell[(y + 1) * clls.size.x + x];
        if (x > 0) cll.west = clls.cell[y * clls.size.x + x - 1];
        cll.region = region({owner: clls, id: cll.regionHash});
        cll.region.cells.push(cll);
      }
    }

    let regionIds = Object.getOwnPropertyNames(clls.regions);
    for (let i in regionIds) clls.dirtyRegions[regionIds[i]] = null;
    region.updateDirty(clls);

    return clls

  };


  /**
   * Returns the {cell} at x, y of the given {cells}.
   * @param {cells} clls
   * @param {number} x
   * @param {number} y
   * @return {cell}
   */
  cells.getCell = (clls, x, y) => {
    if (x < 0 || x >= clls.size.x || y < 0 || y >= clls.size.y) return
    return clls.cell[y * clls.size.x + x]
  };


  /**
   * Returns true if the given {cell} is open; otherwise false.
   * @param {cell} cll
   * @return {boolean}
   */
  cells.isOpen = (cll) => {
    if (!cll || cll.collision) return false
    return true
  };


  /**
   * Returns the type code of the region the given {cell} is in.
   * @param {cell} cll
   * @return {number}
   *    0 - open region
   *    1 - obsticle
   */
  cells.regionType = (cll) => {
    if (cll.collision) return 1
    return 0
  };


  /**
   * Returns true if both {cell}'s can be in the same {region}.
   * @param {cell} a
   * @param {cell} b
   * @return {boolean}
   */
  cells.canShareSameRegion = (a, b) => {
    return a.regionHash === b.regionHash && a.collision === b.collision
  };


  /**
   * Adds the given {entity} to the given {cells}.
   * If a {cell} is not specified the {entity} is position relative to the centre cell of {cells}.
   * @param {cells} clls
   * @param {entity} ent
   * @param {cell=} cll
   */
  cells.addEntity = (clls, ent, cll) => {

    if (!cll) cll = ent.cell;

    // find centre cell if we were not given a cell and the entity is not already assigned a cell
    if (!cll) {
      cll = clls.cell[clls.size.y * 0.5 * clls.size.x + clls.size.x * 0.5];
    }

    // make a copy of the entities offset so we are not manipulating the original
    let offset = vec3(ent.offset);

    // find cell after normalising offset
    cll = cells.findCellFromNormalisedOffset(cll, offset);

    // find the entities collision area
    let collisionArea = cells.collisionArea(ent, cll);

    // don't continue if entity would collide
    if (ent.collide && cells.collides(ent, collisionArea)) return
     
    // update entities offset
    ent.offset = offset;
   
    // add entity to cell
    cll.entities.push(ent);
    ent.cell = cll;

    // add entity to its collision area
    ent.collisionArea = collisionArea;
    for (let i in collisionArea) collisionArea[i].collision = ent;

    // re-region cell and similar neighbours 
    region.reRegion(cll.region);

    return ent

  };

   
  /**
   * Removes an {entity} from its {cells} if attached.
   * @param {entity} ent
   */
  cells.removeEntity = (ent) => {

    if (!ent.cell) return

    let clearedCells = [];

    // remove entity from its collision area
    for (let cll in ent.collisionArea) {
      cll = ent.collisionArea[cll];
      clearedCells.push(cll);
      cll.collision = null;
    }

    ent.collisionArea = [];

    // remove entity from its cell
    let cll = ent.cell;
    ent.cell = null;
    let index = cll.entities.indexOf(ent);
    if (index > -1) cll.entities.splice(index, 1);
    
    // re-region cell and similar neighbours 
    region.reRegion(cll.region);

    let exitCleared = {};

    for (let cll in clearedCells) {
      cll = clearedCells[cll];
      if (cll.regionExitNorth && cll.north.region) exitCleared[cll.north.region.id] = cll.north.region;
      if (cll.regionExitEast && cll.east.region) exitCleared[cll.east.region.id] = cll.east.region;
      if (cll.regionExitSouth && cll.south.region) exitCleared[cll.south.region.id] = cll.south.region;
      if (cll.regionExitWest && cll.west.region) exitCleared[cll.west.region.id] = cll.west.region;
    }
   
    for (let id in exitCleared) {
      region.reRegion(exitCleared[id]);
    }

  };



  /**
   * Updates the given {entity}'s offset and associated {cell} given an offset delta.
   * @param {entity} ent
   * @param {vec3} offsetDelta
   */
  cells.moveEntity = (ent, offsetDelta) => {  
    
    // create a new offset from the addition of the entities offset and the delta
    let offset = vec3.addVectors(ent.offset, offsetDelta);
    
    // find what cell the entity would be in after offset normalisation
    let cll = cells.findCellFromNormalisedOffset(ent.cell, offset);

    // if cell is same as current cell, we only need to update offset and we're done
    if (cll === ent.cell) {
      ent.offset = offset;
      return
    }

    // otherwise we need to test for collision before allowing the move
    let collisionArea;
    if (ent.collide) {
      collisionArea = cells.collisionArea(ent, cll);
      let collision = cells.collides(ent, collisionArea);
      if (collision) return collision
    }

    // remove entity from its current cell
    cells.removeEntity(ent);
    
    // update entities offset
    ent.offset = offset;
   
    // add entity to new cell
    cll.entities.push(ent);
    ent.cell = cll;

    // add entity to its collision area
    ent.collisionArea = collisionArea;
    for (let i in collisionArea) {
      collisionArea[i].collision = ent;
    }

    // re-region cell and similar neighbours 
    region.reRegion(cll.region);

  };



  /**
   * Returns the {cell} offset distance away from the given {cell}'s centre.
   * @param {cell} cll
   * @param {vec3] offset
   * @return {cll}
   */
  cells.findCellFromNormalisedOffset = (cll, offset) => {

    while (cll.west && offset.x <= -0.5) {cll = cll.west; ++offset.x;}
    while (cll.east && offset.x > 0.5) {cll = cll.east; --offset.x;}
    while (cll.north && offset.y <= -0.5) {cll = cll.north; ++offset.y;}
    while (cll.south && offset.y > 0.5) {cll = cll.south; --offset.y;}

    return cll

  };



  /**
   * Returns the first collision found in the array of {cell}'s that is not against the {entity}.
   * If no collision if found a null is returned
   * @param {entity} ent
   * @param {cell[]} list
   * @return {entity=}
   */
  cells.collides = (ent, list) => {

    for (let cll in list) {
      let collision = list[cll].collision;
      if (collision && collision !== ent) return collision
    }

    return null
     
  };



  /**
   * Returns an array of {cell}s in the given {entity}s collision area.
   * @param {entity} ent
   * @param {cell=} cll
   * @return {cell[]}
   */
  cells.collisionArea = (ent, cll) => {

    let collisionArea = [];

    if (!ent.collide) return collisionArea
    if (!cll) cll = ent.cell;

    let last = cll;
    let max = vec3.multiply(vec3.multiply({x: 0.5, y: 0.5, z: 0}, ent.size), ent.collide);
    let min = {x: -max.x, y: -max.y, z: 0};
    let area = {x: 1, y: 1, z: 0};

    while (cll.west && min.x++ <= -0.9) {cll = cll.west; ++area.x;}
    while (cll.north && min.y++ <= -0.9) {cll = cll.north; ++area.y;}
    while (last.east && max.x-- > 0.9) {last = last.east; ++area.x;}
    while (last.south && max.y-- > 0.9) {last = last.south; ++area.y;}


    let row = cll;

    while (area.y--) {
      let x = area.x;
      while (x--) { 
        collisionArea.push(cll);
        if (cll.east) cll = cll.east;
      }
      if (row.south) {
        row = row.south;
        cll = row;
      }
    }

    return collisionArea

  };



  /**
   * Returns true if the given {entity} can travel in a straight line between both {cell}s.
   * If an {entity} is not specified; only {cell}s covered by zero width line are considered.
   * @param {cell} a
   * @param {cell} b
   * @param {entity=} ent
   * @return {boolean}
   */
  cells.canStraightLineTravel = (a, b, ent) => {

    if (!ent) {
      // direct cell only collision test; no entity collisionArea to consider
      let line = cells.raytrace(a, b);
      for (let cll in line) {
        if (line[cll].collision) return false
      }
      return true
    }

    if (!ent.collide) return true
    
    let line = cells.raytrace(a, b);

    for (let cll in line) {
      // collision area testing
      if (cells.collides(ent, cells.collisionArea(ent, line[cll]))) return false
    }

    return true

  };



  /**
   * Returns array of {cell}s touched by a straight line between {cell}s a and b.
   * @param {cell} a
   * @param {cell} b
   * @return {cell[]}
   */
  cells.raytrace = (a, b) => {

    let dx = Math.abs(b.position.x - a.position.x);
    let dy = Math.abs(b.position.y - a.position.y);
    let n = 1 + dx + dy;
    let east = (b.position.x > a.position.x) ? true : false;
    let south = (b.position.y > a.position.y) ? true : false;
    let error = dx - dy;
    let cll = a;
    let line = [];

    dx *= 2;
    dy *= 2;

    for (; n > 0; n--) {
      line.push(cll);
      if (error > 0) {
        if (east && cll.east) cll = cll.east;
        else if (!east && cll.west) cll = cll.west;
        error -= dy;
      } else {
        if (south && cll.south) cll = cll.south;
        else if (!south && cll.north) cll = cll.north;
        error += dx;
      }
    }

    return line
    
  };



  /**
   * Clears path information from all {cell}s in the given {cells}.
   */
  cells.cleanDirtyPathInfo = (clls) => {

    for (let dirtyCell in clls.dirtyCells) {
      dirtyCell = clls.dirtyCells[dirtyCell];
      dirtyCell.score = dirtyCell.g = dirtyCell.h = 0;
      dirtyCell.visited = dirtyCell.closed = dirtyCell.parent = dirtyCell.path = null;
    }

  };



  /**
   * Returns a new {cell} with position {x: x, y: y, z: 0}
   * @param {cells} clls
   * @param {number} x
   * @param {number} y
   * @return {cell}
   */
  let cell = (clls, x, y) => {

    return {

      owner: /**{cells}*/clls,
      position: /**{vec3}*/{x: x, y: y, z: 0},

      region: /**{region}*/null,
      regionHash: (~~(y/clls.regionSize)+1) << 8 | (~~(x/clls.regionSize)+1),

      entities: /**{entity[]}*/[],
      collision: /**{entity=}*/null,

      north: /**{cell}*/null,
      east: /**{cell}*/null,
      south: /**{cell}*/null,
      west: /**{cell}*/null,

      regionBoundary: /**{boolean}*/false,
      regionExitNorth: /**{boolean}*/false,
      regionExitEast: /**{boolean}*/false,
      regionExitSouth: /**{boolean}*/false,
      regionExitWest: /**{boolean}*/false

    }

  };




  /**
   * Returns a new {region}.
   * @param {region=} rgn
   * @return {region}
   */
  let region = (rgn) => {

    rgn = rgn || {};
    rgn.type = rgn.type || 0;

    if (rgn.owner.regions.hasOwnProperty(rgn.id)) return rgn.owner.regions[rgn.id]

    rgn = {
      id: /**{number}*/rgn.id,
      type: /**{number}*/rgn.type,
      owner: /**{cells}*/rgn.owner,
      cells: /**{cell[]}*/[]
    };

    // ensure unique id
    while (!rgn.id || rgn.owner.regions.hasOwnProperty(rgn.id)) {
      rgn.id = ~~(Math.random()*255)<<16|~~(Math.random()*255)<<8|~~(Math.random()*255);
    }

    rgn.owner.regions[rgn.id] = rgn;

    return rgn

  };



  /**
   * Re-evaluate the {region}s of {cell}s in the given {region}.
   * @param {region} rgn
   */
  region.reRegion = (rgn) => {
    
    let dict = {};
    let list = [rgn.id];

    dict[rgn.id] = null;
    
    while (list.length) {

      rgn = rgn.owner.regions[list.pop()];

      if (!rgn) continue

      for (let i in rgn.cells) {

        let cll = rgn.cells[i];

        if (cll.regionExitNorth && cll.north.region && cells.canShareSameRegion(cll, cll.north)) {
          let id = cll.north.region.id;
          if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id);}
        }
        if (cll.regionExitEast && cll.east.region && cells.canShareSameRegion(cll, cll.east)) {
          let id = cll.east.region.id;
          if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id);}
        }
        if (cll.regionExitSouth && cll.south.region && cells.canShareSameRegion(cll, cll.south)) {
          let id = cll.south.region.id;
          if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id);}
        }
        if (cll.regionExitWest && cll.west.region && cells.canShareSameRegion(cll, cll.west)) {
          let id = cll.west.region.id;
          if (!dict.hasOwnProperty(id)) {dict[id] = null; list.push(id);}
        }

      }

      region.destroy(rgn);

    }

    // find regions for unregioned cells
    if (rgn) region.allocateRegions(rgn.owner);

  };


  /**
   * Allocate {region}s to unregioned {cell}s in the given {cells}.
   * @param {cells} clls
   */
  region.allocateRegions = (clls) => {

    clls.dirtyRegions = {};

    while (clls.unregionedCells.length) {

      // pop one cell off as a starting point
      let unregionedCells = [clls.unregionedCells.pop()];

      // will refer to current groups region when one needs creating
      let rgn = null;

      // flood fill unregioned cells into this region that share the same region type until there are none left
      while (unregionedCells.length) {
     
        let cll = unregionedCells.pop();
   
        // skip cells that already have a region
        if (cll.region) continue

        // if we haven't already created a new region for this group; create it
        if (!rgn) rgn = region({owner: clls, type: cells.regionType(cll)});

        cll.region = rgn;
        rgn.cells.push(cll);

        if (cll.north && !cll.north.region && cells.canShareSameRegion(cll, cll.north)) unregionedCells.push(cll.north);
        if (cll.east && !cll.east.region && cells.canShareSameRegion(cll, cll.east)) unregionedCells.push(cll.east);
        if (cll.south && !cll.south.region && cells.canShareSameRegion(cll, cll.south)) unregionedCells.push(cll.south);
        if (cll.west && !cll.west.region && cells.canShareSameRegion(cll, cll.west)) unregionedCells.push(cll.west);
    
      }

      // flag region as dirty
      if (rgn) clls.dirtyRegions[rgn.id] = null;

    }

    // update dirty regions
    region.updateDirty(clls);
   
  };


  /**
   * Updates the regionExit* and regionBoundary properties of dirty {cell}s in the given {cells}.
   * @param {cells} clls
   */
  region.updateDirty = (clls) => {

    let regionIds = Object.getOwnPropertyNames(clls.dirtyRegions);

    for (let i in regionIds) {

      let rgn = clls.regions[regionIds[i]];
      let cll;

      for (let i in rgn.cells) {

        cll = rgn.cells[i];

        let isOpen = cells.isOpen(cll);

        cll.regionBoundary = false;
        cll.regionExitNorth = false;
        cll.regionExitEast = false;
        cll.regionExitSouth = false;
        cll.regionExitWest = false;

        if (!cll.north || cll.north.region.id !== rgn.id ||
            !cll.east || cll.east.region.id !== rgn.id ||
            !cll.south || cll.south.region.id !== rgn.id ||
            !cll.west || cll.west.region.id !== rgn.id) {
          cll.regionBoundary = true;
        }

        if (cll.regionBoundary) {

          // update exits; both outbound and inbound
          
          let neighbour = cll.north;
          if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
            cll.regionExitNorth = true;
            if (!isOpen) neighbour.regionExitSouth = false;
          }

          neighbour = cll.east;
          if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
            cll.regionExitEast = true;
            if (!isOpen) neighbour.regionExitWest = false;
          }

          neighbour = cll.south;
          if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
            cll.regionExitSouth = true;
            if (!isOpen) neighbour.regionExitNorth = false;
          }

          neighbour = cell.west;
          if (neighbour && neighbour.region.id !== rgn.id && cells.isOpen(neighbour)) {
            cll.regionExitWest = true;
            if (!isOpen) neighbour.regionExitEast = false;
          }

        }

      }

      region.reevaluateUpdateFrequency(rgn);

    }

  };



  /**
   * Re-evaulates the update frequence for the given {region}.
   * @param {region} rgn
   */
  region.reevaluateUpdateFrequency = (rgn) => {

    stop('region_update_' + rgn.id);

    if (rgn.cells.length > 0) {

      let distance = ~~(vec3.distanceTo(global$3.view_centre, rgn.cells[0].position) / config.aperture);
      let update_ms = config.region_updates_ms + config.region_attenuation_ms * distance;

      if (update_ms < my$4.fastest_region_update_ms) {
        my$4.fastest_region_update_ms = update_ms;
      } else if (update_ms > my$4.slowest_region_update_ms) {
        my$4.slowest_region_update_ms = update_ms;
      }

      repeat('region_update_' + rgn.id, update_ms, () => {region.update(rgn);});

    }

  };



  /**
   * Destroy the given {region} moving all contianed {cell}s their {cells} unregioned list.
   * @param {region} rgn
   */
  region.destroy = (rgn) => {

    stop('region_update_' + rgn.id);

    while (rgn.cells.length) {

      let cll = rgn.cells.pop();

      cll.region = null;
      cll.regionBoundary = null;
      cll.regionExitNorth = null;
      cll.regionExitEast = null;
      cll.regionExitSouth = null;
      cll.regionExitWest = null;

      rgn.owner.unregionedCells.push(cll);

    }

    delete rgn.owner.regions[rgn.id];

  };



  /**
   * Merge the {cell}s of the src {region} into the dst {region} and flag dst as dirty.
   * @param {region} src
   * @param {region} dst
   */
  region.merge = (src, dst) => {

    while (src.cells.length) {
      let cll = src.cells.pop();
      cll.region = dst;
      dst.cells.push(cll);
    }

    delete src.owner.regions[src.id];
    dst.owner.dirtyRegions[dst.id] = null;

  };



  /**
   * Updates a region.
   * The update frequency is determined by the regions distance from the view.
   * @param {region} rgn
   */
  region.update = (rgn) => {

    for (let cll in rgn.cells) {
      cll = rgn.cells[cll];
      for (let ent in cll.entities) {
        entity.update(cll.entities[ent]);
      }
    }

    region.reevaluateUpdateFrequency(rgn);

  };



  let global$3 = val('global');
  let my$4 = val('cells');

  my$4.fastest_region_update_ms = 9999999;
  my$4.slowest_region_update_ms = 0;

  /* : green
   * : bbb
   * 
   */
  let ui = {};


  /**
   * A terminal UI
   */
  ui.terminal = {};

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

    if (my$5.messagesBody.childNodes.length === my$5.messages_buffer_size) {
      my$5.messagesBody.removeChild(my$5.messagesBody.firstChild);
    }

    let scroll = my$5.messagesScroll.style;
    scroll.overflowY = 'scroll';
   
    let td;

    ui.E(my$5.messagesBody, 'tr', [
      //ui.E('td', {color: my.messages_prompt, verticalAlign: 'top' }, '>'),
      td = ui.E('td', {color: my$5.messages_fg }, message)
    ]);

    td.scrollIntoView(false);

    scroll.overflowY = 'hidden';

    for (let regex in my$5.commands) {
      // match only works on string, '' + messages, ensures the value is a string
      let args = ('' + message).match(regex);
      if (args) {
        for (let listen in my$5.commands[regex]) {
          my$5.commands[regex][listen](args);
        }
      }
    }

  };

  /**
   * Say a message as if entered from the prompt.
   * @param {string} message
   */
  ui.terminal.say = (message) => {
    
    ui.terminal.print('> ' + message);
    
  };

   
  /**
   * Focuses the terminal.
   */
  ui.terminal.focus = () => {

    my$5.messagesScroll.style.overflowY = 'scroll';
    let terminal = my$5.terminalEl.style;
    terminal.background = my$5.messages_bg_focused;
    terminal.opacity = '1.0';
    my$5.sayEl.style.background = my$5.prompt_bg_focused;
    my$5.sayEl.focus();

  };


  /**
   * Unfocuses the terminal.
   */
  ui.terminal.blur = () => {

    my$5.messagesScroll.style.overflowY = 'hidden';
    let terminal = my$5.terminalEl.style;
    terminal.overflowY = 'hidden';
    terminal.background = my$5.messages_bg_unfocused;
    terminal.opacity = '0.5';
    my$5.sayEl.style.background = my$5.prompt_bg_unfocused;
    my$5.sayEl.blur();

  };



  /**
   * Registers a command with the terminal.
   * @param {command} command
   */
  ui.terminal.command = (command) => {

    let regex = command.regex;

    if (!my$5.commands.hasOwnProperty(regex)) my$5.commands[regex] = {};
    my$5.commands[regex][command.context] = command.fn;
    if (command.help) my$5.help[command.command] = command.help;

  };





  /**
   * Updates the displayed cell information.
   * @param {cell} cll
   */
  ui.cell = (cll) => {

    let info = ''; 

    if (cll.collision) {
      let ent = cll.collision;
      info = '&#128082; ' + (ent.name || ent.type);
      info += '<div style="font-size: 10pt">movement speed: ' + ent.movementSpeed + '</div>';
    } else {
      info = 'x ' + cll.position.x + ', ' + cll.position.y;
    }

    my$5.cellEl.innerHTML = info;

  };


  /**
   * Updates the displayed view information.
   * @param {rect3} view
   */
  ui.view = (view) => {

    let width = rect3.width(view);
    let height = rect3.height(view);
    let centre = rect3.centre(view);
     
    my$5.view.innerText = '(' + centre.x + ',' + centre.y + ') ' + width + 'x' + height;

  };



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
      children = style;
      style = name;
      name = parent;
    }

    let element = document.createElement(name);

    if (style instanceof Array || style instanceof Element || typeof style === 'string') {
      children = style;
    } else if (style) {
      for (let key in style) {
        element.style[key] = style[key];
      }
    }

    if (children) {
      if (!(children instanceof Array)) children = [children];
      for (let index = 0; index < children.length; ++index) {
        let child = children[index];
        let childType = typeof child;
        if (childType === 'string' || childType === 'number') {
          element.appendChild(document.createTextNode(child));
        } else {
          element.appendChild(child);
        }
      }
    }

    if (parent instanceof Element) parent.appendChild(element);

    return element

  };


  let my$5 = val('ui');

  my$5.fontfamily = 'Helvetica,Arial,sans-serif';
  my$5.messages_bg_unfocused = 'none';
  my$5.messages_bg_focused = 'rgba(0, 0, 0, 0.1)';
  my$5.prompt_bg_unfocused = 'none';
  my$5.prompt_bg_focused = "#ccf";
  my$5.messages_fg = '#333';
  my$5.messages_prompt = '#ccc';
  my$5.messages_buffer_size = 50;
  my$5.terminal_fontsize = '16pt';
  my$5.terminal_width = '20em';

  my$5.commands = my$5.commands || {};
  my$5.help = my$5.help || {};


  document.body.style.fontFamily = my$5.fontfamily;
  document.body.style.fontSize = my$5.terminal_fontsize;
  document.body.style.lineHeight = '0.9';


  my$5.terminalEl = my$5.terminalEl || ui.E(document.body, 'div', [
      my$5.messagesScroll = my$5.messagesScroll || ui.E('div', ui.E('table', my$5.messagesBody = ui.E('tbody'))),
      my$5.sayEl = ui.E('input')
    ]);

  my$5.terminalEl.style.background = my$5.messages_bg_unfocused;
  my$5.terminalEl.style.color = my$5.messages_fg;
  my$5.terminalEl.style.opacity = '0.5';
  my$5.terminalEl.style.position = 'absolute';
  my$5.terminalEl.style.bottom = '0';
  my$5.terminalEl.style.left = '0';
  my$5.terminalEl.style.width = my$5.terminal_width;
  my$5.terminalEl.style.zIndex = '999';
  my$5.terminalEl.style.padding = '5px';
   
  my$5.messagesScroll.style.overflowY = 'hidden';
  my$5.messagesScroll.style.minHeight = '1.6em';
  my$5.messagesScroll.style.maxHeight = '20em';

  my$5.sayEl.style.background = my$5.prompt_bg_unfocused;
  my$5.sayEl.style.width = '100%';
  my$5.sayEl.style.border = '2px solid transparent';
  my$5.sayEl.style.borderRadius = '3px';
  my$5.sayEl.style.marginTop = '2px';
  my$5.sayEl.style.outline = 'none';
  my$5.sayEl.style.fontFamily = my$5.fontfamily;
  my$5.sayEl.style.fontSize = my$5.terminal_fontsize;
  my$5.sayEl.style.lineHeight = '0.9em';
  my$5.sayEl.style.paddingLeft = '2px';

   
  my$5.cellEl = my$5.cellEl || ui.E(document.body, 'div');

  my$5.cellEl.style.background = my$5.messages_bg_unfocused;
  my$5.cellEl.style.color = my$5.messages_fg;
  my$5.cellEl.style.position = 'absolute';
  my$5.cellEl.style.bottom = '0.8em';
  my$5.cellEl.style.right = '0.8em';
  my$5.cellEl.style.minHeight = '1.4em';
  my$5.cellEl.style.maxHeight = '1.4em';
  my$5.cellEl.style.textAlign = 'right';
  my$5.cellEl.style.zIndex = '999';



  // register the 'help' command
  ui.terminal.command({context: 'ui', command: 'help', regex: '^>[ ]+(help|\\?)[ ]*', fn: (args) => {

    if (Object.getOwnPropertyNames(my$5.help).length === 0) {
      ui.terminal.print('no commands available.');
    }
    for (let command in my$5.help) {
      ui.terminal.print(command + my$5.help[command]);
    }

  }});


  once('ui', () => {

    // once off event listener registration
    
    my$5.sayEl.addEventListener('mouseenter', ui.terminal.focus, false);
    my$5.terminalEl.addEventListener('mouseleave', ui.terminal.blur, false);

    // listen for ENTER press
    my$5.sayEl.addEventListener('keypress', (event) => {
      let keyCode = event.keyCode || event.which;
      let say = my$5.sayEl.value;
      if (keyCode === 13 && say && say !== '') {
        ui.terminal.print('> ' + say);
        my$5.sayEl.value = '';
      }
    }, false);

    // listen for ESC up
    my$5.sayEl.addEventListener('keyup', (event) => {
      let keyCode = event.keyCode || event.which;
      if (keyCode === 27) {
        my$5.sayEl.value = '';
        ui.terminal.blur();
      }
    }, false);  

  });

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
  };


  let input = {};


  input.isDown = (inputstate) => {
      return inputstate.lastDown > inputstate.lastUp
  };


  input.wasDown = (inputstate, timestamps) => {

      // if inputstate is currently down return true straight away
      if (inputstate.lastDown > inputstate.lastUp) return true

      // warn if a timestamps object was not provided
      if (!timestamps) {
          console.warn('timestamps is required');
          console.trace();
          return false
      }

      // test if the inputstate has been down since the given timestamps last record of it
      if (typeof timestamps[inputstate.key] === 'undefined' || inputstate.lastDown > timestamps[inputstate.key]) {
          timestamps[inputstate.key] = global$4.timestamp;
          return true
      }

      return false

  };


  input[' '] = InputState(' ');
  input['!'] = InputState('!');
  input['"'] = InputState('"');
  input['#'] = InputState('#');
  input['$'] = InputState('$');
  input['%'] = InputState('%');
  input['&'] = InputState('&');
  input['\''] = InputState('\'');
  input['('] = InputState('(');
  input[')'] = InputState(')');
  input['*'] = InputState('*');
  input['+'] = InputState('+');
  input[','] = InputState(',');
  input['-'] = InputState('-');
  input['.'] = InputState('.');
  input['/'] = InputState('/');
  input['0'] = InputState('0');
  input['1'] = InputState('1');
  input['2'] = InputState('2');
  input['3'] = InputState('3');
  input['4'] = InputState('4');
  input['5'] = InputState('5');
  input['6'] = InputState('6');
  input['7'] = InputState('7');
  input['8'] = InputState('8');
  input['9'] = InputState('9');
  input[':'] = InputState(':');
  input[';'] = InputState(';');
  input['<'] = InputState('<');
  input['='] = InputState('=');
  input['>'] = InputState('>');
  input['?'] = InputState('?');
  input['@'] = InputState('@');
  input['A'] = InputState('A');
  input['B'] = InputState('B');
  input['C'] = InputState('C');
  input['D'] = InputState('D');
  input['E'] = InputState('E');
  input['F'] = InputState('F');
  input['G'] = InputState('G');
  input['H'] = InputState('H');
  input['I'] = InputState('I');
  input['J'] = InputState('J');
  input['K'] = InputState('K');
  input['L'] = InputState('L');
  input['M'] = InputState('M');
  input['N'] = InputState('N');
  input['O'] = InputState('O');
  input['P'] = InputState('P');
  input['Q'] = InputState('Q');
  input['R'] = InputState('R');
  input['S'] = InputState('S');
  input['T'] = InputState('T');
  input['U'] = InputState('U');
  input['V'] = InputState('V');
  input['W'] = InputState('W');
  input['X'] = InputState('X');
  input['Y'] = InputState('Y');
  input['Z'] = InputState('Z');
  input['['] = InputState('[');
  input['\\'] = InputState('\\');
  input[']'] = InputState(']');
  input['^'] = InputState('^');
  input['_'] = InputState('_');
  input['`'] = InputState('`');
  input['{'] = InputState('{');
  input['|'] = InputState('|');
  input['}'] = InputState('}');
  input['~'] = InputState('~');

  input.ENTER = input[String.fromCharCode(13)] = InputState(String.fromCharCode(13));
  input.ESC = input[String.fromCharCode(27)] = InputState(String.fromCharCode(27));

  input.MOUSE_LBUTTON = InputState('MOUSE_LBUTTON');
  input.MOUSE_MBUTTON = InputState('MOUSE_MBUTTON');
  input.MOUSE_RBUTTON = InputState('MOUSE_RBUTTON');
  input.MOUSE_WHEEL = InputState('MOUSE_WHEEL');
  input.MOUSE_OFFSET = vec3.zero();



  let global$4 = val('global');


  listen(window, 'contextmenu', 100, (event) => { event.preventDefault(); });


  listen(window, 'mousedown', 100, (event) => {
      event.preventDefault();
      switch (event.button) {
      case 0:
          input.MOUSE_LBUTTON.lastDown = global$4.timestamp;
      break
      case 1:
          input.MOUSE_MBUTTON.lastDown = global$4.timestamp;
      break
      case 2:
          input.MOUSE_RBUTTON.lastDown = global$4.timestamp;
      break
      default:
      break
      }
  });


  listen(window, 'mouseup', 100, (event) => {
      event.preventDefault();
      switch (event.button) {
      case 0:
          input.MOUSE_LBUTTON.lastUp = global$4.timestamp;
      break
      case 1:
          input.MOUSE_MBUTTON.lastUp = global$4.timestamp;
      break
      case 2:
          input.MOUSE_RBUTTON.lastUp = global$4.timestamp;
      break
      default:
      break
      }
  });


  document.addEventListener('keydown', (event) => {
      let char = String.fromCharCode(event.which);
      input[char] = InputState(char);
      input[char].lastDown = global$4.timestamp;
  }, false);

  document.addEventListener('keyup', (event) => {
      let char = String.fromCharCode(event.which);
      input[char] = InputState(char);
      input[char].lastUp = global$4.timestamp;
  });


  listen(window, 'mousemove', 0, (event) => {
      input.MOUSE_OFFSET.x = event.pageX;
      input.MOUSE_OFFSET.y = event.pageY;
  });


  listen(window, 'mousewheel', 0, (event) => {
      if (typeof input.MOUSE_WHEEL.delta === 'undefined') input.MOUSE_WHEEL.delta = 0;
      input.MOUSE_WHEEL.delta += Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
      input.MOUSE_WHEEL.lastDown = global$4.timestamp;
  });

  let math = {};


  /**
   * Returns the same psuedo-random number given the same inputs.
   * @param {number} x
   * @param {number} y
   * @return {number} [-1.0, 1.0]
   */
  math.noise = function (x, y) {

      // Skew the input space to determine which simplex cell we're in
      var s = (x + y) * my$6.f2,     // Haiv factor for 2D
          i = Math.floor(x + s),
          j = Math.floor(y + s),
          t = ( i + j ) * my$6.g2,
          X0 = i - t,           // Unskew the cell origin back to ( x,y ) space
          Y0 = j - t,
          x0 = x - X0,          // The x,y distances from the cell origin
          y0 = y - Y0,
          gi, i1 = 0,
          j1 = 1;

      // For the 2D case, the simplex shape is an equilateral triangle.
      // Determine which simplex we are in.
      if (x0 > y0) {
          i1 = 1;
          j1 = 0;
      }

      // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
      // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
      // c = (3-sqrt(3))/6
      // Offsets for middle corner in (x,y) unskewed coords
      var x1 = x0 - i1 + my$6.g2,
          // Offsets for last corner in (x,y) unskewed coords
          y1 = y0 - j1 + my$6.g2,
          x2 = x0 - 1.0 + 2.0 * my$6.g2,
          // Hashed gradient indices of three simplex corners
          y2 = y0 - 1.0 + 2.0 * my$6.g2,
          ii = i & 255,
          jj = j & 255,
          // Calculate the contribution from the three corners
          t0 = 0.5 - x0 * x0 - y0 * y0,
          t1 = 0.5 - x1 * x1 - y1 * y1,
          t2 = 0.5 - x2 * x2 - y2 * y2,
          n0 = 0.0,
          n1 = 0.0,
          n2 = 0.0;

      if (t0 >= 0) {
          gi = my$6.perm123[ii + my$6.perm[jj]];
          t0 *= t0;
          // ( x,y ) of my.grad3 used for 2D gradient
          n0 = t0 * t0 * (my$6.grad3[gi] * x0 + my$6.grad3[gi + 1] * y0);
      }

      if (t1 >= 0) {
          gi = my$6.perm123[ii + i1 + my$6.perm[jj + j1]];
          t1 *= t1;
          n1 = t1 * t1 * (my$6.grad3[gi] * x1 + my$6.grad3[gi + 1] * y1);
      }

      if (t2 >= 0) {
          gi = my$6.perm123[ii + 1 + my$6.perm[jj + 1]];
          t2 *= t2;
          n2 = t2 * t2 * (my$6.grad3[gi] * x2 + my$6.grad3[gi + 1] * y2);
      }

      // Add contributions from each corner to get the final noise value.
      // The result is scaled to return values in the interval [-1,1].
      return 70.0 * (n0 + n1 + n2);

  };



  /**
   * Seeds the Math.random() number generator given a {string}.
   * @param {string} seed
   */
  math.seed = function(seed) {

      my$6.currentSeed = 0;

      for (let index = 0; index < seed.length; ++index) {
          my$6.currentSeed = ((my$6.currentSeed << 5) - my$6.currentSeed) + seed.charCodeAt(index);
          my$6.currentSeed |= 0;
      }


      // Override the built-in Math.random with a seeded psuedo-random implementation
      Math.random = function() {
          my$6.currentSeed = Math.sin(my$6.currentSeed) * 10000;
          return my$6.currentSeed - Math.floor(my$6.currentSeed);
      };


      // Initialise the noise constants
      my$6.f2 = 0.5 * (Math.sqrt(3.0) - 1.0);
      my$6.g2 = (3.0 - Math.sqrt(3.0)) / 6.0;


      var C = 256;
      var P = new Uint8Array(C);

      while (C--) {
          P[C] = (Math.random() * 256) | 0;
      }

      // To remove the need for index wrapping, double the permutation table length
      C = 512;
      my$6.perm = new Uint8Array(C);
      my$6.perm123 = new Uint8Array(C);

      while (C--) {
          my$6.perm[C] = P[C & 255];
          my$6.perm123[C] = (my$6.perm[C] % 12) * 3;
      }

  };



  let my$6 = val('math');


  if (!my$6.initialised) {

    my$6.initialised = true;

    my$6.grad3 = new Float32Array([
        1, 1, 0, -1,   1, 0, 1, -1,   0, -1, -1,  0,
        1, 0, 1, -1,   0, 1, 1,  0,  -1, -1,  0, -1,
        0, 1, 1,  0,  -1, 1, 0,  1,  -1,  0, -1, -1
      ]);

    my$6.currentSeed = 0;

    math.seed('000000000000000000');

  }

  const TYPE = 'cell/blank';

  entity.type(TYPE, (ent, fromString) => {
    // on entity create

    return ent

  }, (ent, toString) => {
    // on entity toString
    
    return toString

  }, (ent) => {
    // on entity update 
   
  }, (ent) => {
    // on entity destroy

  });


  var blankcell = (ent) => {
    // create helper 
    
    ent = ent || {}; 
    ent.type = TYPE;
    return entity(ent)

  };

  const TYPE$1 = 'flora/grass';

  entity.type(TYPE$1, (ent, fromString) => {
    // on entity create
    
    ent.anchor.x = 0.01;
    ent.anchor.y = -0.45;

    let size = 0.2 + 0.4 * config.avg_adult_height;
    ent.size.x = size;
    ent.size.y = size;

    return ent

  }, (ent, toString) => {
    // on entity toString
    
    return toString

  }, (ent) => {
    // on entity update 
   
  }, (ent) => {
    // on entity destroy

  });


  var grass = (ent) => {
    // create helper 
    
    ent = ent || {}; 
    ent.type = TYPE$1;
    return entity(ent)

  };

  const TYPE$2 = 'animal/person';

  entity.type(TYPE$2, (ent, fromString) => {
    // on entity create
    
    ent.anchor.x = 0.1;
    ent.anchor.y = -0.32;
    ent.collide = vec3({x: 0.7, y: 0.2});

    if (fromString) {

      ent.name = fromString[4];

    } else {

      ent.size.x = 0.66 * config.avg_adult_height;
      ent.size.y = config.avg_adult_height;

      ent.movementSpeed = ent.baseMovementSpeed = 2;

    } 

    return ent

  }, (ent, toString) => {
    // on entity toString
    
    return [
      toString,
      ent.name
    ].join('"')


  }, (ent) => {
    // on entity update 
   
  }, (ent) => {
    // on entity destroy

  });


  var person = (ent) => {
    // create helper 
    
    ent = ent || {}; 
    ent.type = TYPE$2;
    ent.name = ent.name || 'unnamed';
    return entity(ent)

  };

  let binaryheap = () => {
    let heap = {
      items: []
    };
    return heap
  };


  binaryheap.push = (heap, item) => {
    // add the new element to the end of the array
    heap.items.push(item);
    // allow it to bubble up
    binaryheap.bubbleUp(heap, heap.items.length - 1);
  };


  binaryheap.pop = (heap) => {
    // store the first item so we can return it later
    let result = heap.items[0];
    // get the item at the end of the array
    let end = heap.items.pop();
    // if there are any items left, put the end element at the start, and let it sink down
    if (heap.items.length > 0) {
      heap.items[0] = end;
      binaryheap.sinkDown(heap, 0);
    }
    return result
  };


  binaryheap.rescore = (heap, item) => {
    binaryheap.sinkDown(heap, heap.items.indexOf(item));
  };


  binaryheap.remove = (heap, item) => {

    let length = heap.items.length;

    // to remove a value, we must search through the array to find it
    for (let i = 0; i < length; i++) {
      if (heap.items[i] != item) continue
      // when it is found, the process seen in 'pop' is repeated to fill up the hole
      let end = heap.items.pop();
      // if the item we popped was the one we needed to remove, we're done
      if (i == length - 1) break
      // otherwise, we replace the removed element with the popped
      // one, and allow it to float up or sink down as appropriate.
      heap.items[i] = end;
      binaryheap.bubbleUp(heap, i);
      binaryheap.sinkDown(heap, i);
      break
    }

  };


  binaryheap.size = (heap) => {
    return heap.items.length
  };


  binaryheap.bubbleUp = (heap, i) => {
    // fetch the item that has to be moved
    let item = heap.items[i], score = item.score;
    // when at 0, an item can not go up any further
    while (i > 0) {
      // compute the parent item's index, and fetch it.
      let parentN = Math.floor((i + 1) / 2) - 1;
      let parent = heap.items[parentN];
      // if the parent has a lesser score, things are in order and we are done
      if (score >= parent.score) break

      // otherwise, swap the parent with the current item and continue
      heap.items[parentN] = item; 
      heap.items[i] = parent;
      i = parentN;
    }
  };


  binaryheap.sinkDown = (heap, i) => {

    // look up the target item and its score
    let length = heap.items.length;
    let item = heap.items[i];
    let elemScore = item.score;

    while(true) {
      // compute the indices of the child items
      let child2N = (i + 1) * 2, child1N = child2N - 1;
      // this is used to store the new position of the item, if any
      let swap = null;
      let child1Score;
      // if the first child exists (is inside the array)...
      if (child1N < length) {
        // look it up and compute its score.
        let child1 = heap.items[child1N];
        child1Score = child1.score;
        // if the score is less than our item's, we need to swap.
        if (child1Score < elemScore) swap = child1N;
      }
      // do the same checks for the other child
      if (child2N < length) {
        let child2 = heap.items[child2N];
        let child2Score = child2.score;
        if (child2Score < (swap === null ? elemScore : child1Score)) swap = child2N;
      }

      // no need to swap further, we are done
      if (swap === null) break

      // otherwise, swap and continue
      heap.items[i] = heap.items[swap];
      heap.items[swap] = item;
      i = swap;
    }

  };

  /**
   * Returns a list of staight line waypoints that avoid collisions from ent's current cell to destination.
   *
   * @param {Entity} ent
   * @param {Cell} destination
   * @return {Cell[]}
   */
  let path$1 = (ent, destination) => {

    let clls = destination.owner;
    let gScore;

    if (ent.collide && cells.collides(ent, cells.collisionArea(ent, destination))) {
      // destination is in a collision; adjust to nearest cell on straight line that doesn't collide
      let line = cells.raytrace(destination, ent.cell);
      for (let cll in line) {
        destination = line[cll];
        // continue path finding with destination set at current cell if no collision found
        if (!cells.collides(ent, cells.collisionArea(ent, destination))) break
      }
    }


    if (ent.collide && cells.collides(ent, cells.collisionArea(ent))) {
      console.log('error: ent is already colliding; need an unstick step here');
      return []
    }

    // clean dirty nodes
    cells.cleanDirtyPathInfo(clls);

    let startCell = ent.cell;
    let endCell = destination;

    clls.dirtyCells = [startCell];

    startCell.g = 0;
    startCell.score = 0;

    let heap = binaryheap();
    binaryheap.push(heap, startCell);

    while (binaryheap.size(heap)) {

      // pop the lowest scored cell off the heap
      let currentCell = binaryheap.pop(heap);

      // end condition -- result has been found, return the traced path
      if (currentCell === endCell || binaryheap.size(heap) > 100) {
        return tracePath(currentCell)
      }

      // move currentCell from open to closed, process each of its neighbours
      currentCell.closed = true;

      let neighbours = [currentCell.north, currentCell.east, currentCell.south, currentCell.west];

      for (let neighbour in neighbours) {

        neighbour = neighbours[neighbour];

        if (!neighbour || neighbour.closed) continue

        // close and continue if a collision would occur
        if (ent.collide && cells.collides(ent, cells.collisionArea(ent, neighbour))) {
          neighbour.closed = true;
          clls.dirtyCells.push(neighbour);
          continue
        }

        let beenVisited = neighbour.visited;
        let neighbourParent = currentCell;

        // make neighbours parent the parent of currentCell if traveled in a straight line does not collide
        if (currentCell.parent && cells.canStraightLineTravel(currentCell.parent, neighbour, ent)) {
          neighbourParent = currentCell.parent;
        }

        gScore = neighbourParent.g + 1;

        // check if neighbour has not been visited yet, or can be reached with a smaller cost from current
        if (!neighbour.visited || gScore < neighbour.g) {

          neighbour.parent = neighbourParent;
          neighbour.h = neighbour.h || heuristic(neighbour, endCell);
          neighbour.g = gScore;
          neighbour.score = neighbour.g + neighbour.h;

          clls.dirtyCells.push(neighbour);

          if (!beenVisited) {
            // pushing to heap will put it in proper place based on the 'f' value.
            binaryheap.push(heap, neighbour);
            neighbour.visited = true;
          } else {
            // already seen the node, but since it has been rescored we need to reorder it in the heap
            binaryheap.rescore(heap, neighbour);
          }

        }

      }

    }

    return []

  };


  /**
   * Manhattan distance
   */
  let heuristic = (start, end) => {

    let dx = Math.abs(start.position.x - end.position.x);
    let dy = Math.abs(start.position.y - end.position.y);

    return dx + dy

  };


  let tracePath = (cll) => {

      let curr = cll;
      var path = [];

      while (curr.parent) {
        curr.path = true;
        path.push(curr);
        curr = curr.parent;
      }

      return path.reverse()

  };

  const TYPE$3 = 'movefindpath';


  effect.type(TYPE$3, (eft) => {
    // on effect create

    // cancel creation if a destination wasn't given in extras
    if (!eft.extras.hasOwnProperty('destination')) return

    // remove an existing 'movefindpath' eft from the entity
    for (let i in eft.entity.effects) {
      if (eft.entity.effects[i].type === TYPE$3) {
        effect.destroy(eft.entity.effects[i]);
        break
      }
    }

    eft.extras.path = path$1(eft.entity, eft.extras['destination']);

    return eft

  }, (eft) => {
    // on effect update

    if (eft.extras.path.length === 0) {
      effect.destroy(eft);
      return
    }

    let absolutePosition = vec3.addVectors(eft.entity.cell.position, eft.entity.offset);
    let offsetDelta = vec3.subtractVectors(eft.extras.path[0].position, absolutePosition);
    let length = vec3.len(offsetDelta);
    let s = (global$5.timestamp - eft.timestamp) * 0.001;
    let traveled = s * eft.entity.movementSpeed;

    if (traveled < length) {
      vec3.multiplyScalar(offsetDelta, traveled / length); 
    } else {
      eft.extras.path.splice(0, 1);
    }

    let collision = cells.moveEntity(eft.entity, offsetDelta);

    if (collision) {
      eft.entity.offset.x = eft.entity.offset.y = 0;
      // reCalculate path around collision
      eft.extras.path = path$1(eft.entity, eft.extras['destination']);
    }

  }, (eft) => {
    // on effect destroyed  
    
  });


  let global$5 = val('global');


  var movefindpath = (eft) => {
    // create helper 
    
    eft = eft || {}; 
    eft.type = TYPE$3;
    eft.extras = eft.extras || {};
    eft.extras['destination'] = eft['destination'];
    return effect(eft)

  };

  let global$6 = val('global');
  let my$7 = val('liveanddie');


  const BLANK_CELL = blankcell();
  const GRASS = grass();


  /**
   * Updates the display and view dimensions based on the current window.
   */
  let updateDisplayViewDraw = () => {

      my$7.displayWidth = Math.max(1, window.innerWidth);
      my$7.displayHeight = Math.max(1, window.innerHeight);

      my$7.apertureWidth = ~~(config.aperture * (my$7.displayWidth / my$7.displayHeight));

      if (!global$6.pixels_per_cell) global$6.pixels_per_cell = vec3.zero();
      global$6.pixels_per_cell.x = my$7.displayWidth / my$7.apertureWidth;
      global$6.pixels_per_cell.y = my$7.displayHeight / config.aperture;

      global$6.view_centre = my$7.view ? rect3.centre(my$7.view) : vec3({x: config.cells * 0.5, y: config.cells * 0.5});
      vec3.round(global$6.view_centre);

      if (!my$7.view) my$7.view = rect3.zero();
      my$7.view.min.x = global$6.view_centre.x - ~~(0.5 * my$7.apertureWidth);
      my$7.view.max.x = my$7.view.min.x + my$7.apertureWidth - 1;
      my$7.view.min.y = global$6.view_centre.y - ~~(0.5 * config.aperture);
      my$7.view.max.y = my$7.view.min.y + config.aperture - 1;

      // Calculate the draw view based on overdraw numbers
      if (!my$7.draw) my$7.draw = rect3.zero();
      my$7.draw.min.x = Math.max(my$7.view.min.x - config.overdraw_west, 0);
      my$7.draw.max.x = Math.min(my$7.view.max.x + config.overdraw_east, config.cells);
      my$7.draw.min.y = Math.max(my$7.view.min.y - config.overdraw_north, 0);
      my$7.draw.max.y = Math.min(my$7.view.max.y + config.overdraw_south, config.cells);


      // Log view dimension changes
      if (my$7.updateDisplayViewDraw_timer) clearTimeout(my$7.updateDisplayViewDraw_timer);

      my$7.updateDisplayViewDraw_timer = setTimeout(() => {

          let viewable = my$7.apertureWidth * config.aperture;
          let drawWidth = (my$7.apertureWidth + config.overdraw_west + config.overdraw_east);
          let drawHeight = (config.aperture + config.overdraw_north + config.overdraw_south);
          let drawable = drawWidth * drawHeight;

          ui.terminal.print('view ' + my$7.apertureWidth + 'x' + config.aperture + ' (' + viewable + ')');
          ui.terminal.print('draw ' + drawWidth + 'x' + drawHeight + ' (' + drawable + ')');
          let ppcx = ~~(global$6.pixels_per_cell.x * 100) / 100;
          let ppcy = ~~(global$6.pixels_per_cell.y * 100) / 100;

          ui.terminal.print('px/cell ' + ppcx + 'x' + ppcy);

      }, 1000);

  };



  // Initialisation of state. Only run on first load (i.e. don't run on reloads from livecoding updates)
  once('liveanddie', () => {

      updateDisplayViewDraw();
      my$7.cells = cells({size: {x: config.cells, y: config.cells}, regionSize: config.regions});
      my$7.timestamps = {};
      my$7.mouse = {x: -1, y: -1, cell: null};

      listen(window, 'resize', 100, () => {

          my$7.window_resized = true;

      });

      my$7.hero = person({cell: cells.getCell(my$7.cells, global$6.view_centre.x, global$6.view_centre.y)});
      movefindpath({entity: my$7.hero, destination: cells.getCell(my$7.cells, global$6.view_centre.x + 5, global$6.view_centre.y + 5)});
      ui.terminal.say('help');

  });



  repeat('liveanddie_3_Hz', 333, () => {

      // Update the display and view dimensions if the window_resize flag is set
      if (my$7.window_resized || my$7.previous_aperture !== config.aperture) {

          my$7.window_resized = false;
          updateDisplayViewDraw();

      }
      my$7.previous_aperture = config.aperture;

      // Terminal focus / blur
      if (input.wasDown(input.ENTER, my$7.timestamps)) ui.terminal.focus();

      // Check for mouse move and new cell focus
      if (my$7.mouse.x != input.MOUSE_OFFSET.x || my$7.mouse.y != input.MOUSE_OFFSET.y) {

          my$7.mouse.x = input.MOUSE_OFFSET.x;
          my$7.mouse.y = input.MOUSE_OFFSET.y;

          let cll = cells.getCell(
                  my$7.cells,
                  my$7.view.min.x + ~~(my$7.mouse.x / global$6.pixels_per_cell.x),
                  my$7.view.min.y + ~~(my$7.mouse.y / global$6.pixels_per_cell.y)
              );

          if (cll !== my$7.mouse.cell) {

              my$7.mouse.cell = cll;
              ui.cell(cll);

          }

      }

      // Check for right mouse button for a move to cell command
      if (input.wasDown(input.MOUSE_RBUTTON, my$7.timestamps)) {

          movefindpath({entity: my$7.hero, destination: my$7.mouse.cell});

      }

  });



  repeat('liveanddie_15_Hz', 66, () => {

      // Check for horizontal keyboard pan
      if (my$7.view.min.x > 0 && input.wasDown(input['A'], my$7.timestamps)) {

          --my$7.view.min.x;
          --my$7.view.max.x;
          --my$7.draw.min.x;
          --my$7.draw.max.x;

      } else if (my$7.view.max.x < config.cells && input.wasDown(input['D'], my$7.timestamps)) {

          ++my$7.view.min.x;
          ++my$7.view.max.x;
          ++my$7.draw.min.x;
          ++my$7.draw.max.x;

      }

      // Check for veritcal keyboard pan
      if (my$7.view.min.y > 0 && input.wasDown(input['W'], my$7.timestamps)) {

          --my$7.view.min.y;
          --my$7.view.max.y;
          --my$7.draw.min.y;
          --my$7.draw.max.y;

      } else if (my$7.view.max.y < config.cells && input.wasDown(input['S'], my$7.timestamps)) {

          ++my$7.view.min.y;
          ++my$7.view.max.y;
          ++my$7.draw.min.y;
          ++my$7.draw.max.y;

      }

  });



  repeat('liveanddie_60_Hz', 15, () => {

      let left = (0.5 - config.overdraw_west) * global$6.pixels_per_cell.x;
      let pos = {x: left, y: (0.5 - config.overdraw_north) * global$6.pixels_per_cell.y, z: 0};


      // Draw a grid like underlay to show the cells
      /*for (let y = my.draw.min.y; y <= my.draw.max.y; ++y) {

          for (let x = my.draw.min.x; x <= my.draw.max.x; ++x) {

              let noise = math.noise(x * config.ground_frequency, y * config.ground_frequency)

              if (noise >= config.highland_altitude) {

                  tint = 0xddddff

              } else if (noise <= config.water_altitude) {

                  tint = 0x5555ff

              } else {

                  tint = 0x005500

              }
              display.sprite(BLANK_CELL, pos, config.underlay_opacity, tint)
              pos.x += global.pixels_per_cell.x

          }
          pos.y += global.pixels_per_cell.y
          pos.x = left

      }*/

      // Reset pos opacity for entities in scene
      pos.y = (0.5 - config.overdraw_north) * global$6.pixels_per_cell.y;

      // Draw clutter
      for (let y = my$7.draw.min.y; y <= my$7.draw.max.y; ++y) {

          for (let x = my$7.draw.min.x; x <= my$7.draw.max.x; ++x) {

              let cll = cells.getCell(my$7.cells, x, y);

              if (cll) {

                  /*let noise = math.noise(x * config.ground_frequency, y * config.ground_frequency)

                  if (noise >= config.grass_altitude_min && noise <= config.grass_altitude_max) {

                      if (((math.noise(x, y) + 1) * 0.5) < config.grass_density) {

                          let offset = 0.5 * math.noise(x, y)

                          GRASS.size.x = GRASS.size.y = (1 + noise * 2)
                          GRASS.offset.x = offset
                          GRASS.offset.y = offset
                          display.sprite(GRASS, pos, config.scene_opacity)

                      }

                  }*/
  				
                  for (let ent in cll.entities) {

                      ent = cll.entities[ent];
                      display.sprite(ent, pos, config.scene_opacity);

                  }

              }
              pos.x += global$6.pixels_per_cell.x;

          }
          pos.y += global$6.pixels_per_cell.y;
          pos.x = left;

      }

      display.update();

  });

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0LmpzIiwic291cmNlcyI6WyJzcmMvY29udGludW91cy5qcyIsInNyYy9jb25maWcuanMiLCJzcmMvdmVjMy5qcyIsInNyYy9yZWN0My5qcyIsInNyYy9kaXNwbGF5LmpzIiwic3JjL2VmZmVjdC5qcyIsInNyYy9lbnRpdHkuanMiLCJzcmMvY2VsbHMuanMiLCJzcmMvdWkuanMiLCJzcmMvaW5wdXQuanMiLCJzcmMvbWF0aC5qcyIsInNyYy9lbnRpdGllcy9jZWxsL2JsYW5rLmpzIiwic3JjL2VudGl0aWVzL2Zsb3JhL2dyYXNzLmpzIiwic3JjL2VudGl0aWVzL2FuaW1hbC9wZXJzb24uanMiLCJzcmMvYmluYXJ5aGVhcC5qcyIsInNyYy9wYXRoLmpzIiwic3JjL2VmZmVjdHMvbW92ZWZpbmRwYXRoLmpzIiwic3JjL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBjb250aW51b3VzXG4gKi9cbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuXG4gICAgXG4gICAgd2luZG93LnN0b3JlID0gZnVuY3Rpb24gKGtleSkge1xuICAgIFxuICAgICAgICByZXR1cm4ga2V5ID8gc3RvcmVba2V5XSA9IHN0b3JlW2tleV0gfHwge30gOiB1bmRlZmluZWRcbiAgICBcbiAgICB9XG4gICAgXG4gICAgd2luZG93LnZhbCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICBcbiAgICAgICAgcmV0dXJuIGtleSA/IHZhcnNba2V5XSA9IHZhcnNba2V5XSB8fCB7fSA6IHVuZGVmaW5lZFxuICAgIFxuICAgIH1cbiAgICBcbiAgICB3aW5kb3cuZGVsYXkgPSBmdW5jdGlvbiAoZGVsYXksIGZuKSB7XG4gICAgXG4gICAgICAgICh0eXBlb2YgZGVsYXkgPT09ICdudW1iZXInKSA/IHNldFRpbWVvdXQoZm4sIGRlbGF5KSA6IGRlbGF5KClcbiAgICBcbiAgICB9XG4gICAgXG4gICAgd2luZG93Lm9uY2UgPSBmdW5jdGlvbiAoa2V5LCBmbikge1xuICAgIFxuICAgICAgICBpZiAoIWtleSB8fCBteS5vbmNlS2V5cy5oYXNPd25Qcm9wZXJ0eShrZXkpKSByZXR1cm5cbiAgICAgICAgbXkub25jZUtleXNba2V5XSA9IG51bGxcbiAgICAgICAgZm4oKVxuICAgIFxuICAgIH1cbiAgICBcbiAgICB3aW5kb3cucmVwZWF0ID0gZnVuY3Rpb24gKGtleSwgbXMsIGZuKSB7XG4gICBcbiAgICAgICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuXG4gICAgXG4gICAgICAgIHR5cGVvZiBtcyAhPT0gJ251bWJlcicgJiYgKG1zID0gMTAwMClcbiAgICBcbiAgICAgICAgbXkucmVwZWF0c1trZXldID0ge21zOiBtcywgdGltZXN0YW1wOiBnbG9iYWwudGltZXN0YW1wICsgbXMsIGZuOiBmbn1cbiAgICBcbiAgICB9XG4gICAgXG4gICAgd2luZG93LnN0b3AgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIFxuICAgICAgICB0eXBlb2Yga2V5ICE9PSAndW5kZWZpbmVkJyAmJiBteS5yZXBlYXRzLmhhc093blByb3BlcnR5KGtleSkgJiYgKGRlbGV0ZSBteS5yZXBlYXRzW2tleV0pXG4gICAgXG4gICAgfVxuICAgIFxuICAgIHdpbmRvdy5saXN0ZW4gPSBmdW5jdGlvbiAob2JqZWN0LCB0eXBlLCBkZWxheSwgZm4pIHtcbiAgICBcbiAgICAgICAgKGZ1bmN0aW9uKHQpIHtcbiAgICBcbiAgICAgICAgICAgIG9iamVjdC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIGZ1bmN0aW9uIChldmVudCkge1xuICAgIFxuICAgICAgICAgICAgICAgIGlmICghdCkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICBmbihldmVudClcbiAgICAgICAgICAgICAgICAgICAgdCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgdCA9IG51bGxcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgfSwgZGVsYXkpXG4gICAgXG4gICAgICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICAgICAgfSwgZmFsc2UpXG4gICAgXG4gICAgICAgIH0oKSlcbiAgICBcbiAgICB9XG4gICAgXG4gICAgXG4gICAgY29uc3QgU1RPUkUgPSAnc3RvcmUnXG4gICAgXG4gICAgdmFyIHN0b3JlID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbShTVE9SRSkgfHwgJ3t9JylcbiAgICB2YXIgdmFycyA9IHdpbmRvdy52YXJzID0gd2luZG93LnZhcnMgfHwge31cbiAgICBcbiAgICB2YXIgZ2xvYmFsID0gdmFsKCdnbG9iYWwnKVxuICAgIHZhciBteSA9IHZhbCgnY29udGludW91cycpXG4gICAgXG4gICAgbXkucmVwZWF0cyA9IG15LnJlcGVhdHMgfHwge31cbiAgICBteS5vbmNlS2V5cyA9IG15Lm9uY2VLZXlzIHx8IHt9XG4gICAgbXkubG9hZHMgPSBteS5sb2FkcyB8fCAwXG4gICAgKytteS5sb2Fkc1xuXG4gICAgXG4gICAgb25jZSgnY29udGludW91cycsIGZ1bmN0aW9uICgpIHtcbiAgICBcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICBcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKFNUT1JFLCBKU09OLnN0cmluZ2lmeShzdG9yZSkpXG4gICAgXG4gICAgICAgIH0sIGZhbHNlKVxuICAgIFxuICAgIH0pXG4gXG5cbiAgICB2YXIgckFGID0gZnVuY3Rpb24gKHRpbWVzdGFtcCkge1xuICAgIFxuICAgICAgICBteS5yQUZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShyQUYpXG4gICAgXG4gICAgICAgIGdsb2JhbC50aW1lc3RhbXAgPSB0aW1lc3RhbXBcbiAgICBcbiAgICAgICAgZm9yICh2YXIga2V5IGluIG15LnJlcGVhdHMpIHtcblxuICAgICAgICAgICAgdmFyIHJlcGVhdCA9IG15LnJlcGVhdHNba2V5XVxuXG4gICAgICAgICAgICBpZiAocmVwZWF0LnRpbWVzdGFtcCA8IHRpbWVzdGFtcCkge1xuICAgIFxuICAgICAgICAgICAgICAgIHJlcGVhdC5mbigpXG4gICAgICAgICAgICAgICAgcmVwZWF0LnRpbWVzdGFtcCA9IHRpbWVzdGFtcCArIHJlcGVhdC5tc1xuICAgIFxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9XG4gICAgXG4gICAgfVxuICAgXG5cbiAgICBpZiAobXkuckFGSWQpIHtcbiAgICBcbiAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUobXkuckFGSWQpXG4gICAgICAgIGNvbnNvbGUubG9nKCdjb250aW51b3VzIHJlbG9hZCAjJyArIChteS5sb2FkcyAtIDEpKVxuICAgIFxuICAgIH1cbiAgICBcbiAgICBcbiAgICByQUYocGVyZm9ybWFuY2Uubm93KCkpXG5cbiAgICBcbiAgICBpZiAobG9jYXRpb24uaG9zdG5hbWUgPT09ICdsb2NhbGhvc3QnKSB7XG4gICAgXG4gICAgICAgIChmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgcmVwZWF0KCdjb250aW51b3VzJywgMTAwMCwgZnVuY3Rpb24gKCkge1xuICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuICAgIFxuICAgICAgICAgICAgICAgIGh0dHAub3BlbignR0VUJywgJy9jb250aW51b3VzJywgdHJ1ZSlcbiAgICBcbiAgICAgICAgICAgICAgICBodHRwLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGlmICghSlNPTi5wYXJzZShodHRwLnJlc3BvbnNlVGV4dCkudXBkYXRlKSByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNjcmlwdHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzY3JpcHRzLmxlbmd0aDsgaSsrKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NyaXB0ID0gc2NyaXB0c1tpXVxuICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzY3JpcHQuZ2V0QXR0cmlidXRlKCdjb250aW51b3VzJykpIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdXBkYXRlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0JylcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZS5zZXRBdHRyaWJ1dGUoJ2NvbnRpbnVvdXMnLCBteS5sb2FkcylcbiAgICAgICAgICAgICAgICAgICAgICAgIHVwZGF0ZS5zcmMgPSBzY3JpcHQuc3JjXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFyZW50ID0gc2NyaXB0LnBhcmVudE5vZGVcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChzY3JpcHQpXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodXBkYXRlKVxuICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgXG4gICAgICAgICAgICAgICAgfSlcbiAgICBcbiAgICBcbiAgICAgICAgICAgICAgICBodHRwLnNlbmQoKVxuICAgIFxuICAgICAgICAgICAgfSlcbiAgICBcbiAgICAgICAgfSgpKVxuICAgIFxuICAgIH1cbiAgICBcbiAgIFxuICAgIFxufSBlbHNlIHtcblxuXG5cbiAgICB2YXIgY3AgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJylcbiAgICB2YXIgd2F0Y2ggPSByZXF1aXJlKCdub2RlLXdhdGNoJylcbiAgICB2YXIgaHR0cCA9IHJlcXVpcmUoJ2h0dHAnKTtcblx0dmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcblx0dmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbiAgICBcbiAgICB2YXIgUE9SVCA9IDgwODBcbiAgICB2YXIgdXBkYXRlID0ge31cbiAgICBcbiAgICBcbiAgICBmdW5jdGlvbiBidWlsZCgpIHtcbiAgICBcbiAgICAgICAgY3AuZXhlYygnbnBtIHJ1biByb2xsdXAnLCBmdW5jdGlvbihlcnIsIHN0ZG91dCwgc3RkZXJyKSB7XG4gICAgXG4gICAgICAgICAgICBlcnIgJiYgY29uc29sZS5sb2coZXJyKVxuICAgICAgICAgICAgc3RkZXJyICYmIGNvbnNvbGUubG9nKHN0ZGVycilcbiAgICBcbiAgICAgICAgICAgIGlmICghZXJyICYmICFzdGRlcnIpIHtcbiAgICBcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnPiByb2xsdXAgc3VjY2Vzc2Z1bCcpXG4gICAgICAgICAgICAgICAgdXBkYXRlID0ge3VwZGF0ZTogdHJ1ZX1cbiAgICBcbiAgICAgICAgICAgICAgICBjcC5leGVjKCducG0gcnVuIGNsb3N1cmUnLCBmdW5jdGlvbihlcnIsIHN0ZG91dCwgc3RkZXJyKSB7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIGVyciAmJiBjb25zb2xlLmxvZyhlcnIpXG4gICAgICAgICAgICAgICAgICAgIHN0ZGVyciAmJiBjb25zb2xlLmxvZyhzdGRlcnIpXG4gICAgICAgICAgICAgICAgICAgICFlcnIgJiYgY29uc29sZS5sb2coJz4gY2xvc3VyZSBzdWNjZXNzZnVsJylcbiAgICBcbiAgICAgICAgICAgICAgICB9KVxuICAgIFxuICAgICAgICAgICAgfVxuICAgIFxuICAgICAgICB9KVxuICAgIFxuICAgIH1cbiAgICBcbiAgICB3YXRjaCgnc3JjJywgZnVuY3Rpb24oZmlsZW5hbWUpIHtcbiAgICAgICAgaWYgKCEvXFwuanMkLy50ZXN0KGZpbGVuYW1lKSkgcmV0dXJuXG4gICAgICAgIGJ1aWxkKClcbiAgICB9KVxuXHRcblxuICAgIGh0dHAuY3JlYXRlU2VydmVyKGZ1bmN0aW9uIChyZXF1ZXN0LCByZXNwb25zZSkge1xuXHRcdFxuXHRcdGlmIChyZXF1ZXN0LnVybCA9PT0gJy9jb250aW51b3VzJykge1xuXHRcdFx0XG5cdFx0XHRyZXNwb25zZS53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSlcblx0XHRcdHJlc3BvbnNlLmVuZChKU09OLnN0cmluZ2lmeSh1cGRhdGUpLCAndXRmLTgnKVxuXHRcdFx0dXBkYXRlID0ge31cblx0XHRcdHJldHVyblxuXG5cdFx0fVxuXHRcdFxuXHRcdHZhciBmaWxlcGF0aCA9IHJlcXVlc3QudXJsID09PSAnJyA/ICcuL2luZGV4Lmh0bWwnIDogcmVxdWVzdC51cmxbcmVxdWVzdC51cmwubGVuZ3RoLTFdID09PSAnLycgPyAnLicgKyByZXF1ZXN0LnVybCArICdpbmRleC5odG1sJyA6ICcuJyArIHJlcXVlc3QudXJsXG5cdFx0dmFyIGV4dG5hbWUgPSBwYXRoLmV4dG5hbWUoZmlsZXBhdGgpXG5cdFx0dmFyIGNvbnRlbnRUeXBlID0gJ3RleHQvaHRtbCdcblx0XHRcblx0XHRzd2l0Y2ggKGV4dG5hbWUpIHtcblx0XHRjYXNlICcuanMnOlxuXHRcdFx0Y29udGVudFR5cGUgPSAndGV4dC9qYXZhc2NyaXB0J1xuXHRcdFx0YnJlYWtcblx0XHRjYXNlICcuY3NzJzpcblx0XHRcdGNvbnRlbnRUeXBlID0gJ3RleHQvY3NzJ1xuXHRcdFx0YnJlYWtcblx0XHRjYXNlICcuanNvbic6XG5cdFx0XHRjb250ZW50VHlwZSA9ICdhcHBsaWNhdGlvbi9qc29uJ1xuXHRcdFx0YnJlYWtcblx0XHRjYXNlICcucG5nJzpcblx0XHRcdGNvbnRlbnRUeXBlID0gJ2ltYWdlL3BuZydcblx0XHRcdGJyZWFrICAgIFxuXHRcdGNhc2UgJy5qcGcnOlxuXHRcdFx0Y29udGVudFR5cGUgPSAnaW1hZ2UvanBnJ1xuXHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRmcy5yZWFkRmlsZShmaWxlcGF0aCwgZnVuY3Rpb24oZXJyb3IsIGNvbnRlbnQpIHtcblx0XHRcdGlmIChlcnJvcikge1xuXHRcdFx0XHRpZihlcnJvci5jb2RlID09ICdFTk9FTlQnKSB7XG5cdFx0XHRcdFx0ZnMucmVhZEZpbGUoJy4vNDA0Lmh0bWwnLCBmdW5jdGlvbihlcnJvciwgY29udGVudCkge1xuXHRcdFx0XHRcdFx0cmVzcG9uc2Uud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogY29udGVudFR5cGUgfSlcblx0XHRcdFx0XHRcdHJlc3BvbnNlLmVuZChjb250ZW50LCAndXRmLTgnKVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJlc3BvbnNlLndyaXRlSGVhZCg1MDApXG5cdFx0XHRcdFx0cmVzcG9uc2UuZW5kKCdTb3JyeSwgY2hlY2sgd2l0aCB0aGUgc2l0ZSBhZG1pbiBmb3IgZXJyb3I6ICcrZXJyb3IuY29kZSsnIC4uXFxuJylcblx0XHRcdFx0XHRyZXNwb25zZS5lbmQoKVxuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXNwb25zZS53cml0ZUhlYWQoMjAwLCB7ICdDb250ZW50LVR5cGUnOiBjb250ZW50VHlwZSB9KVxuXHRcdFx0XHRyZXNwb25zZS5lbmQoY29udGVudCwgJ3V0Zi04Jylcblx0XHRcdH1cblx0XHR9KTtcblxuXHR9KS5saXN0ZW4oUE9SVClcblx0XG5cdGNvbnNvbGUubG9nKCc+IGxpc3RlbmluZyBAIGh0dHA6Ly9sb2NhbGhvc3Q6JyArIFBPUlQpXG5cdFxuICAgIGJ1aWxkKClcbiBcbn1cblxuIiwibGV0IGF0X3dvcmsgPSBmYWxzZVxuXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgc2NlbmVfb3BhY2l0eTogICAgYXRfd29yayA/IDAuMDUgOiAxLjAsXG4gIHVuZGVybGF5X29wYWNpdHk6IGF0X3dvcmsgPyAwLjA0IDogMC4yLFxuXG4gIGNlbGxzOiAgICAgICAgICAgIDEwMDAsIC8vMTAwMCxcbiAgcmVnaW9uczogICAgICAgICAgMzIsXG5cbiAgYXBlcnR1cmU6ICAgICAgICAgMzAsXG5cbiAgb3ZlcmRyYXdfbm9ydGg6ICAgMyxcbiAgb3ZlcmRyYXdfZWFzdDogICAgMyxcbiAgb3ZlcmRyYXdfc291dGg6ICAgOCxcbiAgb3ZlcmRyYXdfd2VzdDogICAgMyxcblxuICAvKipcbiAgICogUmVnaW9uc1xuICAgKi9cbiAgcmVnaW9uX3VwZGF0ZXNfbXM6IDE1LFxuICByZWdpb25fYXR0ZW51YXRpb25fbXM6IDE1LFxuXG4gIGF2Z19hZHVsdF9oZWlnaHQ6IDYsXG5cbiAgLyoqXG4gICAqIFRlcnJhaW5cbiAgICovXG4gIGdyb3VuZF9mcmVxdWVuY3k6IDAuMDQsXG4gIHdhdGVyX2FsdGl0dWRlOiAtMC4zLFxuICBoaWdobGFuZF9hbHRpdHVkZTogMC44LFxuICBncmFzc19hbHRpdHVkZV9taW46IC0wLjMsXG4gIGdyYXNzX2FsdGl0dWRlX21heDogMC41LFxuICBncmFzc19kZW5zaXR5OiAwLjUsXG5cbn1cbiIsIi8qKlxuICogUmV0dXJucyBhIG5ldyB7dmVjM30uXG4gKiBAcGFyYW0ge3ZlYzM9fSB2XG4gKiBAcmV0dXJuIHt2ZWMzfVxuICovXG5sZXQgdmVjMyA9ICh2KSA9PiB7XG4gIHJldHVybiB7eDogKHYgJiYgdi54KSA/IHYueCA6IDAsIHk6ICh2ICYmIHYueSkgPyB2LnkgOiAwLCB6OiAodiAmJiB2LnopID8gdi56IDogMH1cbn1cblxuIFxuLyoqXG4gKiBSZXR1cm5zIHRoZSB6ZXJvIHZlY3RvciA8MCwgMCwgMD5cbiAqIEByZXR1cm4ge3ZlYzN9XG4gKi9cbnZlYzMuemVybyA9ICgpID0+IHtcbiAgcmV0dXJuIHt4OiAwLCB5OiAwLCB6OiAwfVxufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgdW5pdCB2ZWN0b3IgPDEsIDEsIDE+XG4gKiBAcmV0dXJuIHt2ZWMzfVxuICovXG52ZWMzLnVuaXQgPSAoKSA9PiB7XG4gIHJldHVybiB7eDogMSwgeTogMSwgejogMX1cbn1cblxuXG52ZWMzLnRvU3RyaW5nID0gKHYpID0+IHtcbiAgbGV0IHN0ciA9IH5+KHYueCAqIDEwMDApIC8gMTAwMFxuICBpZiAodi55ICE9PSAwKSBzdHIgKz0gJywnICsgfn4odi55ICogMTAwMCkgLyAxMDAwXG4gIGlmICh2LnogIT09IDApIHN0ciArPSAnLCcgKyB+fih2LnogKiAxMDAwKSAvIDEwMDBcbiAgcmV0dXJuIHN0clxufVxuXG5cbnZlYzMuZnJvbVN0cmluZyA9IChzdHIpID0+IHtcbiAgbGV0IHh5eiA9IHN0ci5zcGxpdCgnLCcpXG4gIHJldHVybiB2ZWMzKHtcbiAgICB4OiB4eXoubGVuZ3RoID4gMCA/IHBhcnNlRmxvYXQoeHl6WzBdKSA6IDAsXG4gICAgeTogeHl6Lmxlbmd0aCA+IDEgPyBwYXJzZUZsb2F0KHh5elsxXSkgOiAwLFxuICAgIHo6IHh5ei5sZW5ndGggPiAyID8gcGFyc2VGbG9hdCh4eXpbMl0pIDogMFxuICB9KVxufVxuXG5cbnZlYzMuZXF1YWxzID0gKHYxLCB2MikgPT4ge1xuICByZXR1cm4gKCh2Mi54ID09PSB2MS54KSAmJiAodjIueSA9PT0gdjEueSkgJiYgKHYyLnogPT09IHYxLnopKVxufVxuXG5cbnZlYzMuYWRkID0gKHYxLCB2MikgPT4ge1xuICB2MS54ICs9IHYyLnhcbiAgdjEueSArPSB2Mi55XG4gIHYxLnogKz0gdjIuelxuICByZXR1cm4gdjFcbn1cblxuXG52ZWMzLmFkZFZlY3RvcnMgPSAodjEsIHYyKSA9PiB7XG4gIHJldHVybiB2ZWMzLmFkZCh2ZWMzKHYxKSwgdjIpXG59XG5cblxudmVjMy5hZGRTY2FsYXIgPSAodiwgc2NhbGFyKSA9PiB7XG4gIHYueCArPSBzY2FsYXJcbiAgdi55ICs9IHNjYWxhclxuICB2LnogKz0gc2NhbGFyXG4gIHJldHVybiB2XG59XG5cblxudmVjMy5zdWJ0cmFjdCA9ICh2MSwgdjIpID0+IHtcbiAgdjEueCAtPSB2Mi54XG4gIHYxLnkgLT0gdjIueVxuICB2MS56IC09IHYyLnpcbiAgcmV0dXJuIHYxXG59XG5cblxudmVjMy5zdWJ0cmFjdFZlY3RvcnMgPSAodjEsIHYyKSA9PiB7XG4gIHJldHVybiB2ZWMzLnN1YnRyYWN0KHZlYzModjEpLCB2Milcbn1cblxuXG52ZWMzLm11bHRpcGx5ID0gKHYxLCB2MikgPT4ge1xuICB2MS54ICo9IHYyLnhcbiAgdjEueSAqPSB2Mi55XG4gIHYxLnogKj0gdjIuelxuICByZXR1cm4gdjFcbn1cblxuXG52ZWMzLm11bHRpcGx5VmVjdG9ycyA9ICh2MSwgdjIpID0+IHtcbiAgcmV0dXJuIHZlYzMubXVsdGlwbHkodmVjMyh2MSksIHYyKVxufVxuXG5cbnZlYzMubXVsdGlwbHlTY2FsYXIgPSAodiwgc2NhbGFyKSA9PiB7XG4gIHYueCAqPSBzY2FsYXJcbiAgdi55ICo9IHNjYWxhclxuICB2LnogKj0gc2NhbGFyXG4gIHJldHVybiB2XG59XG5cblxudmVjMy5kaXZpZGUgPSAodjEsIHYyKSA9PiB7XG4gIHYxLnggLz0gdjIueFxuICB2MS55IC89IHYyLnlcbiAgdjEueiAvPSB2Mi56XG4gIHJldHVybiB2MVxufVxuXG5cbnZlYzMuZGl2aWRlU2NhbGFyID0gKHYsIHNjYWxhcikgPT4ge1xuICBpZiAoc2NhbGFyICE9PSAwKSB7XG4gICAgdmFyIGludiA9IDEuMCAvIHNjYWxhclxuICAgIHYueCAqPSBpbnZcbiAgICB2LnkgKj0gaW52XG4gICAgdi56ICo9IGludlxuICB9IGVsc2Uge1xuICAgIHYueCA9IDBcbiAgICB2LnkgPSAwXG4gICAgdi56ID0gMFxuICB9XG4gIHJldHVybiB2XG59XG5cblxudmVjMy5jbGFtcCA9ICh2LCBtaW4sIG1heCkgPT4ge1xuICBpZiAodi54IDwgbWluLngpIHtcbiAgICB2LnggPSBtaW4ueFxuICB9IGVsc2UgaWYgKHYueCA+IG1heC54KSB7XG4gICAgdi54ID0gbWF4LnhcbiAgfVxuICBpZiAodi55IDwgbWluLnkpIHtcbiAgICB2LnkgPSBtaW4ueVxuICB9IGVsc2UgaWYgKHYueSA+IG1heC55KSB7XG4gICAgdi55ID0gbWF4LnlcbiAgfVxuICBpZiAodi56IDwgbWluLnopIHtcbiAgICB2LnogPSBtaW4uelxuICB9IGVsc2UgaWYgKHYueiA+IG1heC56KSB7XG4gICAgdi56ID0gbWF4LnpcbiAgfVxuICByZXR1cm4gdlxufVxuXG5cbnZlYzMuZmxvb3IgPSAodikgPT4ge1xuICB2LnggPSBNYXRoLmZsb29yKHYueClcbiAgdi55ID0gTWF0aC5mbG9vcih2LnkpXG4gIHYueiA9IE1hdGguZmxvb3Iodi56KVxuICByZXR1cm4gdlxufVxuXG5cbnZlYzMuY2VpbCA9ICh2KSA9PiB7XG4gIHYueCA9IE1hdGguY2VpbCh2LngpXG4gIHYueSA9IE1hdGguY2VpbCh2LnkpXG4gIHYueiA9IE1hdGguY2VpbCh2LnopXG4gIHJldHVybiB2XG59XG5cblxudmVjMy5yb3VuZCA9ICh2KSA9PiB7XG4gIHYueCA9IE1hdGgucm91bmQodi54KVxuICB2LnkgPSBNYXRoLnJvdW5kKHYueSlcbiAgdi56ID0gTWF0aC5yb3VuZCh2LnopXG4gIHJldHVybiB2XG59XG5cblxudmVjMy5yb3VuZFRvWmVybyA9ICh2KSA9PiB7XG4gIHYueCA9ICh2LnggPCAwKSA/IE1hdGguY2VpbCh2LngpIDogTWF0aC5mbG9vcih2LngpXG4gIHYueSA9ICh2LnkgPCAwKSA/IE1hdGguY2VpbCh2LnkpIDogTWF0aC5mbG9vcih2LnkpXG4gIHYueiA9ICh2LnogPCAwKSA/IE1hdGguY2VpbCh2LnopIDogTWF0aC5mbG9vcih2LnopXG4gIHJldHVybiB2XG59XG5cblxudmVjMy5uZWdhdGUgPSAodikgPT4ge1xuICB2LnggPSAtdi54XG4gIHYueSA9IC12LnlcbiAgdi56ID0gLXYuelxuICByZXR1cm4gdlxufVxuXG5cbnZlYzMuZG90ID0gKHYxLCB2MikgPT4ge1xuICByZXR1cm4gdjEueCAqIHYyLnggKyB2MS55ICogdjIueSArIHYxLnogKiB2Mi56XG59XG5cblxudmVjMy5sZW5TcSA9ICh2KSA9PiB7XG4gIHJldHVybiB2LnggKiB2LnggKyB2LnkgKiB2LnkgKyB2LnogKiB2Lnpcbn1cblxuXG52ZWMzLmxlbiA9ICh2KSA9PiB7XG4gIHJldHVybiBNYXRoLnNxcnQodmVjMy5sZW5TcSh2KSlcbn1cblxuXG52ZWMzLm5vcm1hbGlzZSA9ICh2KSA9PiB7XG4gIHJldHVybiB2ZWMzLmRpdmlkZVNjYWxhcih2LCB2ZWMzLmxlbih2KSlcbn1cblxuXG52ZWMzLmRpc3RhbmNlVG9TcSA9ICh2MSwgdjIpID0+IHtcbiAgdmFyIGR4ID0gdjEueCAtIHYyLnhcbiAgdmFyIGR5ID0gdjEueSAtIHYyLnlcbiAgdmFyIGR6ID0gdjEueiAtIHYyLnpcbiAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5ICsgZHogKiBkelxufVxuXG5cbnZlYzMuZGlzdGFuY2VUbyA9ICh2MSwgdjIpID0+IHtcbiAgcmV0dXJuIE1hdGguc3FydCh2ZWMzLmRpc3RhbmNlVG9TcSh2MSwgdjIpKVxufVxuXG5cbnZlYzMuc2V0TGVuID0gKHYsIGxlbmd0aCkgPT4ge1xuICB2YXIgb2xkTGVuZ3RoID0gdmVjMy5sZW4odilcbiAgaWYgKG9sZExlbmd0aCAhPT0gMCAmJiBsZW5ndGggIT09IG9sZExlbmd0aCkge1xuICAgIHZlYzMubXVsdGlwbHlTY2FsYXIodiwgbGVuZ3RoIC8gb2xkTGVuZ3RoKVxuICB9XG4gIHJldHVybiB2XG59XG5cblxudmVjMy5sZXJwID0gKHYxLCB2MiwgYWxwaGEpID0+IHtcbiAgdjEueCArPSAodjIueCAtIHYxLngpICogYWxwaGFcbiAgdjEueSArPSAodjIueSAtIHYxLnkpICogYWxwaGFcbiAgdjEueiArPSAodjIueiAtIHYxLnopICogYWxwaGFcbiAgcmV0dXJuIHYxXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgdmVjM1xuXG4iLCJpbXBvcnQgdmVjMyBmcm9tICcuL3ZlYzMnXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyB7cmVjdDN9LlxuICogQHBhcmFtIHtyZWN0Mz19IHJcbiAqIEByZXR1cm4ge3JlY3QzfVxuICovXG5sZXQgcmVjdDMgPSAocikgPT4ge1xuICByZXR1cm4ge1xuICAgIG1pbjogciA/IHZlYzMoci5taW4pIDogdmVjMy56ZXJvKCksXG4gICAgbWF4OiByID8gdmVjMyhyLm1heCkgOiB2ZWMzLnplcm8oKVxuICB9XG59XG5cbiBcbi8qKlxuICogUmV0dXJuIHRoZSB6ZXJvIHJlY3RhbmdsZSB7bWluOiB7MCwgMCwgMH0sIG1heDogezAsIDAsIDB9fVxuICogQHJldHVybiB7cmVjdDN9XG4gKi9cbnJlY3QzLnplcm8gPSAoKSA9PiB7XG4gIHJldHVybiB7bWluOiB2ZWMzLnplcm8oKSwgbWF4OiB2ZWMzLnplcm8oKX1cbn1cblxuXG5yZWN0My5mcm9tTWluTWF4ID0gKC8qKnt2ZWMzfSovbWluLCAvKip7dmVjM30qL21heCkgPT4ge1xuICByZXR1cm4ge1xuICAgIG1pbjogdmVjMyhtaW4pLFxuICAgIG1heDogdmVjMyhtYXgpLFxuICB9XG59XG5cblxucmVjdDMuZnJvbU1pbkRpbSA9ICgvKip7dmVjM30qL21pbiwgLyoqe3ZlYzN9Ki9kaW0pID0+IHtcbiAgcmV0dXJuIHtcbiAgICBtaW46IHZlYzMobWluKSxcbiAgICBtYXg6IHZlYzMuYWRkVmVjdG9ycyhtaW4sIGRpbSksXG4gIH1cbn1cblxuXG5yZWN0My5mcm9tQ2VudHJlRGltID0gKC8qKnt2ZWMzfSovY2VudHJlLCAvKip7dmVjM30qL2RpbSkgPT4ge1xuICBsZXQgaGFsZiA9IHZlYzMubXVsdGlwbHlTY2FsYXIodmVjMyhkaW0pLCAwLjUpXG4gIHJldHVybiB7XG4gICAgbWluOiB2ZWMzLnN1YnRyYWN0VmVjdG9ycyhjZW50cmUsIGhhbGYpLFxuICAgIG1heDogdmVjMy5hZGRWZWN0b3JzKGNlbnRyZSwgaGFsZiksXG4gIH1cbn1cblxuXG5yZWN0My5jb250YWlucyA9ICgvKip7dmVjdDN9Ki9yLCAvKip7dmVjM30qL3YpID0+IHtcbiAgaWYgKHYueCA8IHIubWluLnggfHwgdi54ID4gci5tYXgueCkgcmV0dXJuIGZhbHNlXG4gIGlmICh2LnkgPCByLm1pbi55IHx8IHYueSA+IHIubWF4LnkpIHJldHVybiBmYWxzZVxuICBpZiAodi56IDwgci5taW4ueiB8fCB2LnogPiByLm1heC56KSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHRydWVcbn1cblxuXG5yZWN0My53aWR0aCA9ICgvKip7cmVjdDN9Ki9yKSA9PiB7XG4gIHJldHVybiByLm1heC54IC0gci5taW4ueCArIDFcbn1cblxuXG5yZWN0My5oZWlnaHQgPSAoLyoqe3JlY3QzfSovcikgPT4ge1xuICByZXR1cm4gci5tYXgueSAtIHIubWluLnkgKyAxXG59XG5cblxucmVjdDMuaW50ZXJzZWN0cyA9ICgvKip7cmVjdDN9Ki9hLCAvKip7cmVjdDN9Ki9iKSA9PiB7XG4gIGlmIChhLm1heC54IDwgYi5taW4ueCB8fCBhLm1pbi54ID4gYi5tYXgueCB8fCBhLm1heC55IDwgYi5taW4ueSB8fCBhLm1pbi55ID4gYi5tYXgueSB8fCBhLm1heC56IDwgYi5taW4ueiB8fCBhLm1pbi56ID4gYi5tYXgueikge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cblxucmVjdDMuY2VudHJlID0gKC8qKntyZWN0M30qL3IpID0+IHtcbiAgcmV0dXJuIHZlYzMubXVsdGlwbHlTY2FsYXIodmVjMy5hZGRWZWN0b3JzKHIubWluLCByLm1heCksIDAuNSlcbn1cblxuXG5yZWN0My5lbmxhcmdlID0gKC8qKntyZWN0M30qL3IsIC8qKnt2ZWMzfSovZGVsdGEpID0+IHtcbiAgbGV0IGNlbnRyZSA9IHJlY3QzLmNlbnRyZShyKVxuICBsZXQgZGltID0gdmVjMy5hZGRWZWN0b3JzKHZlYzMuc3VidHJhY3RWZWN0b3JzKHIubWF4LCBjZW50cmUpLCBkZWx0YSlcbiAgci5taW4gPSB2ZWMzLnN1YnRyYWN0VmVjdG9ycyhjZW50cmUsIGRpbSlcbiAgci5tYXggPSB2ZWMzLmFkZFZlY3RvcnMoY2VudHJlLCBkaW0pXG4gIHJldHVybiByXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgcmVjdDNcblxuIiwiaW1wb3J0ICcuL2NvbnRpbnVvdXMnXG5pbXBvcnQgdmVjMyBmcm9tICcuL3ZlYzMnXG5cbi8qZ2xvYmFsIFBJWEkqL1xuXG5sZXQgZGlzcGxheSA9IHt9XG5cblxuZGlzcGxheS53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoICsgMVxuZGlzcGxheS5oZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQgKyAxXG5cblxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBpbWFnZSBmb3IgdXNlIGFzIGEgc3ByaXRlLlxuICogQHBhcmFtIHtzdHJpbmd9IGltYWdlXG4gKi9cbmRpc3BsYXkucmVnaXN0ZXIgPSAoaW1hZ2UpID0+IHtcblxuICBpZiAoIW15LnNwcml0ZXNCaW4uaGFzT3duUHJvcGVydHkoaW1hZ2UpKSB7XG4gICAgbXkuc3ByaXRlc0JpbltpbWFnZV0gPSBbXVxuICB9XG5cbiAgaWYgKCFteS5zcHJpdGVzVXNlZC5oYXNPd25Qcm9wZXJ0eShpbWFnZSkpIHtcbiAgICBteS5zcHJpdGVzVXNlZFtpbWFnZV0gPSBbXVxuICB9XG5cbiAgbXkubmV4dFNwcml0ZVtpbWFnZV0gPSBteS5uZXh0U3ByaXRlW2ltYWdlXSB8fCAwXG5cbn1cblxuXG5cbi8qKlxuICogQWxsb2NhdGVzIGEgc3ByaXRlIHRvIGJlIGRpc3BsYXllZCBvbiB0aGUgbmV4dCBkaXNwbGF5LnVwZGF0ZSgpXG4gKiBAcGFyYW0ge2VudGl0eX0gZW50XG4gKiBAcGFyYW0ge3ZlYzN9IHBvc2l0aW9uXG4gKiBAcGFyYW0ge251bWJlcn0gb3BhY2l0eVxuICogQHBhcmFtIHtudW1iZXJ9IHRpbnRcbiAqLyBcbmRpc3BsYXkuc3ByaXRlID0gKGVudCwgcG9zaXRpb24sIG9wYWNpdHksIHRpbnQpID0+IHtcblxuICBsZXQgc3ByaXRlXG4gIGxldCBzcHJpdGVzVXNlZCA9IG15LnNwcml0ZXNVc2VkW2VudC5pbWFnZV1cbiAgbGV0IHNwcml0ZUluZGV4ID0gbXkubmV4dFNwcml0ZVtlbnQuaW1hZ2VdXG5cbiAgaWYgKHNwcml0ZUluZGV4IDwgc3ByaXRlc1VzZWQubGVuZ3RoKSB7XG4gICAgc3ByaXRlID0gc3ByaXRlc1VzZWRbc3ByaXRlSW5kZXhdXG4gICAgKytteS5uZXh0U3ByaXRlW2VudC5pbWFnZV1cbiAgfSBlbHNlIHtcbiAgICBpZiAobXkuc3ByaXRlc0JpbltlbnQuaW1hZ2VdLmxlbmd0aCkge1xuICAgICAgc3ByaXRlID0gbXkuc3ByaXRlc0JpbltlbnQuaW1hZ2VdLnBvcCgpXG4gICAgfSBlbHNlIHtcbiAgICAgIHNwcml0ZSA9IFBJWElbJ1Nwcml0ZSddWydmcm9tSW1hZ2UnXShlbnQuaW1hZ2UpXG4gICAgICBzcHJpdGUuYW5jaG9yLnggPSAwLjVcbiAgICAgIHNwcml0ZS5hbmNob3IueSA9IDAuNSBcbiAgICB9XG4gICAgc3ByaXRlc1VzZWQucHVzaChzcHJpdGUpXG4gICAgKytteS5uZXh0U3ByaXRlW2VudC5pbWFnZV1cbiAgICBteS5yb290WydhZGRDaGlsZCddKHNwcml0ZSlcbiAgfVxuXG4gIGxldCBzaXplID0gdmVjMy5tdWx0aXBseVZlY3RvcnMoZ2xvYmFsLnBpeGVsc19wZXJfY2VsbCwgZW50LnNpemUpXG5cbiAgc3ByaXRlLndpZHRoID0gc2l6ZS54XG4gIHNwcml0ZS5oZWlnaHQgPSBzaXplLnlcblxuICBsZXQgcG9zID0gdmVjMy5tdWx0aXBseSh2ZWMzLmFkZFZlY3RvcnMoZW50Lm9mZnNldCwgdmVjMy5tdWx0aXBseVZlY3RvcnMoZW50LmFuY2hvciwgZW50LnNpemUpKSwgZ2xvYmFsLnBpeGVsc19wZXJfY2VsbClcbiAgdmVjMy5hZGQocG9zLCBwb3NpdGlvbilcblxuICBzcHJpdGUucG9zaXRpb24ueCA9IHBvcy54XG4gIHNwcml0ZS5wb3NpdGlvbi55ID0gcG9zLnlcblxuICBpZiAodHlwZW9mIHRpbnQgIT09ICd1bmRlZmluZWQnKSBzcHJpdGVbJ3RpbnQnXSA9IHRpbnRcbiAgaWYgKHR5cGVvZiBvcGFjaXR5ICE9PSAndW5kZWZpbmVkJykgc3ByaXRlLmFscGhhID0gb3BhY2l0eVxuXG59XG5cblxuLyoqXG4gKiBVcGRhdGVzIGFsbCBvbi1zY3JlZW4ge2Rpc3BsYXl9cy5cbiAqL1xuZGlzcGxheS51cGRhdGUgPSAoKSA9PiB7XG5cbiAgZm9yIChsZXQgaW1hZ2UgaW4gbXkuc3ByaXRlc1VzZWQpIHtcblxuICAgIGxldCBzcHJpdGVzQmluID0gbXkuc3ByaXRlc0JpbltpbWFnZV1cbiAgICBsZXQgc3ByaXRlc1VzZWQgPSBteS5zcHJpdGVzVXNlZFtpbWFnZV1cbiAgICBsZXQgc3ByaXRlSW5kZXggPSBteS5uZXh0U3ByaXRlW2ltYWdlXVxuXG4gICAgd2hpbGUgKHNwcml0ZUluZGV4IDwgc3ByaXRlc1VzZWQubGVuZ3RoKSB7XG4gICAgICBsZXQgc3ByaXRlID0gc3ByaXRlc1VzZWQucG9wKClcbiAgICAgIG15LnJvb3RbJ3JlbW92ZUNoaWxkJ10oc3ByaXRlKVxuICAgICAgc3ByaXRlc0Jpbi5wdXNoKHNwcml0ZSlcbiAgICB9XG5cbiAgICBteS5uZXh0U3ByaXRlW2ltYWdlXSA9IDBcblxuICB9XG5cbiAgbXkucmVuZGVyZXJbJ3JlbmRlciddKG15LnJvb3QpXG5cbn1cblxuXG5cblBJWElbJ1NDQUxFX01PREVTJ11bJ0RFRkFVTFQnXSA9IFBJWElbJ1NDQUxFX01PREVTJ11bJ05FQVJFU1QnXVxuUElYSVsndXRpbHMnXVsnX3NhaWRIZWxsbyddID0gdHJ1ZVxuXG5sZXQgZ2xvYmFsID0gdmFsKCdnbG9iYWwnKVxubGV0IG15ID0gdmFsKCdkaXNwbGF5JylcblxuXG5teS5yZW5kZXJlciA9IG15LnJlbmRlcmVyIHx8IG5ldyBQSVhJWydXZWJHTFJlbmRlcmVyJ10oZGlzcGxheS53aWR0aCwgZGlzcGxheS5oZWlnaHQsIHsndHJhbnNwYXJlbnQnOiB0cnVlfSlcbm15LnJvb3QgPSBteS5yb290IHx8IG5ldyBQSVhJWydTcHJpdGUnXSgpXG5teS5zcHJpdGVzQmluID0gbXkuc3ByaXRlc0JpbiB8fCB7fVxubXkuc3ByaXRlc1VzZWQgPSBteS5zcHJpdGVzVXNlZCB8fCAge31cbm15Lm5leHRTcHJpdGUgPSBteS5uZXh0U3ByaXRlIHx8IHt9XG5cblxub25jZSgnZGlzcGxheScsICgpID0+IHtcblxuICBsZXQgYm9keSA9IGRvY3VtZW50LmJvZHkuc3R5bGVcbiAgYm9keS5vdmVyZmxvdyA9ICdoaWRkZW4nXG4gIGJvZHkubWFyZ2luID0gYm9keS5wYWRkaW5nID0gJzAnXG5cbiAgbGV0IHJlbmRlcmVyID0gbXkucmVuZGVyZXJbJ3ZpZXcnXS5zdHlsZVxuICByZW5kZXJlci5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbiAgcmVuZGVyZXIud2lkdGggPSAnMTAwJSdcbiAgcmVuZGVyZXIuaGVpZ2h0ID0gJzEwMCUnXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQobXkucmVuZGVyZXJbJ3ZpZXcnXSlcblxuICBsaXN0ZW4od2luZG93LCAncmVzaXplJywgMTAwLCAoKSA9PiB7XG4gICAgbXkucmVuZGVyZXIucmVzaXplKE1hdGgubWF4KDAsIHdpbmRvdy5pbm5lcldpZHRoKSArIDEsIE1hdGgubWF4KDAsIHdpbmRvdy5pbm5lckhlaWdodCkgKyAxKVxuICB9KVxuXG59KVxuXG5cbmV4cG9ydCBkZWZhdWx0IGRpc3BsYXlcblxuIiwiaW1wb3J0ICcuL2NvbnRpbnVvdXMnXG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyB7ZWZmZWN0fS5cbiAqIEBwYXJhbSB7ZW50aXR5fSBlZnRcbiAqIEByZXR1cm4ge2VmZmVjdH1cbiAqL1xubGV0IGVmZmVjdCA9IChlZnQpID0+IHtcblxuICBlZnQgPSBlZnQgfHwge31cblxuICBpZiAoIW15LmNyZWF0ZXMuaGFzT3duUHJvcGVydHkoZWZ0LnR5cGUpKSByZXR1cm5cblxuICBlZnQgPSB7XG4gICAgaWQ6IC8qKntudW1iZXJ9Ki9udWxsLFxuICAgIHR5cGU6IC8qKntzdHJpbmd9Ki9lZnQudHlwZSxcbiAgICBlbnRpdHk6IC8qKntlbnRpdHl9Ki9lZnQuZW50aXR5LFxuICAgIGV4dHJhczogLyoqe29iamVjdH0qL2VmdC5leHRyYXMsXG4gICAgdGltZXN0YW1wOiAvKip7bnVtYmVyfSovZ2xvYmFsLnRpbWVzdGFtcCxcbiAgICBkZXN0cm95ZWQ6IGZhbHNlXG4gIH1cblxuICAvLyBpZiB0aGUgY3JlYXRlIGZ1bmN0aW9uIGRvZXNuJ3Qgd2FudCBpdCBjcmVhdGVkOyB0aGFuIGFib3J0XG4gIGlmICghbXkuY3JlYXRlc1tlZnQudHlwZV0oZWZ0KSkgcmV0dXJuXG5cbiAgLy8gZW5zdXJlIHVuaXF1ZSBpZFxuICB3aGlsZSAoIWVmdC5pZCB8fCBteS5lZmZlY3RzLmhhc093blByb3BlcnR5KGVmdC5pZCkpIHtcbiAgICBlZnQuaWQgPSB+fihNYXRoLnJhbmRvbSgpKjE2Nzc3MjE2KVxuICB9XG5cbiAgLy8gYWRkIG5ldyBlZmZlY3QgdG8gbWFwXG4gIG15LmVmZmVjdHNbZWZ0LmlkXSA9IGVmdFxuXG4gIC8vIGFkZCBlZmZlY3QgdG8gZW50aXRpZXMgb3duIGxpc3Qgb2YgRWZmZWN0cyBhcHBsaWVkIHRvIGl0XG4gIGVmdC5lbnRpdHkuZWZmZWN0cy5wdXNoKGVmdClcblxuICByZXR1cm4gZWZ0XG5cbn1cblxuXG5lZmZlY3QudHlwZSA9ICh0eXBlLCBjcmVhdGUsIHVwZGF0ZSwgZGVzdHJveSkgPT4ge1xuICBteS5jcmVhdGVzW3R5cGVdID0gY3JlYXRlXG4gIG15LnVwZGF0ZXNbdHlwZV0gPSB1cGRhdGVcbiAgbXkuZGVzdHJveXNbdHlwZV0gPSBkZXN0cm95XG59XG5cblxuZWZmZWN0LnVwZGF0ZSA9IChlZnQpID0+IHtcbiAgbXkudXBkYXRlc1tlZnQudHlwZV0oZWZ0KVxuICBlZnQudGltZXN0YW1wID0gZ2xvYmFsLnRpbWVzdGFtcFxufVxuXG5cbmVmZmVjdC5kZXN0cm95ID0gKGVmdCkgPT4ge1xuICBpZiAoIW15LmVmZmVjdHMuaGFzT3duUHJvcGVydHkoZWZ0LmlkKSkgcmV0dXJuXG4gIGRlbGV0ZSBteS5lZmZlY3RzW2VmdC5pZF1cbiAgbXkuZGVzdHJveXNbZWZ0LnR5cGVdKGVmdCkgXG4gIGxldCBpbmRleCA9IGVmdC5lbnRpdHkuZWZmZWN0cy5pbmRleE9mKGVmdClcbiAgaWYgKGluZGV4ID4gLTEpIGVmdC5lbnRpdHkuZWZmZWN0cy5zcGxpY2UoaW5kZXgsIDEpXG4gIGVmdC5kZXN0cm95ZWQgPSB0cnVlXG59XG5cblxubGV0IG15ID0gdmFsKCdlZmZlY3QnKVxubGV0IGdsb2JhbCA9IHZhbCgnZ2xvYmFsJylcblxubXkuZWZmZWN0cyA9IG15LmVmZmVjdHMgfHwge31cbm15LmNyZWF0ZXMgPSBteS5jcmVhdGVzIHx8IHt9XG5teS51cGRhdGVzID0gbXkudXBkYXRlcyB8fCB7fVxubXkuZGVzdHJveXMgPSBteS5kZXN0cm95cyB8fCB7fVxuXG5cbmV4cG9ydCBkZWZhdWx0IGVmZmVjdFxuXG4iLCJpbXBvcnQgJy4vY29udGludW91cydcbmltcG9ydCB2ZWMzIGZyb20gJy4vdmVjMydcbmltcG9ydCBjZWxscyBmcm9tICcuL2NlbGxzJ1xuaW1wb3J0IGVmZmVjdCBmcm9tICcuL2VmZmVjdCdcbmltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgZGlzcGxheSBmcm9tICcuL2Rpc3BsYXknXG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IHtlbnRpdHl9LlxuICogQHBhcmFtIHtlbnRpdHk9fSBlbnRcbiAqIEByZXR1cm4ge2VudGl0eX1cbiAqL1xubGV0IGVudGl0eSA9IChlbnQpID0+IHtcblxuICBlbnQgPSBlbnQgfHwge31cblxuICBsZXQgZnJvbVN0cmluZyA9IGVudC5mcm9tU3RyaW5nXG5cbiAgaWYgKGZyb21TdHJpbmcpIHtcbiAgICBmcm9tU3RyaW5nID0gZnJvbVN0cmluZy5zcGxpdCgnXCInKVxuICAgIGVudC50eXBlID0gZnJvbVN0cmluZ1swXVxuICAgIGVudC5vZmZzZXQgPSB2ZWMzLmZyb21TdHJpbmcoZnJvbVN0cmluZ1sxXSlcbiAgICBlbnQuc2l6ZSA9IHZlYzMuZnJvbVN0cmluZyhmcm9tU3RyaW5nWzJdKVxuICAgIGVudC5iYXNlTW92ZW1lbnRTcGVlZCA9IHBhcnNlRmxvYXQoZnJvbVN0cmluZ1szXSlcbiAgfVxuIFxuICBpZiAoIW15LmNyZWF0ZXMuaGFzT3duUHJvcGVydHkoZW50LnR5cGUpKSB7XG4gICAgY29uc29sZS53YXJuKGVudC50eXBlICsgJyBpcyBub3QgYSBrbm93biB0eXBlIG9mIGVudGl0eScpXG4gICAgcmV0dXJuXG4gIH1cblxuICBlbnQgPSB7XG5cbiAgICBpZDogLyoqe251bWJlcn0qL251bGwsXG5cbiAgICB0eXBlOiAvKip7c3RyaW5nfSovZW50LnR5cGUsXG5cbiAgICAvLyB0aGUge2NlbGx9IHRoaXMgZW50IGlzIGFuY2hvcmVkIHRvXG4gICAgY2VsbDogLyoqe2NlbGx9Ki9lbnQuY2VsbCxcblxuICAgIC8vIG9mZnNldCBpcyB0aGUgcG9zaXRpb24gb2YgdGhlIGVudGl0aWVzIHJlbGF0aXZlIHRvIGl0cyBjZWxscyBjZW50cmUgXG4gICAgLy8gZGlzdGFuY2VzIGdyZWF0ZXIgdGhhbiAwLjUgd2lsbCBtb3ZlIHRoZSBlbnQgdG8gdGhlIGFwcHJvcHJpYXRlIG5laWdoYm91clxuICAgIG9mZnNldDogLyoqe3ZlYzN9Ki92ZWMzKGVudC5vZmZzZXQpLFxuXG4gICAgcm90YXRpb246IC8qKntudW1iZXJ9Ki8wLFxuXG4gICAgLy8gc2l6ZSByZWxhdGl2ZSB0byB0aGUgc2l6ZSBvZiBhIGNlbGwuIGkuZS4gMS4wLCAxLjAgbWF0Y2hlcyB0aGUgZGltZW5zaW9ucyBvZiBvbmUgd2hvbGUgY2VsbFxuICAgIHNpemU6IC8qKnt2ZWMzfSovZW50LnNpemUgPyB2ZWMzKGVudC5zaXplKSA6IHZlYzMudW5pdCgpLFxuXG4gICAgLy8gYW5jaG9yIGlzIGNlbnRyZSBvZiBlbnRpdGllcyBpbWFnZSByZWxhdGl2ZSB0byB0aGUgb2Zmc2V0LiBpLmUuIDAuMCwgMC4wIGlzIGNlbnRyZVxuICAgIGFuY2hvcjogLyoqe3ZlYzN9Ki92ZWMzKGVudC5hbmNob3IpLFxuXG4gICAgLy8gY29sbGlkZSBpcyB0aGUgZGltZW5zaW9ucyBvZiB0aGUgZW50aXRpZXMgY29sbGlzaW9uIHNwYWNlLiBpLmUuIDAuNSwgMC41IGlzIGhhbGYgd2lkdGgsIGhhbGYgaGVpZ2h0XG4gICAgLy8gY29sbGlkZSBjYW4gYmUgbnVsbCBmb3Igbm90IGNvbGxpZGFibGVcbiAgICBjb2xsaWRlOiAvKip7dmVjMz19Ki9lbnQuY29sbGlkZSA/IHZlYzMoZW50LmNvbGxpZGUpIDogbnVsbCxcblxuICAgIGNvbGxpc2lvbkFyZWE6IC8qKntjZWxsW119Ki9bXSxcbiBcbiAgICBpbWFnZTogLyoqe3N0cmluZ30qLycvZGF0YS9zcHJpdGUvJyArIGVudC50eXBlICsgJy5wbmcnLFxuXG4gICAgYmFzZU1vdmVtZW50U3BlZWQ6IC8qKntudW1iZXJ9Ki9lbnQuYmFzZU1vdmVtZW50U3BlZWQgfHwgMCxcbiAgICBtb3ZlbWVudFNwZWVkTW9kaWZpZXJzOiAvKipbZnVuY3Rpb25dKi9bXSxcbiAgICBtb3ZlbWVudFNwZWVkOiAvKip7bnVtYmVyfSovZW50LmJhc2VNb3ZlbWVudFNwZWVkIHx8IDAsXG5cbiAgICBlZmZlY3RzOiAvKip7ZWZmZWN0W119Ki9bXVxuXG4gIH1cblxuICAvLyBpZiB0aGUgY3JlYXRlIGZ1bmN0aW9uIGRvZXNuJ3Qgd2FudCBpdCBjcmVhdGVkOyB0aGFuIGFib3J0XG4gIGlmICghbXkuY3JlYXRlc1tlbnQudHlwZV0oZW50LCBmcm9tU3RyaW5nKSkgcmV0dXJuXG5cbiAgLy8gZW5zdXJlIHVuaXF1ZSBpZFxuICB3aGlsZSAoIWVudC5pZCB8fCBteS5lbnRpdGllcy5oYXNPd25Qcm9wZXJ0eShlbnQuaWQpKSB7XG4gICAgZW50LmlkID0gfn4oTWF0aC5yYW5kb20oKSoxNjc3NzIxNilcbiAgfVxuXG4gIC8vIGFkZCBuZXcgZW50aXR5IHRvIG1hcFxuICBteS5lbnRpdGllc1tlbnQuaWRdID0gZW50XG4gXG4gIC8vIGFkZCBlbnRpdHkgdG8gY2VsbHMgXG4gIGlmIChlbnQuY2VsbCAmJiAhY2VsbHMuYWRkRW50aXR5KGVudC5jZWxsLm93bmVyLCBlbnQsIGVudC5jZWxsKSkge1xuICAgIGNvbnNvbGUud2FybihlbnQudHlwZSArICcgd2FzIG5vdCBhZGRlZCB0byBjZWxsIGR1ZSB0byBjb2xsaXNpb24nKVxuICB9XG5cbiAgcmV0dXJuIGVudFxuXG59XG5cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSB0eXBlIG9mIGVudGl0eS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlXG4gKiBAcGFyYW0ge2Z1bmN0b259IGNyZWF0ZSBmdW5jdGlvblxuICogQHBhcmFtIHtmdW5jdGlvbn0gdG9TdHJpbmcgZnVuY3Rpb25cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHVwZGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIHtmdW5jdGlvbn0gZGVzdHJveSBmdW5jdGlvblxuICovXG5lbnRpdHkudHlwZSA9ICh0eXBlLCBjcmVhdGUsIHRvU3RyaW5nLCB1cGRhdGUsIGRlc3Ryb3kpID0+IHtcblxuICBteS5jcmVhdGVzW3R5cGVdID0gY3JlYXRlXG4gIG15LnRvU3RyaW5nc1t0eXBlXSA9IHRvU3RyaW5nXG4gIG15LnVwZGF0ZXNbdHlwZV0gPSB1cGRhdGVcbiAgbXkuZGVzdHJveXNbdHlwZV0gPSBkZXN0cm95XG5cbiAgZGlzcGxheS5yZWdpc3RlcignL2RhdGEvc3ByaXRlLycgKyB0eXBlICsgJy5wbmcnKVxuXG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBlbnRpdHkuXG4gKiBAcGFyYW0ge2VudGl0eX0gZW50XG4gKiBAcmV0dXJuIHtzdHJpbmd9XG4gKi9cbmVudGl0eS50b1N0cmluZyA9IChlbnQpID0+IHtcblxuICByZXR1cm4gbXkudG9TdHJpbmdzW2VudC50eXBlXShlbnQsIFtcbiAgICBlbnQudHlwZSxcbiAgICB2ZWMzLnRvU3RyaW5nKGVudC5vZmZzZXQpLFxuICAgIHZlYzMudG9TdHJpbmcoZW50LnNpemUpLFxuICAgIH5+KGVudC5iYXNlTW92ZW1lbnRTcGVlZClcbiAgXS5qb2luKCdcIicpKVxuXG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IGVudGl0eSBjb25zdHJ1Y3RlZCBmcm9tIHRoZSBnaXZlbiBzdHJpbmcgZGVzY3JpcHRpb24gYW5kIGFkZGVkIHRvIHRoZSB7Y2VsbH0gaWYgcHJvdmlkZWQuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyXG4gKiBAcGFyYW0ge2NlbGx9IGNsbFxuICogQHJldHVybiB7ZW50aXR5fVxuICovXG5lbnRpdHkuZnJvbVN0cmluZyA9IChzdHIsIGNsbCkgPT4ge1xuICByZXR1cm4gZW50aXR5KHtmcm9tU3RyaW5nOiBzdHIsIGNlbGw6IGNsbH0pXG59XG5cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBnaXZlbiBlbnRpdGllcyBzdGF0ZS5cbiAqIEBwYXJhbSB7ZW50aXR5fSBlbnRcbiAqL1xuZW50aXR5LnVwZGF0ZSA9IChlbnQpID0+IHtcblxuICBmb3IgKGxldCBlZnQgaW4gZW50LmVmZmVjdHMpIHtcbiAgICBlZmZlY3QudXBkYXRlKGVudC5lZmZlY3RzW2VmdF0pXG4gIH1cblxuICBteS51cGRhdGVzW2VudC50eXBlXShlbnQpXG5cbn1cblxuXG4vKipcbiAqIERlc3Ryb3lzIHRoZSBnaXZlbiBlbnRpdHkuXG4gKiBAcGFyYW0ge2VudGl0eX0gZW50XG4gKi9cbmVudGl0eS5kZXN0cm95ID0gKGVudCkgPT4ge1xuXG4gIGlmICghbXkuZW50aXRpZXMuaGFzT3duUHJvcGVydHkoZW50LmlkKSkge1xuICAgIGNvbnNvbGUud2FybihlbnQuaWQgKyAnIGlzIG5vdCBhIGtub3duIGVudGl0eScpXG4gICAgcmV0dXJuXG4gIH1cblxuICBkZWxldGUgbXkuZW50aXRpZXNbZW50LmlkXVxuICBteS5kZXN0cm95c1tlbnQudHlwZV0oZW50KSBcbiAgY2VsbHMucmVtb3ZlRW50aXR5KGVudClcbiAgZW50LmRlc3Ryb3llZCA9IHRydWVcblxufVxuXG5cbi8qKlxuICogRGVzdHJveSBhbGwgZW50aXRpZXMuXG4gKi9cbmVudGl0eS5kZXN0cm95QWxsID0gKCkgPT4ge1xuICBsZXQgZW50aXR5SWRzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMobXkuZW50aXRpZXMpXG4gIHdoaWxlIChlbnRpdHlJZHMubGVuZ3RoKSB7XG4gICAgZW50aXR5LmRlc3Ryb3kobXkuZW50aXRpZXNbZW50aXR5SWRzLnBvcCgpXSlcbiAgfVxufVxuXG5cbiBcbmxldCBteSA9IHZhbCgnZW50JylcblxubXkuZW50aXRpZXMgPSBteS5lbnRpdGllcyB8fCB7fVxubXkuY3JlYXRlcyA9IG15LmNyZWF0ZXMgfHwge31cbm15LnRvU3RyaW5ncyA9IG15LnRvU3RyaW5ncyB8fCB7fVxubXkudXBkYXRlcyA9IG15LnVwZGF0ZXMgfHwge31cbm15LmRlc3Ryb3lzID0gbXkuZGVzdHJveXMgfHwge31cblxuXG5cbmV4cG9ydCBkZWZhdWx0IGVudGl0eVxuXG4iLCJpbXBvcnQgJy4vY29udGludW91cydcbmltcG9ydCB2ZWMzIGZyb20gJy4vdmVjMydcbmltcG9ydCBjb25maWcgZnJvbSAnLi9jb25maWcnXG5pbXBvcnQgZW50aXR5IGZyb20gJy4vZW50aXR5J1xuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyB7Y2VsbHN9LlxuICogQHBhcmFtIHtjZWxscz19IGNsbHMge1xuICogICAgICAgICAgICBzaXplOiB7dmVjM30gW2RlZmF1bHQge3g6IDEwMDAsIHk6IDEwMDAsIHo6IDB9XSxcbiAqICAgICAgICAgICAgcmVnaW9uU2l6ZToge251bWJlcn0gW2RlZmF1bHQgMzJdLFxuICogICAgICAgICAgfSBcbiAqIEByZXR1cm4ge2NlbGxzfVxuICovXG5sZXQgY2VsbHMgPSAoY2xscykgPT4ge1xuXG4gIGNsbHMgPSBjbGxzIHx8IHt9XG5cbiAgY2xscyA9IHtcbiAgICBzaXplOiAoIWNsbHMuc2l6ZSkgPyB7eDogMTAwMCwgeTogMTAwMCwgejogMH0gOiB2ZWMzKGNsbHMuc2l6ZSksXG4gICAgcmVnaW9uU2l6ZTogKCFjbGxzLnJlZ2lvblNpemUpID8gMzIgOiBjbGxzLnJlZ2lvblNpemUsXG4gICAgY2VsbDogW10sXG4gICAgcmVnaW9uczoge30sXG4gICAgZGlydHlSZWdpb25zOiB7fSxcbiAgICB1bnJlZ2lvbmVkQ2VsbHM6IFtdLFxuICAgIGRpcnR5Q2VsbHM6IFtdXG4gIH1cblxuICBsZXQgbWF4eCA9IGNsbHMuc2l6ZS54IC0gMVxuICBsZXQgbWF4eSA9IGNsbHMuc2l6ZS55IC0gMVxuXG4gIGZvciAobGV0IHkgPSAwOyB5IDw9IG1heHk7ICsreSkge1xuICAgIGZvciAobGV0IHggPSAwOyB4IDw9IG1heHg7ICsreCkge1xuICAgICAgY2xscy5jZWxsW3kgKiBjbGxzLnNpemUueCArIHhdID0gY2VsbChjbGxzLCB4LCB5KVxuICAgIH1cbiAgfVxuXG4gIGZvciAobGV0IHkgPSAwOyB5IDw9IG1heHk7ICsreSkge1xuICAgIGZvciAobGV0IHggPSAwOyB4IDw9IG1heHg7ICsreCkge1xuICAgICAgbGV0IGNsbCA9IGNsbHMuY2VsbFt5ICogY2xscy5zaXplLnggKyB4XVxuICAgICAgaWYgKHkgPiAwKSBjbGwubm9ydGggPSBjbGxzLmNlbGxbKHkgLSAxKSAqIGNsbHMuc2l6ZS54ICsgeF1cbiAgICAgIGlmICh4IDwgbWF4eCkgY2xsLmVhc3QgPSBjbGxzLmNlbGxbeSAqIGNsbHMuc2l6ZS54ICsgeCArIDFdXG4gICAgICBpZiAoeSA8IG1heHkpIGNsbC5zb3V0aCA9IGNsbHMuY2VsbFsoeSArIDEpICogY2xscy5zaXplLnggKyB4XVxuICAgICAgaWYgKHggPiAwKSBjbGwud2VzdCA9IGNsbHMuY2VsbFt5ICogY2xscy5zaXplLnggKyB4IC0gMV1cbiAgICAgIGNsbC5yZWdpb24gPSByZWdpb24oe293bmVyOiBjbGxzLCBpZDogY2xsLnJlZ2lvbkhhc2h9KVxuICAgICAgY2xsLnJlZ2lvbi5jZWxscy5wdXNoKGNsbClcbiAgICB9XG4gIH1cblxuICBsZXQgcmVnaW9uSWRzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoY2xscy5yZWdpb25zKVxuICBmb3IgKGxldCBpIGluIHJlZ2lvbklkcykgY2xscy5kaXJ0eVJlZ2lvbnNbcmVnaW9uSWRzW2ldXSA9IG51bGxcbiAgcmVnaW9uLnVwZGF0ZURpcnR5KGNsbHMpXG5cbiAgcmV0dXJuIGNsbHNcblxufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUge2NlbGx9IGF0IHgsIHkgb2YgdGhlIGdpdmVuIHtjZWxsc30uXG4gKiBAcGFyYW0ge2NlbGxzfSBjbGxzXG4gKiBAcGFyYW0ge251bWJlcn0geFxuICogQHBhcmFtIHtudW1iZXJ9IHlcbiAqIEByZXR1cm4ge2NlbGx9XG4gKi9cbmNlbGxzLmdldENlbGwgPSAoY2xscywgeCwgeSkgPT4ge1xuICBpZiAoeCA8IDAgfHwgeCA+PSBjbGxzLnNpemUueCB8fCB5IDwgMCB8fCB5ID49IGNsbHMuc2l6ZS55KSByZXR1cm5cbiAgcmV0dXJuIGNsbHMuY2VsbFt5ICogY2xscy5zaXplLnggKyB4XVxufVxuXG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiB7Y2VsbH0gaXMgb3Blbjsgb3RoZXJ3aXNlIGZhbHNlLlxuICogQHBhcmFtIHtjZWxsfSBjbGxcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNlbGxzLmlzT3BlbiA9IChjbGwpID0+IHtcbiAgaWYgKCFjbGwgfHwgY2xsLmNvbGxpc2lvbikgcmV0dXJuIGZhbHNlXG4gIHJldHVybiB0cnVlXG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB0eXBlIGNvZGUgb2YgdGhlIHJlZ2lvbiB0aGUgZ2l2ZW4ge2NlbGx9IGlzIGluLlxuICogQHBhcmFtIHtjZWxsfSBjbGxcbiAqIEByZXR1cm4ge251bWJlcn1cbiAqICAgIDAgLSBvcGVuIHJlZ2lvblxuICogICAgMSAtIG9ic3RpY2xlXG4gKi9cbmNlbGxzLnJlZ2lvblR5cGUgPSAoY2xsKSA9PiB7XG4gIGlmIChjbGwuY29sbGlzaW9uKSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIGJvdGgge2NlbGx9J3MgY2FuIGJlIGluIHRoZSBzYW1lIHtyZWdpb259LlxuICogQHBhcmFtIHtjZWxsfSBhXG4gKiBAcGFyYW0ge2NlbGx9IGJcbiAqIEByZXR1cm4ge2Jvb2xlYW59XG4gKi9cbmNlbGxzLmNhblNoYXJlU2FtZVJlZ2lvbiA9IChhLCBiKSA9PiB7XG4gIHJldHVybiBhLnJlZ2lvbkhhc2ggPT09IGIucmVnaW9uSGFzaCAmJiBhLmNvbGxpc2lvbiA9PT0gYi5jb2xsaXNpb25cbn1cblxuXG4vKipcbiAqIEFkZHMgdGhlIGdpdmVuIHtlbnRpdHl9IHRvIHRoZSBnaXZlbiB7Y2VsbHN9LlxuICogSWYgYSB7Y2VsbH0gaXMgbm90IHNwZWNpZmllZCB0aGUge2VudGl0eX0gaXMgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIGNlbnRyZSBjZWxsIG9mIHtjZWxsc30uXG4gKiBAcGFyYW0ge2NlbGxzfSBjbGxzXG4gKiBAcGFyYW0ge2VudGl0eX0gZW50XG4gKiBAcGFyYW0ge2NlbGw9fSBjbGxcbiAqL1xuY2VsbHMuYWRkRW50aXR5ID0gKGNsbHMsIGVudCwgY2xsKSA9PiB7XG5cbiAgaWYgKCFjbGwpIGNsbCA9IGVudC5jZWxsXG5cbiAgLy8gZmluZCBjZW50cmUgY2VsbCBpZiB3ZSB3ZXJlIG5vdCBnaXZlbiBhIGNlbGwgYW5kIHRoZSBlbnRpdHkgaXMgbm90IGFscmVhZHkgYXNzaWduZWQgYSBjZWxsXG4gIGlmICghY2xsKSB7XG4gICAgY2xsID0gY2xscy5jZWxsW2NsbHMuc2l6ZS55ICogMC41ICogY2xscy5zaXplLnggKyBjbGxzLnNpemUueCAqIDAuNV1cbiAgfVxuXG4gIC8vIG1ha2UgYSBjb3B5IG9mIHRoZSBlbnRpdGllcyBvZmZzZXQgc28gd2UgYXJlIG5vdCBtYW5pcHVsYXRpbmcgdGhlIG9yaWdpbmFsXG4gIGxldCBvZmZzZXQgPSB2ZWMzKGVudC5vZmZzZXQpXG5cbiAgLy8gZmluZCBjZWxsIGFmdGVyIG5vcm1hbGlzaW5nIG9mZnNldFxuICBjbGwgPSBjZWxscy5maW5kQ2VsbEZyb21Ob3JtYWxpc2VkT2Zmc2V0KGNsbCwgb2Zmc2V0KVxuXG4gIC8vIGZpbmQgdGhlIGVudGl0aWVzIGNvbGxpc2lvbiBhcmVhXG4gIGxldCBjb2xsaXNpb25BcmVhID0gY2VsbHMuY29sbGlzaW9uQXJlYShlbnQsIGNsbClcblxuICAvLyBkb24ndCBjb250aW51ZSBpZiBlbnRpdHkgd291bGQgY29sbGlkZVxuICBpZiAoZW50LmNvbGxpZGUgJiYgY2VsbHMuY29sbGlkZXMoZW50LCBjb2xsaXNpb25BcmVhKSkgcmV0dXJuXG4gICBcbiAgLy8gdXBkYXRlIGVudGl0aWVzIG9mZnNldFxuICBlbnQub2Zmc2V0ID0gb2Zmc2V0XG4gXG4gIC8vIGFkZCBlbnRpdHkgdG8gY2VsbFxuICBjbGwuZW50aXRpZXMucHVzaChlbnQpXG4gIGVudC5jZWxsID0gY2xsXG5cbiAgLy8gYWRkIGVudGl0eSB0byBpdHMgY29sbGlzaW9uIGFyZWFcbiAgZW50LmNvbGxpc2lvbkFyZWEgPSBjb2xsaXNpb25BcmVhXG4gIGZvciAobGV0IGkgaW4gY29sbGlzaW9uQXJlYSkgY29sbGlzaW9uQXJlYVtpXS5jb2xsaXNpb24gPSBlbnRcblxuICAvLyByZS1yZWdpb24gY2VsbCBhbmQgc2ltaWxhciBuZWlnaGJvdXJzIFxuICByZWdpb24ucmVSZWdpb24oY2xsLnJlZ2lvbilcblxuICByZXR1cm4gZW50XG5cbn1cblxuIFxuLyoqXG4gKiBSZW1vdmVzIGFuIHtlbnRpdHl9IGZyb20gaXRzIHtjZWxsc30gaWYgYXR0YWNoZWQuXG4gKiBAcGFyYW0ge2VudGl0eX0gZW50XG4gKi9cbmNlbGxzLnJlbW92ZUVudGl0eSA9IChlbnQpID0+IHtcblxuICBpZiAoIWVudC5jZWxsKSByZXR1cm5cblxuICBsZXQgY2xlYXJlZENlbGxzID0gW11cblxuICAvLyByZW1vdmUgZW50aXR5IGZyb20gaXRzIGNvbGxpc2lvbiBhcmVhXG4gIGZvciAobGV0IGNsbCBpbiBlbnQuY29sbGlzaW9uQXJlYSkge1xuICAgIGNsbCA9IGVudC5jb2xsaXNpb25BcmVhW2NsbF1cbiAgICBjbGVhcmVkQ2VsbHMucHVzaChjbGwpXG4gICAgY2xsLmNvbGxpc2lvbiA9IG51bGxcbiAgfVxuXG4gIGVudC5jb2xsaXNpb25BcmVhID0gW11cblxuICAvLyByZW1vdmUgZW50aXR5IGZyb20gaXRzIGNlbGxcbiAgbGV0IGNsbCA9IGVudC5jZWxsXG4gIGVudC5jZWxsID0gbnVsbFxuICBsZXQgaW5kZXggPSBjbGwuZW50aXRpZXMuaW5kZXhPZihlbnQpXG4gIGlmIChpbmRleCA+IC0xKSBjbGwuZW50aXRpZXMuc3BsaWNlKGluZGV4LCAxKVxuICBcbiAgLy8gcmUtcmVnaW9uIGNlbGwgYW5kIHNpbWlsYXIgbmVpZ2hib3VycyBcbiAgcmVnaW9uLnJlUmVnaW9uKGNsbC5yZWdpb24pXG5cbiAgbGV0IGV4aXRDbGVhcmVkID0ge31cblxuICBmb3IgKGxldCBjbGwgaW4gY2xlYXJlZENlbGxzKSB7XG4gICAgY2xsID0gY2xlYXJlZENlbGxzW2NsbF1cbiAgICBpZiAoY2xsLnJlZ2lvbkV4aXROb3J0aCAmJiBjbGwubm9ydGgucmVnaW9uKSBleGl0Q2xlYXJlZFtjbGwubm9ydGgucmVnaW9uLmlkXSA9IGNsbC5ub3J0aC5yZWdpb25cbiAgICBpZiAoY2xsLnJlZ2lvbkV4aXRFYXN0ICYmIGNsbC5lYXN0LnJlZ2lvbikgZXhpdENsZWFyZWRbY2xsLmVhc3QucmVnaW9uLmlkXSA9IGNsbC5lYXN0LnJlZ2lvblxuICAgIGlmIChjbGwucmVnaW9uRXhpdFNvdXRoICYmIGNsbC5zb3V0aC5yZWdpb24pIGV4aXRDbGVhcmVkW2NsbC5zb3V0aC5yZWdpb24uaWRdID0gY2xsLnNvdXRoLnJlZ2lvblxuICAgIGlmIChjbGwucmVnaW9uRXhpdFdlc3QgJiYgY2xsLndlc3QucmVnaW9uKSBleGl0Q2xlYXJlZFtjbGwud2VzdC5yZWdpb24uaWRdID0gY2xsLndlc3QucmVnaW9uXG4gIH1cbiBcbiAgZm9yIChsZXQgaWQgaW4gZXhpdENsZWFyZWQpIHtcbiAgICByZWdpb24ucmVSZWdpb24oZXhpdENsZWFyZWRbaWRdKVxuICB9XG5cbn1cblxuXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgZ2l2ZW4ge2VudGl0eX0ncyBvZmZzZXQgYW5kIGFzc29jaWF0ZWQge2NlbGx9IGdpdmVuIGFuIG9mZnNldCBkZWx0YS5cbiAqIEBwYXJhbSB7ZW50aXR5fSBlbnRcbiAqIEBwYXJhbSB7dmVjM30gb2Zmc2V0RGVsdGFcbiAqL1xuY2VsbHMubW92ZUVudGl0eSA9IChlbnQsIG9mZnNldERlbHRhKSA9PiB7ICBcbiAgXG4gIC8vIGNyZWF0ZSBhIG5ldyBvZmZzZXQgZnJvbSB0aGUgYWRkaXRpb24gb2YgdGhlIGVudGl0aWVzIG9mZnNldCBhbmQgdGhlIGRlbHRhXG4gIGxldCBvZmZzZXQgPSB2ZWMzLmFkZFZlY3RvcnMoZW50Lm9mZnNldCwgb2Zmc2V0RGVsdGEpXG4gIFxuICAvLyBmaW5kIHdoYXQgY2VsbCB0aGUgZW50aXR5IHdvdWxkIGJlIGluIGFmdGVyIG9mZnNldCBub3JtYWxpc2F0aW9uXG4gIGxldCBjbGwgPSBjZWxscy5maW5kQ2VsbEZyb21Ob3JtYWxpc2VkT2Zmc2V0KGVudC5jZWxsLCBvZmZzZXQpXG5cbiAgLy8gaWYgY2VsbCBpcyBzYW1lIGFzIGN1cnJlbnQgY2VsbCwgd2Ugb25seSBuZWVkIHRvIHVwZGF0ZSBvZmZzZXQgYW5kIHdlJ3JlIGRvbmVcbiAgaWYgKGNsbCA9PT0gZW50LmNlbGwpIHtcbiAgICBlbnQub2Zmc2V0ID0gb2Zmc2V0XG4gICAgcmV0dXJuXG4gIH1cblxuICAvLyBvdGhlcndpc2Ugd2UgbmVlZCB0byB0ZXN0IGZvciBjb2xsaXNpb24gYmVmb3JlIGFsbG93aW5nIHRoZSBtb3ZlXG4gIGxldCBjb2xsaXNpb25BcmVhXG4gIGlmIChlbnQuY29sbGlkZSkge1xuICAgIGNvbGxpc2lvbkFyZWEgPSBjZWxscy5jb2xsaXNpb25BcmVhKGVudCwgY2xsKVxuICAgIGxldCBjb2xsaXNpb24gPSBjZWxscy5jb2xsaWRlcyhlbnQsIGNvbGxpc2lvbkFyZWEpXG4gICAgaWYgKGNvbGxpc2lvbikgcmV0dXJuIGNvbGxpc2lvblxuICB9XG5cbiAgLy8gcmVtb3ZlIGVudGl0eSBmcm9tIGl0cyBjdXJyZW50IGNlbGxcbiAgY2VsbHMucmVtb3ZlRW50aXR5KGVudClcbiAgXG4gIC8vIHVwZGF0ZSBlbnRpdGllcyBvZmZzZXRcbiAgZW50Lm9mZnNldCA9IG9mZnNldFxuIFxuICAvLyBhZGQgZW50aXR5IHRvIG5ldyBjZWxsXG4gIGNsbC5lbnRpdGllcy5wdXNoKGVudClcbiAgZW50LmNlbGwgPSBjbGxcblxuICAvLyBhZGQgZW50aXR5IHRvIGl0cyBjb2xsaXNpb24gYXJlYVxuICBlbnQuY29sbGlzaW9uQXJlYSA9IGNvbGxpc2lvbkFyZWFcbiAgZm9yIChsZXQgaSBpbiBjb2xsaXNpb25BcmVhKSB7XG4gICAgY29sbGlzaW9uQXJlYVtpXS5jb2xsaXNpb24gPSBlbnRcbiAgfVxuXG4gIC8vIHJlLXJlZ2lvbiBjZWxsIGFuZCBzaW1pbGFyIG5laWdoYm91cnMgXG4gIHJlZ2lvbi5yZVJlZ2lvbihjbGwucmVnaW9uKVxuXG59XG5cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHtjZWxsfSBvZmZzZXQgZGlzdGFuY2UgYXdheSBmcm9tIHRoZSBnaXZlbiB7Y2VsbH0ncyBjZW50cmUuXG4gKiBAcGFyYW0ge2NlbGx9IGNsbFxuICogQHBhcmFtIHt2ZWMzXSBvZmZzZXRcbiAqIEByZXR1cm4ge2NsbH1cbiAqL1xuY2VsbHMuZmluZENlbGxGcm9tTm9ybWFsaXNlZE9mZnNldCA9IChjbGwsIG9mZnNldCkgPT4ge1xuXG4gIHdoaWxlIChjbGwud2VzdCAmJiBvZmZzZXQueCA8PSAtMC41KSB7Y2xsID0gY2xsLndlc3Q7ICsrb2Zmc2V0Lng7fVxuICB3aGlsZSAoY2xsLmVhc3QgJiYgb2Zmc2V0LnggPiAwLjUpIHtjbGwgPSBjbGwuZWFzdDsgLS1vZmZzZXQueDt9XG4gIHdoaWxlIChjbGwubm9ydGggJiYgb2Zmc2V0LnkgPD0gLTAuNSkge2NsbCA9IGNsbC5ub3J0aDsgKytvZmZzZXQueTt9XG4gIHdoaWxlIChjbGwuc291dGggJiYgb2Zmc2V0LnkgPiAwLjUpIHtjbGwgPSBjbGwuc291dGg7IC0tb2Zmc2V0Lnk7fVxuXG4gIHJldHVybiBjbGxcblxufVxuXG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCBjb2xsaXNpb24gZm91bmQgaW4gdGhlIGFycmF5IG9mIHtjZWxsfSdzIHRoYXQgaXMgbm90IGFnYWluc3QgdGhlIHtlbnRpdHl9LlxuICogSWYgbm8gY29sbGlzaW9uIGlmIGZvdW5kIGEgbnVsbCBpcyByZXR1cm5lZFxuICogQHBhcmFtIHtlbnRpdHl9IGVudFxuICogQHBhcmFtIHtjZWxsW119IGxpc3RcbiAqIEByZXR1cm4ge2VudGl0eT19XG4gKi9cbmNlbGxzLmNvbGxpZGVzID0gKGVudCwgbGlzdCkgPT4ge1xuXG4gIGZvciAobGV0IGNsbCBpbiBsaXN0KSB7XG4gICAgbGV0IGNvbGxpc2lvbiA9IGxpc3RbY2xsXS5jb2xsaXNpb25cbiAgICBpZiAoY29sbGlzaW9uICYmIGNvbGxpc2lvbiAhPT0gZW50KSByZXR1cm4gY29sbGlzaW9uXG4gIH1cblxuICByZXR1cm4gbnVsbFxuICAgXG59XG5cblxuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgb2Yge2NlbGx9cyBpbiB0aGUgZ2l2ZW4ge2VudGl0eX1zIGNvbGxpc2lvbiBhcmVhLlxuICogQHBhcmFtIHtlbnRpdHl9IGVudFxuICogQHBhcmFtIHtjZWxsPX0gY2xsXG4gKiBAcmV0dXJuIHtjZWxsW119XG4gKi9cbmNlbGxzLmNvbGxpc2lvbkFyZWEgPSAoZW50LCBjbGwpID0+IHtcblxuICBsZXQgY29sbGlzaW9uQXJlYSA9IFtdXG5cbiAgaWYgKCFlbnQuY29sbGlkZSkgcmV0dXJuIGNvbGxpc2lvbkFyZWFcbiAgaWYgKCFjbGwpIGNsbCA9IGVudC5jZWxsXG5cbiAgbGV0IGxhc3QgPSBjbGxcbiAgbGV0IG1heCA9IHZlYzMubXVsdGlwbHkodmVjMy5tdWx0aXBseSh7eDogMC41LCB5OiAwLjUsIHo6IDB9LCBlbnQuc2l6ZSksIGVudC5jb2xsaWRlKVxuICBsZXQgbWluID0ge3g6IC1tYXgueCwgeTogLW1heC55LCB6OiAwfVxuICBsZXQgYXJlYSA9IHt4OiAxLCB5OiAxLCB6OiAwfVxuXG4gIHdoaWxlIChjbGwud2VzdCAmJiBtaW4ueCsrIDw9IC0wLjkpIHtjbGwgPSBjbGwud2VzdDsgKythcmVhLng7fVxuICB3aGlsZSAoY2xsLm5vcnRoICYmIG1pbi55KysgPD0gLTAuOSkge2NsbCA9IGNsbC5ub3J0aDsgKythcmVhLnk7fVxuICB3aGlsZSAobGFzdC5lYXN0ICYmIG1heC54LS0gPiAwLjkpIHtsYXN0ID0gbGFzdC5lYXN0OyArK2FyZWEueDt9XG4gIHdoaWxlIChsYXN0LnNvdXRoICYmIG1heC55LS0gPiAwLjkpIHtsYXN0ID0gbGFzdC5zb3V0aDsgKythcmVhLnk7fVxuXG5cbiAgbGV0IHJvdyA9IGNsbFxuXG4gIHdoaWxlIChhcmVhLnktLSkge1xuICAgIGxldCB4ID0gYXJlYS54XG4gICAgd2hpbGUgKHgtLSkgeyBcbiAgICAgIGNvbGxpc2lvbkFyZWEucHVzaChjbGwpXG4gICAgICBpZiAoY2xsLmVhc3QpIGNsbCA9IGNsbC5lYXN0XG4gICAgfVxuICAgIGlmIChyb3cuc291dGgpIHtcbiAgICAgIHJvdyA9IHJvdy5zb3V0aFxuICAgICAgY2xsID0gcm93XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbGxpc2lvbkFyZWFcblxufVxuXG5cblxuLyoqXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHtlbnRpdHl9IGNhbiB0cmF2ZWwgaW4gYSBzdHJhaWdodCBsaW5lIGJldHdlZW4gYm90aCB7Y2VsbH1zLlxuICogSWYgYW4ge2VudGl0eX0gaXMgbm90IHNwZWNpZmllZDsgb25seSB7Y2VsbH1zIGNvdmVyZWQgYnkgemVybyB3aWR0aCBsaW5lIGFyZSBjb25zaWRlcmVkLlxuICogQHBhcmFtIHtjZWxsfSBhXG4gKiBAcGFyYW0ge2NlbGx9IGJcbiAqIEBwYXJhbSB7ZW50aXR5PX0gZW50XG4gKiBAcmV0dXJuIHtib29sZWFufVxuICovXG5jZWxscy5jYW5TdHJhaWdodExpbmVUcmF2ZWwgPSAoYSwgYiwgZW50KSA9PiB7XG5cbiAgaWYgKCFlbnQpIHtcbiAgICAvLyBkaXJlY3QgY2VsbCBvbmx5IGNvbGxpc2lvbiB0ZXN0OyBubyBlbnRpdHkgY29sbGlzaW9uQXJlYSB0byBjb25zaWRlclxuICAgIGxldCBsaW5lID0gY2VsbHMucmF5dHJhY2UoYSwgYilcbiAgICBmb3IgKGxldCBjbGwgaW4gbGluZSkge1xuICAgICAgaWYgKGxpbmVbY2xsXS5jb2xsaXNpb24pIHJldHVybiBmYWxzZVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZVxuICB9XG5cbiAgaWYgKCFlbnQuY29sbGlkZSkgcmV0dXJuIHRydWVcbiAgXG4gIGxldCBsaW5lID0gY2VsbHMucmF5dHJhY2UoYSwgYilcblxuICBmb3IgKGxldCBjbGwgaW4gbGluZSkge1xuICAgIC8vIGNvbGxpc2lvbiBhcmVhIHRlc3RpbmdcbiAgICBpZiAoY2VsbHMuY29sbGlkZXMoZW50LCBjZWxscy5jb2xsaXNpb25BcmVhKGVudCwgbGluZVtjbGxdKSkpIHJldHVybiBmYWxzZVxuICB9XG5cbiAgcmV0dXJuIHRydWVcblxufVxuXG5cblxuLyoqXG4gKiBSZXR1cm5zIGFycmF5IG9mIHtjZWxsfXMgdG91Y2hlZCBieSBhIHN0cmFpZ2h0IGxpbmUgYmV0d2VlbiB7Y2VsbH1zIGEgYW5kIGIuXG4gKiBAcGFyYW0ge2NlbGx9IGFcbiAqIEBwYXJhbSB7Y2VsbH0gYlxuICogQHJldHVybiB7Y2VsbFtdfVxuICovXG5jZWxscy5yYXl0cmFjZSA9IChhLCBiKSA9PiB7XG5cbiAgbGV0IGR4ID0gTWF0aC5hYnMoYi5wb3NpdGlvbi54IC0gYS5wb3NpdGlvbi54KVxuICBsZXQgZHkgPSBNYXRoLmFicyhiLnBvc2l0aW9uLnkgLSBhLnBvc2l0aW9uLnkpXG4gIGxldCBuID0gMSArIGR4ICsgZHlcbiAgbGV0IGVhc3QgPSAoYi5wb3NpdGlvbi54ID4gYS5wb3NpdGlvbi54KSA/IHRydWUgOiBmYWxzZVxuICBsZXQgc291dGggPSAoYi5wb3NpdGlvbi55ID4gYS5wb3NpdGlvbi55KSA/IHRydWUgOiBmYWxzZVxuICBsZXQgZXJyb3IgPSBkeCAtIGR5XG4gIGxldCBjbGwgPSBhXG4gIGxldCBsaW5lID0gW11cblxuICBkeCAqPSAyXG4gIGR5ICo9IDJcblxuICBmb3IgKDsgbiA+IDA7IG4tLSkge1xuICAgIGxpbmUucHVzaChjbGwpXG4gICAgaWYgKGVycm9yID4gMCkge1xuICAgICAgaWYgKGVhc3QgJiYgY2xsLmVhc3QpIGNsbCA9IGNsbC5lYXN0XG4gICAgICBlbHNlIGlmICghZWFzdCAmJiBjbGwud2VzdCkgY2xsID0gY2xsLndlc3RcbiAgICAgIGVycm9yIC09IGR5XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzb3V0aCAmJiBjbGwuc291dGgpIGNsbCA9IGNsbC5zb3V0aFxuICAgICAgZWxzZSBpZiAoIXNvdXRoICYmIGNsbC5ub3J0aCkgY2xsID0gY2xsLm5vcnRoXG4gICAgICBlcnJvciArPSBkeFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsaW5lXG4gIFxufVxuXG5cblxuLyoqXG4gKiBDbGVhcnMgcGF0aCBpbmZvcm1hdGlvbiBmcm9tIGFsbCB7Y2VsbH1zIGluIHRoZSBnaXZlbiB7Y2VsbHN9LlxuICovXG5jZWxscy5jbGVhbkRpcnR5UGF0aEluZm8gPSAoY2xscykgPT4ge1xuXG4gIGZvciAobGV0IGRpcnR5Q2VsbCBpbiBjbGxzLmRpcnR5Q2VsbHMpIHtcbiAgICBkaXJ0eUNlbGwgPSBjbGxzLmRpcnR5Q2VsbHNbZGlydHlDZWxsXVxuICAgIGRpcnR5Q2VsbC5zY29yZSA9IGRpcnR5Q2VsbC5nID0gZGlydHlDZWxsLmggPSAwXG4gICAgZGlydHlDZWxsLnZpc2l0ZWQgPSBkaXJ0eUNlbGwuY2xvc2VkID0gZGlydHlDZWxsLnBhcmVudCA9IGRpcnR5Q2VsbC5wYXRoID0gbnVsbFxuICB9XG5cbn1cblxuXG5cbi8qKlxuICogUmV0dXJucyBhIG5ldyB7Y2VsbH0gd2l0aCBwb3NpdGlvbiB7eDogeCwgeTogeSwgejogMH1cbiAqIEBwYXJhbSB7Y2VsbHN9IGNsbHNcbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHJldHVybiB7Y2VsbH1cbiAqL1xubGV0IGNlbGwgPSAoY2xscywgeCwgeSkgPT4ge1xuXG4gIHJldHVybiB7XG5cbiAgICBvd25lcjogLyoqe2NlbGxzfSovY2xscyxcbiAgICBwb3NpdGlvbjogLyoqe3ZlYzN9Ki97eDogeCwgeTogeSwgejogMH0sXG5cbiAgICByZWdpb246IC8qKntyZWdpb259Ki9udWxsLFxuICAgIHJlZ2lvbkhhc2g6ICh+fih5L2NsbHMucmVnaW9uU2l6ZSkrMSkgPDwgOCB8ICh+fih4L2NsbHMucmVnaW9uU2l6ZSkrMSksXG5cbiAgICBlbnRpdGllczogLyoqe2VudGl0eVtdfSovW10sXG4gICAgY29sbGlzaW9uOiAvKip7ZW50aXR5PX0qL251bGwsXG5cbiAgICBub3J0aDogLyoqe2NlbGx9Ki9udWxsLFxuICAgIGVhc3Q6IC8qKntjZWxsfSovbnVsbCxcbiAgICBzb3V0aDogLyoqe2NlbGx9Ki9udWxsLFxuICAgIHdlc3Q6IC8qKntjZWxsfSovbnVsbCxcblxuICAgIHJlZ2lvbkJvdW5kYXJ5OiAvKip7Ym9vbGVhbn0qL2ZhbHNlLFxuICAgIHJlZ2lvbkV4aXROb3J0aDogLyoqe2Jvb2xlYW59Ki9mYWxzZSxcbiAgICByZWdpb25FeGl0RWFzdDogLyoqe2Jvb2xlYW59Ki9mYWxzZSxcbiAgICByZWdpb25FeGl0U291dGg6IC8qKntib29sZWFufSovZmFsc2UsXG4gICAgcmVnaW9uRXhpdFdlc3Q6IC8qKntib29sZWFufSovZmFsc2VcblxuICB9XG5cbn1cblxuXG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbmV3IHtyZWdpb259LlxuICogQHBhcmFtIHtyZWdpb249fSByZ25cbiAqIEByZXR1cm4ge3JlZ2lvbn1cbiAqL1xubGV0IHJlZ2lvbiA9IChyZ24pID0+IHtcblxuICByZ24gPSByZ24gfHwge31cbiAgcmduLnR5cGUgPSByZ24udHlwZSB8fCAwXG5cbiAgaWYgKHJnbi5vd25lci5yZWdpb25zLmhhc093blByb3BlcnR5KHJnbi5pZCkpIHJldHVybiByZ24ub3duZXIucmVnaW9uc1tyZ24uaWRdXG5cbiAgcmduID0ge1xuICAgIGlkOiAvKip7bnVtYmVyfSovcmduLmlkLFxuICAgIHR5cGU6IC8qKntudW1iZXJ9Ki9yZ24udHlwZSxcbiAgICBvd25lcjogLyoqe2NlbGxzfSovcmduLm93bmVyLFxuICAgIGNlbGxzOiAvKip7Y2VsbFtdfSovW11cbiAgfVxuXG4gIC8vIGVuc3VyZSB1bmlxdWUgaWRcbiAgd2hpbGUgKCFyZ24uaWQgfHwgcmduLm93bmVyLnJlZ2lvbnMuaGFzT3duUHJvcGVydHkocmduLmlkKSkge1xuICAgIHJnbi5pZCA9IH5+KE1hdGgucmFuZG9tKCkqMjU1KTw8MTZ8fn4oTWF0aC5yYW5kb20oKSoyNTUpPDw4fH5+KE1hdGgucmFuZG9tKCkqMjU1KVxuICB9XG5cbiAgcmduLm93bmVyLnJlZ2lvbnNbcmduLmlkXSA9IHJnblxuXG4gIHJldHVybiByZ25cblxufVxuXG5cblxuLyoqXG4gKiBSZS1ldmFsdWF0ZSB0aGUge3JlZ2lvbn1zIG9mIHtjZWxsfXMgaW4gdGhlIGdpdmVuIHtyZWdpb259LlxuICogQHBhcmFtIHtyZWdpb259IHJnblxuICovXG5yZWdpb24ucmVSZWdpb24gPSAocmduKSA9PiB7XG4gIFxuICBsZXQgZGljdCA9IHt9XG4gIGxldCBsaXN0ID0gW3Jnbi5pZF1cblxuICBkaWN0W3Jnbi5pZF0gPSBudWxsXG4gIFxuICB3aGlsZSAobGlzdC5sZW5ndGgpIHtcblxuICAgIHJnbiA9IHJnbi5vd25lci5yZWdpb25zW2xpc3QucG9wKCldXG5cbiAgICBpZiAoIXJnbikgY29udGludWVcblxuICAgIGZvciAobGV0IGkgaW4gcmduLmNlbGxzKSB7XG5cbiAgICAgIGxldCBjbGwgPSByZ24uY2VsbHNbaV1cblxuICAgICAgaWYgKGNsbC5yZWdpb25FeGl0Tm9ydGggJiYgY2xsLm5vcnRoLnJlZ2lvbiAmJiBjZWxscy5jYW5TaGFyZVNhbWVSZWdpb24oY2xsLCBjbGwubm9ydGgpKSB7XG4gICAgICAgIGxldCBpZCA9IGNsbC5ub3J0aC5yZWdpb24uaWRcbiAgICAgICAgaWYgKCFkaWN0Lmhhc093blByb3BlcnR5KGlkKSkge2RpY3RbaWRdID0gbnVsbDsgbGlzdC5wdXNoKGlkKX1cbiAgICAgIH1cbiAgICAgIGlmIChjbGwucmVnaW9uRXhpdEVhc3QgJiYgY2xsLmVhc3QucmVnaW9uICYmIGNlbGxzLmNhblNoYXJlU2FtZVJlZ2lvbihjbGwsIGNsbC5lYXN0KSkge1xuICAgICAgICBsZXQgaWQgPSBjbGwuZWFzdC5yZWdpb24uaWRcbiAgICAgICAgaWYgKCFkaWN0Lmhhc093blByb3BlcnR5KGlkKSkge2RpY3RbaWRdID0gbnVsbDsgbGlzdC5wdXNoKGlkKX1cbiAgICAgIH1cbiAgICAgIGlmIChjbGwucmVnaW9uRXhpdFNvdXRoICYmIGNsbC5zb3V0aC5yZWdpb24gJiYgY2VsbHMuY2FuU2hhcmVTYW1lUmVnaW9uKGNsbCwgY2xsLnNvdXRoKSkge1xuICAgICAgICBsZXQgaWQgPSBjbGwuc291dGgucmVnaW9uLmlkXG4gICAgICAgIGlmICghZGljdC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtkaWN0W2lkXSA9IG51bGw7IGxpc3QucHVzaChpZCl9XG4gICAgICB9XG4gICAgICBpZiAoY2xsLnJlZ2lvbkV4aXRXZXN0ICYmIGNsbC53ZXN0LnJlZ2lvbiAmJiBjZWxscy5jYW5TaGFyZVNhbWVSZWdpb24oY2xsLCBjbGwud2VzdCkpIHtcbiAgICAgICAgbGV0IGlkID0gY2xsLndlc3QucmVnaW9uLmlkXG4gICAgICAgIGlmICghZGljdC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtkaWN0W2lkXSA9IG51bGw7IGxpc3QucHVzaChpZCl9XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZWdpb24uZGVzdHJveShyZ24pXG5cbiAgfVxuXG4gIC8vIGZpbmQgcmVnaW9ucyBmb3IgdW5yZWdpb25lZCBjZWxsc1xuICBpZiAocmduKSByZWdpb24uYWxsb2NhdGVSZWdpb25zKHJnbi5vd25lcilcblxufVxuXG5cbi8qKlxuICogQWxsb2NhdGUge3JlZ2lvbn1zIHRvIHVucmVnaW9uZWQge2NlbGx9cyBpbiB0aGUgZ2l2ZW4ge2NlbGxzfS5cbiAqIEBwYXJhbSB7Y2VsbHN9IGNsbHNcbiAqL1xucmVnaW9uLmFsbG9jYXRlUmVnaW9ucyA9IChjbGxzKSA9PiB7XG5cbiAgY2xscy5kaXJ0eVJlZ2lvbnMgPSB7fVxuXG4gIHdoaWxlIChjbGxzLnVucmVnaW9uZWRDZWxscy5sZW5ndGgpIHtcblxuICAgIC8vIHBvcCBvbmUgY2VsbCBvZmYgYXMgYSBzdGFydGluZyBwb2ludFxuICAgIGxldCB1bnJlZ2lvbmVkQ2VsbHMgPSBbY2xscy51bnJlZ2lvbmVkQ2VsbHMucG9wKCldXG5cbiAgICAvLyB3aWxsIHJlZmVyIHRvIGN1cnJlbnQgZ3JvdXBzIHJlZ2lvbiB3aGVuIG9uZSBuZWVkcyBjcmVhdGluZ1xuICAgIGxldCByZ24gPSBudWxsXG5cbiAgICAvLyBmbG9vZCBmaWxsIHVucmVnaW9uZWQgY2VsbHMgaW50byB0aGlzIHJlZ2lvbiB0aGF0IHNoYXJlIHRoZSBzYW1lIHJlZ2lvbiB0eXBlIHVudGlsIHRoZXJlIGFyZSBub25lIGxlZnRcbiAgICB3aGlsZSAodW5yZWdpb25lZENlbGxzLmxlbmd0aCkge1xuICAgXG4gICAgICBsZXQgY2xsID0gdW5yZWdpb25lZENlbGxzLnBvcCgpXG4gXG4gICAgICAvLyBza2lwIGNlbGxzIHRoYXQgYWxyZWFkeSBoYXZlIGEgcmVnaW9uXG4gICAgICBpZiAoY2xsLnJlZ2lvbikgY29udGludWVcblxuICAgICAgLy8gaWYgd2UgaGF2ZW4ndCBhbHJlYWR5IGNyZWF0ZWQgYSBuZXcgcmVnaW9uIGZvciB0aGlzIGdyb3VwOyBjcmVhdGUgaXRcbiAgICAgIGlmICghcmduKSByZ24gPSByZWdpb24oe293bmVyOiBjbGxzLCB0eXBlOiBjZWxscy5yZWdpb25UeXBlKGNsbCl9KVxuXG4gICAgICBjbGwucmVnaW9uID0gcmduXG4gICAgICByZ24uY2VsbHMucHVzaChjbGwpXG5cbiAgICAgIGlmIChjbGwubm9ydGggJiYgIWNsbC5ub3J0aC5yZWdpb24gJiYgY2VsbHMuY2FuU2hhcmVTYW1lUmVnaW9uKGNsbCwgY2xsLm5vcnRoKSkgdW5yZWdpb25lZENlbGxzLnB1c2goY2xsLm5vcnRoKVxuICAgICAgaWYgKGNsbC5lYXN0ICYmICFjbGwuZWFzdC5yZWdpb24gJiYgY2VsbHMuY2FuU2hhcmVTYW1lUmVnaW9uKGNsbCwgY2xsLmVhc3QpKSB1bnJlZ2lvbmVkQ2VsbHMucHVzaChjbGwuZWFzdClcbiAgICAgIGlmIChjbGwuc291dGggJiYgIWNsbC5zb3V0aC5yZWdpb24gJiYgY2VsbHMuY2FuU2hhcmVTYW1lUmVnaW9uKGNsbCwgY2xsLnNvdXRoKSkgdW5yZWdpb25lZENlbGxzLnB1c2goY2xsLnNvdXRoKVxuICAgICAgaWYgKGNsbC53ZXN0ICYmICFjbGwud2VzdC5yZWdpb24gJiYgY2VsbHMuY2FuU2hhcmVTYW1lUmVnaW9uKGNsbCwgY2xsLndlc3QpKSB1bnJlZ2lvbmVkQ2VsbHMucHVzaChjbGwud2VzdClcbiAgXG4gICAgfVxuXG4gICAgLy8gZmxhZyByZWdpb24gYXMgZGlydHlcbiAgICBpZiAocmduKSBjbGxzLmRpcnR5UmVnaW9uc1tyZ24uaWRdID0gbnVsbFxuXG4gIH1cblxuICAvLyB1cGRhdGUgZGlydHkgcmVnaW9uc1xuICByZWdpb24udXBkYXRlRGlydHkoY2xscylcbiBcbn1cblxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHJlZ2lvbkV4aXQqIGFuZCByZWdpb25Cb3VuZGFyeSBwcm9wZXJ0aWVzIG9mIGRpcnR5IHtjZWxsfXMgaW4gdGhlIGdpdmVuIHtjZWxsc30uXG4gKiBAcGFyYW0ge2NlbGxzfSBjbGxzXG4gKi9cbnJlZ2lvbi51cGRhdGVEaXJ0eSA9IChjbGxzKSA9PiB7XG5cbiAgbGV0IHJlZ2lvbklkcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGNsbHMuZGlydHlSZWdpb25zKVxuXG4gIGZvciAobGV0IGkgaW4gcmVnaW9uSWRzKSB7XG5cbiAgICBsZXQgcmduID0gY2xscy5yZWdpb25zW3JlZ2lvbklkc1tpXV1cbiAgICBsZXQgY2xsXG5cbiAgICBmb3IgKGxldCBpIGluIHJnbi5jZWxscykge1xuXG4gICAgICBjbGwgPSByZ24uY2VsbHNbaV1cblxuICAgICAgbGV0IGlzT3BlbiA9IGNlbGxzLmlzT3BlbihjbGwpXG5cbiAgICAgIGNsbC5yZWdpb25Cb3VuZGFyeSA9IGZhbHNlXG4gICAgICBjbGwucmVnaW9uRXhpdE5vcnRoID0gZmFsc2VcbiAgICAgIGNsbC5yZWdpb25FeGl0RWFzdCA9IGZhbHNlXG4gICAgICBjbGwucmVnaW9uRXhpdFNvdXRoID0gZmFsc2VcbiAgICAgIGNsbC5yZWdpb25FeGl0V2VzdCA9IGZhbHNlXG5cbiAgICAgIGlmICghY2xsLm5vcnRoIHx8IGNsbC5ub3J0aC5yZWdpb24uaWQgIT09IHJnbi5pZCB8fFxuICAgICAgICAgICFjbGwuZWFzdCB8fCBjbGwuZWFzdC5yZWdpb24uaWQgIT09IHJnbi5pZCB8fFxuICAgICAgICAgICFjbGwuc291dGggfHwgY2xsLnNvdXRoLnJlZ2lvbi5pZCAhPT0gcmduLmlkIHx8XG4gICAgICAgICAgIWNsbC53ZXN0IHx8IGNsbC53ZXN0LnJlZ2lvbi5pZCAhPT0gcmduLmlkKSB7XG4gICAgICAgIGNsbC5yZWdpb25Cb3VuZGFyeSA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKGNsbC5yZWdpb25Cb3VuZGFyeSkge1xuXG4gICAgICAgIC8vIHVwZGF0ZSBleGl0czsgYm90aCBvdXRib3VuZCBhbmQgaW5ib3VuZFxuICAgICAgICBcbiAgICAgICAgbGV0IG5laWdoYm91ciA9IGNsbC5ub3J0aFxuICAgICAgICBpZiAobmVpZ2hib3VyICYmIG5laWdoYm91ci5yZWdpb24uaWQgIT09IHJnbi5pZCAmJiBjZWxscy5pc09wZW4obmVpZ2hib3VyKSkge1xuICAgICAgICAgIGNsbC5yZWdpb25FeGl0Tm9ydGggPSB0cnVlXG4gICAgICAgICAgaWYgKCFpc09wZW4pIG5laWdoYm91ci5yZWdpb25FeGl0U291dGggPSBmYWxzZVxuICAgICAgICB9XG5cbiAgICAgICAgbmVpZ2hib3VyID0gY2xsLmVhc3RcbiAgICAgICAgaWYgKG5laWdoYm91ciAmJiBuZWlnaGJvdXIucmVnaW9uLmlkICE9PSByZ24uaWQgJiYgY2VsbHMuaXNPcGVuKG5laWdoYm91cikpIHtcbiAgICAgICAgICBjbGwucmVnaW9uRXhpdEVhc3QgPSB0cnVlXG4gICAgICAgICAgaWYgKCFpc09wZW4pIG5laWdoYm91ci5yZWdpb25FeGl0V2VzdCA9IGZhbHNlXG4gICAgICAgIH1cblxuICAgICAgICBuZWlnaGJvdXIgPSBjbGwuc291dGhcbiAgICAgICAgaWYgKG5laWdoYm91ciAmJiBuZWlnaGJvdXIucmVnaW9uLmlkICE9PSByZ24uaWQgJiYgY2VsbHMuaXNPcGVuKG5laWdoYm91cikpIHtcbiAgICAgICAgICBjbGwucmVnaW9uRXhpdFNvdXRoID0gdHJ1ZVxuICAgICAgICAgIGlmICghaXNPcGVuKSBuZWlnaGJvdXIucmVnaW9uRXhpdE5vcnRoID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIG5laWdoYm91ciA9IGNlbGwud2VzdFxuICAgICAgICBpZiAobmVpZ2hib3VyICYmIG5laWdoYm91ci5yZWdpb24uaWQgIT09IHJnbi5pZCAmJiBjZWxscy5pc09wZW4obmVpZ2hib3VyKSkge1xuICAgICAgICAgIGNsbC5yZWdpb25FeGl0V2VzdCA9IHRydWVcbiAgICAgICAgICBpZiAoIWlzT3BlbikgbmVpZ2hib3VyLnJlZ2lvbkV4aXRFYXN0ID0gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZWdpb24ucmVldmFsdWF0ZVVwZGF0ZUZyZXF1ZW5jeShyZ24pXG5cbiAgfVxuXG59XG5cblxuXG4vKipcbiAqIFJlLWV2YXVsYXRlcyB0aGUgdXBkYXRlIGZyZXF1ZW5jZSBmb3IgdGhlIGdpdmVuIHtyZWdpb259LlxuICogQHBhcmFtIHtyZWdpb259IHJnblxuICovXG5yZWdpb24ucmVldmFsdWF0ZVVwZGF0ZUZyZXF1ZW5jeSA9IChyZ24pID0+IHtcblxuICBzdG9wKCdyZWdpb25fdXBkYXRlXycgKyByZ24uaWQpXG5cbiAgaWYgKHJnbi5jZWxscy5sZW5ndGggPiAwKSB7XG5cbiAgICBsZXQgZGlzdGFuY2UgPSB+fih2ZWMzLmRpc3RhbmNlVG8oZ2xvYmFsLnZpZXdfY2VudHJlLCByZ24uY2VsbHNbMF0ucG9zaXRpb24pIC8gY29uZmlnLmFwZXJ0dXJlKVxuICAgIGxldCB1cGRhdGVfbXMgPSBjb25maWcucmVnaW9uX3VwZGF0ZXNfbXMgKyBjb25maWcucmVnaW9uX2F0dGVudWF0aW9uX21zICogZGlzdGFuY2VcblxuICAgIGlmICh1cGRhdGVfbXMgPCBteS5mYXN0ZXN0X3JlZ2lvbl91cGRhdGVfbXMpIHtcbiAgICAgIG15LmZhc3Rlc3RfcmVnaW9uX3VwZGF0ZV9tcyA9IHVwZGF0ZV9tc1xuICAgIH0gZWxzZSBpZiAodXBkYXRlX21zID4gbXkuc2xvd2VzdF9yZWdpb25fdXBkYXRlX21zKSB7XG4gICAgICBteS5zbG93ZXN0X3JlZ2lvbl91cGRhdGVfbXMgPSB1cGRhdGVfbXNcbiAgICB9XG5cbiAgICByZXBlYXQoJ3JlZ2lvbl91cGRhdGVfJyArIHJnbi5pZCwgdXBkYXRlX21zLCAoKSA9PiB7cmVnaW9uLnVwZGF0ZShyZ24pfSlcblxuICB9XG5cbn1cblxuXG5cbi8qKlxuICogRGVzdHJveSB0aGUgZ2l2ZW4ge3JlZ2lvbn0gbW92aW5nIGFsbCBjb250aWFuZWQge2NlbGx9cyB0aGVpciB7Y2VsbHN9IHVucmVnaW9uZWQgbGlzdC5cbiAqIEBwYXJhbSB7cmVnaW9ufSByZ25cbiAqL1xucmVnaW9uLmRlc3Ryb3kgPSAocmduKSA9PiB7XG5cbiAgc3RvcCgncmVnaW9uX3VwZGF0ZV8nICsgcmduLmlkKVxuXG4gIHdoaWxlIChyZ24uY2VsbHMubGVuZ3RoKSB7XG5cbiAgICBsZXQgY2xsID0gcmduLmNlbGxzLnBvcCgpXG5cbiAgICBjbGwucmVnaW9uID0gbnVsbFxuICAgIGNsbC5yZWdpb25Cb3VuZGFyeSA9IG51bGxcbiAgICBjbGwucmVnaW9uRXhpdE5vcnRoID0gbnVsbFxuICAgIGNsbC5yZWdpb25FeGl0RWFzdCA9IG51bGxcbiAgICBjbGwucmVnaW9uRXhpdFNvdXRoID0gbnVsbFxuICAgIGNsbC5yZWdpb25FeGl0V2VzdCA9IG51bGxcblxuICAgIHJnbi5vd25lci51bnJlZ2lvbmVkQ2VsbHMucHVzaChjbGwpXG5cbiAgfVxuXG4gIGRlbGV0ZSByZ24ub3duZXIucmVnaW9uc1tyZ24uaWRdXG5cbn1cblxuXG5cbi8qKlxuICogTWVyZ2UgdGhlIHtjZWxsfXMgb2YgdGhlIHNyYyB7cmVnaW9ufSBpbnRvIHRoZSBkc3Qge3JlZ2lvbn0gYW5kIGZsYWcgZHN0IGFzIGRpcnR5LlxuICogQHBhcmFtIHtyZWdpb259IHNyY1xuICogQHBhcmFtIHtyZWdpb259IGRzdFxuICovXG5yZWdpb24ubWVyZ2UgPSAoc3JjLCBkc3QpID0+IHtcblxuICB3aGlsZSAoc3JjLmNlbGxzLmxlbmd0aCkge1xuICAgIGxldCBjbGwgPSBzcmMuY2VsbHMucG9wKClcbiAgICBjbGwucmVnaW9uID0gZHN0XG4gICAgZHN0LmNlbGxzLnB1c2goY2xsKVxuICB9XG5cbiAgZGVsZXRlIHNyYy5vd25lci5yZWdpb25zW3NyYy5pZF1cbiAgZHN0Lm93bmVyLmRpcnR5UmVnaW9uc1tkc3QuaWRdID0gbnVsbFxuXG59XG5cblxuXG4vKipcbiAqIFVwZGF0ZXMgYSByZWdpb24uXG4gKiBUaGUgdXBkYXRlIGZyZXF1ZW5jeSBpcyBkZXRlcm1pbmVkIGJ5IHRoZSByZWdpb25zIGRpc3RhbmNlIGZyb20gdGhlIHZpZXcuXG4gKiBAcGFyYW0ge3JlZ2lvbn0gcmduXG4gKi9cbnJlZ2lvbi51cGRhdGUgPSAocmduKSA9PiB7XG5cbiAgZm9yIChsZXQgY2xsIGluIHJnbi5jZWxscykge1xuICAgIGNsbCA9IHJnbi5jZWxsc1tjbGxdXG4gICAgZm9yIChsZXQgZW50IGluIGNsbC5lbnRpdGllcykge1xuICAgICAgZW50aXR5LnVwZGF0ZShjbGwuZW50aXRpZXNbZW50XSlcbiAgICB9XG4gIH1cblxuICByZWdpb24ucmVldmFsdWF0ZVVwZGF0ZUZyZXF1ZW5jeShyZ24pXG5cbn1cblxuXG5cbmxldCBnbG9iYWwgPSB2YWwoJ2dsb2JhbCcpXG5sZXQgbXkgPSB2YWwoJ2NlbGxzJylcblxubXkuZmFzdGVzdF9yZWdpb25fdXBkYXRlX21zID0gOTk5OTk5OVxubXkuc2xvd2VzdF9yZWdpb25fdXBkYXRlX21zID0gMFxuXG5cbmV4cG9ydCBkZWZhdWx0IGNlbGxzXG5cbiIsImltcG9ydCAnLi9jb250aW51b3VzJ1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuL2NvbmZpZydcbmltcG9ydCByZWN0MyBmcm9tICcuL3JlY3QzJ1xuXG4vKiA6IGdyZWVuXG4gKiA6IGJiYlxuICogXG4gKi9cbmxldCB1aSA9IHt9XG5cblxuLyoqXG4gKiBBIHRlcm1pbmFsIFVJXG4gKi9cbnVpLnRlcm1pbmFsID0ge31cblxuLyoqXG4gKiBXcml0ZXMgYSBtZXNzYWdlIHRvIHRoZSB0ZXJtaW5hbC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKi9cbnVpLnRlcm1pbmFsLnByaW50ID0gKG1lc3NhZ2UpID0+IHtcblxuICAvL1RPRE86IE5vdCB0aW1lc3RhbXBpbmcgbWVzc2FnZSBhdCB0aGUgbW9tZW50XG4gIC8vbGV0IG5vdyA9IG5ldyBEYXRlXG4gIC8vbGV0IGhvdXJzID0gKCcwMCcgKyBub3cuZ2V0SG91cnMoKSkuc2xpY2UoLTIpXG4gIC8vbGV0IG1pbnV0ZXMgPSAoJzAwJyArIG5vdy5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKVxuICAvL2xldCBzZWNvbmRzID0gKCcwMCcgKyBub3cuZ2V0U2Vjb25kcygpKS5zbGljZSgtMilcblxuICBpZiAobXkubWVzc2FnZXNCb2R5LmNoaWxkTm9kZXMubGVuZ3RoID09PSBteS5tZXNzYWdlc19idWZmZXJfc2l6ZSkge1xuICAgIG15Lm1lc3NhZ2VzQm9keS5yZW1vdmVDaGlsZChteS5tZXNzYWdlc0JvZHkuZmlyc3RDaGlsZClcbiAgfVxuXG4gIGxldCBzY3JvbGwgPSBteS5tZXNzYWdlc1Njcm9sbC5zdHlsZVxuICBzY3JvbGwub3ZlcmZsb3dZID0gJ3Njcm9sbCdcbiBcbiAgbGV0IHRkXG5cbiAgdWkuRShteS5tZXNzYWdlc0JvZHksICd0cicsIFtcbiAgICAvL3VpLkUoJ3RkJywge2NvbG9yOiBteS5tZXNzYWdlc19wcm9tcHQsIHZlcnRpY2FsQWxpZ246ICd0b3AnIH0sICc+JyksXG4gICAgdGQgPSB1aS5FKCd0ZCcsIHtjb2xvcjogbXkubWVzc2FnZXNfZmcgfSwgbWVzc2FnZSlcbiAgXSlcblxuICB0ZC5zY3JvbGxJbnRvVmlldyhmYWxzZSlcblxuICBzY3JvbGwub3ZlcmZsb3dZID0gJ2hpZGRlbidcblxuICBmb3IgKGxldCByZWdleCBpbiBteS5jb21tYW5kcykge1xuICAgIC8vIG1hdGNoIG9ubHkgd29ya3Mgb24gc3RyaW5nLCAnJyArIG1lc3NhZ2VzLCBlbnN1cmVzIHRoZSB2YWx1ZSBpcyBhIHN0cmluZ1xuICAgIGxldCBhcmdzID0gKCcnICsgbWVzc2FnZSkubWF0Y2gocmVnZXgpXG4gICAgaWYgKGFyZ3MpIHtcbiAgICAgIGZvciAobGV0IGxpc3RlbiBpbiBteS5jb21tYW5kc1tyZWdleF0pIHtcbiAgICAgICAgbXkuY29tbWFuZHNbcmVnZXhdW2xpc3Rlbl0oYXJncylcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufVxuXG4vKipcbiAqIFNheSBhIG1lc3NhZ2UgYXMgaWYgZW50ZXJlZCBmcm9tIHRoZSBwcm9tcHQuXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICovXG51aS50ZXJtaW5hbC5zYXkgPSAobWVzc2FnZSkgPT4ge1xuICBcbiAgdWkudGVybWluYWwucHJpbnQoJz4gJyArIG1lc3NhZ2UpXG4gIFxufVxuXG4gXG4vKipcbiAqIEZvY3VzZXMgdGhlIHRlcm1pbmFsLlxuICovXG51aS50ZXJtaW5hbC5mb2N1cyA9ICgpID0+IHtcblxuICBteS5tZXNzYWdlc1Njcm9sbC5zdHlsZS5vdmVyZmxvd1kgPSAnc2Nyb2xsJ1xuICBsZXQgdGVybWluYWwgPSBteS50ZXJtaW5hbEVsLnN0eWxlXG4gIHRlcm1pbmFsLmJhY2tncm91bmQgPSBteS5tZXNzYWdlc19iZ19mb2N1c2VkXG4gIHRlcm1pbmFsLm9wYWNpdHkgPSBjb25maWcud29ya19tb2RlID8gJzAuMicgOiAnMS4wJ1xuICBteS5zYXlFbC5zdHlsZS5iYWNrZ3JvdW5kID0gbXkucHJvbXB0X2JnX2ZvY3VzZWRcbiAgbXkuc2F5RWwuZm9jdXMoKVxuXG59XG5cblxuLyoqXG4gKiBVbmZvY3VzZXMgdGhlIHRlcm1pbmFsLlxuICovXG51aS50ZXJtaW5hbC5ibHVyID0gKCkgPT4ge1xuXG4gIG15Lm1lc3NhZ2VzU2Nyb2xsLnN0eWxlLm92ZXJmbG93WSA9ICdoaWRkZW4nXG4gIGxldCB0ZXJtaW5hbCA9IG15LnRlcm1pbmFsRWwuc3R5bGVcbiAgdGVybWluYWwub3ZlcmZsb3dZID0gJ2hpZGRlbidcbiAgdGVybWluYWwuYmFja2dyb3VuZCA9IG15Lm1lc3NhZ2VzX2JnX3VuZm9jdXNlZFxuICB0ZXJtaW5hbC5vcGFjaXR5ID0gY29uZmlnLndvcmtfbW9kZSA/ICcwLjEnIDogJzAuNSdcbiAgbXkuc2F5RWwuc3R5bGUuYmFja2dyb3VuZCA9IG15LnByb21wdF9iZ191bmZvY3VzZWRcbiAgbXkuc2F5RWwuYmx1cigpXG5cbn1cblxuXG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgY29tbWFuZCB3aXRoIHRoZSB0ZXJtaW5hbC5cbiAqIEBwYXJhbSB7Y29tbWFuZH0gY29tbWFuZFxuICovXG51aS50ZXJtaW5hbC5jb21tYW5kID0gKGNvbW1hbmQpID0+IHtcblxuICBsZXQgcmVnZXggPSBjb21tYW5kLnJlZ2V4XG5cbiAgaWYgKCFteS5jb21tYW5kcy5oYXNPd25Qcm9wZXJ0eShyZWdleCkpIG15LmNvbW1hbmRzW3JlZ2V4XSA9IHt9XG4gIG15LmNvbW1hbmRzW3JlZ2V4XVtjb21tYW5kLmNvbnRleHRdID0gY29tbWFuZC5mblxuICBpZiAoY29tbWFuZC5oZWxwKSBteS5oZWxwW2NvbW1hbmQuY29tbWFuZF0gPSBjb21tYW5kLmhlbHBcblxufVxuXG5cblxuXG5cbi8qKlxuICogVXBkYXRlcyB0aGUgZGlzcGxheWVkIGNlbGwgaW5mb3JtYXRpb24uXG4gKiBAcGFyYW0ge2NlbGx9IGNsbFxuICovXG51aS5jZWxsID0gKGNsbCkgPT4ge1xuXG4gIGxldCBpbmZvID0gJycgXG5cbiAgaWYgKGNsbC5jb2xsaXNpb24pIHtcbiAgICBsZXQgZW50ID0gY2xsLmNvbGxpc2lvblxuICAgIGluZm8gPSAnJiMxMjgwODI7ICcgKyAoZW50Lm5hbWUgfHwgZW50LnR5cGUpXG4gICAgaW5mbyArPSAnPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTBwdFwiPm1vdmVtZW50IHNwZWVkOiAnICsgZW50Lm1vdmVtZW50U3BlZWQgKyAnPC9kaXY+J1xuICB9IGVsc2Uge1xuICAgIGluZm8gPSAneCAnICsgY2xsLnBvc2l0aW9uLnggKyAnLCAnICsgY2xsLnBvc2l0aW9uLnlcbiAgfVxuXG4gIG15LmNlbGxFbC5pbm5lckhUTUwgPSBpbmZvXG5cbn1cblxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGRpc3BsYXllZCB2aWV3IGluZm9ybWF0aW9uLlxuICogQHBhcmFtIHtyZWN0M30gdmlld1xuICovXG51aS52aWV3ID0gKHZpZXcpID0+IHtcblxuICBsZXQgd2lkdGggPSByZWN0My53aWR0aCh2aWV3KVxuICBsZXQgaGVpZ2h0ID0gcmVjdDMuaGVpZ2h0KHZpZXcpXG4gIGxldCBjZW50cmUgPSByZWN0My5jZW50cmUodmlldylcbiAgIFxuICBteS52aWV3LmlubmVyVGV4dCA9ICcoJyArIGNlbnRyZS54ICsgJywnICsgY2VudHJlLnkgKyAnKSAnICsgd2lkdGggKyAneCcgKyBoZWlnaHRcblxufVxuXG5cblxuLyoqXG4gKiBNYWtlcyBhbiBFbGVtZW50IGFuZCBhdHRhY2hlcyBhbnkgb2YgdGhlIG9wdGlvbmFsbHkgc3BlY2lmaWVkIHBhcmVudCwgc3R5bGUsIGNoaWxkcmVuLlxuICpcbiAqIEBwYXJhbSB7RWxlbWVudD19IHBhcmVudFxuICogQHBhcmFtIHtzdHJpbmc9fSBuYW1lXG4gKiBAcGFyYW0ge29iamVjdD19IHN0eWxlXG4gKiBAcGFyYW0ge29iamVjdD19IGNoaWxkcmVuXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxuICovXG51aS5FID0gKHBhcmVudCwgbmFtZSwgc3R5bGUsIGNoaWxkcmVuKSA9PiB7XG5cbiAgaWYgKHR5cGVvZiBwYXJlbnQgPT09ICdzdHJpbmcnKSB7XG4gICAgY2hpbGRyZW4gPSBzdHlsZVxuICAgIHN0eWxlID0gbmFtZVxuICAgIG5hbWUgPSBwYXJlbnRcbiAgfVxuXG4gIGxldCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKVxuXG4gIGlmIChzdHlsZSBpbnN0YW5jZW9mIEFycmF5IHx8IHN0eWxlIGluc3RhbmNlb2YgRWxlbWVudCB8fCB0eXBlb2Ygc3R5bGUgPT09ICdzdHJpbmcnKSB7XG4gICAgY2hpbGRyZW4gPSBzdHlsZVxuICB9IGVsc2UgaWYgKHN0eWxlKSB7XG4gICAgZm9yIChsZXQga2V5IGluIHN0eWxlKSB7XG4gICAgICBlbGVtZW50LnN0eWxlW2tleV0gPSBzdHlsZVtrZXldXG4gICAgfVxuICB9XG5cbiAgaWYgKGNoaWxkcmVuKSB7XG4gICAgaWYgKCEoY2hpbGRyZW4gaW5zdGFuY2VvZiBBcnJheSkpIGNoaWxkcmVuID0gW2NoaWxkcmVuXVxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBjaGlsZHJlbi5sZW5ndGg7ICsraW5kZXgpIHtcbiAgICAgIGxldCBjaGlsZCA9IGNoaWxkcmVuW2luZGV4XVxuICAgICAgbGV0IGNoaWxkVHlwZSA9IHR5cGVvZiBjaGlsZFxuICAgICAgaWYgKGNoaWxkVHlwZSA9PT0gJ3N0cmluZycgfHwgY2hpbGRUeXBlID09PSAnbnVtYmVyJykge1xuICAgICAgICBlbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNoaWxkKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHBhcmVudCBpbnN0YW5jZW9mIEVsZW1lbnQpIHBhcmVudC5hcHBlbmRDaGlsZChlbGVtZW50KVxuXG4gIHJldHVybiBlbGVtZW50XG5cbn1cblxuXG5sZXQgbXkgPSB2YWwoJ3VpJylcblxubXkuZm9udGZhbWlseSA9ICdIZWx2ZXRpY2EsQXJpYWwsc2Fucy1zZXJpZidcbm15Lm1lc3NhZ2VzX2JnX3VuZm9jdXNlZCA9ICdub25lJ1xubXkubWVzc2FnZXNfYmdfZm9jdXNlZCA9ICdyZ2JhKDAsIDAsIDAsIDAuMSknXG5teS5wcm9tcHRfYmdfdW5mb2N1c2VkID0gJ25vbmUnXG5teS5wcm9tcHRfYmdfZm9jdXNlZCA9IFwiI2NjZlwiXG5teS5tZXNzYWdlc19mZyA9ICcjMzMzJ1xubXkubWVzc2FnZXNfcHJvbXB0ID0gJyNjY2MnXG5teS5tZXNzYWdlc19idWZmZXJfc2l6ZSA9IDUwXG5teS50ZXJtaW5hbF9mb250c2l6ZSA9ICcxNnB0J1xubXkudGVybWluYWxfd2lkdGggPSAnMjBlbSdcblxubXkuY29tbWFuZHMgPSBteS5jb21tYW5kcyB8fCB7fVxubXkuaGVscCA9IG15LmhlbHAgfHwge31cblxuXG5kb2N1bWVudC5ib2R5LnN0eWxlLmZvbnRGYW1pbHkgPSBteS5mb250ZmFtaWx5XG5kb2N1bWVudC5ib2R5LnN0eWxlLmZvbnRTaXplID0gbXkudGVybWluYWxfZm9udHNpemVcbmRvY3VtZW50LmJvZHkuc3R5bGUubGluZUhlaWdodCA9ICcwLjknXG5cblxubXkudGVybWluYWxFbCA9IG15LnRlcm1pbmFsRWwgfHwgdWkuRShkb2N1bWVudC5ib2R5LCAnZGl2JywgW1xuICAgIG15Lm1lc3NhZ2VzU2Nyb2xsID0gbXkubWVzc2FnZXNTY3JvbGwgfHwgdWkuRSgnZGl2JywgdWkuRSgndGFibGUnLCBteS5tZXNzYWdlc0JvZHkgPSB1aS5FKCd0Ym9keScpKSksXG4gICAgbXkuc2F5RWwgPSB1aS5FKCdpbnB1dCcpXG4gIF0pXG5cbm15LnRlcm1pbmFsRWwuc3R5bGUuYmFja2dyb3VuZCA9IG15Lm1lc3NhZ2VzX2JnX3VuZm9jdXNlZFxubXkudGVybWluYWxFbC5zdHlsZS5jb2xvciA9IG15Lm1lc3NhZ2VzX2ZnXG5teS50ZXJtaW5hbEVsLnN0eWxlLm9wYWNpdHkgPSBjb25maWcud29ya19tb2RlID8gJzAuMScgOiAnMC41J1xubXkudGVybWluYWxFbC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSdcbm15LnRlcm1pbmFsRWwuc3R5bGUuYm90dG9tID0gJzAnXG5teS50ZXJtaW5hbEVsLnN0eWxlLmxlZnQgPSAnMCdcbm15LnRlcm1pbmFsRWwuc3R5bGUud2lkdGggPSBteS50ZXJtaW5hbF93aWR0aFxubXkudGVybWluYWxFbC5zdHlsZS56SW5kZXggPSAnOTk5J1xubXkudGVybWluYWxFbC5zdHlsZS5wYWRkaW5nID0gJzVweCdcbiBcbm15Lm1lc3NhZ2VzU2Nyb2xsLnN0eWxlLm92ZXJmbG93WSA9ICdoaWRkZW4nXG5teS5tZXNzYWdlc1Njcm9sbC5zdHlsZS5taW5IZWlnaHQgPSAnMS42ZW0nXG5teS5tZXNzYWdlc1Njcm9sbC5zdHlsZS5tYXhIZWlnaHQgPSAnMjBlbSdcblxubXkuc2F5RWwuc3R5bGUuYmFja2dyb3VuZCA9IG15LnByb21wdF9iZ191bmZvY3VzZWRcbm15LnNheUVsLnN0eWxlLndpZHRoID0gJzEwMCUnXG5teS5zYXlFbC5zdHlsZS5ib3JkZXIgPSAnMnB4IHNvbGlkIHRyYW5zcGFyZW50J1xubXkuc2F5RWwuc3R5bGUuYm9yZGVyUmFkaXVzID0gJzNweCdcbm15LnNheUVsLnN0eWxlLm1hcmdpblRvcCA9ICcycHgnXG5teS5zYXlFbC5zdHlsZS5vdXRsaW5lID0gJ25vbmUnXG5teS5zYXlFbC5zdHlsZS5mb250RmFtaWx5ID0gbXkuZm9udGZhbWlseVxubXkuc2F5RWwuc3R5bGUuZm9udFNpemUgPSBteS50ZXJtaW5hbF9mb250c2l6ZVxubXkuc2F5RWwuc3R5bGUubGluZUhlaWdodCA9ICcwLjllbSdcbm15LnNheUVsLnN0eWxlLnBhZGRpbmdMZWZ0ID0gJzJweCdcblxuIFxubXkuY2VsbEVsID0gbXkuY2VsbEVsIHx8IHVpLkUoZG9jdW1lbnQuYm9keSwgJ2RpdicpXG5cbm15LmNlbGxFbC5zdHlsZS5iYWNrZ3JvdW5kID0gbXkubWVzc2FnZXNfYmdfdW5mb2N1c2VkXG5teS5jZWxsRWwuc3R5bGUuY29sb3IgPSBteS5tZXNzYWdlc19mZ1xubXkuY2VsbEVsLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJ1xubXkuY2VsbEVsLnN0eWxlLmJvdHRvbSA9ICcwLjhlbSdcbm15LmNlbGxFbC5zdHlsZS5yaWdodCA9ICcwLjhlbSdcbm15LmNlbGxFbC5zdHlsZS5taW5IZWlnaHQgPSAnMS40ZW0nXG5teS5jZWxsRWwuc3R5bGUubWF4SGVpZ2h0ID0gJzEuNGVtJ1xubXkuY2VsbEVsLnN0eWxlLnRleHRBbGlnbiA9ICdyaWdodCdcbm15LmNlbGxFbC5zdHlsZS56SW5kZXggPSAnOTk5J1xuXG5cblxuLy8gcmVnaXN0ZXIgdGhlICdoZWxwJyBjb21tYW5kXG51aS50ZXJtaW5hbC5jb21tYW5kKHtjb250ZXh0OiAndWknLCBjb21tYW5kOiAnaGVscCcsIHJlZ2V4OiAnXj5bIF0rKGhlbHB8XFxcXD8pWyBdKicsIGZuOiAoYXJncykgPT4ge1xuXG4gIGlmIChPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhteS5oZWxwKS5sZW5ndGggPT09IDApIHtcbiAgICB1aS50ZXJtaW5hbC5wcmludCgnbm8gY29tbWFuZHMgYXZhaWxhYmxlLicpXG4gIH1cbiAgZm9yIChsZXQgY29tbWFuZCBpbiBteS5oZWxwKSB7XG4gICAgdWkudGVybWluYWwucHJpbnQoY29tbWFuZCArIG15LmhlbHBbY29tbWFuZF0pXG4gIH1cblxufX0pXG5cblxub25jZSgndWknLCAoKSA9PiB7XG5cbiAgLy8gb25jZSBvZmYgZXZlbnQgbGlzdGVuZXIgcmVnaXN0cmF0aW9uXG4gIFxuICBteS5zYXlFbC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWVudGVyJywgdWkudGVybWluYWwuZm9jdXMsIGZhbHNlKVxuICBteS50ZXJtaW5hbEVsLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbGVhdmUnLCB1aS50ZXJtaW5hbC5ibHVyLCBmYWxzZSlcblxuICAvLyBsaXN0ZW4gZm9yIEVOVEVSIHByZXNzXG4gIG15LnNheUVsLmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgKGV2ZW50KSA9PiB7XG4gICAgbGV0IGtleUNvZGUgPSBldmVudC5rZXlDb2RlIHx8IGV2ZW50LndoaWNoXG4gICAgbGV0IHNheSA9IG15LnNheUVsLnZhbHVlXG4gICAgaWYgKGtleUNvZGUgPT09IDEzICYmIHNheSAmJiBzYXkgIT09ICcnKSB7XG4gICAgICB1aS50ZXJtaW5hbC5wcmludCgnPiAnICsgc2F5KVxuICAgICAgbXkuc2F5RWwudmFsdWUgPSAnJ1xuICAgIH1cbiAgfSwgZmFsc2UpXG5cbiAgLy8gbGlzdGVuIGZvciBFU0MgdXBcbiAgbXkuc2F5RWwuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCAoZXZlbnQpID0+IHtcbiAgICBsZXQga2V5Q29kZSA9IGV2ZW50LmtleUNvZGUgfHwgZXZlbnQud2hpY2hcbiAgICBpZiAoa2V5Q29kZSA9PT0gMjcpIHtcbiAgICAgIG15LnNheUVsLnZhbHVlID0gJydcbiAgICAgIHVpLnRlcm1pbmFsLmJsdXIoKVxuICAgIH1cbiAgfSwgZmFsc2UpICBcblxufSlcblxuXG5leHBvcnQgZGVmYXVsdCB1aVxuXG4iLCJpbXBvcnQgJy4vY29udGludW91cydcbmltcG9ydCB2ZWMzIGZyb20gJy4vdmVjMydcblxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcge0lucHV0U3RhdGV9LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXlcbiAqIEByZXR1cm4ge0lucHV0U3RhdGV9XG4gKi9cbmxldCBJbnB1dFN0YXRlID0gKGtleSkgPT4ge1xuICAgIHJldHVybiBpbnB1dFtrZXldIHx8IHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGxhc3REb3duOiAvKip7bnVtYmVyfSovLTEsXG4gICAgICAgIGxhc3RVcDogLyoqe251bWJlcn0qLy0xLFxuICAgIH1cbn1cblxuXG5sZXQgaW5wdXQgPSB7fVxuXG5cbmlucHV0LmlzRG93biA9IChpbnB1dHN0YXRlKSA9PiB7XG4gICAgcmV0dXJuIGlucHV0c3RhdGUubGFzdERvd24gPiBpbnB1dHN0YXRlLmxhc3RVcFxufVxuXG5cbmlucHV0Lndhc0Rvd24gPSAoaW5wdXRzdGF0ZSwgdGltZXN0YW1wcykgPT4ge1xuXG4gICAgLy8gaWYgaW5wdXRzdGF0ZSBpcyBjdXJyZW50bHkgZG93biByZXR1cm4gdHJ1ZSBzdHJhaWdodCBhd2F5XG4gICAgaWYgKGlucHV0c3RhdGUubGFzdERvd24gPiBpbnB1dHN0YXRlLmxhc3RVcCkgcmV0dXJuIHRydWVcblxuICAgIC8vIHdhcm4gaWYgYSB0aW1lc3RhbXBzIG9iamVjdCB3YXMgbm90IHByb3ZpZGVkXG4gICAgaWYgKCF0aW1lc3RhbXBzKSB7XG4gICAgICAgIGNvbnNvbGUud2FybigndGltZXN0YW1wcyBpcyByZXF1aXJlZCcpXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKVxuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICAvLyB0ZXN0IGlmIHRoZSBpbnB1dHN0YXRlIGhhcyBiZWVuIGRvd24gc2luY2UgdGhlIGdpdmVuIHRpbWVzdGFtcHMgbGFzdCByZWNvcmQgb2YgaXRcbiAgICBpZiAodHlwZW9mIHRpbWVzdGFtcHNbaW5wdXRzdGF0ZS5rZXldID09PSAndW5kZWZpbmVkJyB8fCBpbnB1dHN0YXRlLmxhc3REb3duID4gdGltZXN0YW1wc1tpbnB1dHN0YXRlLmtleV0pIHtcbiAgICAgICAgdGltZXN0YW1wc1tpbnB1dHN0YXRlLmtleV0gPSBnbG9iYWwudGltZXN0YW1wXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlXG5cbn1cblxuXG5pbnB1dFsnICddID0gSW5wdXRTdGF0ZSgnICcpXG5pbnB1dFsnISddID0gSW5wdXRTdGF0ZSgnIScpXG5pbnB1dFsnXCInXSA9IElucHV0U3RhdGUoJ1wiJylcbmlucHV0WycjJ10gPSBJbnB1dFN0YXRlKCcjJylcbmlucHV0WyckJ10gPSBJbnB1dFN0YXRlKCckJylcbmlucHV0WyclJ10gPSBJbnB1dFN0YXRlKCclJylcbmlucHV0WycmJ10gPSBJbnB1dFN0YXRlKCcmJylcbmlucHV0WydcXCcnXSA9IElucHV0U3RhdGUoJ1xcJycpXG5pbnB1dFsnKCddID0gSW5wdXRTdGF0ZSgnKCcpXG5pbnB1dFsnKSddID0gSW5wdXRTdGF0ZSgnKScpXG5pbnB1dFsnKiddID0gSW5wdXRTdGF0ZSgnKicpXG5pbnB1dFsnKyddID0gSW5wdXRTdGF0ZSgnKycpXG5pbnB1dFsnLCddID0gSW5wdXRTdGF0ZSgnLCcpXG5pbnB1dFsnLSddID0gSW5wdXRTdGF0ZSgnLScpXG5pbnB1dFsnLiddID0gSW5wdXRTdGF0ZSgnLicpXG5pbnB1dFsnLyddID0gSW5wdXRTdGF0ZSgnLycpXG5pbnB1dFsnMCddID0gSW5wdXRTdGF0ZSgnMCcpXG5pbnB1dFsnMSddID0gSW5wdXRTdGF0ZSgnMScpXG5pbnB1dFsnMiddID0gSW5wdXRTdGF0ZSgnMicpXG5pbnB1dFsnMyddID0gSW5wdXRTdGF0ZSgnMycpXG5pbnB1dFsnNCddID0gSW5wdXRTdGF0ZSgnNCcpXG5pbnB1dFsnNSddID0gSW5wdXRTdGF0ZSgnNScpXG5pbnB1dFsnNiddID0gSW5wdXRTdGF0ZSgnNicpXG5pbnB1dFsnNyddID0gSW5wdXRTdGF0ZSgnNycpXG5pbnB1dFsnOCddID0gSW5wdXRTdGF0ZSgnOCcpXG5pbnB1dFsnOSddID0gSW5wdXRTdGF0ZSgnOScpXG5pbnB1dFsnOiddID0gSW5wdXRTdGF0ZSgnOicpXG5pbnB1dFsnOyddID0gSW5wdXRTdGF0ZSgnOycpXG5pbnB1dFsnPCddID0gSW5wdXRTdGF0ZSgnPCcpXG5pbnB1dFsnPSddID0gSW5wdXRTdGF0ZSgnPScpXG5pbnB1dFsnPiddID0gSW5wdXRTdGF0ZSgnPicpXG5pbnB1dFsnPyddID0gSW5wdXRTdGF0ZSgnPycpXG5pbnB1dFsnQCddID0gSW5wdXRTdGF0ZSgnQCcpXG5pbnB1dFsnQSddID0gSW5wdXRTdGF0ZSgnQScpXG5pbnB1dFsnQiddID0gSW5wdXRTdGF0ZSgnQicpXG5pbnB1dFsnQyddID0gSW5wdXRTdGF0ZSgnQycpXG5pbnB1dFsnRCddID0gSW5wdXRTdGF0ZSgnRCcpXG5pbnB1dFsnRSddID0gSW5wdXRTdGF0ZSgnRScpXG5pbnB1dFsnRiddID0gSW5wdXRTdGF0ZSgnRicpXG5pbnB1dFsnRyddID0gSW5wdXRTdGF0ZSgnRycpXG5pbnB1dFsnSCddID0gSW5wdXRTdGF0ZSgnSCcpXG5pbnB1dFsnSSddID0gSW5wdXRTdGF0ZSgnSScpXG5pbnB1dFsnSiddID0gSW5wdXRTdGF0ZSgnSicpXG5pbnB1dFsnSyddID0gSW5wdXRTdGF0ZSgnSycpXG5pbnB1dFsnTCddID0gSW5wdXRTdGF0ZSgnTCcpXG5pbnB1dFsnTSddID0gSW5wdXRTdGF0ZSgnTScpXG5pbnB1dFsnTiddID0gSW5wdXRTdGF0ZSgnTicpXG5pbnB1dFsnTyddID0gSW5wdXRTdGF0ZSgnTycpXG5pbnB1dFsnUCddID0gSW5wdXRTdGF0ZSgnUCcpXG5pbnB1dFsnUSddID0gSW5wdXRTdGF0ZSgnUScpXG5pbnB1dFsnUiddID0gSW5wdXRTdGF0ZSgnUicpXG5pbnB1dFsnUyddID0gSW5wdXRTdGF0ZSgnUycpXG5pbnB1dFsnVCddID0gSW5wdXRTdGF0ZSgnVCcpXG5pbnB1dFsnVSddID0gSW5wdXRTdGF0ZSgnVScpXG5pbnB1dFsnViddID0gSW5wdXRTdGF0ZSgnVicpXG5pbnB1dFsnVyddID0gSW5wdXRTdGF0ZSgnVycpXG5pbnB1dFsnWCddID0gSW5wdXRTdGF0ZSgnWCcpXG5pbnB1dFsnWSddID0gSW5wdXRTdGF0ZSgnWScpXG5pbnB1dFsnWiddID0gSW5wdXRTdGF0ZSgnWicpXG5pbnB1dFsnWyddID0gSW5wdXRTdGF0ZSgnWycpXG5pbnB1dFsnXFxcXCddID0gSW5wdXRTdGF0ZSgnXFxcXCcpXG5pbnB1dFsnXSddID0gSW5wdXRTdGF0ZSgnXScpXG5pbnB1dFsnXiddID0gSW5wdXRTdGF0ZSgnXicpXG5pbnB1dFsnXyddID0gSW5wdXRTdGF0ZSgnXycpXG5pbnB1dFsnYCddID0gSW5wdXRTdGF0ZSgnYCcpXG5pbnB1dFsneyddID0gSW5wdXRTdGF0ZSgneycpXG5pbnB1dFsnfCddID0gSW5wdXRTdGF0ZSgnfCcpXG5pbnB1dFsnfSddID0gSW5wdXRTdGF0ZSgnfScpXG5pbnB1dFsnfiddID0gSW5wdXRTdGF0ZSgnficpXG5cbmlucHV0LkVOVEVSID0gaW5wdXRbU3RyaW5nLmZyb21DaGFyQ29kZSgxMyldID0gSW5wdXRTdGF0ZShTdHJpbmcuZnJvbUNoYXJDb2RlKDEzKSlcbmlucHV0LkVTQyA9IGlucHV0W1N0cmluZy5mcm9tQ2hhckNvZGUoMjcpXSA9IElucHV0U3RhdGUoU3RyaW5nLmZyb21DaGFyQ29kZSgyNykpXG5cbmlucHV0Lk1PVVNFX0xCVVRUT04gPSBJbnB1dFN0YXRlKCdNT1VTRV9MQlVUVE9OJylcbmlucHV0Lk1PVVNFX01CVVRUT04gPSBJbnB1dFN0YXRlKCdNT1VTRV9NQlVUVE9OJylcbmlucHV0Lk1PVVNFX1JCVVRUT04gPSBJbnB1dFN0YXRlKCdNT1VTRV9SQlVUVE9OJylcbmlucHV0Lk1PVVNFX1dIRUVMID0gSW5wdXRTdGF0ZSgnTU9VU0VfV0hFRUwnKVxuaW5wdXQuTU9VU0VfT0ZGU0VUID0gdmVjMy56ZXJvKClcblxuXG5cbmxldCBnbG9iYWwgPSB2YWwoJ2dsb2JhbCcpXG5cblxubGlzdGVuKHdpbmRvdywgJ2NvbnRleHRtZW51JywgMTAwLCAoZXZlbnQpID0+IHsgZXZlbnQucHJldmVudERlZmF1bHQoKSB9KVxuXG5cbmxpc3Rlbih3aW5kb3csICdtb3VzZWRvd24nLCAxMDAsIChldmVudCkgPT4ge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KClcbiAgICBzd2l0Y2ggKGV2ZW50LmJ1dHRvbikge1xuICAgIGNhc2UgMDpcbiAgICAgICAgaW5wdXQuTU9VU0VfTEJVVFRPTi5sYXN0RG93biA9IGdsb2JhbC50aW1lc3RhbXBcbiAgICBicmVha1xuICAgIGNhc2UgMTpcbiAgICAgICAgaW5wdXQuTU9VU0VfTUJVVFRPTi5sYXN0RG93biA9IGdsb2JhbC50aW1lc3RhbXBcbiAgICBicmVha1xuICAgIGNhc2UgMjpcbiAgICAgICAgaW5wdXQuTU9VU0VfUkJVVFRPTi5sYXN0RG93biA9IGdsb2JhbC50aW1lc3RhbXBcbiAgICBicmVha1xuICAgIGRlZmF1bHQ6XG4gICAgYnJlYWtcbiAgICB9XG59KVxuXG5cbmxpc3Rlbih3aW5kb3csICdtb3VzZXVwJywgMTAwLCAoZXZlbnQpID0+IHtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgc3dpdGNoIChldmVudC5idXR0b24pIHtcbiAgICBjYXNlIDA6XG4gICAgICAgIGlucHV0Lk1PVVNFX0xCVVRUT04ubGFzdFVwID0gZ2xvYmFsLnRpbWVzdGFtcFxuICAgIGJyZWFrXG4gICAgY2FzZSAxOlxuICAgICAgICBpbnB1dC5NT1VTRV9NQlVUVE9OLmxhc3RVcCA9IGdsb2JhbC50aW1lc3RhbXBcbiAgICBicmVha1xuICAgIGNhc2UgMjpcbiAgICAgICAgaW5wdXQuTU9VU0VfUkJVVFRPTi5sYXN0VXAgPSBnbG9iYWwudGltZXN0YW1wXG4gICAgYnJlYWtcbiAgICBkZWZhdWx0OlxuICAgIGJyZWFrXG4gICAgfVxufSlcblxuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgbGV0IGNoYXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKVxuICAgIGlucHV0W2NoYXJdID0gSW5wdXRTdGF0ZShjaGFyKVxuICAgIGlucHV0W2NoYXJdLmxhc3REb3duID0gZ2xvYmFsLnRpbWVzdGFtcFxufSwgZmFsc2UpXG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGV2ZW50KSA9PiB7XG4gICAgbGV0IGNoYXIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGV2ZW50LndoaWNoKVxuICAgIGlucHV0W2NoYXJdID0gSW5wdXRTdGF0ZShjaGFyKVxuICAgIGlucHV0W2NoYXJdLmxhc3RVcCA9IGdsb2JhbC50aW1lc3RhbXBcbn0pXG5cblxubGlzdGVuKHdpbmRvdywgJ21vdXNlbW92ZScsIDAsIChldmVudCkgPT4ge1xuICAgIGlucHV0Lk1PVVNFX09GRlNFVC54ID0gZXZlbnQucGFnZVhcbiAgICBpbnB1dC5NT1VTRV9PRkZTRVQueSA9IGV2ZW50LnBhZ2VZXG59KVxuXG5cbmxpc3Rlbih3aW5kb3csICdtb3VzZXdoZWVsJywgMCwgKGV2ZW50KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dC5NT1VTRV9XSEVFTC5kZWx0YSA9PT0gJ3VuZGVmaW5lZCcpIGlucHV0Lk1PVVNFX1dIRUVMLmRlbHRhID0gMFxuICAgIGlucHV0Lk1PVVNFX1dIRUVMLmRlbHRhICs9IE1hdGgubWF4KC0xLCBNYXRoLm1pbigxLCAoZXZlbnQud2hlZWxEZWx0YSB8fCAtZXZlbnQuZGV0YWlsKSkpXG4gICAgaW5wdXQuTU9VU0VfV0hFRUwubGFzdERvd24gPSBnbG9iYWwudGltZXN0YW1wXG59KVxuXG5cbmV4cG9ydCBkZWZhdWx0IGlucHV0XG5cbiIsImltcG9ydCAnLi9jb250aW51b3VzJ1xuXG5sZXQgbWF0aCA9IHt9XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBzYW1lIHBzdWVkby1yYW5kb20gbnVtYmVyIGdpdmVuIHRoZSBzYW1lIGlucHV0cy5cbiAqIEBwYXJhbSB7bnVtYmVyfSB4XG4gKiBAcGFyYW0ge251bWJlcn0geVxuICogQHJldHVybiB7bnVtYmVyfSBbLTEuMCwgMS4wXVxuICovXG5tYXRoLm5vaXNlID0gZnVuY3Rpb24gKHgsIHkpIHtcblxuICAgIC8vIFNrZXcgdGhlIGlucHV0IHNwYWNlIHRvIGRldGVybWluZSB3aGljaCBzaW1wbGV4IGNlbGwgd2UncmUgaW5cbiAgICB2YXIgcyA9ICh4ICsgeSkgKiBteS5mMiwgICAgIC8vIEhhaXYgZmFjdG9yIGZvciAyRFxuICAgICAgICBpID0gTWF0aC5mbG9vcih4ICsgcyksXG4gICAgICAgIGogPSBNYXRoLmZsb29yKHkgKyBzKSxcbiAgICAgICAgdCA9ICggaSArIGogKSAqIG15LmcyLFxuICAgICAgICBYMCA9IGkgLSB0LCAgICAgICAgICAgLy8gVW5za2V3IHRoZSBjZWxsIG9yaWdpbiBiYWNrIHRvICggeCx5ICkgc3BhY2VcbiAgICAgICAgWTAgPSBqIC0gdCxcbiAgICAgICAgeDAgPSB4IC0gWDAsICAgICAgICAgIC8vIFRoZSB4LHkgZGlzdGFuY2VzIGZyb20gdGhlIGNlbGwgb3JpZ2luXG4gICAgICAgIHkwID0geSAtIFkwLFxuICAgICAgICBnaSwgaTEgPSAwLFxuICAgICAgICBqMSA9IDE7XG5cbiAgICAvLyBGb3IgdGhlIDJEIGNhc2UsIHRoZSBzaW1wbGV4IHNoYXBlIGlzIGFuIGVxdWlsYXRlcmFsIHRyaWFuZ2xlLlxuICAgIC8vIERldGVybWluZSB3aGljaCBzaW1wbGV4IHdlIGFyZSBpbi5cbiAgICBpZiAoeDAgPiB5MCkge1xuICAgICAgICBpMSA9IDE7XG4gICAgICAgIGoxID0gMDtcbiAgICB9XG5cbiAgICAvLyBBIHN0ZXAgb2YgKDEsMCkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgxLWMsLWMpIGluICh4LHkpLCBhbmRcbiAgICAvLyBhIHN0ZXAgb2YgKDAsMSkgaW4gKGksaikgbWVhbnMgYSBzdGVwIG9mICgtYywxLWMpIGluICh4LHkpLCB3aGVyZVxuICAgIC8vIGMgPSAoMy1zcXJ0KDMpKS82XG4gICAgLy8gT2Zmc2V0cyBmb3IgbWlkZGxlIGNvcm5lciBpbiAoeCx5KSB1bnNrZXdlZCBjb29yZHNcbiAgICB2YXIgeDEgPSB4MCAtIGkxICsgbXkuZzIsXG4gICAgICAgIC8vIE9mZnNldHMgZm9yIGxhc3QgY29ybmVyIGluICh4LHkpIHVuc2tld2VkIGNvb3Jkc1xuICAgICAgICB5MSA9IHkwIC0gajEgKyBteS5nMixcbiAgICAgICAgeDIgPSB4MCAtIDEuMCArIDIuMCAqIG15LmcyLFxuICAgICAgICAvLyBIYXNoZWQgZ3JhZGllbnQgaW5kaWNlcyBvZiB0aHJlZSBzaW1wbGV4IGNvcm5lcnNcbiAgICAgICAgeTIgPSB5MCAtIDEuMCArIDIuMCAqIG15LmcyLFxuICAgICAgICBpaSA9IGkgJiAyNTUsXG4gICAgICAgIGpqID0gaiAmIDI1NSxcbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBjb250cmlidXRpb24gZnJvbSB0aGUgdGhyZWUgY29ybmVyc1xuICAgICAgICB0MCA9IDAuNSAtIHgwICogeDAgLSB5MCAqIHkwLFxuICAgICAgICB0MSA9IDAuNSAtIHgxICogeDEgLSB5MSAqIHkxLFxuICAgICAgICB0MiA9IDAuNSAtIHgyICogeDIgLSB5MiAqIHkyLFxuICAgICAgICBuMCA9IDAuMCxcbiAgICAgICAgbjEgPSAwLjAsXG4gICAgICAgIG4yID0gMC4wO1xuXG4gICAgaWYgKHQwID49IDApIHtcbiAgICAgICAgZ2kgPSBteS5wZXJtMTIzW2lpICsgbXkucGVybVtqal1dO1xuICAgICAgICB0MCAqPSB0MDtcbiAgICAgICAgLy8gKCB4LHkgKSBvZiBteS5ncmFkMyB1c2VkIGZvciAyRCBncmFkaWVudFxuICAgICAgICBuMCA9IHQwICogdDAgKiAobXkuZ3JhZDNbZ2ldICogeDAgKyBteS5ncmFkM1tnaSArIDFdICogeTApO1xuICAgIH1cblxuICAgIGlmICh0MSA+PSAwKSB7XG4gICAgICAgIGdpID0gbXkucGVybTEyM1tpaSArIGkxICsgbXkucGVybVtqaiArIGoxXV07XG4gICAgICAgIHQxICo9IHQxO1xuICAgICAgICBuMSA9IHQxICogdDEgKiAobXkuZ3JhZDNbZ2ldICogeDEgKyBteS5ncmFkM1tnaSArIDFdICogeTEpO1xuICAgIH1cblxuICAgIGlmICh0MiA+PSAwKSB7XG4gICAgICAgIGdpID0gbXkucGVybTEyM1tpaSArIDEgKyBteS5wZXJtW2pqICsgMV1dO1xuICAgICAgICB0MiAqPSB0MjtcbiAgICAgICAgbjIgPSB0MiAqIHQyICogKG15LmdyYWQzW2dpXSAqIHgyICsgbXkuZ3JhZDNbZ2kgKyAxXSAqIHkyKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgY29udHJpYnV0aW9ucyBmcm9tIGVhY2ggY29ybmVyIHRvIGdldCB0aGUgZmluYWwgbm9pc2UgdmFsdWUuXG4gICAgLy8gVGhlIHJlc3VsdCBpcyBzY2FsZWQgdG8gcmV0dXJuIHZhbHVlcyBpbiB0aGUgaW50ZXJ2YWwgWy0xLDFdLlxuICAgIHJldHVybiA3MC4wICogKG4wICsgbjEgKyBuMik7XG5cbn07XG5cblxuXG4vKipcbiAqIFNlZWRzIHRoZSBNYXRoLnJhbmRvbSgpIG51bWJlciBnZW5lcmF0b3IgZ2l2ZW4gYSB7c3RyaW5nfS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzZWVkXG4gKi9cbm1hdGguc2VlZCA9IGZ1bmN0aW9uKHNlZWQpIHtcblxuICAgIG15LmN1cnJlbnRTZWVkID0gMDtcblxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBzZWVkLmxlbmd0aDsgKytpbmRleCkge1xuICAgICAgICBteS5jdXJyZW50U2VlZCA9ICgobXkuY3VycmVudFNlZWQgPDwgNSkgLSBteS5jdXJyZW50U2VlZCkgKyBzZWVkLmNoYXJDb2RlQXQoaW5kZXgpO1xuICAgICAgICBteS5jdXJyZW50U2VlZCB8PSAwO1xuICAgIH1cblxuXG4gICAgLy8gT3ZlcnJpZGUgdGhlIGJ1aWx0LWluIE1hdGgucmFuZG9tIHdpdGggYSBzZWVkZWQgcHN1ZWRvLXJhbmRvbSBpbXBsZW1lbnRhdGlvblxuICAgIE1hdGgucmFuZG9tID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIG15LmN1cnJlbnRTZWVkID0gTWF0aC5zaW4obXkuY3VycmVudFNlZWQpICogMTAwMDA7XG4gICAgICAgIHJldHVybiBteS5jdXJyZW50U2VlZCAtIE1hdGguZmxvb3IobXkuY3VycmVudFNlZWQpO1xuICAgIH07XG5cblxuICAgIC8vIEluaXRpYWxpc2UgdGhlIG5vaXNlIGNvbnN0YW50c1xuICAgIG15LmYyID0gMC41ICogKE1hdGguc3FydCgzLjApIC0gMS4wKTtcbiAgICBteS5nMiA9ICgzLjAgLSBNYXRoLnNxcnQoMy4wKSkgLyA2LjA7XG5cblxuICAgIHZhciBDID0gMjU2O1xuICAgIHZhciBQID0gbmV3IFVpbnQ4QXJyYXkoQyk7XG5cbiAgICB3aGlsZSAoQy0tKSB7XG4gICAgICAgIFBbQ10gPSAoTWF0aC5yYW5kb20oKSAqIDI1NikgfCAwO1xuICAgIH1cblxuICAgIC8vIFRvIHJlbW92ZSB0aGUgbmVlZCBmb3IgaW5kZXggd3JhcHBpbmcsIGRvdWJsZSB0aGUgcGVybXV0YXRpb24gdGFibGUgbGVuZ3RoXG4gICAgQyA9IDUxMjtcbiAgICBteS5wZXJtID0gbmV3IFVpbnQ4QXJyYXkoQyk7XG4gICAgbXkucGVybTEyMyA9IG5ldyBVaW50OEFycmF5KEMpO1xuXG4gICAgd2hpbGUgKEMtLSkge1xuICAgICAgICBteS5wZXJtW0NdID0gUFtDICYgMjU1XTtcbiAgICAgICAgbXkucGVybTEyM1tDXSA9IChteS5wZXJtW0NdICUgMTIpICogMztcbiAgICB9XG5cbn07XG5cblxuXG5sZXQgbXkgPSB2YWwoJ21hdGgnKVxuXG5cbmlmICghbXkuaW5pdGlhbGlzZWQpIHtcblxuICBteS5pbml0aWFsaXNlZCA9IHRydWVcblxuICBteS5ncmFkMyA9IG5ldyBGbG9hdDMyQXJyYXkoW1xuICAgICAgMSwgMSwgMCwgLTEsICAgMSwgMCwgMSwgLTEsICAgMCwgLTEsIC0xLCAgMCxcbiAgICAgIDEsIDAsIDEsIC0xLCAgIDAsIDEsIDEsICAwLCAgLTEsIC0xLCAgMCwgLTEsXG4gICAgICAwLCAxLCAxLCAgMCwgIC0xLCAxLCAwLCAgMSwgIC0xLCAgMCwgLTEsIC0xXG4gICAgXSlcblxuICBteS5jdXJyZW50U2VlZCA9IDBcblxuICBtYXRoLnNlZWQoJzAwMDAwMDAwMDAwMDAwMDAwMCcpXG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBtYXRoXG5cbiIsImltcG9ydCBlbnRpdHkgZnJvbSAnLi4vLi4vZW50aXR5J1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5cbmNvbnN0IFRZUEUgPSAnY2VsbC9ibGFuaydcblxuZW50aXR5LnR5cGUoVFlQRSwgKGVudCwgZnJvbVN0cmluZykgPT4ge1xuICAvLyBvbiBlbnRpdHkgY3JlYXRlXG5cbiAgcmV0dXJuIGVudFxuXG59LCAoZW50LCB0b1N0cmluZykgPT4ge1xuICAvLyBvbiBlbnRpdHkgdG9TdHJpbmdcbiAgXG4gIHJldHVybiB0b1N0cmluZ1xuXG59LCAoZW50KSA9PiB7XG4gIC8vIG9uIGVudGl0eSB1cGRhdGUgXG4gXG59LCAoZW50KSA9PiB7XG4gIC8vIG9uIGVudGl0eSBkZXN0cm95XG5cbn0pXG5cblxuZXhwb3J0IGRlZmF1bHQgKGVudCkgPT4ge1xuICAvLyBjcmVhdGUgaGVscGVyIFxuICBcbiAgZW50ID0gZW50IHx8IHt9IFxuICBlbnQudHlwZSA9IFRZUEVcbiAgcmV0dXJuIGVudGl0eShlbnQpXG5cbn1cbiIsImltcG9ydCBlbnRpdHkgZnJvbSAnLi4vLi4vZW50aXR5J1xuaW1wb3J0IGNvbmZpZyBmcm9tICcuLi8uLi9jb25maWcnXG5cbmNvbnN0IFRZUEUgPSAnZmxvcmEvZ3Jhc3MnXG5cbmVudGl0eS50eXBlKFRZUEUsIChlbnQsIGZyb21TdHJpbmcpID0+IHtcbiAgLy8gb24gZW50aXR5IGNyZWF0ZVxuICBcbiAgZW50LmFuY2hvci54ID0gMC4wMVxuICBlbnQuYW5jaG9yLnkgPSAtMC40NVxuXG4gIGxldCBzaXplID0gMC4yICsgMC40ICogY29uZmlnLmF2Z19hZHVsdF9oZWlnaHRcbiAgZW50LnNpemUueCA9IHNpemVcbiAgZW50LnNpemUueSA9IHNpemVcblxuICByZXR1cm4gZW50XG5cbn0sIChlbnQsIHRvU3RyaW5nKSA9PiB7XG4gIC8vIG9uIGVudGl0eSB0b1N0cmluZ1xuICBcbiAgcmV0dXJuIHRvU3RyaW5nXG5cbn0sIChlbnQpID0+IHtcbiAgLy8gb24gZW50aXR5IHVwZGF0ZSBcbiBcbn0sIChlbnQpID0+IHtcbiAgLy8gb24gZW50aXR5IGRlc3Ryb3lcblxufSlcblxuXG5leHBvcnQgZGVmYXVsdCAoZW50KSA9PiB7XG4gIC8vIGNyZWF0ZSBoZWxwZXIgXG4gIFxuICBlbnQgPSBlbnQgfHwge30gXG4gIGVudC50eXBlID0gVFlQRVxuICByZXR1cm4gZW50aXR5KGVudClcblxufVxuXG4iLCJpbXBvcnQgZW50aXR5IGZyb20gJy4uLy4uL2VudGl0eSdcbmltcG9ydCBjb25maWcgZnJvbSAnLi4vLi4vY29uZmlnJ1xuaW1wb3J0IHZlYzMgZnJvbSAnLi4vLi4vdmVjMydcblxuY29uc3QgVFlQRSA9ICdhbmltYWwvcGVyc29uJ1xuXG5lbnRpdHkudHlwZShUWVBFLCAoZW50LCBmcm9tU3RyaW5nKSA9PiB7XG4gIC8vIG9uIGVudGl0eSBjcmVhdGVcbiAgXG4gIGVudC5hbmNob3IueCA9IDAuMVxuICBlbnQuYW5jaG9yLnkgPSAtMC4zMlxuICBlbnQuY29sbGlkZSA9IHZlYzMoe3g6IDAuNywgeTogMC4yfSlcblxuICBpZiAoZnJvbVN0cmluZykge1xuXG4gICAgZW50Lm5hbWUgPSBmcm9tU3RyaW5nWzRdXG5cbiAgfSBlbHNlIHtcblxuICAgIGVudC5zaXplLnggPSAwLjY2ICogY29uZmlnLmF2Z19hZHVsdF9oZWlnaHRcbiAgICBlbnQuc2l6ZS55ID0gY29uZmlnLmF2Z19hZHVsdF9oZWlnaHRcblxuICAgIGVudC5tb3ZlbWVudFNwZWVkID0gZW50LmJhc2VNb3ZlbWVudFNwZWVkID0gMlxuXG4gIH0gXG5cbiAgcmV0dXJuIGVudFxuXG59LCAoZW50LCB0b1N0cmluZykgPT4ge1xuICAvLyBvbiBlbnRpdHkgdG9TdHJpbmdcbiAgXG4gIHJldHVybiBbXG4gICAgdG9TdHJpbmcsXG4gICAgZW50Lm5hbWVcbiAgXS5qb2luKCdcIicpXG5cblxufSwgKGVudCkgPT4ge1xuICAvLyBvbiBlbnRpdHkgdXBkYXRlIFxuIFxufSwgKGVudCkgPT4ge1xuICAvLyBvbiBlbnRpdHkgZGVzdHJveVxuXG59KVxuXG5cbmV4cG9ydCBkZWZhdWx0IChlbnQpID0+IHtcbiAgLy8gY3JlYXRlIGhlbHBlciBcbiAgXG4gIGVudCA9IGVudCB8fCB7fSBcbiAgZW50LnR5cGUgPSBUWVBFXG4gIGVudC5uYW1lID0gZW50Lm5hbWUgfHwgJ3VubmFtZWQnXG4gIHJldHVybiBlbnRpdHkoZW50KVxuXG59XG4iLCJsZXQgYmluYXJ5aGVhcCA9ICgpID0+IHtcbiAgbGV0IGhlYXAgPSB7XG4gICAgaXRlbXM6IFtdXG4gIH1cbiAgcmV0dXJuIGhlYXBcbn1cblxuXG5iaW5hcnloZWFwLnB1c2ggPSAoaGVhcCwgaXRlbSkgPT4ge1xuICAvLyBhZGQgdGhlIG5ldyBlbGVtZW50IHRvIHRoZSBlbmQgb2YgdGhlIGFycmF5XG4gIGhlYXAuaXRlbXMucHVzaChpdGVtKVxuICAvLyBhbGxvdyBpdCB0byBidWJibGUgdXBcbiAgYmluYXJ5aGVhcC5idWJibGVVcChoZWFwLCBoZWFwLml0ZW1zLmxlbmd0aCAtIDEpXG59XG5cblxuYmluYXJ5aGVhcC5wb3AgPSAoaGVhcCkgPT4ge1xuICAvLyBzdG9yZSB0aGUgZmlyc3QgaXRlbSBzbyB3ZSBjYW4gcmV0dXJuIGl0IGxhdGVyXG4gIGxldCByZXN1bHQgPSBoZWFwLml0ZW1zWzBdXG4gIC8vIGdldCB0aGUgaXRlbSBhdCB0aGUgZW5kIG9mIHRoZSBhcnJheVxuICBsZXQgZW5kID0gaGVhcC5pdGVtcy5wb3AoKVxuICAvLyBpZiB0aGVyZSBhcmUgYW55IGl0ZW1zIGxlZnQsIHB1dCB0aGUgZW5kIGVsZW1lbnQgYXQgdGhlIHN0YXJ0LCBhbmQgbGV0IGl0IHNpbmsgZG93blxuICBpZiAoaGVhcC5pdGVtcy5sZW5ndGggPiAwKSB7XG4gICAgaGVhcC5pdGVtc1swXSA9IGVuZFxuICAgIGJpbmFyeWhlYXAuc2lua0Rvd24oaGVhcCwgMClcbiAgfVxuICByZXR1cm4gcmVzdWx0XG59XG5cblxuYmluYXJ5aGVhcC5yZXNjb3JlID0gKGhlYXAsIGl0ZW0pID0+IHtcbiAgYmluYXJ5aGVhcC5zaW5rRG93bihoZWFwLCBoZWFwLml0ZW1zLmluZGV4T2YoaXRlbSkpXG59XG5cblxuYmluYXJ5aGVhcC5yZW1vdmUgPSAoaGVhcCwgaXRlbSkgPT4ge1xuXG4gIGxldCBsZW5ndGggPSBoZWFwLml0ZW1zLmxlbmd0aFxuXG4gIC8vIHRvIHJlbW92ZSBhIHZhbHVlLCB3ZSBtdXN0IHNlYXJjaCB0aHJvdWdoIHRoZSBhcnJheSB0byBmaW5kIGl0XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoaGVhcC5pdGVtc1tpXSAhPSBpdGVtKSBjb250aW51ZVxuICAgIC8vIHdoZW4gaXQgaXMgZm91bmQsIHRoZSBwcm9jZXNzIHNlZW4gaW4gJ3BvcCcgaXMgcmVwZWF0ZWQgdG8gZmlsbCB1cCB0aGUgaG9sZVxuICAgIGxldCBlbmQgPSBoZWFwLml0ZW1zLnBvcCgpXG4gICAgLy8gaWYgdGhlIGl0ZW0gd2UgcG9wcGVkIHdhcyB0aGUgb25lIHdlIG5lZWRlZCB0byByZW1vdmUsIHdlJ3JlIGRvbmVcbiAgICBpZiAoaSA9PSBsZW5ndGggLSAxKSBicmVha1xuICAgIC8vIG90aGVyd2lzZSwgd2UgcmVwbGFjZSB0aGUgcmVtb3ZlZCBlbGVtZW50IHdpdGggdGhlIHBvcHBlZFxuICAgIC8vIG9uZSwgYW5kIGFsbG93IGl0IHRvIGZsb2F0IHVwIG9yIHNpbmsgZG93biBhcyBhcHByb3ByaWF0ZS5cbiAgICBoZWFwLml0ZW1zW2ldID0gZW5kXG4gICAgYmluYXJ5aGVhcC5idWJibGVVcChoZWFwLCBpKVxuICAgIGJpbmFyeWhlYXAuc2lua0Rvd24oaGVhcCwgaSlcbiAgICBicmVha1xuICB9XG5cbn1cblxuXG5iaW5hcnloZWFwLnNpemUgPSAoaGVhcCkgPT4ge1xuICByZXR1cm4gaGVhcC5pdGVtcy5sZW5ndGhcbn1cblxuXG5iaW5hcnloZWFwLmJ1YmJsZVVwID0gKGhlYXAsIGkpID0+IHtcbiAgLy8gZmV0Y2ggdGhlIGl0ZW0gdGhhdCBoYXMgdG8gYmUgbW92ZWRcbiAgbGV0IGl0ZW0gPSBoZWFwLml0ZW1zW2ldLCBzY29yZSA9IGl0ZW0uc2NvcmVcbiAgLy8gd2hlbiBhdCAwLCBhbiBpdGVtIGNhbiBub3QgZ28gdXAgYW55IGZ1cnRoZXJcbiAgd2hpbGUgKGkgPiAwKSB7XG4gICAgLy8gY29tcHV0ZSB0aGUgcGFyZW50IGl0ZW0ncyBpbmRleCwgYW5kIGZldGNoIGl0LlxuICAgIGxldCBwYXJlbnROID0gTWF0aC5mbG9vcigoaSArIDEpIC8gMikgLSAxXG4gICAgbGV0IHBhcmVudCA9IGhlYXAuaXRlbXNbcGFyZW50Tl1cbiAgICAvLyBpZiB0aGUgcGFyZW50IGhhcyBhIGxlc3NlciBzY29yZSwgdGhpbmdzIGFyZSBpbiBvcmRlciBhbmQgd2UgYXJlIGRvbmVcbiAgICBpZiAoc2NvcmUgPj0gcGFyZW50LnNjb3JlKSBicmVha1xuXG4gICAgLy8gb3RoZXJ3aXNlLCBzd2FwIHRoZSBwYXJlbnQgd2l0aCB0aGUgY3VycmVudCBpdGVtIGFuZCBjb250aW51ZVxuICAgIGhlYXAuaXRlbXNbcGFyZW50Tl0gPSBpdGVtIFxuICAgIGhlYXAuaXRlbXNbaV0gPSBwYXJlbnRcbiAgICBpID0gcGFyZW50TlxuICB9XG59XG5cblxuYmluYXJ5aGVhcC5zaW5rRG93biA9IChoZWFwLCBpKSA9PiB7XG5cbiAgLy8gbG9vayB1cCB0aGUgdGFyZ2V0IGl0ZW0gYW5kIGl0cyBzY29yZVxuICBsZXQgbGVuZ3RoID0gaGVhcC5pdGVtcy5sZW5ndGhcbiAgbGV0IGl0ZW0gPSBoZWFwLml0ZW1zW2ldXG4gIGxldCBlbGVtU2NvcmUgPSBpdGVtLnNjb3JlXG5cbiAgd2hpbGUodHJ1ZSkge1xuICAgIC8vIGNvbXB1dGUgdGhlIGluZGljZXMgb2YgdGhlIGNoaWxkIGl0ZW1zXG4gICAgbGV0IGNoaWxkMk4gPSAoaSArIDEpICogMiwgY2hpbGQxTiA9IGNoaWxkMk4gLSAxXG4gICAgLy8gdGhpcyBpcyB1c2VkIHRvIHN0b3JlIHRoZSBuZXcgcG9zaXRpb24gb2YgdGhlIGl0ZW0sIGlmIGFueVxuICAgIGxldCBzd2FwID0gbnVsbFxuICAgIGxldCBjaGlsZDFTY29yZVxuICAgIC8vIGlmIHRoZSBmaXJzdCBjaGlsZCBleGlzdHMgKGlzIGluc2lkZSB0aGUgYXJyYXkpLi4uXG4gICAgaWYgKGNoaWxkMU4gPCBsZW5ndGgpIHtcbiAgICAgIC8vIGxvb2sgaXQgdXAgYW5kIGNvbXB1dGUgaXRzIHNjb3JlLlxuICAgICAgbGV0IGNoaWxkMSA9IGhlYXAuaXRlbXNbY2hpbGQxTl1cbiAgICAgIGNoaWxkMVNjb3JlID0gY2hpbGQxLnNjb3JlXG4gICAgICAvLyBpZiB0aGUgc2NvcmUgaXMgbGVzcyB0aGFuIG91ciBpdGVtJ3MsIHdlIG5lZWQgdG8gc3dhcC5cbiAgICAgIGlmIChjaGlsZDFTY29yZSA8IGVsZW1TY29yZSkgc3dhcCA9IGNoaWxkMU5cbiAgICB9XG4gICAgLy8gZG8gdGhlIHNhbWUgY2hlY2tzIGZvciB0aGUgb3RoZXIgY2hpbGRcbiAgICBpZiAoY2hpbGQyTiA8IGxlbmd0aCkge1xuICAgICAgbGV0IGNoaWxkMiA9IGhlYXAuaXRlbXNbY2hpbGQyTl1cbiAgICAgIGxldCBjaGlsZDJTY29yZSA9IGNoaWxkMi5zY29yZVxuICAgICAgaWYgKGNoaWxkMlNjb3JlIDwgKHN3YXAgPT09IG51bGwgPyBlbGVtU2NvcmUgOiBjaGlsZDFTY29yZSkpIHN3YXAgPSBjaGlsZDJOXG4gICAgfVxuXG4gICAgLy8gbm8gbmVlZCB0byBzd2FwIGZ1cnRoZXIsIHdlIGFyZSBkb25lXG4gICAgaWYgKHN3YXAgPT09IG51bGwpIGJyZWFrXG5cbiAgICAvLyBvdGhlcndpc2UsIHN3YXAgYW5kIGNvbnRpbnVlXG4gICAgaGVhcC5pdGVtc1tpXSA9IGhlYXAuaXRlbXNbc3dhcF1cbiAgICBoZWFwLml0ZW1zW3N3YXBdID0gaXRlbVxuICAgIGkgPSBzd2FwXG4gIH1cblxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IGJpbmFyeWhlYXBcblxuIiwiaW1wb3J0IGNlbGxzIGZyb20gJy4vY2VsbHMnXG5pbXBvcnQgYmluYXJ5aGVhcCBmcm9tICcuL2JpbmFyeWhlYXAnXG5cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBzdGFpZ2h0IGxpbmUgd2F5cG9pbnRzIHRoYXQgYXZvaWQgY29sbGlzaW9ucyBmcm9tIGVudCdzIGN1cnJlbnQgY2VsbCB0byBkZXN0aW5hdGlvbi5cbiAqXG4gKiBAcGFyYW0ge0VudGl0eX0gZW50XG4gKiBAcGFyYW0ge0NlbGx9IGRlc3RpbmF0aW9uXG4gKiBAcmV0dXJuIHtDZWxsW119XG4gKi9cbmxldCBwYXRoID0gKGVudCwgZGVzdGluYXRpb24pID0+IHtcblxuICBsZXQgY2xscyA9IGRlc3RpbmF0aW9uLm93bmVyXG4gIGxldCBjb3N0XG4gIGxldCBnU2NvcmVcblxuICBpZiAoZW50LmNvbGxpZGUgJiYgY2VsbHMuY29sbGlkZXMoZW50LCBjZWxscy5jb2xsaXNpb25BcmVhKGVudCwgZGVzdGluYXRpb24pKSkge1xuICAgIC8vIGRlc3RpbmF0aW9uIGlzIGluIGEgY29sbGlzaW9uOyBhZGp1c3QgdG8gbmVhcmVzdCBjZWxsIG9uIHN0cmFpZ2h0IGxpbmUgdGhhdCBkb2Vzbid0IGNvbGxpZGVcbiAgICBsZXQgbGluZSA9IGNlbGxzLnJheXRyYWNlKGRlc3RpbmF0aW9uLCBlbnQuY2VsbClcbiAgICBmb3IgKGxldCBjbGwgaW4gbGluZSkge1xuICAgICAgZGVzdGluYXRpb24gPSBsaW5lW2NsbF1cbiAgICAgIC8vIGNvbnRpbnVlIHBhdGggZmluZGluZyB3aXRoIGRlc3RpbmF0aW9uIHNldCBhdCBjdXJyZW50IGNlbGwgaWYgbm8gY29sbGlzaW9uIGZvdW5kXG4gICAgICBpZiAoIWNlbGxzLmNvbGxpZGVzKGVudCwgY2VsbHMuY29sbGlzaW9uQXJlYShlbnQsIGRlc3RpbmF0aW9uKSkpIGJyZWFrXG4gICAgfVxuICB9XG5cblxuICBpZiAoZW50LmNvbGxpZGUgJiYgY2VsbHMuY29sbGlkZXMoZW50LCBjZWxscy5jb2xsaXNpb25BcmVhKGVudCkpKSB7XG4gICAgY29uc29sZS5sb2coJ2Vycm9yOiBlbnQgaXMgYWxyZWFkeSBjb2xsaWRpbmc7IG5lZWQgYW4gdW5zdGljayBzdGVwIGhlcmUnKVxuICAgIHJldHVybiBbXVxuICB9XG5cbiAgLy8gY2xlYW4gZGlydHkgbm9kZXNcbiAgY2VsbHMuY2xlYW5EaXJ0eVBhdGhJbmZvKGNsbHMpXG5cbiAgbGV0IHN0YXJ0Q2VsbCA9IGVudC5jZWxsXG4gIGxldCBlbmRDZWxsID0gZGVzdGluYXRpb25cblxuICBjbGxzLmRpcnR5Q2VsbHMgPSBbc3RhcnRDZWxsXVxuXG4gIHN0YXJ0Q2VsbC5nID0gMFxuICBzdGFydENlbGwuc2NvcmUgPSAwXG5cbiAgbGV0IGhlYXAgPSBiaW5hcnloZWFwKClcbiAgYmluYXJ5aGVhcC5wdXNoKGhlYXAsIHN0YXJ0Q2VsbClcblxuICB3aGlsZSAoYmluYXJ5aGVhcC5zaXplKGhlYXApKSB7XG5cbiAgICAvLyBwb3AgdGhlIGxvd2VzdCBzY29yZWQgY2VsbCBvZmYgdGhlIGhlYXBcbiAgICBsZXQgY3VycmVudENlbGwgPSBiaW5hcnloZWFwLnBvcChoZWFwKVxuXG4gICAgLy8gZW5kIGNvbmRpdGlvbiAtLSByZXN1bHQgaGFzIGJlZW4gZm91bmQsIHJldHVybiB0aGUgdHJhY2VkIHBhdGhcbiAgICBpZiAoY3VycmVudENlbGwgPT09IGVuZENlbGwgfHwgYmluYXJ5aGVhcC5zaXplKGhlYXApID4gMTAwKSB7XG4gICAgICByZXR1cm4gdHJhY2VQYXRoKGN1cnJlbnRDZWxsKVxuICAgIH1cblxuICAgIC8vIG1vdmUgY3VycmVudENlbGwgZnJvbSBvcGVuIHRvIGNsb3NlZCwgcHJvY2VzcyBlYWNoIG9mIGl0cyBuZWlnaGJvdXJzXG4gICAgY3VycmVudENlbGwuY2xvc2VkID0gdHJ1ZVxuXG4gICAgbGV0IG5laWdoYm91cnMgPSBbY3VycmVudENlbGwubm9ydGgsIGN1cnJlbnRDZWxsLmVhc3QsIGN1cnJlbnRDZWxsLnNvdXRoLCBjdXJyZW50Q2VsbC53ZXN0XVxuXG4gICAgZm9yIChsZXQgbmVpZ2hib3VyIGluIG5laWdoYm91cnMpIHtcblxuICAgICAgbmVpZ2hib3VyID0gbmVpZ2hib3Vyc1tuZWlnaGJvdXJdXG5cbiAgICAgIGlmICghbmVpZ2hib3VyIHx8IG5laWdoYm91ci5jbG9zZWQpIGNvbnRpbnVlXG5cbiAgICAgIC8vIGNsb3NlIGFuZCBjb250aW51ZSBpZiBhIGNvbGxpc2lvbiB3b3VsZCBvY2N1clxuICAgICAgaWYgKGVudC5jb2xsaWRlICYmIGNlbGxzLmNvbGxpZGVzKGVudCwgY2VsbHMuY29sbGlzaW9uQXJlYShlbnQsIG5laWdoYm91cikpKSB7XG4gICAgICAgIG5laWdoYm91ci5jbG9zZWQgPSB0cnVlXG4gICAgICAgIGNsbHMuZGlydHlDZWxscy5wdXNoKG5laWdoYm91cilcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgbGV0IGJlZW5WaXNpdGVkID0gbmVpZ2hib3VyLnZpc2l0ZWRcbiAgICAgIGxldCBuZWlnaGJvdXJQYXJlbnQgPSBjdXJyZW50Q2VsbFxuXG4gICAgICAvLyBtYWtlIG5laWdoYm91cnMgcGFyZW50IHRoZSBwYXJlbnQgb2YgY3VycmVudENlbGwgaWYgdHJhdmVsZWQgaW4gYSBzdHJhaWdodCBsaW5lIGRvZXMgbm90IGNvbGxpZGVcbiAgICAgIGlmIChjdXJyZW50Q2VsbC5wYXJlbnQgJiYgY2VsbHMuY2FuU3RyYWlnaHRMaW5lVHJhdmVsKGN1cnJlbnRDZWxsLnBhcmVudCwgbmVpZ2hib3VyLCBlbnQpKSB7XG4gICAgICAgIG5laWdoYm91clBhcmVudCA9IGN1cnJlbnRDZWxsLnBhcmVudFxuICAgICAgfVxuXG4gICAgICBnU2NvcmUgPSBuZWlnaGJvdXJQYXJlbnQuZyArIDFcblxuICAgICAgLy8gY2hlY2sgaWYgbmVpZ2hib3VyIGhhcyBub3QgYmVlbiB2aXNpdGVkIHlldCwgb3IgY2FuIGJlIHJlYWNoZWQgd2l0aCBhIHNtYWxsZXIgY29zdCBmcm9tIGN1cnJlbnRcbiAgICAgIGlmICghbmVpZ2hib3VyLnZpc2l0ZWQgfHwgZ1Njb3JlIDwgbmVpZ2hib3VyLmcpIHtcblxuICAgICAgICBuZWlnaGJvdXIucGFyZW50ID0gbmVpZ2hib3VyUGFyZW50XG4gICAgICAgIG5laWdoYm91ci5oID0gbmVpZ2hib3VyLmggfHwgaGV1cmlzdGljKG5laWdoYm91ciwgZW5kQ2VsbClcbiAgICAgICAgbmVpZ2hib3VyLmcgPSBnU2NvcmVcbiAgICAgICAgbmVpZ2hib3VyLnNjb3JlID0gbmVpZ2hib3VyLmcgKyBuZWlnaGJvdXIuaFxuXG4gICAgICAgIGNsbHMuZGlydHlDZWxscy5wdXNoKG5laWdoYm91cilcblxuICAgICAgICBpZiAoIWJlZW5WaXNpdGVkKSB7XG4gICAgICAgICAgLy8gcHVzaGluZyB0byBoZWFwIHdpbGwgcHV0IGl0IGluIHByb3BlciBwbGFjZSBiYXNlZCBvbiB0aGUgJ2YnIHZhbHVlLlxuICAgICAgICAgIGJpbmFyeWhlYXAucHVzaChoZWFwLCBuZWlnaGJvdXIpXG4gICAgICAgICAgbmVpZ2hib3VyLnZpc2l0ZWQgPSB0cnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYWxyZWFkeSBzZWVuIHRoZSBub2RlLCBidXQgc2luY2UgaXQgaGFzIGJlZW4gcmVzY29yZWQgd2UgbmVlZCB0byByZW9yZGVyIGl0IGluIHRoZSBoZWFwXG4gICAgICAgICAgYmluYXJ5aGVhcC5yZXNjb3JlKGhlYXAsIG5laWdoYm91cilcbiAgICAgICAgfVxuXG4gICAgICB9XG5cbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBbXVxuXG59XG5cblxuLyoqXG4gKiBNYW5oYXR0YW4gZGlzdGFuY2VcbiAqL1xubGV0IGhldXJpc3RpYyA9IChzdGFydCwgZW5kKSA9PiB7XG5cbiAgbGV0IGR4ID0gTWF0aC5hYnMoc3RhcnQucG9zaXRpb24ueCAtIGVuZC5wb3NpdGlvbi54KVxuICBsZXQgZHkgPSBNYXRoLmFicyhzdGFydC5wb3NpdGlvbi55IC0gZW5kLnBvc2l0aW9uLnkpXG5cbiAgcmV0dXJuIGR4ICsgZHlcblxufVxuXG5cbmxldCB0cmFjZVBhdGggPSAoY2xsKSA9PiB7XG5cbiAgICBsZXQgY3VyciA9IGNsbFxuICAgIHZhciBwYXRoID0gW11cblxuICAgIHdoaWxlIChjdXJyLnBhcmVudCkge1xuICAgICAgY3Vyci5wYXRoID0gdHJ1ZVxuICAgICAgcGF0aC5wdXNoKGN1cnIpXG4gICAgICBjdXJyID0gY3Vyci5wYXJlbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aC5yZXZlcnNlKClcblxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IHBhdGhcblxuIiwiaW1wb3J0ICcuLi9jb250aW51b3VzJ1xuaW1wb3J0IGVmZmVjdCBmcm9tICcuLi9lZmZlY3QnXG5pbXBvcnQgdmVjMyBmcm9tICcuLi92ZWMzJ1xuaW1wb3J0IGNlbGxzIGZyb20gJy4uL2NlbGxzJ1xuaW1wb3J0IHBhdGggZnJvbSAnLi4vcGF0aCdcblxuXG5jb25zdCBUWVBFID0gJ21vdmVmaW5kcGF0aCdcblxuXG5lZmZlY3QudHlwZShUWVBFLCAoZWZ0KSA9PiB7XG4gIC8vIG9uIGVmZmVjdCBjcmVhdGVcblxuICAvLyBjYW5jZWwgY3JlYXRpb24gaWYgYSBkZXN0aW5hdGlvbiB3YXNuJ3QgZ2l2ZW4gaW4gZXh0cmFzXG4gIGlmICghZWZ0LmV4dHJhcy5oYXNPd25Qcm9wZXJ0eSgnZGVzdGluYXRpb24nKSkgcmV0dXJuXG5cbiAgLy8gcmVtb3ZlIGFuIGV4aXN0aW5nICdtb3ZlZmluZHBhdGgnIGVmdCBmcm9tIHRoZSBlbnRpdHlcbiAgZm9yIChsZXQgaSBpbiBlZnQuZW50aXR5LmVmZmVjdHMpIHtcbiAgICBpZiAoZWZ0LmVudGl0eS5lZmZlY3RzW2ldLnR5cGUgPT09IFRZUEUpIHtcbiAgICAgIGVmZmVjdC5kZXN0cm95KGVmdC5lbnRpdHkuZWZmZWN0c1tpXSlcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgZWZ0LmV4dHJhcy5wYXRoID0gcGF0aChlZnQuZW50aXR5LCBlZnQuZXh0cmFzWydkZXN0aW5hdGlvbiddKVxuXG4gIHJldHVybiBlZnRcblxufSwgKGVmdCkgPT4ge1xuICAvLyBvbiBlZmZlY3QgdXBkYXRlXG5cbiAgaWYgKGVmdC5leHRyYXMucGF0aC5sZW5ndGggPT09IDApIHtcbiAgICBlZmZlY3QuZGVzdHJveShlZnQpXG4gICAgcmV0dXJuXG4gIH1cblxuICBsZXQgYWJzb2x1dGVQb3NpdGlvbiA9IHZlYzMuYWRkVmVjdG9ycyhlZnQuZW50aXR5LmNlbGwucG9zaXRpb24sIGVmdC5lbnRpdHkub2Zmc2V0KVxuICBsZXQgb2Zmc2V0RGVsdGEgPSB2ZWMzLnN1YnRyYWN0VmVjdG9ycyhlZnQuZXh0cmFzLnBhdGhbMF0ucG9zaXRpb24sIGFic29sdXRlUG9zaXRpb24pXG4gIGxldCBsZW5ndGggPSB2ZWMzLmxlbihvZmZzZXREZWx0YSlcbiAgbGV0IHMgPSAoZ2xvYmFsLnRpbWVzdGFtcCAtIGVmdC50aW1lc3RhbXApICogMC4wMDFcbiAgbGV0IHRyYXZlbGVkID0gcyAqIGVmdC5lbnRpdHkubW92ZW1lbnRTcGVlZFxuXG4gIGlmICh0cmF2ZWxlZCA8IGxlbmd0aCkge1xuICAgIHZlYzMubXVsdGlwbHlTY2FsYXIob2Zmc2V0RGVsdGEsIHRyYXZlbGVkIC8gbGVuZ3RoKSBcbiAgfSBlbHNlIHtcbiAgICBlZnQuZXh0cmFzLnBhdGguc3BsaWNlKDAsIDEpXG4gIH1cblxuICBsZXQgY29sbGlzaW9uID0gY2VsbHMubW92ZUVudGl0eShlZnQuZW50aXR5LCBvZmZzZXREZWx0YSlcblxuICBpZiAoY29sbGlzaW9uKSB7XG4gICAgZWZ0LmVudGl0eS5vZmZzZXQueCA9IGVmdC5lbnRpdHkub2Zmc2V0LnkgPSAwXG4gICAgLy8gcmVDYWxjdWxhdGUgcGF0aCBhcm91bmQgY29sbGlzaW9uXG4gICAgZWZ0LmV4dHJhcy5wYXRoID0gcGF0aChlZnQuZW50aXR5LCBlZnQuZXh0cmFzWydkZXN0aW5hdGlvbiddKVxuICB9XG5cbn0sIChlZnQpID0+IHtcbiAgLy8gb24gZWZmZWN0IGRlc3Ryb3llZCAgXG4gIFxufSlcblxuXG5sZXQgZ2xvYmFsID0gdmFsKCdnbG9iYWwnKVxuXG5cbmV4cG9ydCBkZWZhdWx0IChlZnQpID0+IHtcbiAgLy8gY3JlYXRlIGhlbHBlciBcbiAgXG4gIGVmdCA9IGVmdCB8fCB7fSBcbiAgZWZ0LnR5cGUgPSBUWVBFXG4gIGVmdC5leHRyYXMgPSBlZnQuZXh0cmFzIHx8IHt9XG4gIGVmdC5leHRyYXNbJ2Rlc3RpbmF0aW9uJ10gPSBlZnRbJ2Rlc3RpbmF0aW9uJ11cbiAgcmV0dXJuIGVmZmVjdChlZnQpXG5cbn1cblxuIiwiaW1wb3J0ICcuL2NvbnRpbnVvdXMnXG5pbXBvcnQgY29uZmlnIGZyb20gJy4vY29uZmlnJ1xuaW1wb3J0IHZlYzMgZnJvbSAnLi92ZWMzJ1xuaW1wb3J0IHJlY3QzIGZyb20gJy4vcmVjdDMnXG5pbXBvcnQgZGlzcGxheSBmcm9tICcuL2Rpc3BsYXknXG5pbXBvcnQgY2VsbHMgZnJvbSAnLi9jZWxscydcbmltcG9ydCB1aSBmcm9tICcuL3VpJ1xuaW1wb3J0IGlucHV0IGZyb20gJy4vaW5wdXQnXG5pbXBvcnQgbWF0aCBmcm9tICcuL21hdGgnXG5cblxuLy8gRW50aXRpZXNcbmltcG9ydCBibGFua2NlbGwgZnJvbSAnLi9lbnRpdGllcy9jZWxsL2JsYW5rJ1xuaW1wb3J0IGdyYXNzIGZyb20gJy4vZW50aXRpZXMvZmxvcmEvZ3Jhc3MnXG5pbXBvcnQgcGVyc29uIGZyb20gJy4vZW50aXRpZXMvYW5pbWFsL3BlcnNvbidcblxuLy8gRWZmZWN0c1xuaW1wb3J0IG1vdmVmaW5kcGF0aCBmcm9tICcuL2VmZmVjdHMvbW92ZWZpbmRwYXRoJ1xuXG5cbmxldCBnbG9iYWwgPSB2YWwoJ2dsb2JhbCcpXG5sZXQgbXkgPSB2YWwoJ2xpdmVhbmRkaWUnKVxuXG5cbmNvbnN0IEJMQU5LX0NFTEwgPSBibGFua2NlbGwoKVxuY29uc3QgR1JBU1MgPSBncmFzcygpXG5cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBkaXNwbGF5IGFuZCB2aWV3IGRpbWVuc2lvbnMgYmFzZWQgb24gdGhlIGN1cnJlbnQgd2luZG93LlxuICovXG5sZXQgdXBkYXRlRGlzcGxheVZpZXdEcmF3ID0gKCkgPT4ge1xuXG4gICAgbXkuZGlzcGxheVdpZHRoID0gTWF0aC5tYXgoMSwgd2luZG93LmlubmVyV2lkdGgpXG4gICAgbXkuZGlzcGxheUhlaWdodCA9IE1hdGgubWF4KDEsIHdpbmRvdy5pbm5lckhlaWdodClcblxuICAgIG15LmFwZXJ0dXJlV2lkdGggPSB+fihjb25maWcuYXBlcnR1cmUgKiAobXkuZGlzcGxheVdpZHRoIC8gbXkuZGlzcGxheUhlaWdodCkpXG5cbiAgICBpZiAoIWdsb2JhbC5waXhlbHNfcGVyX2NlbGwpIGdsb2JhbC5waXhlbHNfcGVyX2NlbGwgPSB2ZWMzLnplcm8oKVxuICAgIGdsb2JhbC5waXhlbHNfcGVyX2NlbGwueCA9IG15LmRpc3BsYXlXaWR0aCAvIG15LmFwZXJ0dXJlV2lkdGhcbiAgICBnbG9iYWwucGl4ZWxzX3Blcl9jZWxsLnkgPSBteS5kaXNwbGF5SGVpZ2h0IC8gY29uZmlnLmFwZXJ0dXJlXG5cbiAgICBnbG9iYWwudmlld19jZW50cmUgPSBteS52aWV3ID8gcmVjdDMuY2VudHJlKG15LnZpZXcpIDogdmVjMyh7eDogY29uZmlnLmNlbGxzICogMC41LCB5OiBjb25maWcuY2VsbHMgKiAwLjV9KVxuICAgIHZlYzMucm91bmQoZ2xvYmFsLnZpZXdfY2VudHJlKVxuXG4gICAgaWYgKCFteS52aWV3KSBteS52aWV3ID0gcmVjdDMuemVybygpXG4gICAgbXkudmlldy5taW4ueCA9IGdsb2JhbC52aWV3X2NlbnRyZS54IC0gfn4oMC41ICogbXkuYXBlcnR1cmVXaWR0aClcbiAgICBteS52aWV3Lm1heC54ID0gbXkudmlldy5taW4ueCArIG15LmFwZXJ0dXJlV2lkdGggLSAxXG4gICAgbXkudmlldy5taW4ueSA9IGdsb2JhbC52aWV3X2NlbnRyZS55IC0gfn4oMC41ICogY29uZmlnLmFwZXJ0dXJlKVxuICAgIG15LnZpZXcubWF4LnkgPSBteS52aWV3Lm1pbi55ICsgY29uZmlnLmFwZXJ0dXJlIC0gMVxuXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBkcmF3IHZpZXcgYmFzZWQgb24gb3ZlcmRyYXcgbnVtYmVyc1xuICAgIGlmICghbXkuZHJhdykgbXkuZHJhdyA9IHJlY3QzLnplcm8oKVxuICAgIG15LmRyYXcubWluLnggPSBNYXRoLm1heChteS52aWV3Lm1pbi54IC0gY29uZmlnLm92ZXJkcmF3X3dlc3QsIDApXG4gICAgbXkuZHJhdy5tYXgueCA9IE1hdGgubWluKG15LnZpZXcubWF4LnggKyBjb25maWcub3ZlcmRyYXdfZWFzdCwgY29uZmlnLmNlbGxzKVxuICAgIG15LmRyYXcubWluLnkgPSBNYXRoLm1heChteS52aWV3Lm1pbi55IC0gY29uZmlnLm92ZXJkcmF3X25vcnRoLCAwKVxuICAgIG15LmRyYXcubWF4LnkgPSBNYXRoLm1pbihteS52aWV3Lm1heC55ICsgY29uZmlnLm92ZXJkcmF3X3NvdXRoLCBjb25maWcuY2VsbHMpXG5cblxuICAgIC8vIExvZyB2aWV3IGRpbWVuc2lvbiBjaGFuZ2VzXG4gICAgaWYgKG15LnVwZGF0ZURpc3BsYXlWaWV3RHJhd190aW1lcikgY2xlYXJUaW1lb3V0KG15LnVwZGF0ZURpc3BsYXlWaWV3RHJhd190aW1lcilcblxuICAgIG15LnVwZGF0ZURpc3BsYXlWaWV3RHJhd190aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuXG4gICAgICAgIGxldCB2aWV3YWJsZSA9IG15LmFwZXJ0dXJlV2lkdGggKiBjb25maWcuYXBlcnR1cmVcbiAgICAgICAgbGV0IGRyYXdXaWR0aCA9IChteS5hcGVydHVyZVdpZHRoICsgY29uZmlnLm92ZXJkcmF3X3dlc3QgKyBjb25maWcub3ZlcmRyYXdfZWFzdClcbiAgICAgICAgbGV0IGRyYXdIZWlnaHQgPSAoY29uZmlnLmFwZXJ0dXJlICsgY29uZmlnLm92ZXJkcmF3X25vcnRoICsgY29uZmlnLm92ZXJkcmF3X3NvdXRoKVxuICAgICAgICBsZXQgZHJhd2FibGUgPSBkcmF3V2lkdGggKiBkcmF3SGVpZ2h0XG5cbiAgICAgICAgdWkudGVybWluYWwucHJpbnQoJ3ZpZXcgJyArIG15LmFwZXJ0dXJlV2lkdGggKyAneCcgKyBjb25maWcuYXBlcnR1cmUgKyAnICgnICsgdmlld2FibGUgKyAnKScpXG4gICAgICAgIHVpLnRlcm1pbmFsLnByaW50KCdkcmF3ICcgKyBkcmF3V2lkdGggKyAneCcgKyBkcmF3SGVpZ2h0ICsgJyAoJyArIGRyYXdhYmxlICsgJyknKVxuICAgICAgICBsZXQgcHBjeCA9IH5+KGdsb2JhbC5waXhlbHNfcGVyX2NlbGwueCAqIDEwMCkgLyAxMDBcbiAgICAgICAgbGV0IHBwY3kgPSB+fihnbG9iYWwucGl4ZWxzX3Blcl9jZWxsLnkgKiAxMDApIC8gMTAwXG5cbiAgICAgICAgdWkudGVybWluYWwucHJpbnQoJ3B4L2NlbGwgJyArIHBwY3ggKyAneCcgKyBwcGN5KVxuXG4gICAgfSwgMTAwMClcblxufVxuXG5cblxuLy8gSW5pdGlhbGlzYXRpb24gb2Ygc3RhdGUuIE9ubHkgcnVuIG9uIGZpcnN0IGxvYWQgKGkuZS4gZG9uJ3QgcnVuIG9uIHJlbG9hZHMgZnJvbSBsaXZlY29kaW5nIHVwZGF0ZXMpXG5vbmNlKCdsaXZlYW5kZGllJywgKCkgPT4ge1xuXG4gICAgdXBkYXRlRGlzcGxheVZpZXdEcmF3KClcbiAgICBteS5jZWxscyA9IGNlbGxzKHtzaXplOiB7eDogY29uZmlnLmNlbGxzLCB5OiBjb25maWcuY2VsbHN9LCByZWdpb25TaXplOiBjb25maWcucmVnaW9uc30pXG4gICAgbXkudGltZXN0YW1wcyA9IHt9XG4gICAgbXkubW91c2UgPSB7eDogLTEsIHk6IC0xLCBjZWxsOiBudWxsfVxuXG4gICAgbGlzdGVuKHdpbmRvdywgJ3Jlc2l6ZScsIDEwMCwgKCkgPT4ge1xuXG4gICAgICAgIG15LndpbmRvd19yZXNpemVkID0gdHJ1ZVxuXG4gICAgfSlcblxuICAgIG15Lmhlcm8gPSBwZXJzb24oe2NlbGw6IGNlbGxzLmdldENlbGwobXkuY2VsbHMsIGdsb2JhbC52aWV3X2NlbnRyZS54LCBnbG9iYWwudmlld19jZW50cmUueSl9KVxuICAgIG1vdmVmaW5kcGF0aCh7ZW50aXR5OiBteS5oZXJvLCBkZXN0aW5hdGlvbjogY2VsbHMuZ2V0Q2VsbChteS5jZWxscywgZ2xvYmFsLnZpZXdfY2VudHJlLnggKyA1LCBnbG9iYWwudmlld19jZW50cmUueSArIDUpfSlcbiAgICB1aS50ZXJtaW5hbC5zYXkoJ2hlbHAnKVxuXG59KVxuXG5cblxucmVwZWF0KCdsaXZlYW5kZGllXzNfSHonLCAzMzMsICgpID0+IHtcblxuICAgIC8vIFVwZGF0ZSB0aGUgZGlzcGxheSBhbmQgdmlldyBkaW1lbnNpb25zIGlmIHRoZSB3aW5kb3dfcmVzaXplIGZsYWcgaXMgc2V0XG4gICAgaWYgKG15LndpbmRvd19yZXNpemVkIHx8IG15LnByZXZpb3VzX2FwZXJ0dXJlICE9PSBjb25maWcuYXBlcnR1cmUpIHtcblxuICAgICAgICBteS53aW5kb3dfcmVzaXplZCA9IGZhbHNlXG4gICAgICAgIHVwZGF0ZURpc3BsYXlWaWV3RHJhdygpXG5cbiAgICB9XG4gICAgbXkucHJldmlvdXNfYXBlcnR1cmUgPSBjb25maWcuYXBlcnR1cmVcblxuICAgIC8vIFRlcm1pbmFsIGZvY3VzIC8gYmx1clxuICAgIGlmIChpbnB1dC53YXNEb3duKGlucHV0LkVOVEVSLCBteS50aW1lc3RhbXBzKSkgdWkudGVybWluYWwuZm9jdXMoKVxuXG4gICAgLy8gQ2hlY2sgZm9yIG1vdXNlIG1vdmUgYW5kIG5ldyBjZWxsIGZvY3VzXG4gICAgaWYgKG15Lm1vdXNlLnggIT0gaW5wdXQuTU9VU0VfT0ZGU0VULnggfHwgbXkubW91c2UueSAhPSBpbnB1dC5NT1VTRV9PRkZTRVQueSkge1xuXG4gICAgICAgIG15Lm1vdXNlLnggPSBpbnB1dC5NT1VTRV9PRkZTRVQueFxuICAgICAgICBteS5tb3VzZS55ID0gaW5wdXQuTU9VU0VfT0ZGU0VULnlcblxuICAgICAgICBsZXQgY2xsID0gY2VsbHMuZ2V0Q2VsbChcbiAgICAgICAgICAgICAgICBteS5jZWxscyxcbiAgICAgICAgICAgICAgICBteS52aWV3Lm1pbi54ICsgfn4obXkubW91c2UueCAvIGdsb2JhbC5waXhlbHNfcGVyX2NlbGwueCksXG4gICAgICAgICAgICAgICAgbXkudmlldy5taW4ueSArIH5+KG15Lm1vdXNlLnkgLyBnbG9iYWwucGl4ZWxzX3Blcl9jZWxsLnkpXG4gICAgICAgICAgICApXG5cbiAgICAgICAgaWYgKGNsbCAhPT0gbXkubW91c2UuY2VsbCkge1xuXG4gICAgICAgICAgICBteS5tb3VzZS5jZWxsID0gY2xsXG4gICAgICAgICAgICB1aS5jZWxsKGNsbClcblxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvLyBDaGVjayBmb3IgcmlnaHQgbW91c2UgYnV0dG9uIGZvciBhIG1vdmUgdG8gY2VsbCBjb21tYW5kXG4gICAgaWYgKGlucHV0Lndhc0Rvd24oaW5wdXQuTU9VU0VfUkJVVFRPTiwgbXkudGltZXN0YW1wcykpIHtcblxuICAgICAgICBtb3ZlZmluZHBhdGgoe2VudGl0eTogbXkuaGVybywgZGVzdGluYXRpb246IG15Lm1vdXNlLmNlbGx9KVxuXG4gICAgfVxuXG59KVxuXG5cblxucmVwZWF0KCdsaXZlYW5kZGllXzE1X0h6JywgNjYsICgpID0+IHtcblxuICAgIC8vIENoZWNrIGZvciBob3Jpem9udGFsIGtleWJvYXJkIHBhblxuICAgIGlmIChteS52aWV3Lm1pbi54ID4gMCAmJiBpbnB1dC53YXNEb3duKGlucHV0WydBJ10sIG15LnRpbWVzdGFtcHMpKSB7XG5cbiAgICAgICAgLS1teS52aWV3Lm1pbi54XG4gICAgICAgIC0tbXkudmlldy5tYXgueFxuICAgICAgICAtLW15LmRyYXcubWluLnhcbiAgICAgICAgLS1teS5kcmF3Lm1heC54XG5cbiAgICB9IGVsc2UgaWYgKG15LnZpZXcubWF4LnggPCBjb25maWcuY2VsbHMgJiYgaW5wdXQud2FzRG93bihpbnB1dFsnRCddLCBteS50aW1lc3RhbXBzKSkge1xuXG4gICAgICAgICsrbXkudmlldy5taW4ueFxuICAgICAgICArK215LnZpZXcubWF4LnhcbiAgICAgICAgKytteS5kcmF3Lm1pbi54XG4gICAgICAgICsrbXkuZHJhdy5tYXgueFxuXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHZlcml0Y2FsIGtleWJvYXJkIHBhblxuICAgIGlmIChteS52aWV3Lm1pbi55ID4gMCAmJiBpbnB1dC53YXNEb3duKGlucHV0WydXJ10sIG15LnRpbWVzdGFtcHMpKSB7XG5cbiAgICAgICAgLS1teS52aWV3Lm1pbi55XG4gICAgICAgIC0tbXkudmlldy5tYXgueVxuICAgICAgICAtLW15LmRyYXcubWluLnlcbiAgICAgICAgLS1teS5kcmF3Lm1heC55XG5cbiAgICB9IGVsc2UgaWYgKG15LnZpZXcubWF4LnkgPCBjb25maWcuY2VsbHMgJiYgaW5wdXQud2FzRG93bihpbnB1dFsnUyddLCBteS50aW1lc3RhbXBzKSkge1xuXG4gICAgICAgICsrbXkudmlldy5taW4ueVxuICAgICAgICArK215LnZpZXcubWF4LnlcbiAgICAgICAgKytteS5kcmF3Lm1pbi55XG4gICAgICAgICsrbXkuZHJhdy5tYXgueVxuXG4gICAgfVxuXG59KVxuXG5cblxucmVwZWF0KCdsaXZlYW5kZGllXzYwX0h6JywgMTUsICgpID0+IHtcblxuICAgIGxldCBsZWZ0ID0gKDAuNSAtIGNvbmZpZy5vdmVyZHJhd193ZXN0KSAqIGdsb2JhbC5waXhlbHNfcGVyX2NlbGwueFxuICAgIGxldCBwb3MgPSB7eDogbGVmdCwgeTogKDAuNSAtIGNvbmZpZy5vdmVyZHJhd19ub3J0aCkgKiBnbG9iYWwucGl4ZWxzX3Blcl9jZWxsLnksIHo6IDB9XG4gICAgbGV0IHRpbnRcblxuXG4gICAgLy8gRHJhdyBhIGdyaWQgbGlrZSB1bmRlcmxheSB0byBzaG93IHRoZSBjZWxsc1xuICAgIC8qZm9yIChsZXQgeSA9IG15LmRyYXcubWluLnk7IHkgPD0gbXkuZHJhdy5tYXgueTsgKyt5KSB7XG5cbiAgICAgICAgZm9yIChsZXQgeCA9IG15LmRyYXcubWluLng7IHggPD0gbXkuZHJhdy5tYXgueDsgKyt4KSB7XG5cbiAgICAgICAgICAgIGxldCBub2lzZSA9IG1hdGgubm9pc2UoeCAqIGNvbmZpZy5ncm91bmRfZnJlcXVlbmN5LCB5ICogY29uZmlnLmdyb3VuZF9mcmVxdWVuY3kpXG5cbiAgICAgICAgICAgIGlmIChub2lzZSA+PSBjb25maWcuaGlnaGxhbmRfYWx0aXR1ZGUpIHtcblxuICAgICAgICAgICAgICAgIHRpbnQgPSAweGRkZGRmZlxuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5vaXNlIDw9IGNvbmZpZy53YXRlcl9hbHRpdHVkZSkge1xuXG4gICAgICAgICAgICAgICAgdGludCA9IDB4NTU1NWZmXG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgICAgICB0aW50ID0gMHgwMDU1MDBcblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlzcGxheS5zcHJpdGUoQkxBTktfQ0VMTCwgcG9zLCBjb25maWcudW5kZXJsYXlfb3BhY2l0eSwgdGludClcbiAgICAgICAgICAgIHBvcy54ICs9IGdsb2JhbC5waXhlbHNfcGVyX2NlbGwueFxuXG4gICAgICAgIH1cbiAgICAgICAgcG9zLnkgKz0gZ2xvYmFsLnBpeGVsc19wZXJfY2VsbC55XG4gICAgICAgIHBvcy54ID0gbGVmdFxuXG4gICAgfSovXG5cbiAgICAvLyBSZXNldCBwb3Mgb3BhY2l0eSBmb3IgZW50aXRpZXMgaW4gc2NlbmVcbiAgICBwb3MueSA9ICgwLjUgLSBjb25maWcub3ZlcmRyYXdfbm9ydGgpICogZ2xvYmFsLnBpeGVsc19wZXJfY2VsbC55XG5cbiAgICAvLyBEcmF3IGNsdXR0ZXJcbiAgICBmb3IgKGxldCB5ID0gbXkuZHJhdy5taW4ueTsgeSA8PSBteS5kcmF3Lm1heC55OyArK3kpIHtcblxuICAgICAgICBmb3IgKGxldCB4ID0gbXkuZHJhdy5taW4ueDsgeCA8PSBteS5kcmF3Lm1heC54OyArK3gpIHtcblxuICAgICAgICAgICAgbGV0IGNsbCA9IGNlbGxzLmdldENlbGwobXkuY2VsbHMsIHgsIHkpXG5cbiAgICAgICAgICAgIGlmIChjbGwpIHtcblxuICAgICAgICAgICAgICAgIC8qbGV0IG5vaXNlID0gbWF0aC5ub2lzZSh4ICogY29uZmlnLmdyb3VuZF9mcmVxdWVuY3ksIHkgKiBjb25maWcuZ3JvdW5kX2ZyZXF1ZW5jeSlcblxuICAgICAgICAgICAgICAgIGlmIChub2lzZSA+PSBjb25maWcuZ3Jhc3NfYWx0aXR1ZGVfbWluICYmIG5vaXNlIDw9IGNvbmZpZy5ncmFzc19hbHRpdHVkZV9tYXgpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoKChtYXRoLm5vaXNlKHgsIHkpICsgMSkgKiAwLjUpIDwgY29uZmlnLmdyYXNzX2RlbnNpdHkpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG9mZnNldCA9IDAuNSAqIG1hdGgubm9pc2UoeCwgeSlcblxuICAgICAgICAgICAgICAgICAgICAgICAgR1JBU1Muc2l6ZS54ID0gR1JBU1Muc2l6ZS55ID0gKDEgKyBub2lzZSAqIDIpXG4gICAgICAgICAgICAgICAgICAgICAgICBHUkFTUy5vZmZzZXQueCA9IG9mZnNldFxuICAgICAgICAgICAgICAgICAgICAgICAgR1JBU1Mub2Zmc2V0LnkgPSBvZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXkuc3ByaXRlKEdSQVNTLCBwb3MsIGNvbmZpZy5zY2VuZV9vcGFjaXR5KVxuXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0qL1xuXHRcdFx0XHRcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBlbnQgaW4gY2xsLmVudGl0aWVzKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgZW50ID0gY2xsLmVudGl0aWVzW2VudF1cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheS5zcHJpdGUoZW50LCBwb3MsIGNvbmZpZy5zY2VuZV9vcGFjaXR5KVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb3MueCArPSBnbG9iYWwucGl4ZWxzX3Blcl9jZWxsLnhcblxuICAgICAgICB9XG4gICAgICAgIHBvcy55ICs9IGdsb2JhbC5waXhlbHNfcGVyX2NlbGwueVxuICAgICAgICBwb3MueCA9IGxlZnRcblxuICAgIH1cblxuICAgIGRpc3BsYXkudXBkYXRlKClcblxufSlcbiJdLCJuYW1lcyI6WyJteSIsImdsb2JhbCIsIlRZUEUiLCJwYXRoIl0sIm1hcHBp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RyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDcEYsRUFBQzs7RUFFRDtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNO0VBQ2xCLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzNCLEVBQUM7OztFQUdEO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNO0VBQ2xCLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0VBQzNCLEVBQUM7OztFQUdELElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLEtBQUs7RUFDdkIsRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxLQUFJO0VBQ2pDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLElBQUksR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUk7RUFDbkQsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSTtFQUNuRCxFQUFFLE9BQU8sR0FBRztFQUNaLEVBQUM7OztFQUdELElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxHQUFHLEtBQUs7RUFDM0IsRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQztFQUMxQixFQUFFLE9BQU8sSUFBSSxDQUFDO0VBQ2QsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDOUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDOUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7RUFDOUMsR0FBRyxDQUFDO0VBQ0osRUFBQzs7O0VBR0QsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUs7RUFDMUIsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2hFLEVBQUM7OztFQUdELElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLO0VBQ3ZCLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBQztFQUNkLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBQztFQUNkLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBQztFQUNkLEVBQUUsT0FBTyxFQUFFO0VBQ1gsRUFBQzs7O0VBR0QsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEtBQUs7RUFDOUIsRUFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztFQUMvQixFQUFDOzs7RUFHRCxJQUFJLENBQUMsU0FBUyxHQUFH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QUdELElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUs7RUFDbkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztFQUN0QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQ3RCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDdEIsRUFBRSxPQUFPLENBQUM7RUFDVixFQUFDOzs7RUFHRCxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLO0VBQ3BCLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDdkIsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztFQUN2QixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQ3ZCLEVBQUUsT0FBTyxDQUFDO0VBQ1YsRUFBQzs7O0VBR0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSztFQUMxQixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDcEQsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENB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QUksR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsS0FBSyxLQUFLO0VBQy9CLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFLO0VBQy9CLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFLO0VBQy9CLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFLO0VBQy9CLEVBQUUsT0FBTyxFQUFFO0VBQ1gsQ0FBQzs7RUMxT0Q7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLO0VBQ25CLEVBQUUsT0FBTztFQUNULElBQUksR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7RUFDdEMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtFQUN0QyxHQUFHO0VBQ0gsRUFBQzs7RUFFRDtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsS0FBSyxDQUFDLElBQUksR0FBRyxNQUFNO0VBQ25CLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUM3QyxFQUFDOzs7RUFHRCxLQUFLLENBQUMsVUFBVSxHQUFHLFlBQVksR0FBRyxhQUFhLEdBQUcsS0FBSztFQUN2RCxFQUFFLE9BQU87RUFDVCxJQUFJLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDO0VBQ2xCLElBQUksR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUM7RUFDbEIs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QyxLQUFLLENBQUMsR0FBRyxHQUFFO0VBQzlCLEdBQUc7O0VBRUgsRUFBRUEsSUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBR0EsSUFBRSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFDOztFQUVsRCxFQUFDOzs7O0VBSUQ7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxLQUFLOztFQUVuRCxFQUFFLElBQUksT0FBTTtFQUNaLEVBQUUsSUFBSSxXQUFXLEdBQUdBLElBQUUsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQztFQUM3QyxFQUFFLElBQUksV0FBVyxHQUFHQSxJQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUM7O0VBRTVDLEVBQUUsSUFBSSxXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sRUFBRTtFQUN4QyxJQUFJLE1BQU0sR0FBRyxXQUFXLENBQUMsV0FBVyxFQUFDO0VBQ3JDLElBQUksRUFBRUEsSUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDO0VBQzlCLEdBQUcsTUFBTTtFQUNULElBQUksSUFBSUEsSUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFO0VBQ3pDLE1BQU0sTUFBTSxHQUFHQSxJQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEdBQUU7RUFDN0MsS0FBSyxNQUFNO0VBQ1gsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUM7RUFDckQsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFHO0VBQzNCLE1BQU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBRztFQUMzQixL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LElBQUlBLElBQUUsR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFDO0VBQ3RCLElBQUlDLFFBQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFDOztBQUUxQkQsTUFBRSxDQUFDLE9BQU8sR0FBR0EsSUFBRSxDQUFDLE9BQU8sSUFBSSxHQUFFO0FBQzdCQSxNQUFFLENBQUMsT0FBTyxHQUFHQSxJQUFFLENBQUMsT0FBTyxJQUFJLEdBQUU7QUFDN0JBLE1BQUUsQ0FBQyxPQUFPLEdBQUdBLElBQUUsQ0FBQyxPQUFPLElBQUksR0FBRTtBQUM3QkEsTUFBRSxDQUFDLFFBQVEsR0FBR0EsSUFBRSxDQUFDLFFBQVEsSUFBSSxFQUFFOztFQzlEL0I7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBLElBQUksTUFBTSxHQUFHLENBQUMsR0FBRyxLQUFLOztFQUV0QixFQUFFLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRTs7RUFFakIsRUFBRSxJQUFJLFVBQVUsR0FBRyxHQUFHLENBQUMsV0FBVTs7RUFFakMsRUFBRSxJQUFJLFVBQVUsRUFBRTtFQUNsQixJQUFJLFVBQVUsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBQztFQUN0QyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLENBQUMsRUFBQztFQUM1QixJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDL0MsSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFDO0VBQzdDLElBQUksR0FBRyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUM7RUFDckQsR0FBRztFQUNIO0VBQ0EsRUFBRSxJQUFJLENBQUNBLElBQUUsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtFQUM1QyxJQUFJLE9BQU8sQ0FBQyxJQUFJ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QUFDLEVBQUM7RUFDdkQsS0FBSztFQUNMLEdBQUc7O0VBRUgsRUFBRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0VBQ2xDLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLENBQUMsRUFBRTtFQUNwQyxNQUFNLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBQztFQUM5QyxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBQztFQUNqRSxNQUFNLElBQUksQ0FBQyxHQUFHLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUM7RUFDakUsTUFBTSxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUM7RUFDcEUsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0VBQzlELE1BQU0sR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVB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LEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO0VBQy9GLFFBQVEsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRTtFQUNwQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDLENBQUM7RUFDdEUsT0FBTztFQUNQLE1BQU0sSUFBSSxHQUFHLENBQUMsY0FBYyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQzVGLFFBQVEsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRTtFQUNuQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDLENBQUM7RUFDdEUsT0FBTztFQUNQLE1BQU0sSUFBSSxHQUFHLENBQUMsZUFBZSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO0VBQy9GLFFBQVEsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRTtFQUNwQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDLENBQUM7RUFDdEUsT0FBTztFQUNQLE1BQU0sSUFBSSxHQUFHLENBQUMsY0FBYyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO0VBQzVGLFFBQVEsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRTtFQUNuQyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFDLENBQUM7RUFDdEUsT0FBTzs7RUFFUCxLQUFLOztFQUVMLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUM7O0VBRXZCLEdBQUc7O0VBRUg7RUFDQSxFQUFFLElBQUksR0FBRyxFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBQzs7RUFFNUMsRUFBQzs7O0VBR0Q7RUFDQTtFQUNBO0VBQ0E7RUFDQSxNQUFNLENBQUMsZUFBZSxHQUFHLENBQUMsSUFBSSxLQUFLOztFQUVuQyxFQUFFLElBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRTs7RUFFeEIsRUFBRSxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFOztFQUV0QztFQUNBLElBQUksSUFBSSxlQUFlLEdBQUcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxFQUFDOztFQUV0RDtFQUNBLElBQUksSUFBSSxHQUFHLEdBQUcsS0FBSTs7RUFFbEI7RUFDQSxJQUFJLE9BQU8sZUFBZSxDQUFDLE1BQU0sRUFBRTtFQUNuQztFQUNBLE1BQU0sSUFBSSxHQUFHLEdBQUcsZUFBZSxDQUFDLEdBQUcsR0FBRTtFQUNyQztFQUNBO0VBQ0EsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUTs7RUFFOUI7RUFDQSxNQUFNLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQzs7RUFFeEUsTUFBTSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUc7RUFDdEIsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUM7O0VBRXpCLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDO0VBQ3JILE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFDO0VBQ2pILE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsZUFBZSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFDO0VBQ3JILE1BQU0sSUFBSSxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsZUFBZSxDQUFDLElBQUks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LEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUM7RUFDOUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUM7RUFDOUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7RUFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUM7O0VBRTVCLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFBQztFQUNsRixLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEVBQUM7O0VBRWhGLEtBQUssQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFD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O0VBQzdCLFFBQVEsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO0VBQ2xCLFFBQVEsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO0VBQ2xCLFFBQVEsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFO0VBQ25CLFFBQVEsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFO0VBQ25CLFFBQVEsRUFBRSxFQUFFLEVBQUUsR0FBRyxDQUFDO0VBQ2xCLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQzs7RUFFZjtFQUNBO0VBQ0EsSUFBSSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7RUFDakIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQ2YsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0VBQ2YsS0FBSzs7RUFFTDtFQUNBO0VBQ0E7RUFDQTtFQUNBLElBQUksSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBR0EsSUFBRSxDQUFDLEVBQUU7RUFDNUI7RUFDQSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHQSxJQUFFLENBQUMsRUFBRTtFQUM1QixRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBR0EsSUFBRSxDQUFDLEVBQUU7RUFDbkM7RUFDQSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBR0EsSUFBRSxDQUFDLEVBQUU7RUFDbkMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUc7RUFDcEIsUUFBUSxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUc7RUFDcEI7RUFDQSxRQUFRLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUNwQyxRQUFRLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUNwQyxRQUFRLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtFQUNwQyxRQUFRLEVBQUUsR0FBRyxHQUFHO0VBQ2hCLFFBQVEsRUFBRSxHQUFHLEdBQUc7RUFDaEIsUUFBUSxFQUFFLEdBQUcsR0FBRyxDQUFDOztFQUVqQixJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRTtFQUNqQixRQUFRLEVBQUUsR0FBR0EsSUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUdBLElBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztFQUMxQyxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUM7RUFDakI7RUFDQSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJQSxJQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBR0EsSUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7RUFDbkUsS0FBSzs7RUFFTCxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRTtFQUNqQixRQUFRLEVBQUUsR0FBR0EsSUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHQSxJQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ3BELFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztFQUNqQixRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJQSxJQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBR0EsSUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7RUFDbkUsS0FBSzs7RUFFTCxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRTtFQUNqQixRQUFRLEVBQUUsR0FBR0EsSUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHQSxJQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ2xELFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQztFQUNqQixRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJQSxJQUFFLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBR0EsSUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7RUFDbkUsS0FBSzs7RUFFTDtFQUNBO0VBQ0EsSUFBSSxPQUFPLElBQUksSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDOztFQUVqQyxDQUFDLENBQUM7Ozs7RUFJRjtFQUNBO0VBQ0E7RUFDQTtFQUNBLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxJQUFJLEVBQUU7O0VBRTNCLElBQUlBLElBQUUsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDOztFQUV2QixJQUFJLEtBQUssSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsS0FBSyxFQUFFO0VBQ3RELFFBQVFBLElBQUUsQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDQSxJQUFFLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSUEsSUFBRSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0VBQzNGLFFBQVFBLElBQUUsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDO0VBQzVCLEtBQUs7OztFQUdMO0VBQ0EsSUFBSSxJQUFJLENBQUMsTUFBTSxHQUFHLFdBQVc7RUFDN0IsUUFBUUEsSUFBRSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDQSxJQUFFLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO0VBQzFELFFBQVEsT0FBT0EsSUFBRSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDQSxJQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7RUFDM0QsS0FBSyxDQUFDOzs7RUFHTjtFQUNBLElBQUlBLElBQUUsQ0FBQyxFQUFFLEdB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QUMsRUFBRSxNQUFNLENBQUMsUUFBUSxJQUFJQSxJQUFFLENBQUMsWUFBWSxHQUFHQSxJQUFFLENBQUMsYUFBYSxDQUFDLEVBQUM7O0VBRWpGLElBQUksSUFBSSxDQUFDQyxRQUFNLENBQUMsZUFBZSxFQUFFQSxRQUFNLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUU7RUFDckUsSUFBSUEsUUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEdBQUdELElBQUUsQ0FBQyxZQUFZLEdBQUdBLElBQUUsQ0FBQyxjQUFhO0VBQ2pFLElBQUlDLFFBQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxHQUFHRCxJQUFFLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxTQUFROztFQUVqRSxJQUFJQyxRQUFNLENBQUMsV0FBVyxHQUFHRCxJQUFFLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUNBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEVBQUM7RUFDL0csSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDQyxRQUFNLENBQUMsV0FBVyxFQUFDOztFQUVsQyxJQUFJLElBQUksQ0FBQ0QsSUFBRSxDQUFDLElBQUksRUFBRUEsSUFBRSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFFO0VBQ3hDLElBQUlBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0MsUUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBR0QsSUFBRSxDQUFDLGFBQWEsRUFBQztFQUNyRSxJQUFJQSxJQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUdBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0EsSUFBRSxDQUFDLGFBQWEsR0FBRyxFQUFDO0VBQ3hELElBQUlBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0MsUUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxFQUFDO0VBQ3BFLElBQUlELElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBR0EsSUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEdBQUcsRUFBQzs7RUFFdkQ7RUFDQSxJQUFJLElBQUksQ0FBQ0EsSUFBRSxDQUFDLElBQUksRUFBRUEsSUFBRSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxHQUFFO0VBQ3hDLElBQUlBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDQSxJQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLGFBQWEsRUFBRSxDQUFDLEVBQUM7RUFDckUsSUFBSUEsSUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUNBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxLQUFLLEVBQUM7RUFDaEYsSUFBSUEsSUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUNBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsY0FBYyxFQUFFLENBQUMsRUFBQztFQUN0RSxJQUFJQSxJQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQ0EsSUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxjQUFjLEVBQUUsTUFB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QixRQUFRLEVBQUVBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUM7O0VBRXZCLEtBQUssTUFBTSxJQUFJQSxJQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRUEsSUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFOztFQUV6RixRQUFRLEVBQUVBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUM7RUFDdkIsUUFBUSxFQUFFQSxJQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFDO0VBQ3ZCLFFBQVEsRUFBRUEsSUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQztFQUN2QixRQUFRLEVBQUVBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUM7O0VBRXZCLEtBQUs7O0VBRUw7RUFDQSxJQUFJLElBQUlBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUVBLElBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRTs7RUFFdkUsUUFBUSxFQUFFQSxJQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFDO0VBQ3ZCLFFBQVEsRUFBRUEsSUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBQztFQUN2QixRQUFRLEVBQUVBLElBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUM7RUFDdkIsUUFBUSxFQUFFQSxJQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFDOztFQUV2QixLQUFLLE1BQU0sSUFBSUEsSUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVB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
