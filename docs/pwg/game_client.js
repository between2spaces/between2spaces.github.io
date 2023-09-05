import { Client, Entity } from './client.js';


class Table {

	constructor() {

		this.dom = document.createElement( 'table' );

		this.dom.append( this.thead = document.createElement( 'thead' ) );
		this.dom.append( this.tbody = document.createElement( 'tbody' ) );

	}

	add( entityTableEntry ) {

		this.tbody.append( entityTableEntry.dom );

	}

}



class EntityUI {

	constructor( entity, UIid ) {

		this.entity = entity;
		this.UIid = UIid;

		EntityUI.byUIid[ UIid ] = entity;

		if ( ! ( entity.id in EntityUI.byEntityId ) ) EntityUI.byEntityId[ entity.id ] = [];

		EntityUI.byEntityId[ entity.id ].push( this );

	}

	purge() {

		this.dom.remove();
		delete EntityUI.byUIid[ this.UIid ];
		delete EntityUI.byEntityId[ this.entity.id ];

	}

	update() {
	}

}

EntityUI.byUIid = {};
EntityUI.byEntityId = {};


EntityUI.purgeAll = () => {

	for ( let entityId in EntityUI.byEntityId ) {

		for ( let entityUI of EntityUI.byEntityId[ entityId ] ) {

			entityUI.purge();

		}

	}

};

EntityUI.purgeEntity = ( entityId ) => {

	if ( ! ( entityId in EntityUI.byEntityId ) ) return;

	for ( let entityUI of EntityUI.byEntityId[ entityId ] ) {

		entityUI.purge();

	}

};




class EntityTableEntry extends EntityUI {

	constructor( entity ) {

		super( entity, `EntityTableEntry-${entity.id}` );

		this.dom = document.createElement( 'tr' );

		this.update();

	}

	update() {

		super.update();

		this.dom.innerHTML = `<td>${this.entity.id}</td><td>${this.entity.type}</td>`;

	}

}

EntityTableEntry.updateOrCreate = ( entity, entityTableInstance ) => {

	const UIid = `EntityTableEntry-${entity.id}`;

	if ( ! ( UIid in EntityUI.byUIid ) ) {

		entityTableInstance.add( new EntityTableEntry( entity ) );

	} else {

		EntityUI.byUIid[ UIid ].update();

	}

};





class Game extends Client {

	constructor() {

		super( document.location.host === 'localhost:8000' ? 'ws://localhost:6500/' : 'wss://knowing-laced-tulip.glitch.me/' );

		this.entityTable = new Table();

		document.body.append( this.entityTable.dom );

	}

	onConnected() {

		super.onConnected();

		console.log( 'connected' );

		EntityUI.purgeAll();

	}

	onDisconnected() {

		super.onDisconnected();

		console.log( 'disconnected' );

		EntityUI.purgeAll();

	}


	onEntityUpdate( entity ) {

		super.onEntityUpdate( entity );

		EntityTableEntry.updateOrCreate( entity, this.entityTable );

	}

	onEntityPurge( entity ) {

		EntityUI.purgeEntity( entity.id );

	}

	_send( msg ) {

		console.log( msg );

	}

}





window.client = new Game();
window.Entity = Entity;
