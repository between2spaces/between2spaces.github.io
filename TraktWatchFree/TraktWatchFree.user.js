// ==UserScript==
// @name            Trakt Watch Free
// @namespace       http://between2spaces.github.io/TraktWatchFree
// @version         0.1.0
// @author          Between2Spaces
// @description     Presents free sources for movies and tv episodes on Trakt.tv
// @domain          trakt.tv
// @domain          raw.github.com
// @include         http://trakt.tv/*
// @include         https://trakt.tv/*
// @grant           GM_xmlhttpRequest
// @run-at          document-end
// @noframes
// @license         MIT License
// ==/UserScript==

function poll() {

    // Remove none VIP Ads
    let nodes = query( '//*[@id="huckster-content-page" or @id="huckster-desktop-wrapper" or @id="huckster-mobile-square-wrapper"]' )
    for ( let i = 0; i < nodes.snapshotLength; i++ ) {
        let ads = nodes.snapshotItem( i )
        ads.style.display = 'none'
    }

    nodes = query( '//a[contains(@class, "watch-now") and not(@traktwatchfree)]' )

    for ( let i = 0; i < nodes.snapshotLength; i++ ) {

        let watchnow = nodes.snapshotItem( i )
        watchnow.setAttribute( 'traktwatchfree', null )
        let media = mediainfo( watchnow )

        let url = search( media, url => {

            console.log( url )

            if ( url ) {

                watchnow.href = url
                watchnow.style.border = "1px solid green"

            } else {

                watchnow.style.border = "1px solid red"

            }

        } )

    }

}

function mediainfo( watchnow ) {

    let media = {
        title: undefined,
        year: '\\d+',
        seasonNo: undefined,
        episodeNo: undefined,
        episodeName: undefined
    }

    let nodes = query( 'ancestor::*[contains(@class, "grid-item")]', watchnow )

    if ( !nodes.snapshotLength ) {

        if ( /^https?:\/\/trakt\.tv\/movies\//.test( document.URL ) ) {

            let title = /^(.*) \((\d+)\)/.exec( document.title )
            media.title = title[ 1 ]
            media.year = title[ 2 ]

        } else {

            let title = /^(.*) (\d+)x(\d+) (&quot;|")(.*)(&quot;|")/.exec( document.title )
            media.title = title[ 1 ]
            media.seasonNo = title[ 2 ]
            media.episodeNo = title[ 3 ]
            media.episodeName = title[ 5 ]

        }

    } else {

        let griditem = nodes.snapshotItem( 0 )

        if ( griditem.getAttribute( 'itemtype' ) === 'http://schema.org/Movie' ) {

            media.title = text( './/meta[@itemprop="name"]/@content', griditem )
            media.year = text( './/span[@class="year"]', griditem )
            let yearintitle = /^(.*) \((\d+)\)$/.exec( media.title )
            if ( yearintitle ) {
                media.title = yearintitle[ 1 ]
                media.year = yearintitle[ 2 ]
            }

        } else {

            let title = text( './/img[@class="real"]/@title', griditem )

            if ( title ) {

                title = /^(.*) (\d+)x(\d+) (&quot;|")(.*)(&quot;|")/.exec( title )
                media.title = title[ 1 ]
                media.seasonNo = title[ 2 ]
                media.episodeNo = title[ 3 ]
                media.episodeName = title[ 5 ]

            } else {

                let titles = first( './/div[@class="titles"]', griditem )
                media.title = text( './h5', titles )
                let sxe = /(\d+)x(\d+)/.exec( text( './/*[@class="main-title-sxe"]', titles ) )
                media.seasonNo = sxe[ 1 ]
                media.episodeNo = sxe[ 2 ]
                media.episodeName = text( './/*[@class="main-title"]', titles )

            }

        }

    }

    return media

}

function query( xpath, context, domdocument ) {

    return ( domdocument || document ).evaluate( xpath, context || document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null )

}

