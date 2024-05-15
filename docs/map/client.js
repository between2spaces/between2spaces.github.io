import Glyphs from './glyphs.js';
import World from './world.js';

class Map {
	constructor() {
		this.offset = { x: 0, y: 0 };
		this.dom = document.createElement('div');
		this.dom.className = 'view';
		this.tiles = {};
		this.borders = {};
		this.position();
		const self = this;
		window.addEventListener('resize', function (event) {
			self.position();
		}, true);
	}

	update() {
	}

	position(x = null, y = null) {
		if (x === null) x = this.offset.x;
		if (y === null) y = this.offset.y;
		this.offset.x = x;
		this.offset.y = y;
		this.dom.style.left = `calc(${window.innerWidth * 0.5}px - ${this.offset.x}em)`;
		this.dom.style.top = `calc(${window.innerHeight * 0.5}px - ${this.offset.y}em)`;
	}

	centreNeighbour(direction = null) {
		if (direction.indexOf('north') > -1) this.offset.y--;
		else if (direction.indexOf('south') > -1) this.offset.y++;
		if (direction.indexOf('east') > -1) this.offset.x++;
		else if (direction.indexOf('west') > -1) this.offset.x--;
		this.position();
	}

	add(entitydef) {
		const entity = new Entity(entitydef.type ?? '?', entitydef.x ?? 0, entitydef.y ?? 0, entitydef.rotation ?? 0);
		this.tile(Math.round(entity.position.x), Math.round(entity.position.y)).add(entity);
		return entity;
	}

	tile(x, y, createIfNotExists = true) {
		const key = `${x}x${y}`;
		if (createIfNotExists && !this.tiles.hasOwnProperty(key)) {
			this.tiles[key] = new Tile(x, y);
		}
		return this.tiles.hasOwnProperty(key) ? this.tiles[key] : null;
	}

	border(x, y, createIfNotExists = true) {
		const key = `${x}x${y}`;
		if (createIfNotExists && !this.borders.hasOwnProperty(key)) {
			this.borders[key] = new Border(x, y);
		}
		return this.borders.hasOwnProperty(key) ? this.borders[key] : null;
	}
}


class Glyph {

	constructor(type = '?', rotation = 0) {
		this.dom = document.createElement('div');
		this.dom.className = 'glyph';
		this.dom.style.transform = `rotate(${rotation}deg)`;
		const glyph = Glyphs[type];
		if (glyph.overflow) this.dom.style.overflow = glyph.overflow;
		if (glyph.color) this.dom.style.color = glyph.color;
		if (glyph.zIndex) this.dom.style.zIndex = glyph.zIndex;
		const chars = glyph.char ? [glyph] : glyph.chars ?? [{}];
		for (let char of chars) this.add(char);
	}

	add(char) {
		const el = document.createElement('div');
		el.className = 'glyph';
		el.style.left = `${char.x ?? 0}em`;
		el.style.top = `${char.y ?? 0}em`;
		el.style.fontSize = `${char.size ?? 1}em`;
		el.style.transform = `rotate(${char.rotation ?? 0}deg)`;
		if (this.dom.style.zIndex) el.style.zIndex = this.dom.style.zIndex;
		el.textContent = char.char ?? '?';
		this.dom.append(el);
	}

}


class Entity {

	constructor(type, x = 0, y = 0, rotation = 0) {
		this.position = { x, y };
		this.offset = { x: x - Math.round(x), y: y - Math.round(y) };
		this.rotation = rotation;
		this.parent = null;
		this.contents = [];
		this.dom = document.createElement('div');
		this.dom.className = 'entity';
		this.setPosition(x, y);
		this.rotate();
		this.setType(type);
	}

	setType(type) {
		if (this.glyph?.dom) this.glyph.dom.remove();
		this.type = type;
		if (!type) return;
		this.glyph = new Glyph(type);
		this.dom.insertBefore(this.glyph.dom, this.dom.firstChild);
	}

	add(entity) {
		if (entity.parent) {
			const i = entity.parent.contents.indexOf(entity);
			entity.parent.contents.splice(i, 1);
		}
		entity.parent = this;
		this.contents.push(entity);
		this.dom.append(entity.dom);
	}

