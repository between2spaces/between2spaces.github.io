var dom = dom || {};
export default dom;

(function (internal) {
	
	dom.element = function (parent, tag, style, children) {
		
		if (typeof parent === 'string') {
			
			children = style;
			style = tag;
			tag = parent;
		 	
		}
		
		var element = document.createElement(tag);
		
		if (style instanceof Array || style instanceof Element) {
			
			children = style;
			
		} else if (style) {
			
			for (var name in style) {
				
				element.style[name] = style[name];
				
			}
			
		}
		
		if (children) {
			
			if (!(children instanceof Array)) {
				
				children = [children];
				
			}
			
			for (var index = 0; index < children.length; ++index) {
				
				var child = children[index];
				
				if (typeof child === 'string') {
					
					element.appendChild(document.createTextNode(child));
					
				} else {
					
					element.appendChild(child);
					
				}
				
			}
			
		}
		
		if (parent instanceof Element) {
			
			parent.appendChild(element);
			
		}
		
		return element;
		
	};
	
	dom.internal = internal;
	
} (dom.internal || {}));
