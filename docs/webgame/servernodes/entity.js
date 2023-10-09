import { connect, uuid, call } from '../server.js';

let Entity;

connect( Entity = {

	id: 'Entity',

	connected: ( args ) => {},

	create: ( args ) => {

		const entity = { type: args.shift(), id: uuid() };
		for ( let i = 0; i < args.length; i += 2 ) entity[ args[ i ] ] = args[ i + 1 ];
		entities[ entity.id ] = entity;
		return entity.id;

	},

	properties: ( args ) => {

		const entityId = args[ 0 ];
		if ( ! ( entityId in entities ) ) return [ 'error', `${entityId} not found` ];
		const entity = entities[ entityId ];
		return Object.keys( entity );

	},

	values: ( args ) => {

		const entityId = args[ 0 ];
		if ( ! ( entityId in entities ) ) return [ 'error', `${entityId} not found` ];
		const entity = entities[ entityId ];
		return Object.values( entity );

	}

} );

const entities = {};