	update() {
	}

	setPosition(x = null, y = null) {
		if (x === null) x = this.position.x;
		if (y === null) y = this.position.y;
		this.position.x = x;
		this.position.y = y;
		this.offset.x = x % 1;
		this.offset.y = y % 1;
		this.dom.style.left = `${this.offset.x}em`;
		this.dom.style.top = `${this.offset.y}em`;
	}

	rotate(delta = 0) {
		this.rotation += delta;
		this.dom.style.transform = `rotate(${this.rotation}deg)`;
	}

	tile() {
		let parent = this.parent;
		while (parent && !(parent instanceof Tile)) parent = parent.parent;
		return parent;
	}

}


class Tile extends Entity {

	constructor(x, y) {
		super('dirt', x, y);
		this.neighbour = { north: null, east: null, south: null, west: null };
		this.border = { north: null, east: null, south: null, west: null };
		this.dom.className = 'tile';

		map.dom.append(this.dom);
		this.setPosition();

		this.assignNeighbour(map.tile(x, y - 1, false), 'north');
		this.assignNeighbour(map.tile(x, y + 1, false), 'south');
		this.assignNeighbour(map.tile(x + 1, y, false), 'east');
		this.assignNeighbour(map.tile(x - 1, y, false), 'west');

		if (!this.border.north) this.border.north = new Border(x, y - 0.05, 'horizontal');
	}

	setPosition(x = null, y = null) {
		if (x === null) x = this.position.x;
		if (y === null) y = this.position.y;
		this.position.x = this.offset.x = x;
		this.position.y = this.offset.y = y;
		this.dom.style.left = `calc(${this.offset.x}em - 0.5 * ${this.dom.offsetWidth}px)`;
		this.dom.style.top = `calc(${this.offset.y}em - 0.5 * ${this.dom.offsetHeight}px)`;
	}

	assignNeighbour(tile, direction) {
		if (!tile) return;
		if (direction === 'north') {
			this.neighbour.north = tile;
			tile.neighbour.south = this;
			this.border.north = tile.border.south;
		} else if (direction === 'south') {
			this.neighbour.south = tile;
			tile.neighbour.north = this;
			this.border.south = tile.border.north;
		} else if (direction === 'east') {
			this.neighbour.east = tile;
			tile.neighbour.west = this;
			this.border.east = tile.border.west;
		} else if (direction === 'west') {
			this.neighbour.west = tile;
			tile.neighbour.east = this;
			this.border.west = tile.border.east;
		}
	}

}

class Border extends Entity {

	constructor(x, y, alignment = 'horizontal') {
		super(null, x, y);
		this.dom.className = `border ${alignment}Border`;
		this.alignment = alignment;
		map.dom.append(this.dom);
	}

	setPosition(x = null, y = null) {
		if (x === null) x = this.position.x;
		if (y === null) y = this.position.y;
		this.position.x = this.offset.x = x;
		this.position.y = this.offset.y = y;
		//this.dom.style.left = `${this.offset.x - (this.alignment === 'horizontal' ? 0.52 : 0.45)}em`;
		//this.dom.style.top = `${this.offset.y - (this.alignment === 'horizontal' ? 0.45 : 0.52)}em`;
	}

}


let map;

export default function main(container) {

	map = new Map();

	container.append(map.dom);;

	const moveMapKeys = {
		'w': 'north',
		'k': 'north',
		'ArrowUp': 'north',
		's': 'south',
		'j': 'south',
		'ArrowDown': 'south',
		'a': 'west',
		'h': 'west',
		'ArrowLeft': 'west',
		'd': 'east',
		'l': 'east',
		'ArrowRight': 'east'
	};

	window.addEventListener('keydown', (event) => {
		if (moveMapKeys.hasOwnProperty(event.key)) {
			map.centreNeighbour(moveMapKeys[event.key]);
		}
	});

	World.initialise(map);

	function update() {
		map.update();
	}

	setInterval(update, 1000);

	console.log(map.tiles['0x0']);

}
