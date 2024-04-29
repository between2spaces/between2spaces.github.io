/**
 * 
 */

class Map {
	constructor(container) {
		this.offset = { x: 0, y: 0 };
		this.dom = document.createElement('div');
		this.dom.className = 'view';
		this.tiles = {};
	}
	update() {
		if (!this.tiles.hasOwnProperty('0x0')) return;
		const tile = this.tiles['0x0'];
		const tileWidth = tile.dom.offsetWidth;
		const tileHeight = tile.dom.offsetHeight;
		this.dom.style.left = `${window.innerWidth * 0.5 - tileWidth * 0.5 - this.offset.x * tileWidth}px`;
		this.dom.style.top = `${window.innerHeight * 0.5 - tileHeight * 0.5 - this.offset.y * tileHeight}px`;
	}
	add(entity) {
		if (entity instanceof Tile) {
			this.tiles[`${entity.offset.x}x${this.entity.y}`] = entity;
		} else if (!entity.container) {
			const tileX = Math.round(entity.offset.x);
			const tileY = Math.round(entity.offset.y);
			const key = `${tileX}x${tileY}`;
			if (!this.tiles.hasOwnProperty(key)) {
				this.tiles[key] = new Tile(tileX, tileY);
			}
			this.tiles[key].add(entity);
		}
	}
	moveNorth() {
		if (!this.tiles.hasOwnProperty(`${this.offset.x}x${this.offset.y - 1}`)) return;
		this.offset.y--;
		this.update();
	}
	moveSouth() {
		this.offset.y++;
		this.update();
	}
	moveWest() {
		this.offset.x--;
		this.update();
	}
	moveEast() {
		this.offset.x++;
		this.update();
	}
}


const EntityType = {
	'ᚔ': {
		name: 'fence',
		width: 1,
		height: 0.1
	},
	'"': {
		name: 'grass',
		width: 1,
		height: 1
	},
}

class Entity {
	constructor(offsetx, offsety, type) {
		this.offset = { x: offsetx, y: offsety };
		this.type = type;
		this.dom = document.createElement('div');
		this.dom.className = 'entity';
		this.dom.append(type);
		this.container = null;
		this.contents = [];
	}
	add(entity) {
		if (entity.container) {
			const i = entity.container.contents.indexOf(entity);
			entity.container.contents.splice(i, 1);
		}
		this.contents.push(entity);
		this.dom.append(entity.dom);
	}
}


class Tile extends Entity {
	constructor(offsetx, offsety) {
		super(offsetx, offsety, '"');
		this.north = null;
		this.east = null;
		this.south = null;
		this.west = null;
		this.dom.classList.add('tile');
		map.dom.append(this.dom);
	}
}


const map = new Map();


function update() {
	map.update();
}


export default function main(container) {
	container.append(map.dom);;

	const moveNorth = ['w', 'k', 'ArrowUp'];
	const moveSouth = ['s', 'j', 'ArrowDown'];
	const moveWest = ['a', 'h', 'ArrowLeft'];
	const moveEast = ['d', 'l', 'ArrowRight'];

	window.addEventListener('keydown', (event) => {
		if (moveNorth.indexOf(event.key) > -1) {
			map.moveNorth();
		} else if (moveSouth.indexOf(event.key) > -1) {
			map.moveSouth();
		} else if (moveWest.indexOf(event.key) > -1) {
			map.moveWest();
		} else if (moveEast.indexOf(event.key) > -1) {
			map.moveEast();
		}
	});

	map.add(new Entity(0, 0, 'ᚔ'));

	setInterval(update, 1000);
}
