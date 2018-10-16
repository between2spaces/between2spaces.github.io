/*! readme */
( () => {

    let xhr = new XMLHttpRequest

    xhr.addEventListener( "load", e => {

        /* showdown script extension */
        showdown.extension( "script", () => {

            return [ {

                type: "output",
                
                filter: function ( text ) {

                    return text.replace( /(?:<p>)?<img.*?src="(.+?)"(.*?)\/?>(?:<\/p>)?/gi, ( match, url ) => {

                        if ( ! /\.js$/.test( url ) ) {

                            return match

                        }

                        let script = document.createElement( "script" )
                        script.src = url
                        script.async = false
                        document.head.appendChild( script )

                        return ""

                    } )

                }
            } ]

        } )

        let text = e.currentTarget.responseText

        let i = text.indexOf( "#" )
        document.title = - 1 < i ? text.substring( i + 1, text.substring( i ).indexOf( "\n" ) + 1 ) : "Untitled"

        let path = window.location.href.split( "#" )[ 0 ].replace( /\/(index\.html)?$/, "" ).split( "/" )
        let ref = "../"
        let crumb = path.pop()
        let popped

        for ( path.splice( 0, 2 ); 0 < path.length; ) {

            if ( ( popped = path.pop() ) !== "" ) {

                crumb = '<a href="' + ref + '">' + popped + "</a> / " + crumb
                ref += "../"

            }

        }

        document.body.innerHTML = '<div id="crumb">' + crumb + "</div>" + ( new showdown.Converter( { extensions: [ "script" ] } ) ).makeHtml( text )

    } )

    xhr.open( "GET", window.location.href.split( "#" )[ 0 ].replace( "/index.html", "" ) + "/README.md" )
    xhr.send()

} ).call( this )
