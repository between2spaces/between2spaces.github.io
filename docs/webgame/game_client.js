import { Client, Entity } from './client.js';


class Table {

	constructor() {

		this.dom = document.createElement( 'div' );

		this.table = document.createElement( 'table' );
		this.thead = document.createElement( 'thead' );
		this.tbody = document.createElement( 'tbody' );

		this.table.append( this.thead );
		this.table.append( this.tbody );

		this.dom.append( this.table );

		this.items = [];

	}

	add( item ) {

		this.items.push( item );

		this.tbody.append( item.tr );

	}

}



class TableItem {

	constructor() {

		this.tr = document.createElement( 'tr' );

	}

	setValue( col, value ) {



	}

}


class TableItemEntity extends TableItem {

	constructor( entity ) {

		this.entity = entity;

	}

}


class Game extends Client {

	constructor() {

		super( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://knowing-laced-tulip.glitch.me/' );

	}

	_entity( msg ) {

		super._entity( msg );

		console.log( msg );

	}

}


window.client = new Game();
window.Entity = Entity;

