// ==UserScript==
// @name         Idlescape Mod
// @namespace    https://idlescape.com/
// @version      0.1.0
// @author       Between2Spaces
// @match        https://idlescape.com/game*
// @grant        none
// ==/UserScript==

( function () {

    const idol = window.idol = {}

    setInterval( main, 5000 )

    function main() {
        readExpStats();
        readInv();
    }

    document.addEventListener( "keyup", event => {
        if ( event.target.tagName === "input" ) return;
        if ( event.key === "a" ) {
            xpath( `//*[contains(@class, "exp-tooltip") and @data-for="attackHeader"]` ).iterateNext().click();
        } else if ( event.key === "m" ) {
            xpath( `//*[contains(@class, "goldTable")]` ).iterateNext().click();
        }
    } );

    function readExpStats() {
        if ( !idol.exp ) idol.exp = {};
        let result = xpath( `//*[contains(@class, "exp-tooltip")]` );
        let node;
        while ( node = result.iterateNext() ) {
            let stat = xpath( `string(./img/@alt)`, node ).stringValue.replace( " level icon", "" );
            let value = ( xpath( `.//svg:text[contains(@class, "CircularProgressbar-text")]`, node ).iterateNext() || xpath( `./span`, node ).iterateNext() ).textContent;
            idol.exp[ stat ] = parseInt( value );
        }
    }

    function readInv() {
        idol.inv = {};
        let inv = xpath( `//*[contains(@class, "inventory-container-all-items")]` ).iterateNext();
        if ( !inv ) return;
        let result = xpath( `.//*[contains(@class, "item")]`, inv );
        let node;
        while ( node = result.iterateNext() ) {
            let tooltip = [];
            let nodes = xpath( `.//*[@data-id="tooltip"]//text()`, node, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE );
            for ( let i = 0; i < nodes.snapshotLength; i++ )
                tooltip.push( nodes.snapshotItem( i ).textContent.trim() );
            idol.inv[ tooltip[ 0 ] ] = {
                amount: parseInt( xpath( `./div`, node ).iterateNext().textContent ),
                tooltip: tooltip
            };
        }
    }

    function marketplace_buy_items( callback ) {
        if ( idol._marketplace_buy_items && Date.now() - idol._marketplace_buy_items_age < ( 1000 * 60 * 2 ) ) {
            return idol._marketplace_buy_items;
        }
        let buy_items_available = xpath( `//div[contains(@data-for, "marketplaceBuyItemTooltip")]` ).iterateNext();
        if ( !xpath( `//div[contains(@data-for, "marketplaceBuyItemTooltip")]` ).iterateNext() ) {
            let buy_tab = xpath( `//*[contains(@class, "marketplace-overview buy-sell-my-auctions")]/div` ).iterateNext();
            if ( buy_tab ) {
                buy_tab.click();
                upon( `//div[contains(@data-for, "marketplaceBuyItemTooltip")]`, () => {
                    marketplace_buy_items( callback );
                } );
            } else {
                xpath( `//*[contains(@class, "goldTable")]` ).iterateNext().click();
                marketplace_buy_items( callback );
            }
            return
        }
        idol._marketplace_buy_items = {}
        let result = xpath( `//div[contains(@data-for, "marketplaceBuyItemTooltip")]` );
        let node;
        while ( node = result.iterateNext() ) {
            let item_name = xpath( `string(./img/@alt)`, node ).stringValue;
            idol._marketplace_buy_items[ item_name ] = {
                buy_node: node
            };
        }
        idol._marketplace_buy_items_age = Date.now();
        callback( idol._marketplace_buy_items );
    }

    idol.price_check = ( name, callback ) => {
        marketplace_buy_items( _marketplace_buy_items => {
            if ( !_marketplace_buy_items[ name ] ) return callback();
            if ( _marketplace_buy_items[ name ].hasOwnProperty( "lowest" ) ) return callback( _marketplace_buy_items[ name ].lowest );
            _marketplace_buy_items[ name ].buy_node.click();
            upon( `//*[contains(@class, "marketplace-table")]/tbody/tr`, row => {
                _marketplace_buy_items[ name ].lowest = {
                    node: row,
                    amount: parseInt( xpath( `string(./td[3]/text())`, row ).stringValue ),
                    price: parseInt( xpath( `string(./td[4]/text())`, row ).stringValue ),
                };
                callback( _marketplace_buy_items[ name ].lowest );
            } );
        } );
    };

    ( style => {
        style.type = "text/css";
        style.innerHTML = `
    img { opacity: .1 !important }
    * {
        background-image: none !important;
        background: rgba( 240, 240, 240, .5 ) !important;
        color: #555 !important;
        text-shadow: none !important;
    }
    `;
        document.getElementsByTagName( "head" )[ 0 ].appendChild( style );
    } )( document.createElement( "style" ) );


    function xpath( expression, context, type ) {
        return document.evaluate( expression, context || document, prefix => {
            return prefix === "svg" ? "http://www.w3.org/2000/svg" : null;
        }, type || 0 )
    }

    function upon( expression, callback ) {
        let node = xpath( expression ).iterateNext();
        if ( !node ) return setTimeout( () => { upon( expression, callback ) }, 50 );
        callback( node );
    }

} )();