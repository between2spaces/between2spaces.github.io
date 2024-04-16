//import './websocket.js';


export default function main(container) {

	World.init();
	
	window.addEventListener('keydown', (event) => {
		if (event.key === 'k') Nav.selectPrevious();
		else if (event.key === 'j') Nav.selectNext();
	});

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


const UIDebug = {
	init: function() {
		
		E(document.head, 'style', null, null, [
			'.div {',
			'   border: 1px solid #aaa;',
			'}',
			''
		].join('\n'));

	}
};


const Bread = {
	dom: null,

	init: function() {
		E(document.head, 'style', null, null, [
			'.bread {',
			'   border: 1px solid #aaa;',
			'}',
			'.bread-item {',
			'   color: #aaa;',
			'   overflow: hidden;',
			'   padding: 0;',
			'   white-space: nowrap;',
			'	line-height: 100%;',
			'}',
			'.bread-item-type {',
			'	display: inline-block;',
			'   filter: grayscale(100%);',
			'   opacity: 50%;',
			'	padding: 0;',
			'	line-height: 2em;',
			'	width: 2em;',
			'   text-align: center;',
			'   vertical-align: middle;',
			'}',
			'.bread-item-name {',
			'	display: inline-block;',
			'   padding: 0.5em;',
			'   vertical-align: middle;',
			'}',
			''
		]);

		Bread.dom = E(document.body, 'div', 'bread', pos('0', '0', '100%', '2em'));
	},

	clear: function() {
		if (!Bread.dom) Bread.init();
		Bread.dom.innerHTML = '';
	},

	insert: function(item) {
		if (!Bread.dom) Nav.init();
		const el = E(Bread.dom, 'div', 'bread-item', null, [
			E(null, 'div', 'bread-item-type', null, item.type),
			E(null, 'div', 'bread-item-name', null, item.name),
		]);
		el.id = `bread-item-${Nav.dom.childElementCount}`;
		el.itemid = item.id;
	}
};

const Nav = {
	dom: null,
	selected: 1,

	init: function() {
		E(document.head, 'style', null, null, [
			'.nav {',
			'	display: table;',
			'   border: 1px solid #aaa;',
			'}',
			'.nav-item {',
			'	display: table-row;',
			'   color: #aaa;',
			'   overflow: hidden;',
			'   padding: 0;',
			'   white-space: nowrap;',
			'	line-height: 100%;',
			'}',
			'.nav-item-select {',
			'	display: table-cell;',
			'   min-width: 0.5em;',
			'	line-height: 2em;',
			'   vertical-align: middle;',
			'}',
			'.nav-item-type {',
			'	display: table-cell;',
			'   filter: grayscale(100%);',
			'   opacity: 50%;',
			'	width: 2em;',
			'   text-align: center;',
			'   vertical-align: middle;',
			'}',
			'.nav-item-name {',
			'	display: table-cell;',
			'   padding: 0.5em;',
			'   vertical-align: middle;',
			'}',
			'.nav-item-container {',
			'	display: table-cell;',
			'   min-width: 0.5em;',
			'	line-height: 2em;',
			'   vertical-align: middle;',
			'}',
			''
		].join('\n'));

		Nav.dom = E(document.body, 'nav', null, pos('10%', '2em', '25%', '100%'));
	},

	clear: function() {
		if (!Nav.dom) Nav.init();
		Nav.dom.innerHTML = '';
		Nav.select(1);
	},

	add: function(item) {
		if (!Nav.dom) Nav.init();
		const el = E(Nav.dom, 'div', 'nav-item', null, [
			E(null, 'div', 'nav-item-select', null),
			E(null, 'div', 'nav-item-type', null, item.type),
			E(null, 'div', 'nav-item-name', null, item.name),
			E(null, 'div', 'nav-item-container', null, item.contents.length > 0 ? '⋮' : '')
		]);
		el.id = `nav-item-${Nav.dom.childElementCount}`;
		el.itemid = item.id;
		el.draggable = "true";
		el.ondragstart = "drag(event)";
	},
	
	select: function(num) {
		if (!Nav.dom) Nav.init();
		const el = document.getElementById(`nav-item-${num}`);
		if (!el) return;
		if (Nav.selected) {
			const prev = document.getElementById(`nav-item-${Nav.selected}`);
			if (prev) {
				prev.style.background = 'none';
				prev.querySelector('.nav-item-select').style.background = 'none';
			}
		}
		el.style.background = '#eee';
		el.querySelector('.nav-item-select').style.background = '#aaa';
		Nav.selected = num;
	},

	selectPrevious: function() {
		if (!Nav.dom) Nav.init();
		if (Nav.selected === 1) return;
		Nav.select(Nav.selected - 1);
	},

	selectNext: function() {
		if (!Nav.dom) Nav.init();
		if (Nav.selected === Nav.dom.childElementCount) return;
		Nav.select(Nav.selected + 1);
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

		World.setLocation(World.root);
	},

	setLocation: function(item) {
		World.location = item;
		Nav.clear();
		for (let child of item.contents) {
			Nav.add(child);
		}
		let parent = item;
		Bread.clear();
		while (parent) {
			Bread.insert(parent);
			parent = parent.parent;
		}
	}
};


const Item = {
	create: function(parent, type, name) {
		const item = {};
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