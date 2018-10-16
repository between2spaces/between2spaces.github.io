(function () {
	
	var header = document.evaluate('/html/body/header', document, null, XPathResult.ANY_TYPE, null).iterateNext()
	
	if (header) {
		
		header.innerHTML = [
			'<h1><a href="/soba">SOBA</a></h1>',
			'<aside>',
            '  <a class="github-icon" href="https://www.github.com/stephencarmody/soba" title="GitHub"></a>',
            '  <a class="twitter-icon" href="https://twitter.com/_stephencarmody" title="Twitter"></a>',
            '</aside>'
		].join('\n')
		
	}
	
	var footer = document.evaluate('/html/body/footer', document, null, XPathResult.ANY_TYPE, null).iterateNext()
	
	if (footer) {
		
		footer.innerHTML = [
			'<p></p>'
		].join('\n')
		
	}
	
}())