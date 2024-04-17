//import './websocket.js';


export default function main(container) {

	UI.init();
	World.init();
	Key.init();

	window.drag = function (event) {
		event.dataTransfer.setData('text', event.target.id);
	}

}

function E(parent = null, tag = 'div', classList = null, styleProperties = null, content = []) {
	const div = document.createElement(tag);
	div.classList.add('div');
	if (classList === null) classList = [];
	if (classList.constructor !== Array) classList = [classList];
	for (let className of classList) {
		div.classList.add(className);
	}
	if (parent) parent.append(div);
	if (content.constructor !== Array) content = [content];
	for (let child of content) {
		if (child instanceof Element) {
			div.append(child);
		} else {
			div.textContent += child;
		}
	}
	if (styleProperties) style(div, styleProperties);
	return div;
}

function style(element, properties = {}) {
	for (let property of Object.keys(properties)) {
		element.style[property] = properties[property];
	}
}

function pos(left = 0, top = 0, width = null, height = null, additionalProperties = null) {
	const style = { position: 'absolute', left, top };
	if (width) style.width = width;
	if (height) style.height = height;
	if (additionalProperties) Object.assign(style, additionalProperties);
	return style;
}


const UI = {
	init: function() {
		
		E(document.head, 'style', null, null, [
			'.div {',
			'   border: 1px solid #aaa;',
			'}',
			'.menu {',
			'   margin: 0;',
			'   border: 1px solid #aaa;',
			'   min-width: 2em;',
			'}',
			'.menu-item {',
			'	display: table-row;',
			'   color: #aaa;',
			'	line-height: 2em;',
			'   vertical-align: middle;',
			'   overflow: hidden;',
			'   padding: 0;',
			'   white-space: nowrap;',
			'}',
			'.menu-item-select {',
			'	display: table-cell;',
			'   min-width: 0.5em;',
			'}',
			'.menu-item-type {',
			'	display: table-cell;',
			'   filter: grayscale(100%);',
			'   opacity: 50%;',
			'	width: 2em;',
			'   text-align: center;',
			'}',
			'.menu-item-name {',
			'	display: table-cell;',
			'   text-overflow: ellipsis;',
			'	width: 100%;',
			'	max-width: 0;',
			'   overflow: hidden;',
			'}',
			'.menu-item-container {',
			'	display: table-cell;',
			'   min-width: 0.5em;',
			'}',
			'.focus {',
			'}',
			'.focus-type {',
			'	display: absolute;',
			'   filter: grayscale(100%);',
			'   opacity: 50%;',
			'	font-size: 50vh;',
			'	line-height: 50vh;',
			'}',
			''
		].join('\n'));

		this.outside = new Menu('0', '0', '20%', '100%');
		this.location = new Menu('20%', '0', '30%', '100%');
		this.location.onSelect = function(item) {
			Focus.set(item);
		}
		Focus.init();

	}
};


const Key = {
	menuUp: ['w', 'k', 'ArrowUp'],
	menuDown: ['s', 'j', 'ArrowDown'],

	init: function() {
		window.addEventListener('keydown', (event) => {
			console.log(event.key);
			if (Key.menuUp.indexOf(event.key) > -1) {
				UI.location.selectPrevious();
			} else if (Key.menuDown.indexOf(event.key) > -1) {
				UI.location.selectNext();
			}
		});
	}
};


class Menu {
	constructor(left, top, width, height) {
		this.id = Menu.nextId;
		Menu.nextId++;
		this.dom = E(document.body, 'div', 'menu', pos(left, top, width, height));
		this.selected = 1;
		this.onSelect = null;
	}

	set(item=null) {
		this.dom.innerHTML = '';
		this.select(1);
	}

	add(item, selected=false) {
		const el = E(this.dom, 'div', 'menu-item', null, [
			E(null, 'div', 'menu-item-select', null),
			E(null, 'div', 'menu-item-type', null, item.type),
			E(null, 'div', 'menu-item-name', null, item.name),
			E(null, 'div', 'menu-item-container', null, item.contents.length > 0 ? '⟫' : '')
		]);
		el.id = `menu-${this.id}-item-${this.dom.childElementCount}`;
		el.itemid = item.id;
		el.draggable = "true";
		el.ondragstart = "drag(event)";
		if (selected || this.selected === this.dom.childElementCount) this.select(this.dom.childElementCount);
	}
	
