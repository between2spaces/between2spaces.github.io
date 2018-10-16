import mem from './mem.js'

/**
 * @param {string=} id The id of the element. Use (null|undefined) for no id.
 * @param {string=} tag The element tag
 * @returns {HTMLElement} The element
 */
export const element = ( id, tag ) => {
    if ( ! tag ) return element.byId[ id ]
    let e = document.createElement( tag )
    if ( id ) {
        e.setAttribute( "id", id )
        element.byId[ id ] = e
    }
    return e
}

element.byId = {}

/**
 * @param {HTMLElement} e The element
 * @param {string} id The id to set for the element
 * @returns {HTMLElement} The element
 */
export const setid = ( e, id ) => {
    attrib( e, { 'id': id } )
    element.byId[ id ] = e
    return e
}


/**
 * @param {HTMLElement} e The element
 * @param {(string | {})} attribs if string returns attributes value; otherwise sets attributes
 * @returns {HTMLElement} The element
 */
export const attrib = ( e, attribs ) => {
    if ( typeof attribs === 'string' ) return e.getAttribute( attribs )
    for ( let props = Object.getOwnPropertyNames( attribs ), i = props.length; i --; ) {
        e.setAttribute( props[ i ], attribs[ props[ i ] ] )
    }
    return e
}

/**
 * @param {HTMLElement} e The element
 * @param {(string | {})} css if string returns css value; otherwise sets css properties
 * @returns {HTMLElement} The element
 */
export const style = ( e, css ) => {
    if ( typeof css === "string" ) return e.style[ css ]
    for ( let props = Object.getOwnPropertyNames( css ), i = props.length; i --; ) {
        e.style[ props[ i ] ] = css[ props[ i ] ]
    }
    return e
}

/**
 * @param {HTMLElement} e The element
 * @param {(any | [])} contents Content to add to element
 * @returns {HTMLElement} The element
 */
export const content = ( e, contents ) => {
    contents = contents instanceof Array ? contents : [ contents ]
    for ( let i = 0; i < contents.length; ++ i ) {
        let child = contents[ i ]
        if ( typeof child === "string" || typeof child === "number" ) {
            child = document.createTextNode( child )
        }
        e.appendChild( child )
    }
    return e
}

/**
 * @param {string=} id The id of the element. Use (null|undefined) for no id.
 * @param {number[]} columns Columns percentages
 * @param {number=} rows Number of rows (default=1)
 * @returns {HTMLElement} The element
 */
export const layout = ( id, columns, rows ) => {
    let e = element( id, 'table' )
    let tbody = element( null, 'tbody' )
    let trs = []
    let firstrow = true
    for ( let i = 0; i < rows; i++ ) {
        let tr = element( null, 'tr' )
        for ( let t = 0; t < columns.length; t++ ) {
            let td = element( null, 'td' )
            if ( firstrow ) style( td, { width: columns[ t ] + '%' } )
            content( tr, td )
        }
        firstrow = false
        trs.push( tr )
    }
    content( e, tbody )
    content( tbody, trs )
    return e
}

/**
 * @param {string} xpathExpression An XPath expression
 * @param {number=} resultType A constant that specifies the desired result type to be returned (default=XPathResult.ANY_TYPE)
 * @returns The xpath result
 */
export const xpath = ( xpathExpression, resultType ) => {
    resultType = ( typeof resultType === 'undefined' ) ? XPathResult.ANY_TYPE : resultType
    return document.evaluate( xpathExpression, document, null, resultType, null )
}


export const update = () => {
    for ( let key in mem ) {
        let el = element( key )
        if ( el ) {
            let value = mem[ key ]
            el.innerHTML = typeof value === "number" ? Math.round( value * 100 ) / 100.0 : value
        }
    }
}
