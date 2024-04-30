import EntityTypeTemplate from './entitytypes.js';

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

	add(entity) {
		if (entity instanceof Tile) {
			this.tiles[`${Math.round(entity.offset.x)}x${Math.round(entity.offset.y)}`] = entity;
			const northKey = `${Math.round(entity.offset.x)}x${Math.round(entity.offset.y - 1)}`;
			if (this.tiles.hasOwnProperty(northKey)) entity.assignNeighbour(this.tiles[northKey], 'north');
			const southKey = `${Math.round(entity.offset.x)}x${Math.round(entity.offset.y + 1)}`;
			if (this.tiles.hasOwnProperty(southKey)) entity.assignNeighbour(this.tiles[southKey], 'south');
			const eastKey = `${Math.round(entity.offset.x + 1)}x${Math.round(entity.offset.y)}`;
			if (this.tiles.hasOwnProperty(eastKey)) entity.assignNeighbour(this.tiles[eastKey], 'east');
			const westKey = `${Math.round(entity.offset.x - 1)}x${Math.round(entity.offset.y)}`;
			if (this.tiles.hasOwnProperty(westKey)) entity.assignNeighbour(this.tiles[westKey], 'west');
			this.dom.append(entity.dom);
			if (!this.tileSize) {
				this.tileSize = { width: entity.dom.offsetWidth, height: entity.dom.offsetHeight };
				this.position();
			}
		} else if (!entity.container) {
			this.tileAt(entity).add(entity);
		}
	}

	tileAt(entity) {
		const tileX = Math.round(entity.offset.x);
		const tileY = Math.round(entity.offset.y);
		const key = `${tileX}x${tileY}`;
		if (!this.tiles.hasOwnProperty(key)) this.add(new Tile(tileX, tileY));
		return this.tiles[key];
	}
}


class Entity {

	constructor(type, x = 0, y = 0) {
		this.offset = { x, y };
		this.rotation = 0;
		this.container = null;
		this.contents = [];
		Object.assign(this, EntityTypeTemplate[type]);
		this.contents = [];
		if (EntityTypeTemplate[type].hasOwnProperty('contents')) {
			for (let child of EntityTypeTemplate[type].contents) {
				this.add(new Entity)
			}
		}
		this.dom = document.createElement('div');
		this.dom.className = 'entity';
		this.position(x, y);
		this.rotate();
		this.dom.append(type);
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

	rotate(delta=0) {
		this.rotation += delta;
		this.dom.style.transform = `rotate(${this.rotation}deg)`;
	}

}


class Tile extends Entity {

	constructor(offsetx, offsety) {
		super('⛆', offsetx, offsety);
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

	map.add(new Tile(0, 0));
	map.add(new Tile(0, -1));

	
	map.tiles['0x0'].assignBorder(new Entity('═'), 'east');
	map.tiles['0x0'].assignBorder(new Entity('═'), 'south');
	map.tiles['0x0'].assignBorder(new Entity('ᚔ'), 'west');

	map.tiles['0x-1'].assignBorder(new Entity('🚪'), 'north');

	function update() {
		map.update();
	}

	setInterval(update, 1000);

	console.log(map.tiles['0x0']);
}