	select(num) {
		const el = document.getElementById(`menu-${this.id}-item-${num}`);
		if (!el) return;
		const prev = document.getElementById(`menu-${this.id}-item-${this.selected}`);
		if (prev) {
			prev.style.background = 'none';
			prev.querySelector('.menu-item-select').style.background = 'none';
		}
		el.style.background = '#eee';
		el.querySelector('.menu-item-select').style.background = '#aaa';
		this.selected = num;
		if (this.onSelect) this.onSelect(Item.byId[el.itemid]);
	}

	selectPrevious() {
		this.select(this.selected - 1);
	}

	selectNext() {
		this.select(this.selected + 1);
	}
}

Menu.nextId = 0;



const Focus = {
	dom: null,
	typeEl: null,

	init: function() {
		Focus.dom = E(document.body, 'div', 'focus', pos('50%', '0', '50%', '100%'));
		Focus.typeEl = E(Focus.dom, 'div', 'focus-type');
	},

	set: function(item) {
		Focus.typeEl.innerHTML = item.type;
	}
};


const Equip = {
	dom: null,

	init: function() {
		
		E(document.head, 'style', null, null, [
			'.equip-slot {',
			'   font-size: 16vh;',
			'   text-align: center;',
			'   line-height: 120%;',
			'   width: 100%;',
			'   height: 16.67%;',
			'   color: #aaa;',
			'   filter: grayscale(100%);',
			'   opacity: 50%;',
			'   overflow: hidden;',
			'}',
			''
		].join('\n'));

		Equip.dom = E(document.body, 'div', null, pos('0', '0', '10%', '100%'));

		E(Equip, 'div', 'equip-slot', pos('0%', '0', null, null, { lineHeight: '105%'}), '🗡');
		E(Equip, 'div', 'equip-slot', pos('0', '16.67%', null, null, { lineHeight: '105%'}), E(null, 'div', null, {fontSize: '14vh', opacity: '50%'},'✋'));
		E(Equip, 'div', 'equip-slot', pos('0', '33.33%', null, null, { fontSize: '19vh', lineHeight: '90%' }), '🗣');
		E(Equip, 'div', 'equip-slot', pos('0', '50%', null, null, { lineHeight: '105%' }), E(null, 'div', null, {fontSize: '14vh', marginLeft: '-15%', opacity: '50%'}, '👚'));
		E(Equip, 'div', 'equip-slot', pos('0', '66.67%', null, null, { lineHeight: '105%'}), E(null, 'div', null, {fontSize: '14vh', opacity: '50%'}, '👖'));
		E(Equip, 'div', 'equip-slot', pos('0', '83.33%', null, null, { lineHeight: '100%' }), E(null, 'div', null, {fontSize: '13vh', marginLeft: '-10%', opacity: '50%'}, '👞'));
	}
};


const World = {
	root: null,
	location: null,
	focus: null,
	
	init: function() {
		World.root = Item.create(null, '🌎', 'World');
		
		const campfire = Item.create(World.root, '🔥', 'Campfire')
		Item.create(campfire, '/', 'Log');

		Item.create(World.root, '👞', 'Boots');
		Item.create(World.root, '🗡', 'Stick');

		const tent = Item.create(World.root, '⌂', 'Tent');
		Item.create(tent, '👖', 'Pants');
		const jar = Item.create(tent, '🏺', 'Jar');
		Item.create(jar, '💧', 'Water');

		World.setLocation(World.root);
	},

	setLocation: function(item) {
		World.location = item;
		UI.location.set(item);
		for (let child of item.contents) {
			UI.location.add(child);
		}
		let parent = item.parent;
		if (!parent) {
			UI.outside.set();
			UI.outside.add(item, true);
		} else {
			UI.outside.set(parent);
			for (let child of parent.contents) {
				UI.outside.add(child, child === item);
			}
		}
	}
};


const Item = {
	create: function(parent, type, name) {
		const item = {};
		item.id = Item.nextId;
		Item.nextId++;
		Item.byId[item.id] = item;
		item.parent = null;
		item.type = type;
		item.name = name;
		item.contents = [];
		if (parent) Item.add(parent, item);
		return item;
	},

	add: function(parent, item) {
		if (item.parent) {
			const i = item.parent.contents.indexOf(item);
			if (i > -1); item.parent.contents.splice(i, 1);
		}
		item.parent = parent;
		parent.contents.push(item);
	}
}

Item.nextId = 0;
Item.byId = {};