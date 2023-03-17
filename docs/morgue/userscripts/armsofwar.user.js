// ==UserScript==
// @name         Arms of War - Mods
// @namespace    https://arms-of-war.com/
// @version      0.1.0
// @author       Between2Spaces
// @match        https://arms-of-war.com/game?id=*
// @grant        none
// ==/UserScript==

( function () {

    window.aow = {}

    aow.setDonation = donateAmount => {
        log( 'Donations ' + donateAmount )
    }

    const head = document.getElementsByTagName( 'head' )[ 0 ]
    const style = document.createElement( 'style' )
    style.type = 'text/css'
    style.innerHTML = `
    `
    head.appendChild( style )

    console.log( 'Arms of War - Mods' )

    function init() {
        aow.username = stringValue( '//a[@id="navbarDropdownMenuLink"]//text()' ).trim()
        if ( aow.username === '[Username]' ) return setTimeout( init )
        aow.gameId = aow.username + '#' + /id=([^&#]+)/ig.exec( location.href )[ 1 ]
        console.log( 'GameID ' + aow.gameId )
        aow.history = localStorage.getItem( aow.gameId ) || '[]'
        try { aow.history = JSON.parse( aow.history ) } catch { aow.history = [] }
        aow.donateNext = true
        aow.donations = [ 'castleGold', 'castleWood', 'castleFood', 'castleIron', 'castleConscripts' ]
        aow.shuffle( aow.donations )
        let donate = historyFind( /Donations (\d+)/ig, -1 ) || historyFind( /Donate (\d+)/ig, -1 )
        log( 'Donations ' + ( donate ? donate.match[ 1 ] : '0' ) )
        setInterval( update, 2000 )
    }
    init()

    function update() {
        let donate = historyFind( /Donations (\d+)/ig, -1 ) || historyFind( /Donate (\d+)/ig, -1 )
        if ( donate && donate.match[ 1 ] !== '0' ) {
            aow.donateNext ? autoDonate( parseInt( donate.match[ 1 ] ) ) : autoBuy()
        } else {
            autoBuy()
        }
    }

    function autoDonate( donateAmount ) {
        let incompleteDonations = []
        for ( let i = 0; i < aow.donations.length; i++ ) {
            let donation = aow.donations[ i ]
            if ( integerValue( '//span[@id="' + donation + '"]' ) < integerValue( '//span[@id="' + donation + 'Req"]' ) ) {
                incompleteDonations.push( donation )
            }
        }
        if ( incompleteDonations.length === 0 ) {
            aow.donateNext = false
            return
        }
        let donation = incompleteDonations[ 0 ]
        let resource = donation.replace( 'castle', '' )
        let amount = amountOfResource( resource )
        if ( donation === 'castleConscripts' ) donateAmount = 1
        if ( amount < donateAmount ) return gatherResource( resource )
        return click( null, '//button[@id="donateType"]', null, () => {
            let donateTypes = snapshotNodes( '//div[@id="donateTypeDropDown"]/div' )
            for ( let i = 0; i < donateTypes.snapshotLength; i++ ) {
                let donateType = donateTypes.snapshotItem( i )
                if ( donateType.textContent === resource ) {
                    click( null, donateType, null, () => {
                        aow.donateNext = false
                        singleNode( '//input[@id="donationAmount"]' ).value = donateAmount
                        click( 'Donate ' + donateAmount + ' ' + resource, '//button[@id="donateBtn"]' )
                    } )
                    break
                }
            }
        } )
    }

    function teamColour() {
        return stringValue( '//div[@id="battle-store-units-tab"]//div[@class="unit-store-image"][1]/img/@src' ).endsWith( 'Blue.png' ) ? 'Blue' : 'Red'
    }

    function enemyTeamColour() {
        return teamColour() === 'Blue' ? 'Red' : 'Blue'
    }

    function castleTier() {
        return integerValue( '//div[@id="castle' + teamColour() + '"]/span[@class="castleHealth"]/span[text()="Tier:"]/following-sibling::span[1]' )
    }

    function enemyCastleTier() {
        return integerValue( '//div[@id="castle' + enemyTeamColour() + '"]/span[@class="castleHealth"]/span[text()="Tier:"]/following-sibling::span[1]' )
    }

    function autoBuy() {
        let gold = integerValue( '//span[@id="gold-inventory"]/span[@class="rss-inventory-text"]' )
        let equipStoreCosts = snapshotNodes( '//span[@class="equip-store-cost"]' )
        for ( let i = 0; i < equipStoreCosts.snapshotLength; i++ ) {
            let equipStoreCost = equipStoreCosts.snapshotItem( i )
            let equipStoreCostAmount = parseInt( equipStoreCost.textContent.split( ' ' )[ 0 ] )
            if ( equipStoreCostAmount <= gold ) {
                let equipTitle = stringValue( './ancestor::div[@class="equip-store-tile"]/div[@class="equip-store-title"]', equipStoreCost )
                if ( equipTitle === 'Mortar and Pestle' ) break
                click( 'Buy ' + equipTitle + ' ' + equipStoreCostAmount + ' G', './ancestor::div[@class="equip-store-tile"]/button[@class="equip-store-purchase"]', equipStoreCost )
                break
            }
        }

        let buyUnitType = 'Basic'
        let tier = castleTier()
        if ( tier > 1 ) buyUnitType = 'Heavy'
        let unitStore = singleNode( '//div[@class="unit-store-tile" and ./div/@class="unit-store-title" and contains(./div/text(),"' + buyUnitType + '")]' )
        if ( !unitStore ) return
        let items = snapshotNodes( './/div[@id="' + buyUnitType.toLowerCase() + '-cost-content"]//span[@class="unit-store-detail-val" and not(text()="0")]', unitStore )
        for ( let i = 0; i < items.snapshotLength; i++ ) {
            let item = items.snapshotItem( i )
            let cost = parseInt( item.textContent.replace( ',', '' ).trim() )
            let resource = stringValue( '../text()', item ).replace( ':', '' )
            if ( amountOfResource( resource ) < cost ) return gatherResource( resource )
        }
        log( 'Tier ' + tier + ' -> Buy ' + buyUnitType )
        aow.donateNext = true
        return click( null, './button[@class="unit-store-purchase"]', unitStore )
    }

    function gatherResource( resource ) {
        resource = resource.trim().toLowerCase()
        let id = 'battle-rss-' + ( resource === 'conscripts' ? 'cons' : resource )
        let activeButton = singleNode( '//div[@id="' + id + '"]/button[not(contains(@class, "btn-disabled"))]' )
        if ( activeButton ) click( null, activeButton )
    }

    function amountOfResource( resource ) {
        resource = resource.trim().toLowerCase()
        let id = resource === 'conscripts' ? 'cons-inventory' : resource + '-inventory'
        return integerValue( '//span[@id="' + id + '"]/span[@class="rss-inventory-text"]' )
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

    const click = debounce( ( debug, node_or_xpath, context, callback ) => {
        if ( typeof node_or_xpath === 'string' ) node_or_xpath = singleNode( node_or_xpath, context )
        if ( !node_or_xpath || !available( node_or_xpath ) ) return
        node_or_xpath.click()
        callback && callback()
    }, 1000 )

    function available( node ) {
        if ( !node || node.style.visibility === 'hidden' || node.style.display === 'none' || node.disabled ) return false
        return true
    }

    function stringValue( xpath, context ) {
        return document.evaluate( xpath, context || document, null, XPathResult.STRING_TYPE, null ).stringValue
    }

    function integerValue( xpath, context ) {
        return parseInt( stringValue( xpath, context ).replace( ',', '' ).trim() )
    }

    function singleNode( xpath, context ) {
        return document.evaluate( xpath, context || document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue
    }

    function snapshotNodes( xpath, context ) {
        return document.evaluate( xpath, context || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null )
    }

    function log( msg ) {
        const MAX_HISTORY = 1000
        let message = { timestamp: timestamp(), text: msg.trim() }
        console.log( '%c' + message.timestamp + ' %c' + message.text, 'color:#444', 'color:#777' )
        aow.history.push( message )
        if ( MAX_HISTORY < aow.history.length ) aow.history.splice( 0, aow.history.length - MAX_HISTORY )
        localStorage.setItem( aow.gameId, JSON.stringify( aow.history ) )
    }

    function printmsg( timestamp, text ) {
        console.log( '%c' + timestamp + ' %c' + text, 'color:#444', 'color:#777' )
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
        for ( let i = aow.history.length - 1; -1 < i; i-- ) {
            let message = aow.history[ i ]
            if ( age > -1 && now - new Date( message.timestamp ) > age * 1000 ) return matches
            message.match = regex.exec( message.text )
            if ( message.match ) {
                if ( age === -1 ) return message
                matches.push( message )
            }
        }
        return age === -1 ? null : matches
    }

    aow.shuffle = ( array ) => {
        var currentIndex = array.length, temporaryValue, randomIndex
        while ( 0 !== currentIndex ) {
            randomIndex = Math.floor( Math.random() * currentIndex )
            currentIndex -= 1
            temporaryValue = array[ currentIndex ]
            array[ currentIndex ] = array[ randomIndex ]
            array[ randomIndex ] = temporaryValue
        }
        return array
    }

}() )
