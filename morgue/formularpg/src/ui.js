import info from "./info.js";

export const element = ( id, tag, parent ) => {

    if ( ! tag ) return element.byId[ id ];

    let e = document.createElement( tag );

    if ( id ) {

        e.setAttribute( "id", id );

        element.byId[ id ] = e;

    }

    if ( parent ) {

        parent.appendChild( e );

    }

    return e;

};


element.byId = {};


export const attrib = ( elem, attribs ) => {

    if ( typeof attribs === "string" ) return elem.getAttribute( attribs );

    for ( let props = Object.getOwnPropertyNames( attribs ), i = props.length; i --; ) {

        elem.setAttribute( props[ i ], attribs[ props[ i ] ] );

    }

    elem.style.opacity = UI_OPACITY;

    return elem;

};


export const style = ( elem, css ) => {

    if ( typeof css === "string" ) return elem.style[ css ];

    for ( let props = Object.getOwnPropertyNames( css ), i = props.length; i --; ) {

        elem.style[ props[ i ] ] = css[ props[ i ] ];

    }

    return elem;

};


export const content = ( elem, contents ) => {

    contents = contents instanceof Array ? contents : [ contents ];

    for ( let i = 0; i < contents.length; ++ i ) {

        let child = contents[ i ];

        if ( typeof child === "string" || typeof child === "number" ) {

            child = document.createTextNode( child );

        }

        elem.appendChild( child );

    }

    return elem;

};


setInterval( () => {

    for ( let name in info.values ) {

        if ( element( name ) ) element( name ).innerHTML = info.values[ name ];

    }

}, 60 );
