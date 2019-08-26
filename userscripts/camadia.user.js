// ==UserScript==
// @name         Camadia - Mods
// @description  Mods for Camadia
// @namespace    https://www.camadia.com/
// @version      0.1.0
// @author       Between2Spaces
// @match        https://www.camadia.com/play/
// @grant        none
// ==/UserScript==

( function () {

    const MAX_HISTORY = 1000

    const head = document.getElementsByTagName( 'head' )[ 0 ]

    let style = document.createElement( 'style' )
    style.type = 'text/css'
    style.innerHTML = `
    /*img { opacity: .5 !important }
    div { opacity: .8 !important }
    .drk-bg-blk { background: none !important }*/
    `
    head.appendChild( style )

    let script = document.createElement( 'script' )
    script.src = 'https://unpkg.com/tesseract.js@2.0.0-alpha.10/dist/tesseract.min.js'
    script.type = 'text/javascript'
    head.appendChild( script )

    let history = localStorage.getItem( 'history' ) || '[]'
    try { history = JSON.parse( history ) } catch { history = [] }
    for ( let i = 0; i < history.length; i++ )
        console.log( '%c' + history[ i ].timestamp + ' %c' + history[ i ].text, 'color:#444', 'color:#777' )

    setInterval( main, 2000 )

    function main() {
        if ( botcheck() ) return
        handleNotifications()
        autoEat()
        autoCombat()
        pageTitleStatus()
    }

    function botcheck() {
        let captcha = singleNode( '//img[@alt="CAPTCHA code"]' )
        if ( captcha ) {
            if ( captcha.complete && !botcheck.preservedTitle ) {
                botcheck.preservedTitle = document.title
                let canvas = document.createElement( 'canvas' )
                // scale the captcha image x2 to improve gaps between numbers
                canvas.width = 320
                canvas.height = 150
                canvas.getContext( '2d' ).drawImage( captcha, 0, 0, canvas.width, canvas.height )
                const worker = new Tesseract.TesseractWorker()
                worker.recognize( canvas, 'eng', {
                    tessedit_char_whitelist: '0123456789',
                } ).progress( data => {
                } ).then( data => {
                    let answer = data.text.trim()
                    simulateKeyPress( '//form[@id="botcheck-form"]/input', answer )
                    if ( answer.length === 4 ) click( 'Botcheck answered "' + answer + '"', '//button[@id="botcheck-button"]' )
                } )
            }
            document.title = document.title !== 'Botcheck!' ? 'Botcheck!' : botcheck.preservedTitle
            return true
        }
        botcheck.preservedTitle = null
    }

    function pageTitleStatus() {
        let timer = stringValue( '//*[@id="worktimer"]', document )
        if ( timer ) {
            let work = stringValue( '//a[@onclick="SetupMainArea(\'cancelwork\'); return false;"]/text()' )
            work = work.replace( 'Stop ', '' )
            work = work.replace( 'Cancel ', '' )
            if ( work === '' ) {
                let fighting = stringValue( '//div[@id="main_area"]//p[@class="mb-0"][1]/text()[1]' )
                fighting = fighting.replace( 'You are fighting a ', '' )
                fighting = fighting.split( ',' )[ 0 ]
                let HP = playerHP()
                HP = HP ? HP.remaining + '/' + HP.total : '?/?'
                let monster_health = stringValue( '//p[@id="monster_health"]' )
                monster = monster_health.split( ' HP: ' )
                let heals = availableHeals()
                let heals_total = 0
                for ( let i = 0; i < heals.length; i++ ) heals_total += heals[ i ].amount * heals[ i ].count
                document.title = timer + ' ' + HP + '(' + heals_total + ') ' + monster[ 1 ] + ' ' + monster[ 0 ]
                return
            }
            if ( work === 'Woodcutting' ) {
                let amount = stringValue( '//div[@title="Logs "]/span[@class="item_invent_count"]/text()' )
                document.title = timer + ' - ' + work + ' (' + amount + ')'
                return
            }
            if ( work === 'Travel' ) {
                let destination = stringValue( '//div[@id="main_area"]//p[@class="mb-1"][1]/text()[1]' )
                destination = destination.replace( 'Now traveling to', 'Travel to' )
                document.title = timer + ' - ' + destination
                return
            }
            if ( work === 'Cooking' ) {
                let food = stringValue( '//div[@id="main_area"]//p[@class="mb-1"][1]/text()[1]' )
                food = food.replace( '!', '' )
                document.title = timer + ' - ' + food
                return
            }
            document.title = timer + ' - ' + work + ' (?)'
            return
        }
        let location = stringValue( '//*[@id="location_name_text"]/text()' )
        document.title = location
    }

    function playerHP() {
        let node = singleNode( '//span[@id="health_stat_holder"]' )
        if ( !node ) return null
        let HP = node.textContent.split( '/' )
        if ( HP.length < 2 ) return null
        HP = { remaining: parseInt( HP[ 0 ] ), total: parseInt( HP[ 1 ] ) }
        node.style.color = HP.remaining === HP.total ? '#0a0' : HP.remaining > HP.total * .5 ? '#a50' : '#a00'
        return HP
    }

    function availableHeals() {
        let heals = []
        let usables = snapshotNodes( '//div[contains(@class, "isusuable")]' )
        for ( let i = 0; i < usables.snapshotLength; i++ ) {
            let usable = usables.snapshotItem( i )
            let title = usable.title
            if ( title.indexOf( ' : Heals ' ) === -1 ) continue
            let count = parseInt( stringValue( 'span[@class="item_invent_count"]', usable ) )
            if ( count === 0 ) continue
            usable.style.border = '1px solid #0a0'
            title = usable.title.split( ' : Heals ' )
            heals.push( { title: usable.title, amount: parseInt( title[ 1 ].trim() ), count: count, node: usable } )
        }
        return heals
    }

    function autoEat() {
        let HP = playerHP()
        if ( !HP || HP.remaining === HP.total ) return
        let heals = availableHeals()
        for ( let i = 0; i < heals.length; i++ ) {
            let heal = heals[ i ]
            if ( HP.total - HP.remaining < heal.amount ) continue
            click( null, heal.node, () => {
                let heals = availableHeals()
                let total = 0
                for ( let i = 0; i < heals.length; i++ ) total += heals[ i ].amount * heals[ i ].count
                HP = playerHP()
                log( 'Your HP was at ' + HP.remaining + '/' + HP.total + '. You ate ' + heal.title.split( ' :' )[ 0 ] + ' which healed for +' + heal.amount + ' (+' + total + ' heals remaining)' )
                log( 'You are healing at a rate of ' + healPerMin() + ' heals/min' )
            } )
            break
        }
    }

    function autoCombat() {
        let leavecombat = singleNode( '//a[@id="leavecombat"]' )
        if ( !leavecombat ) return
        let combatTraining = singleNode( '//select[@id="combat-training"]' )
        if ( !combatTraining ) return
        if ( !autoCombat.trainingRegistered ) {
            combatTraining.addEventListener( 'change', () => { changeCombatTraining( 0 ) } )
            autoCombat.trainingRegistered = true
        }
        if ( availableHeals().length === 0 ) return click( 'No heals available, leaving combat', leavecombat )
        leavecombat.style.visibility = 'visible'
        let xpath = '//a[@id="fightagain" and @style="visibility: visible;"]'
        let fightagain = singleNode( xpath )
        if ( fightagain ) click( stringValue( '//div[@id="finishmsg"]/p[1]' ), xpath, () => {
            log( 'You are earning ' + xpPerMin() + ' XP/min' )
            let training = 'Training '
            let nodes = snapshotNodes( '//div[@id="combat_screen"]/p[3]//text()' )
            for ( let i = 0; i < nodes.snapshotLength; i++ ) training += nodes.snapshotItem( i ).textContent
            log( training )
        } )
    }

    function xpPerMin( period ) {
        period = period || 600
        let messages = historyFind( /you earned (\d+) [a-z]+ experience/gi, period )
        let gains = 0
        for ( let i = 0; i < messages.length; i++ ) {
            let message = messages[ i ]
            let match = /you earned (\d+) [a-z]+ experience/gi.exec( message.text )
            if ( match ) gains += parseInt( match[ 1 ] )
        }
        return ( 60 * gains / period ).toFixed( 1 )
    }

    function healPerMin( period ) {
        period = period || 600
        let messages = historyFind( /you ate [a-z ]+ which healed for \+(\d+) /gi, period )
        let heals = 0
        for ( let i = 0; i < messages.length; i++ ) {
            let message = messages[ i ]
            let match = /you ate [a-z ]+ which healed for \+(\d+) /gi.exec( message.text )
            if ( match ) heals += parseInt( match[ 1 ] )
        }
        return ( 60 * heals / period ).toFixed( 1 )
    }

    function handleNotifications() {
        let notifybox = singleNode( '//div[@id="notify_player_box"]' )
        if ( !notifybox || notifybox.style.display === '' || notifybox.style.display === 'none' ) return
        let notify = stringValue( '//div[@id="notify_msg"]' ).trim()
        if ( notify === '' ) return
        click( notify, '//button[@id="close_notify_player_box"]', () => {
            if ( notify.indexOf( ' level has increased to ' ) > -1 ) changeCombatTraining( 1 )
        } )
    }

    function changeCombatTraining( delta ) {
        let combatTraining = singleNode( '//select[@id="combat-training"]' )
        if ( !combatTraining ) return
        let index = combatTraining.options.selectedIndex
        if ( index + delta >= combatTraining.options.length ) index = index - combatTraining.options.length
        else if ( index + delta < 0 ) index = index + combatTraining.options.length
        combatTraining.options.selectedIndex = index + delta
        click( null, singleNode( '//button[@id="change-skill"]' ), () => {
            log( 'Now training ' + combatTraining.options[ combatTraining.options.selectedIndex ].text )
        } )
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
        if ( !node_or_xpath ) return
        node_or_xpath.click()
        callback && callback()
    }, 500 )

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

    function simulateKeyUp( keys ) {
        keys.split( '' ).forEach( key => {
            const e = new window.KeyboardEvent( 'keypress', {
                bubbles: true,
                key: key,
                keyCode: key.charCodeAt( 0 ),
                charCode: key.charCodeAt( 0 ),
            } )
            document.activeElement.dispatchEvent( e )
        } )
    }

    function simulateKeyDown( keys ) {
        keys.split( '' ).forEach( key => {
            console.log( key )
            const e = new window.KeyboardEvent( 'keypress', {
                bubbles: true,
                key: key,
                keyCode: key.charCodeAt( 0 ),
                charCode: key.charCodeAt( 0 ),
            } )
            document.activeElement.dispatchEvent( e )
        } )
    }

    function post( url, success ) {
        $.ajax( {
            type: 'POST', url: url, success: data => {
                if ( isJson( data ) ) return success( data )
                let node = document.createElement( 'div' )
                node.innerHTML = data
                success( node )
            }
        } )
    }

    function isJson( item ) {
        item = typeof item !== "string" ? JSON.stringify( item ) : item
        try { item = JSON.parse( item ) } catch ( e ) { return false }
        return typeof item === "object" && item !== null
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
            if ( now - new Date( message.timestamp ) > age * 1000 ) return matches
            if ( message.text.match( regex ) ) matches.push( message )
        }
        return matches
    }

    window.z = {
        historyFind: historyFind,
        xpPerMin: xpPerMin,
        healPerMin: healPerMin
    }

}() )