function first( xpath, context, domdocument ) {

    let nodes = query( xpath, context, domdocument )
    return nodes.snapshotLength > 0 ? nodes.snapshotItem( 0 ) : null

}

function text( xpath, context, domdocument ) {

    let nodes = query( xpath, context, domdocument )
    return nodes.snapshotLength > 0 ? nodes.snapshotItem( 0 ).textContent : null

}

function search( media, res ) {

    return my123movies.search( media, res )

}

const aggregators = []

const my123movies = {

    url: 'https://my123movies.org',

    search: function ( media, res ) {

        httpGet( my123movies.url + '/?s=' + media.title, my123movies.results, media, res )

    },

    results: function ( doc, media, res ) {

        console.log( 'TraktWatchFree' )
        let result = first( '//div[contains(@class, "movies-list")]//a[@href="' + my123movies.url + '/' + ( media.seasonNo ? 'episode/' + media.title.toLowerCase().replace( / /g, '-' ) + '-season-' + media.seasonNo.replace( /^[0]+/, '' ) + '-episode-' + media.episodeNo.replace( /^[0]+/, '' ) : media.title.toLowerCase() + '-' + media.year ) + '/"]', doc.body, doc )
        if ( result ) return res( nodes.snapshotItem( i ).getAttribute( 'href' ) )
        let page = /\/page\/(\d+)\//.exec( doc.url )
        page = page ? parseInt( page[ 1 ] ) : 1
        let url = my123movies.url + '/page/' + ( page + 1 ) + '/?s=' + media.title.replace( / /g, '+' )
        xpath = '//a[@href="' + url + '"]'
        let nextpage = first( '//a[@href="' + url + '"]', doc.body, doc )
        if ( nextpage ) {
            return httpGet( url, my123movies.results, media, res )
        }
        res( null )
    }

}

const icefilms = {

    url: 'https://www.icefilms.info',

    search: function ( media, res ) {

        let letter = media.title.toLowerCase().replace( 'the ', '' ).replace( 'a ', '' ).replace( ' ', '' )[ 0 ].toUpperCase()
        let url = icefilms.url + '/' + ( media.seasonNo ? 'tv' : 'movies' ) + '/a-z/' + letter
        httpGet( url, icefilms.index, media, res )

    },

    index: function ( doc, media, res ) {

        let xpath = '//a[starts-with(text(), "' + media.title + '")]'
        let pages = doc.evaluate( xpath, doc.body, null, XPathResult.ANY_TYPE )

        for ( var page = pages.iterateNext(); page; page = pages.iterateNext() ) {

            if ( ( new RegExp( ' \\(' + media.year + '\\)$' ) ).test( page.textContent ) ) {

                let url = icefilms.url + page.getAttribute( 'href' )
                return httpGet( url, media.seasonNo ? icefilms.episodes : icefilms.result, media, res )

            }

        }

        let words = media.title.split( ' ' )

        if ( words.length > 1 ) {

            words.splice( 0, 1 )
            media.title = words.join( ' ' )
            icefilms.search( media, res )

        }

    },

    episodes: function ( doc, media ) {

        var episodes = document.evaluate( '//a[starts-with(@href, "/ip\.php\?v=")]', doc.body, null, XPathResult.ANY_TYPE );

        for ( var episode = episodes.iterateNext(); episode; episode = episodes.iterateNext() ) {

            if ( ( new RegExp( '^' + media.seasonNo + 'x' + media.episodeNo + ' ' ) ).test( episode.textContent ) ) {

                return httpGet( icefilms.url + episode.getAttribute( 'href' ), icefilms.result, media, res )

            }

        }

    },

    result: function ( doc, media, res ) {

        res( doc.url )

    }

}

function httpGet( url, onload, data, res ) {
    GM_xmlhttpRequest( {
        method: 'GET',
        url: url,
        onload: function ( response ) {
            if ( response.status === 200 ) {
                var doc = document.implementation.createHTMLDocument()
                doc.documentElement.innerHTML = response.responseText
                onload( doc, data, res )
            }
        }
    } )

}

setInterval( poll, 100 )
