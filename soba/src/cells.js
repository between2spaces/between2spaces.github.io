import app from './app'
import Vec3 from './vec3'

let Cell = () => {
  let cell = {
    entities: []
  }
  return cell
}

let Cells = (/**{Vec3}*/size) => {
  let cells = {
    size: (!size) ? Vec3({x: 1000, y: 1000}) : Vec3(size),
    cell: []
  }
  for (let y = 0; y < cells.size.y; ++y) {
		for (let x = 0; x < cells.size.x; ++x) {
			if (Math.random() > 0.8) cells.cell[y * cells.size.x + x] = Cell()
		}
	}
  return cells
}


Cells.cell = (cells, x, y) => {
  if (x < 0 || x >= cells.size.x || y < 0 || y >= cells.size.y) {
    return undefined
  }
  return cells.cell[y * cells.size.x + x]
}


export default Cells
