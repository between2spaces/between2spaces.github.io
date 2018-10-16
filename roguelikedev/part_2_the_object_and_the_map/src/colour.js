
function Colour( r, g, b ) {
	return { r: r, g: g, b: b }
}

function scale( colour, n ) {
	return { r: colour.r * n, g: colour.g * n, b: colour.b * n }
}

function string( colour ) {
	return 'rgb( ' + Math.floor( colour.r ) + ', ' + Math.floor( colour.g ) + ', ' + Math.floor( colour.b ) + ')'
}

export { Colour, scale, string }