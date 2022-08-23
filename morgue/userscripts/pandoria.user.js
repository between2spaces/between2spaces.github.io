// ==UserScript==
// @name         Pendoria - Mods
// @description  Mods for Pendoria
// @namespace    http://pendoria.net/
// @version      0.1.0
// @author       Between2Spaces
// @match        https://pendoria.net/game
// @grant        none
// ==/UserScript==

( function () {

    let style = document.createElement( 'style' )
    style.type = 'text/css'
    style.innerHTML = `
    /** { opacity: .9 !important }*/
    body { background: #444 }
    `
    document.getElementsByTagName( 'head' )[ 0 ].appendChild( style )

    let history = localStorage.getItem( 'history' ) || '[]'
    try { history = JSON.parse( history ) } catch { history = [] }
    for ( let i = 0; i < history.length; i++ )
        console.log( '%c' + history[ i ].timestamp + ' %c' + history[ i ].text, 'color:#444', 'color:#777' )

    const MONSTER_MIN_BATTLES = 20
    const DOWNGRADE_MONSTER_WL = .6
    const UPGRADE_MONSTER_WL = .85
    const BATTLEDATA_TIMEOUT = 10000

    let battleDataTime = performance.now()
    let wins = 0
    let losses = 0
    let botcheckPreservedTitle

    setInterval( main, 1000 )

    function main() {
        let captcha = singleNode( '//div[@id="captcha"]' )
        if ( !captcha || captcha.style.display === 'none' ) {
            botcheckPreservedTitle = null
        } else {
            if ( document.title !== 'Botcheck!' && !botcheckPreservedTitle ) {
                botcheckPreservedTitle = document.title
                log( 'Botcheck!' )
            }
            document.title = document.title !== 'Botcheck!' ? 'Botcheck!' : botcheckPreservedTitle
            return
        }
    }

    onBattleData()
    onUpdateDungeons()

    setInterval( () => {
        let duration = performance.now() - battleDataTime
        if ( duration < BATTLEDATA_TIMEOUT ) return
        log( 'No battle data seen for awhile, starting battle...' )
        click( 'battlebutton' )
    }, BATTLEDATA_TIMEOUT )

    const checks = [
        () => { // Guild task progress and auto task #1 start
            post( '/guild/tasks', response => {
                let progress = stringValue( '//td[text()="Progress"]/following-sibling::td[1]/text()', response ).split( '/' )
                if ( 2 === progress.length ) {
                    let completed = parseInt( progress[ 0 ].replace( /\D/g, '' ) )
                    let total = parseInt( progress[ 1 ].replace( /\D/g, '' ) )
                    let percent = Math.round( ( completed / total ) * 100 )
                    log( 'Guild task progress ' + completed + '/' + total + ' ' + percent + '%' )
                    return
                }
                post( '/guild/select-task/1', response => {
                    log( 'You have started Guild Task #1' )
                } )
            } )
        },
        () => { // Deployment auto signup
            post( '/encampment/deployment', response => {
                let signup = singleNode( '//*[@id="deployment-signup" and not(@hidden) and not(@disabled)]', response )
                if ( !signup ) return
                setTimeout( () => {
                    post( '/encampment/deployment/signup', () => {
                        log( 'You have signed up for a deployment' )
                    } )
                }, 5000 + Math.round( Math.random() * 10000 ) )
            } )
        },
        () => { // Dungeon progress and auto start
            let duration = performance.now() - updateDungeonsTime
            if ( duration < BATTLEDATA_TIMEOUT ) return
            post( '/action/dungeons', response => {
                post( '/dungeons/portal-activators', data => {
                    if ( data.portalActivators <= 0 ) return
                    let dungeonButtonStart = singleNode( '//*[@class="dungeon-button-start" and not(@hidden) and not(@disabled)]', response )
                    if ( !dungeonButtonStart ) return
                    dungeonButtonStart.click()
                    let confirmInterval = setInterval( () => {
                        let confirm = singleNode( '//*[@id="pconfirm"]' )
                        if ( confirm ) {
                            clearInterval( confirmInterval )
                            confirm.click()
                            log( 'You have started a new dungeon' )
                        }
                    }, 1000 )
                } )
            } )
        }
    ]

    function onBattleData( data ) {

        if ( !data ) return window.socket ? socket.on( 'battle data', onBattleData ) : setTimeout( onBattleData, 500 )

        battleDataTime = performance.now()

        click( 'turnin' )
        click( 'getQuest' )

        if ( !checks.hasOwnProperty( 'index' ) || checks.index >= checks.length ) checks.index = 0

        checks[ checks.index++ ]()

        let playerLife = data.playerLife
        let monsterName = data.monsterName

        let monsterSelect = document.getElementById( 'monster' )
        if ( !monsterSelect ) return
        monsterSelect.addEventListener( 'change', () => { changeMonster( 0 ) } )
        let battleBtn = document.getElementById( 'battlebutton' )
        if ( !battleBtn ) return
        battleBtn.addEventListener( 'click', () => { resetWinLoss() } )

        if ( playerLife > 0 ) wins++; else losses++
        let total = wins + losses
        let win_ratio = wins / total

        log( 'Battle ' + monsterSelect.options.selectedIndex + '/' + monsterSelect.length + ' ' + monsterName + ' ' + wins + '/' + losses + ' ' + Math.round( win_ratio * 100 ) + '% ' )

        if ( total < MONSTER_MIN_BATTLES ) {
            if ( losses > MONSTER_MIN_BATTLES * DOWNGRADE_MONSTER_WL ) return changeMonster( -1 )
            if ( wins > MONSTER_MIN_BATTLES * UPGRADE_MONSTER_WL ) return changeMonster( 1 )
            return
        }

        if ( win_ratio < DOWNGRADE_MONSTER_WL ) return changeMonster( -1 )
        if ( win_ratio > UPGRADE_MONSTER_WL ) return changeMonster( 1 )

    }

    let updateDungeonsTime = performance.now()

    function onUpdateDungeons( data ) {
        if ( !data ) return window.socket ? socket.on( 'update dungeons', onUpdateDungeons ) : setTimeout( onUpdateDungeons, 500 )
        updateDungeonsTime = performance.now()
        log( 'Dungeon ' + data.current + '/' + data.target + ' ' + Math.round( 100 * data.current / data.target ) + '% | ' + data.ingots + ' ingots remaining' )
    }

    function changeMonster( delta ) {
        let monsterSelect = document.getElementById( 'monster' )
        let monsterIndex = monsterSelect.options.selectedIndex
        monsterSelect.options.selectedIndex = monsterIndex + delta
        click( 'battlebutton' )
    }

    function resetWinLoss() {
        wins = 0
        losses = 0
    }

    function click( id ) {
        let e = document.getElementById( id )
        e && e.click()
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

    function log( msg ) {
        let message = { timestamp: timestamp(), text: msg.trim() }
        console.log( '%c' + message.timestamp + ' %c' + message.text, 'color:#444', 'color:#777' )
        let history = localStorage.getItem( 'history' ) || '[]'
        try { history = JSON.parse( history ) } catch { history = [] }
        history.push( message )
        if ( 100 < history.length ) history.splice( 0, history.length - 100 )
        localStorage.setItem( 'history', JSON.stringify( history ) )
    }

    function timestamp( date ) {
        if ( !date ) date = new Date
        return date.getHours().toString().padStart( 2, '0' ) + ':' + date.getMinutes().toString().padStart( 2, '0' ) + ':' + date.getSeconds().toString().padStart( 2, '0' )
    }

}() )
