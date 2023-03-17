import { generateUUID } from "./math.js";


const uuids = {};


export const listen = ( object, event, fn, delay ) => {

    let router;

    if ( delay ) {

        ( function ( timeout ) {

            router = object => {

                timeout || ( fn( object ), timeout = setTimeout( () => {

                    timeout = null;

                }, delay ) );

            };

        } )();

    } else {

        router = object => { fn( object ); };

    }

    if ( object === window || object === document || object instanceof HTMLElement ) {

        object.addEventListener( event, router );
    
    } else {

        if ( ! uuids.hasOwnProperty( event ) ) {

            uuids[ event ] = {};

        }

        if ( ! object.hasOwnProperty( "uuid" ) ) {

            object.uuid = generateUUID();

        }

        if ( ! uuids[ event ].hasOwnProperty( object.uuid ) ) {

            uuids[ event ][ object.uuid ] = [];
        
        }

        uuids[ event ][ object.uuid ].push( router );

    }
    
};


export const announce = ( object, event ) => {

    if ( object === window || object === document || object instanceof HTMLElement ) {

        object.dispatchEvent( new Event( event ) );
    
    } else {

        if ( uuids.hasOwnProperty( event ) && uuids[ event ].hasOwnProperty( object.uuid ) ) {

            for ( let index = 0; index < uuids[ event ][ object.uuid ].length; index++ ) {

                uuids[ event ][ object.uuid ][ index ]( object );

            }

        }

    }

}
