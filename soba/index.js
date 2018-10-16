var cp = require('child_process')
var chokidar = require('chokidar')
var serve = require('serve-static')('.')

var liveUpdate = {}

build()
listen(8000, '/liveupdate')
watch('src/**/*.js')

function build() {

	cp.exec('mkdir dist')

	cp.exec('npm run build-js', function (err, stdout, stderr) {

		var now = new Date()
		var timestamp = '[' + ('00' + now.getHours()).slice(-2) +
			':' + ('00' + now.getMinutes()).slice(-2) +
			':' + ('00' + now.getSeconds()).slice(-2) + '] '

		err && console.error(timestamp + err)
		stderr && console.log(timestamp + stderr)
		err || stderr || (liveUpdate = { '/dist/soba.js': true }) && console.log(timestamp + 'update build successful')

	})

}

function listen(port, liveUpdateUrl) {

	require('http').createServer(function (req, res) {

		if (req.url === liveUpdateUrl) {

			res.setHeader('Content-Type', 'application/json')
			res.end(JSON.stringify(Object.getOwnPropertyNames(liveUpdate)))
			liveUpdate = {}
			return

		}

		req.url = req.url.replace(/^\/soba/, '/')

		serve(req, res, function (err) {

			res.statusCode = err ? (err.statusCode || err.status) : 404
			res.end(err ? err.toString() : 'Cannot ' + req.method + ' ' + req.url + '\n')

		})

	}).listen(port)

}

function watch(glob) {

	chokidar.watch(glob).on('change', build)

}
