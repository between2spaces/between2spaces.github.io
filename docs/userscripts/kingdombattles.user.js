// ==UserScript==
// @name         Kingdom Battles - Mods
// @description  Mods for Kingdom Battles
// @namespace    https://kingdombattles.net/
// @version      0.1.0
// @author       Between2Spaces
// @match        https://kingdombattles.net/*
// @grant        none
// ==/UserScript==

( function () {

    const MAX_HISTORY = 1000

    const head = document.getElementsByTagName( 'head' )[ 0 ]

    let style = document.createElement( 'style' )
    style.type = 'text/css'
    style.innerHTML = `
    a.banner { display: none }
    h1.centered { display: none }
    `
    head.appendChild( style )

    let history = localStorage.getItem( 'history' ) || '[]'
    try { history = JSON.parse( history ) } catch { history = [] }
    for ( let i = 0; i < history.length; i++ )
        printlog( '%c' + history[ i ].timestamp + ' %c' + history[ i ].text, 'color:#444', 'color:#777' )

    setInterval( main, 2000 )

    function main() {
        let attack = singleNode( '//button[./text()="Attack"]' )
        if ( available( attack ) ) {
            let message = historyFind( /(\d+)min \+ (\d+)sec farming cycle/, -1 )
            if ( message ) {
                let match = /(\d+)min \+ (\d+)sec farming cycle/gi.exec( message.text )
                let min = parseInt( match[ 1 ] )
                if ( min > 0 ) click( null, attack, () => {
                    let sec = Math.floor( 3 + Math.random() * 12 )
                    log( 'Attack started; ' + min + 'min + ' + sec + 'sec farming cycle' )
                } )
            }
        } else {
            let message = historyFind( /(\d+)min \+ (\d+)sec farming cycle/, -1 )
            if ( message ) {
                let match = /(\d+)min \+ (\d+)sec farming cycle/gi.exec( message.text )
                let min = parseInt( match[ 1 ] )
                if ( min > 0 ) {
                    let sec = parseInt( match[ 2 ] )
                    let delay = min * 60000 + sec * 1000
                    let elapsed = ( new Date ) - new Date( message.timestamp )
                    let remaining = delay - elapsed
                    let url = window.location.href
                    if ( remaining <= 0 && url.startsWith( 'https://kingdombattles.net/profile?username=' ) && !url.endsWith( 'HeartOfTheGrove' ) )
                        return location.reload()
                    if ( remaining > 0 && remaining < 30000 ) return log( 'Attack ends in ' + Math.round( remaining * .001 ) + 'sec' )
                }
            }
        }
    }

    function farm( min ) {
        let sec = min > 0 ? Math.floor( 3 + Math.random() * 12 ) : 0
        log( 'Set farming; ' + min + 'min + ' + sec + 'sec farming cycle' )
    }

    function debounce( func, delay ) {
        let inDebounce
        return function () {
            const context = this
            const args = arguments
            if ( inDebounce ) return
            clearTimeout( inDebounce )
            inDebounce = setTimeout( () => {
                inDebounce = null
                args[ 0 ] && log( args[ 0 ] )
                func.apply( context, args )
            }, delay )
        }
    }

    const click = debounce( ( debug, node_or_xpath, callback ) => {
        if ( typeof node_or_xpath === 'string' ) node_or_xpath = singleNode( node_or_xpath )
        if ( !node_or_xpath || !available( node_or_xpath ) ) return
        node_or_xpath.click()
        callback && callback()
    }, 1000 )

    function available( node ) {
        if ( !node || node.style.visibility === 'hidden' || node.style.display === 'none' || node.disabled ) return false
        return true
    }

    function simulateKeyPress( node_or_xpath, keys ) {
        if ( typeof node_or_xpath === 'string' ) node_or_xpath = singleNode( node_or_xpath )
        if ( !node_or_xpath ) return
        let keypressListener = e => { e.target.value += e.key }
        node_or_xpath.addEventListener( 'keypress', keypressListener )
        node_or_xpath.focus()
        keys.split( '' ).forEach( key => {
            const e = new window.KeyboardEvent( 'keypress', {
                bubbles: true,
                key: key,
                keyCode: key.charCodeAt( 0 ),
                charCode: key.charCodeAt( 0 ),
            } )
            document.activeElement.dispatchEvent( e )
        } )
        node_or_xpath.removeEventListener( 'keypress', keypressListener )
    }

    function stringValue( xpath, context ) {
        return document.evaluate( xpath, context || document, null, XPathResult.STRING_TYPE, null ).stringValue
    }

    function singleNode( xpath, context ) {
        return document.evaluate( xpath, context || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue
    }

    function snapshotNodes( xpath, context ) {
        return document.evaluate( xpath, context || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null )
    }

    function log( msg ) {
        let message = { timestamp: timestamp(), text: msg.trim() }
        console.log( '%c' + message.timestamp + ' %c' + message.text, 'color:#444', 'color:#777' )
        history = localStorage.getItem( 'history' ) || '[]'
        try { history = JSON.parse( history ) } catch { history = [] }
        history.push( message )
        if ( MAX_HISTORY < history.length ) history.splice( 0, history.length - MAX_HISTORY )
        localStorage.setItem( 'history', JSON.stringify( history ) )
    }

    function printmsg( timestamp, text ) {
        printlog( '%c' + timestamp + ' %c' + history[ i ].text, 'color:#444', 'color:#777' )
    }

    function timestamp( date ) {
        let d = date || new Date
        return d.getFullYear() + '-' + pad( d.getMonth() + 1 ) + '-' + pad( d.getDate() ) + 'T' + pad( d.getHours() ) + ':' + pad( d.getMinutes() ) + ':' + pad( d.getSeconds() )
    }

    function pad( number ) {
        return number.toString().padStart( 2, '0' )
    }

    function historyFind( regex, age ) {
        let now = new Date
        let matches = []
        for ( let i = history.length - 1; -1 < i; i-- ) {
            let message = history[ i ]
            if ( age > -1 && now - new Date( message.timestamp ) > age * 1000 ) return matches
            if ( message.text.match( regex ) ) {
                if ( age === -1 ) return message
                matches.push( message )
            }
        }
        return age === -1 ? null : matches
    }

    window.z = {
        historyFind: historyFind,
        farm: farm
    }

}() )
