import Glyphs from './glyphs.js';
import World from './world.js';

class Map {
	constructor(container) {
		this.offset = { x: 0, y: 0 };
		this.dom = document.createElement('div');
		this.dom.className = 'view';
		this.tiles = {};
		this.tileSize = null;
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
		// (!this.tileSize) return;
		this.dom.style.left = `calc(${window.innerWidth * 0.5}px - ${0.5 - this.offset.x}em)`;
		this.dom.style.top = `calc(${window.innerHeight * 0.5}px - ${0.5 - this.offset.y}em)`;
		//this.dom.style.top = `${window.innerHeight * 0.5 - 0.5 - this.offset.y * this.tileSize.height}px`;
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
		this.tileAt(entity).add(entity);
		return entity;
	}

	tileAt(entity) {
		const tileX = Math.round(entity.offset.x);
		const tileY = Math.round(entity.offset.y);
		const key = `${tileX}x${tileY}`;
		if (!this.tiles.hasOwnProperty(key)) {
			this.tiles[key] = new Tile(tileX, tileY);
			const northKey = `${Math.round(entity.offset.x)}x${Math.round(entity.offset.y - 1)}`;
			if (this.tiles.hasOwnProperty(northKey)) this.tiles[key].assignNeighbour(this.tiles[northKey], 'north');
			const southKey = `${Math.round(entity.offset.x)}x${Math.round(entity.offset.y + 1)}`;
			if (this.tiles.hasOwnProperty(southKey)) this.tiles[key].assignNeighbour(this.tiles[southKey], 'south');
			const eastKey = `${Math.round(entity.offset.x + 1)}x${Math.round(entity.offset.y)}`;
			if (this.tiles.hasOwnProperty(eastKey)) this.tiles[key].assignNeighbour(this.tiles[eastKey], 'east');
			const westKey = `${Math.round(entity.offset.x - 1)}x${Math.round(entity.offset.y)}`;
			if (this.tiles.hasOwnProperty(westKey)) this.tiles[key].assignNeighbour(this.tiles[westKey], 'west');
			const tileDom = this.tiles[key].dom;
			this.dom.append(tileDom);
			if (!this.tileSize) {
				this.tileSize = { width: tileDom.offsetWidth, height: tileDom.offsetHeight };
				this.position();
			}
		}
		return this.tiles[key];
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
		el.textContent = char.char ?? '?';
		this.dom.append(el);
	}

}


class Entity {

	constructor(type, x = 0, y = 0, rotation = 0) {
		this.offset = { x, y };
		this.rotation = rotation;
		this.container = null;
		this.contents = [];
		this.dom = document.createElement('div');
		this.dom.className = 'entity';
		this.position(x, y);
		this.rotate();
		this.setType(type);
	}

	setType(type) {
		if (this.glyph?.dom) this.glyph.dom.remove();
		this.type = type;
		this.glyph = new Glyph(type);
		this.dom.insertBefore(this.glyph.dom, this.dom.firstChild);
	}

	add(entity) {
		if (entity.container) {
			const i = entity.container.contents.indexOf(entity);
			entity.container.contents.splice(i, 1);
		}
		entity.container = this;
		this.contents.push(entity);
		this.dom.append(entity.dom);
	}

	update() {
	}

	position(x = null, y = null) {
		if (x === null) x = this.offset.x;
		if (y === null) y = this.offset.y;
		this.offset.x = x;
		this.offset.y = y;
		this.dom.style.left = `${this.offset.x}em`;
		this.dom.style.top = `${this.offset.y}em`;
	}

	rotate(delta = 0) {
		this.rotation += delta;
		this.dom.style.transform = `rotate(${this.rotation}deg)`;
	}

	tile() {
		let container = this.container;
		while (container && !(container instanceof Tile)) container = container.container;
		return container;
	}

	assignBorder(direction) {
		this.tile().assignBorder(this, direction);
	}

}


class Tile extends Entity {

	constructor(offsetx, offsety) {
		super('floorboards', offsetx, offsety);
		this.neighbour = {
			north: null,
			east: null,
			south: null,
			west: null
		};
		this.border = {
			north: null,
			east: null,
			south: null,
			west: null
		};
		this.dom.classList.add('tile');
	}

	assignNeighbour(tile, direction) {
		if (direction === 'north') {
			this.neighbour.north = tile;
			tile.neighbour.south = this;
		} else if (direction === 'south') {
			this.neighbour.south = tile;
			tile.neighbour.north = this;
		} else if (direction === 'east') {
			this.neighbour.east = tile;
			tile.neighbour.west = this;
		} else if (direction === 'west') {
			this.neighbour.west = tile;
			tile.neighbour.east = this;
		}
	}

	assignBorder(entity, direction) {
		this.add(entity);
		if (direction === 'north') {
			this.border.north = entity;
			entity.position(0, -0.5);
		} else if (direction === 'south') {
			this.border.south = entity;
			entity.position(0, 0.49999);
			entity.rotate(180);
		} else if (direction === 'east') {
			this.border.east = entity;
			entity.position(0.49999, 0);
			entity.rotate(90);
		} else if (direction === 'west') {
			this.border.west = entity;
			entity.position(-0.5, 0);
			entity.rotate(-90);
		}
	}

}



export default function main(container) {
	const map = new Map();

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
