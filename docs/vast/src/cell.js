
function Cell( x, y ) {

	let cell = {
		x: x,
		y: y,
		div: document.createElement( "div" )
	}

	cell.div.style.backgroundColor = "#eee"
	cell.div.style.border = "1px solid #ddd"
	document.body.appendChild( cell.div )

	return cell

}

function copy( cell ) {
    
    let _cell = {
        x: cell.x,
        y: cell.y,
        div: cell.div
    }
    
    return _cell

}

function generation( cell, generationInfo ) {

    let _cell = copy( cell )

    let shade = parseInt( ( generationInfo.iteration / 1000.0 ) * 255 )

    _cell.div.style.backgroundColor = "rgb( " + shade + ", " + shade + ", " + shade + " )"

    return _cell

}


export { Cell, generation }
