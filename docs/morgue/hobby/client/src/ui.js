const get_elements_by_xpath = ( xpathExpression, contextNode, onfound ) => {
    let result = document.evaluate( xpathExpression, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null )
    let nodes = []
    for ( let i = 0; i < result.snapshotLength; i++ ) {
        let node = result.snapshotItem( i )
        nodes.push( node )
        onfound && onfound( node )
    }
    return nodes
}

const get_element_by_xpath = ( xpathExpression, contextNode, onfound ) => {
    let nodes = get_elements_by_xpath( xpathExpression, contextNode )
    if ( 0 < nodes.length ) return onfound && onfound( nodes[ 0 ] ), nodes[ 0 ]
}

const fill_params = params => {
    if ( !params ) return
    let ids = Object.keys( params )
    for ( let i = 0; i < ids.length; i++ ) {
        let element = document.getElementById( ids[ i ] )
        if ( element ) {
            let value = params[ ids[ i ] ]
            if ( element.tagName === "INPUT" ) element.value = value
            else {
                element.innerHTML = ( value && value !== "" ) ? value : "&nbsp;"
                get_element_by_xpath( '//*[@aria-describedby="' + ids[ i ] + '"]', document, element => {
                    if ( value && value !== "" ) {
                        element.classList.add( "is-invalid" )
                    } else {
                        element.classList.remove( "is-invalid" )
                        element.classList.add( "is-valid" )
                    }
                } )
            }
        }
    }
}

const render = ( id, html, params ) => {
    get_element_by_xpath( '/html/body/div[@id="' + id + '"]', document, element => {
        element.innerHTML = html
    } )
    fill_params( params )
}

export { get_elements_by_xpath, get_element_by_xpath, render }
