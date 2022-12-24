const info = ( name, value ) => {

    if ( typeof value !== "undefined" ) {

        info.values[ name ] = typeof value === "number" ? Math.round( value * 100 ) / 100.0 : value;

    }

    return info.values.hasOwnProperty( name ) ? info.values[ name ] : null;

};


info.values = {};


export default info;
