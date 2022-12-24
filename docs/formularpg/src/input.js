import info from "./info.js";
import { listen } from "./event.js";

export const input = label => {

    if ( input.byLabel[ label ] ) return input.byLabel[ label ];

    let keycode = label;

    if ( typeof label !== "number" ) {

        if ( label === "ENTER" ) keycode = 13;
        else if ( label === "SHIFT" ) keycode = 16;
        else if ( label === "CTRL" ) keycode = 17;
        else if ( label === "ALT" ) keycode = 18;
        else if ( label === "ESC" ) keycode = 27;
        else if ( label === "SPACE" ) keycode = 32;
        else if ( label === ";:" ) keycode = 186;
        else if ( label === "=+" ) keycode = 187;
        else if ( label === ",<" ) keycode = 188;
        else if ( label === "-_" ) keycode = 189;
        else if ( label === ".>" ) keycode = 190;
        else if ( label === "/?" ) keycode = 191;
        else if ( label === "[{" ) keycode = 219;
        else if ( label === "\\|" ) keycode = 220;
        else if ( label === "]}" ) keycode = 221;
        else if ( label === "\"" ) keycode = 222;
        else if ( label >= "a" && label <= "Z" ) keycode = label.charCodeAt() - 32;

    } else {

        if ( keycode === 13 ) label = "ENTER";
        else if ( keycode === 16 ) label = "SHIFT";
        else if ( keycode === 17 ) label = "CTRL";
        else if ( keycode === 18 ) label = "ALT";
        else if ( keycode === 27 ) label = "ESC";
        else if ( keycode === 32 ) label = "SPACE";
        else if ( keycode === 186 ) label = ";:";
        else if ( keycode === 187 ) label = "=+";
        else if ( keycode === 188 ) label = ",<";
        else if ( keycode === 189 ) label = "-_";
        else if ( keycode === 190 ) label = ".>";
        else if ( keycode === 191 ) label = "/?";
        else if ( keycode === 219 ) label = "[{";
        else if ( keycode === 220 ) label = "\\|";
        else if ( keycode === 221 ) label = "]}";
        else if ( keycode === 222 ) label = "\"";
        else if ( keycode >= 65 && keycode <= 122 ) label = String.fromCharCode( keycode + 32 );

    }

    input.byLabel[ label ] = input.byLabel[ keycode ] = input.byLabel[ keycode ] || {
        label: label,
        keycode: keycode,
        lastDown: - 1,
        wasDown: - 1,
        lastUp: - 1,
        wasUp: - 1,
        lastChanged: - 1,
        hasChanged: - 1,
    };

    return input.byLabel[ label ];

};


input.byLabel = {};


export const isDown = label => {

    let state = input( label );

    if ( state.lastDown > state.lastUp ) {

        return true;

    }

    return false;

};


export const wasDown = label => {

    let state = input( label );

    if ( state.lastDown > state.wasDown ) {

        state.wasDown = state.lastDown;
        return true;

    }

    return false;

};


export const hasChanged = label => {

    let state = input( label );

    if ( state.hasChanged === info( "time" ) || state.lastChanged > state.hasChanged ) {

        state.hasChanged = state.lastChanged;
        return true;

    }

    return false;

};


input( "MOUSE_LBUTTON" );
input( "MOUSE_MBUTTON" );
input( "MOUSE_RBUTTON" );
input( "MOUSE_WHEEL" ).delta = 0;
input( "MOUSE_OFFSET" ).x = 0;
input( "MOUSE_OFFSET" ).y = 0;



listen( window, "contextmenu", event => {

    event.preventDefault();

}, 100 );


listen( document.body, "mousedown", event => {

    event.preventDefault();

    switch ( event.button ) {
        case 0:
            input( "MOUSE_LBUTTON" ).lastChanged = input( "MOUSE_LBUTTON" ).lastDown = info( "time" );
            break;
        case 1:
            input( "MOUSE_MBUTTON" ).lastChanged = input( "MOUSE_MBUTTON" ).lastDown = info( "time" );
            break;
        case 2:
            input( "MOUSE_RBUTTON" ).lastChanged = input( "MOUSE_RBUTTON" ).lastDown = info( "time" );
            break;
        default:
            break;
    }

}, 100 );


listen( document.body, "mouseup", event => {

    event.preventDefault();

    switch ( event.button ) {
    case 0:
        input( "MOUSE_LBUTTON" ).lastChanged = input( "MOUSE_LBUTTON" ).lastUp = info( "time" );
        break;
    case 1:
        input( "MOUSE_MBUTTON" ).lastChanged = input( "MOUSE_MBUTTON" ).lastUp = info( "time" );
        break;
    case 2:
        input( "MOUSE_RBUTTON" ).lastChanged = input( "MOUSE_RBUTTON" ).lastUp = info( "time" );
        break;
    default:
        break;
    }

}, 100 );


listen( document, "keydown", event => {

    let state = input( event.which );
    state.lastChanged = state.lastDown = info( "time" );

} );


listen( document, "keyup", event => {

    let state = input( event.which );
    state.lastChanged = state.lastUp = info( "time" );

} );


listen( window, "mousemove", event => {

    let state = input( "MOUSE_OFFSET" );
    state.x = event.clientX;
    state.y = event.clientY;
    state.lastChanged = info( "time" );

} );


listen( window, "mousewheel", event => {

    let state = input( "MOUSE_WHEEL" );
    state.delta += Math.max( - 1, Math.min( 1, ( event.wheelDelta || - event.detail ) ) );
    state.lastChanged = info( "time" );

} );
