/**
 * continuous
 */
if (typeof window !== 'undefined') {

    
    window.store = function (key) {
    
        return key ? store[key] = store[key] || {} : undefined
    
    }
    
    window.val = function (key) {
    
        return key ? vars[key] = vars[key] || {} : undefined
    
    }
    
    window.delay = function (delay, fn) {
    
        (typeof delay === 'number') ? setTimeout(fn, delay) : delay()
    
    }
    
    window.once = function (key, fn) {
    
        if (!key || my.onceKeys.hasOwnProperty(key)) return
        my.onceKeys[key] = null
        fn()
    
    }
    
    window.repeat = function (key, ms, fn) {
   
        if (typeof fn !== 'function') return
    
        typeof ms !== 'number' && (ms = 1000)
    
        my.repeats[key] = {ms: ms, timestamp: global.timestamp + ms, fn: fn}
    
    }
    
    window.stop = function (key) {
  
        typeof key !== 'undefined' && my.repeats.hasOwnProperty(key) && (delete my.repeats[key])
    
    }
    
    window.listen = function (object, type, delay, fn) {
    
        (function(t) {
    
            object.addEventListener(type, function (event) {
    
                if (!t) {
    
                    fn(event)
                    t = setTimeout(function () {
    
                        t = null
    
                    }, delay)
    
                }
    
            }, false)
    
        }())
    
    }
    
    
    const STORE = 'store'
    
    var store = JSON.parse(localStorage.getItem(STORE) || '{}')
    var vars = window.vars = window.vars || {}
    
    var global = val('global')
    var my = val('continuous')
    
    my.repeats = my.repeats || {}
    my.onceKeys = my.onceKeys || {}
    my.loads = my.loads || 0
    ++my.loads

    
    once('continuous', function () {
    
        window.addEventListener('beforeunload', function () {
    
            localStorage.setItem(STORE, JSON.stringify(store))
    
        }, false)
    
    })
 

    var rAF = function (timestamp) {
    
        my.rAFId = requestAnimationFrame(rAF)
    
        global.timestamp = timestamp
    
        for (var key in my.repeats) {

            var repeat = my.repeats[key]

            if (repeat.timestamp < timestamp) {
    
                repeat.fn()
                repeat.timestamp = timestamp + repeat.ms
    
            }
    
        }
    
    }
   

    if (my.rAFId) {
    
        cancelAnimationFrame(my.rAFId)
        console.log('continuous reload #' + (my.loads - 1))
    
    }
    
    
    rAF(performance.now())

    
    if (location.hostname === 'localhost') {
    
        (function() {

            repeat('continuous', 1000, function () {
    
                const http = new XMLHttpRequest()
    
                http.open('GET', '/continuous', true)
    
                http.addEventListener('load', function () {
    
                    if (!JSON.parse(http.responseText).update) return
                    var scripts = document.getElementsByTagName('script')
    
                    for (var i = 0; i < scripts.length; i++) {
    
                        var script = scripts[i]
    
                        if (!script.getAttribute('continuous')) continue
                        var update = document.createElement('script')
    
                        update.setAttribute('continuous', my.loads)
                        update.src = script.src
                        var parent = script.parentNode
    
                        parent.removeChild(script)
                        parent.appendChild(update)
    
                    }
    
                })
    
    
                http.send()
    
            })
    
        }())
    
    }
    
   
    
} else {



    var cp = require('child_process')
    var watch = require('node-watch')
    var http = require('http');
	var fs = require('fs');
	var path = require('path');

    
    var PORT = 8080
    var update = {}
    
    
    function build() {
    
        cp.exec('npm run rollup', function(err, stdout, stderr) {
    
            err && console.log(err)
            stderr && console.log(stderr)
    
            if (!err && !stderr) {
    
                console.log('> rollup successful')
                update = {update: true}
    
                cp.exec('npm run closure', function(err, stdout, stderr) {
    
                    err && console.log(err)
                    stderr && console.log(stderr)
                    !err && console.log('> closure successful')
    
                })
    
            }
    
        })
    
    }
    
    watch('src', function(filename) {
        if (!/\.js$/.test(filename)) return
        build()
    })
	

    http.createServer(function (request, response) {
		
		if (request.url === '/continuous') {
			
			response.writeHead(200, { 'Content-Type': 'application/json' })
			response.end(JSON.stringify(update), 'utf-8')
			update = {}
			return

		}
		
		var filepath = request.url === '' ? './index.html' : request.url[request.url.length-1] === '/' ? '.' + request.url + 'index.html' : '.' + request.url
		var extname = path.extname(filepath)
		var contentType = 'text/html'
		
		switch (extname) {
		case '.js':
			contentType = 'text/javascript'
			break
		case '.css':
			contentType = 'text/css'
			break
		case '.json':
			contentType = 'application/json'
			break
		case '.png':
			contentType = 'image/png'
			break    
		case '.jpg':
			contentType = 'image/jpg'
			break
		}

		fs.readFile(filepath, function(error, content) {
			if (error) {
				if(error.code == 'ENOENT') {
					fs.readFile('./404.html', function(error, content) {
						response.writeHead(200, { 'Content-Type': contentType })
						response.end(content, 'utf-8')
					});
				} else {
					response.writeHead(500)
					response.end('Sorry, check with the site admin for error: '+error.code+' ..\n')
					response.end()
				}
			} else {
				response.writeHead(200, { 'Content-Type': contentType })
				response.end(content, 'utf-8')
			}
		});

	}).listen(PORT)
	
	console.log('> listening @ http://localhost:' + PORT)
	
    build()
 
}

