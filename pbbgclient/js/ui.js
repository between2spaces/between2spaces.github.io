PBBG.ui = {}
PBBG.ui._divs = {}
PBBG.ui.div = ( id ) => {
    if ( PBBG.ui._divs.hasOwnProperty( id ) ) {
        return PBBG.ui._divs[ id ]
    }
    let div = PBBG.ui._divs[ id ] = document.createElement( 'div' )
    div.id = id
    return div
}
PBBG.ui.style = ( element, css ) => {
    if ( !css ) {
        return element
    }
    if ( typeof css === "string" ) {
        return element.style[ css ]
    }
    for ( let properties = Object.getOwnPropertyNames( css ), i = properties.length; i--; ) {
        element.style[ properties[ i ] ] = css[ properties[ i ] ]
    }
    return element
}
PBBG.ui.create = ( parent, id, className, css ) => {
    let div = PBBG.ui.style( PBBG.ui.div( id ), css )
    div.className = className
    parent.append( div )
    return div
}

PBBG.ui.terminal = ( name ) => {
    name = name.toLowerCase()
    name = name.charAt( 0 ).toUpperCase() + name.slice( 1 )
    let terminal_id = 'terminal_' + name
    let tab_id = 'tab_' + name
    if ( PBBG.ui.terminal[ terminal_id ] ) {
        return PBBG.ui.terminal[ terminal_id ]
    }
    let tab = PBBG.ui.terminal[ tab_id ] = PBBG.ui.create( document.getElementById( 'terminaltabcontainer' ), tab_id, 'tab' )
    tab.innerHTML = name
    tab.addEventListener( 'click', PBBG.ui.terminalTabClick )
    let terminal = PBBG.ui.terminal[ terminal_id ] = PBBG.ui.create( document.getElementById( 'terminalcontainer' ), terminal_id, 'terminal' )
    if ( !PBBG.ui.terminal.map ) {
        PBBG.ui.terminal.map = {}
    }
    PBBG.ui.terminal.map[ name ] = {
        tab: tab,
        terminal: terminal
    }
    PBBG.ui.terminal.show( name )
    return terminal
}
PBBG.ui.terminal.show = ( name ) => {
    let names = Object.keys( PBBG.ui.terminal.map )
    for ( let i = 0, l = names.length; i < l; i++ ) {
        let terminal_name = names[ i ]
        let term = PBBG.ui.terminal.map[ terminal_name ]
        if ( terminal_name === name ) {
            term.terminal.classList.add( 'terminal-active' )
            term.tab.classList.add( 'tab-active' )
        } else {
            term.terminal.classList.remove( 'terminal-active' )
            term.tab.classList.remove( 'tab-active' )
        }
    }
}
PBBG.ui.terminalTabClick = ( e ) => {
    PBBG.ui.terminal.show( e.target.textContent.trim() )
}
PBBG.ui.terminal( 'Event' )
PBBG.ui.terminal( 'Chat' )
PBBG.print = ( terminalname, html ) => {
    PBBG.ui.terminal( terminalname ).innerHTML += html
}
PBBG.print( 'Event', 'Hello' )