import Client from './client.js';


class EntityList {

	constructor( properties ) {

		this.id = Client.uuid();

		this.fields = ( properties && 'fields' in properties ) ? properties.fields : [ 'id' ];
		this.dom = document.createElement( 'div' );
		this.table = document.createElement( 'table' );
		this.thead = document.createElement( 'thead' );
		this.tbody = document.createElement( 'tbody' );

		this.table.append( this.thead );
		this.table.append( this.tbody );
		this.dom.append( this.table );

		this.th = [];

		for ( let field of this.fields ) {

			const th = document.createElement( 'th' );
			th.textContent = field;
			this.thead.append( th );

		}

		this.tr = [];
		this.trById = {};

	}

	add( entity ) {

		const id = `${this.id}-${entity.id}`;

		if ( id in this.trById ) return;

		const tr = document.createElement( 'tr' );

		tr.id = id;

		for ( let field of this.fields ) {

			const td = document.createElement( 'td' );
			td.textContent = entity[ field ];
			tr.append( td );

		}

		this.tr.push( tr );
		this.trById[ tr.id ] = tr;

		this.tbody.append( tr );

	}

	remove( entity ) {

		const id = `${this.id}-${entity.id}`;
		const tr = this.trById[ id ];
		tr.parentNode.removeChild( tr );
		delete this.trById[ id ];

	}

	clear() {

		this.tbody.innerHTML = '';
		this.tr = [];
		this.trById = {};

	}

}

function main() {

	const entities = new EntityList( { fields: [ 'type', 'id' ] } );
	document.body.append( entities.dom );

	const client = window.client = new Client( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://knowing-laced-tulip.glitch.me/' );

	client.listen( 'connecting', message => {

		entities.clear();

	} );

	client.listen( 'entity', message => {

		entities.add( client.entityById[ message.data.id ] );

	} );

}

setTimeout( main, 0 );
