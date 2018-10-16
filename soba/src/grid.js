import game from './game';
import Vec3 from './vec3';


var cells = cells || {};


(function (internal) {
	
	
	internal.GRID_SIZE = 250;
	internal.CELLS_PER_METRE = 4;
	internal.LINE_OF_SIGHT_DELTAS = 0.1;
	internal.DEBUGVIEW_UPDATE_MS = 333;
	internal.MAX_SEARCH_LENGTH = 100;
	internal.nextDebugViewUpdate = internal.nextDebugViewUpdate || 0;
	
	
	/**
	 * @struct GridNode
	 * @return {GridNode}
	 */
	function GridNode(x, y) {
	
		return {
			x: x,
			y: y,
			offset: /** {Vec3} */Vec3({ x: (x - internal.centre) / internal.CELLS_PER_METRE, y: (y - internal.centre) / internal.CELLS_PER_METRE }),
			entities: /** {Entity[]} */[],
			weight: 1,
			f: 0,
	        g: 0,
	        h: 0,
	        visited: false,
	        closed: false,
	        parent: null,
			debugPath: false,
			north: null,
			northeast: null,
			east: null,
			southeast: null,
			south: null,
			southwest: null,
			west: null,
			northwest: null,
			neighbours: []
		};
	
	};
	
	
	
	internal.grid = internal.grid || [];
	internal.nodesForEntity = internal.nodesForEntity || {};
	internal.dirtyNodes = internal.dirtyNodes || [];
	
	internal.centre = internal.centre || ~~(internal.GRID_SIZE * 0.5);
	internal.offset = internal.offset || Vec3();
	internal.collisionBox = internal.collisionBox || Vec3();
	internal.min = internal.min || Vec3();
	internal.max = internal.max || Vec3();
	
	
	if (!internal.grid.length) {
	
		for (var y = 0; y < internal.GRID_SIZE; ++y) {
			internal.grid[y] = [];
			for (var x = 0; x < internal.GRID_SIZE; ++x) {
				internal.grid[y][x] = GridNode(x, y);
			}
		}
	
		for (var y = 0; y < internal.GRID_SIZE; ++y) {
			for (var x = 0; x < internal.GRID_SIZE; ++x) {
				var node = internal.grid[y][x];
				node.north = y > 0 ? internal.grid[y - 1][x] : null;
				node.northeast = (y > 0 && x < (internal.GRID_SIZE - 1)) ? internal.grid[y - 1][x + 1] : null;
				node.east = x < (internal.GRID_SIZE - 1) ? internal.grid[y][x + 1] : null;
				node.southeast = (x < (internal.GRID_SIZE - 1) && y < (internal.GRID_SIZE - 1)) ? internal.grid[y + 1][x + 1] : null;
				node.south = y < (internal.GRID_SIZE - 1) ? internal.grid[y + 1][x] : null;
				node.southwest = (x > 0 && y < (internal.GRID_SIZE - 1)) ? internal.grid[y + 1][x - 1] : null;
				node.west = x > 0 ? internal.grid[y][x - 1] : null;
				node.northwest = (x > 0 && y > 0) ? internal.grid[y - 1][x - 1] : null;
				
				node.neighbours = [];
				if (node.north) node.neighbours.push(node.north);
				//if (node.northeast) node.neighbours.push(node.northeast);
				if (node.east) node.neighbours.push(node.east);
				//if (node.southeast) node.neighbours.push(node.southeast);
				if (node.south) node.neighbours.push(node.south);
				//if (node.southwest) node.neighbours.push(node.southwest);
				if (node.west) node.neighbours.push(node.west);
				//if (node.northwest) node.neighbours.push(node.northwest);
			}
		}
	
		internal.canvas = document.createElement('canvas');
		internal.canvas.width = internal.GRID_SIZE;
		internal.canvas.height = internal.GRID_SIZE;
		internal.canvas.style.imageRendering = 'pixelated';
	
		internal.context = internal.canvas.getContext('2d', { antialias: false, depth: false });
	
		internal.CLEAR_COLOUR = internal.context.createImageData(1, 1);
		internal.CLEAR_COLOUR.data[3] = 0;
	
		internal.LIMIT_COLOUR = internal.context.createImageData(1, 1);
		var data = internal.LIMIT_COLOUR.data;
		data[0] = data[2] = 255; data[3] = 200;
	
		internal.COLLISION_COLOUR = internal.context.createImageData(1, 1);
		internal.COLLISION_COLOUR.data[3] = 50;
	
		internal.PATH_COLOUR = internal.context.createImageData(1, 1);
		internal.PATH_COLOUR.data[3] = 100;
	
		internal.VISITED_COLOUR = internal.context.createImageData(1, 1);
		internal.VISITED_COLOUR.data[3] = 20;
		
	}
	
	
	
	
	cells.updateCollisionSpace = function (entity) {
		
		if (!entity.collisionBox) {
			return [];
		}
		
		if (!internal.sprite) {
			internal.sprite = new PIXI.Sprite(PIXI.Texture.fromCanvas(internal.canvas));
			internal.sprite.anchor.x = 0.5;
			internal.sprite.anchor.y = 0.5;
			internal.sprite.width = internal.sprite.height = (internal.GRID_SIZE / internal.CELLS_PER_METRE) * game.PIXELS_PER_METRE;
			internal.sprite.name = 'cells';
			internal.sprite.zOrder = 99999;
			internal.sprite.alpha = 0.5;
			game.world.spriteContainer.addChild(internal.sprite);
		}
	
		var nodes = internal.nodesForEntity[entity.id] = internal.nodesForEntity[entity.id] || [];
		var node;
		
		for (node in nodes) {
			node = nodes[node];
			node.entities.splice(node.entities.indexOf(entity), 1);
			node.weight = (node.entities.length === 0) ? 1 : 0;
		}
	
		internal.offset.x = Math.round(internal.centre + entity.offset.x * internal.CELLS_PER_METRE);
		internal.offset.y = Math.round(internal.centre + entity.offset.y * internal.CELLS_PER_METRE);
		
		internal.collisionBox.x = Math.ceil(0.5 * entity.collisionBox.x * entity.size.x * internal.CELLS_PER_METRE) - 1;
		internal.collisionBox.y = Math.ceil(0.5 * entity.collisionBox.y * entity.size.y * internal.CELLS_PER_METRE) - 1;
		
		internal.min.x = Math.min(Math.max(internal.offset.x - internal.collisionBox.x, 0), internal.GRID_SIZE - 1);
		internal.max.x = Math.min(Math.max(internal.offset.x + internal.collisionBox.x, 0), internal.GRID_SIZE - 1);
		internal.min.y = Math.min(Math.max(internal.offset.y - internal.collisionBox.y, 0), internal.GRID_SIZE - 1);
		internal.max.y = Math.min(Math.max(internal.offset.y + internal.collisionBox.y, 0), internal.GRID_SIZE - 1);
	
		var collisions = [];
		
		nodes.length = 0;
		
		for (var y = internal.min.y; y <= internal.max.y; ++y) {
			for (var x = internal.min.x; x <= internal.max.x; ++x) {
				node = internal.grid[y][x];
				if (node.weight === 0) {
					for (var entity in node.entities) {
						collisions.push(node.entities[entity]);
					}
				}
				node.weight = 0;
				node.entities.push(entity);
				nodes.push(node);
			}
		}
		
		return collisions;
	
	};
	
	
	
	cells.debugView = function () {
	
		if (game.timestamp < internal.nextDebugViewUpdate) return;
	
		internal.nextDebugViewUpdate = game.timestamp + internal.DEBUGVIEW_UPDATE_MS;
	
		internal.context.clearRect(0, 0, internal.GRID_SIZE, internal.GRID_SIZE);
	
		for (var y = 0; y < internal.GRID_SIZE; ++y) {
	
			for (var x = 0; x < internal.GRID_SIZE; ++x) {
				
				var node = internal.grid[y][x];
				
				if (node.weight === 0) {
					internal.context.putImageData(internal.COLLISION_COLOUR, x, y);
				} else if (node.debugPath) {
					internal.context.putImageData(internal.PATH_COLOUR, x, y);
				} else if (node.visited) {
					internal.context.putImageData(internal.VISITED_COLOUR, x, y);
				} else if (x === 0 || y === 0 || x === internal.GRID_SIZE - 1 || y === internal.GRID_SIZE - 1) {
					internal.context.putImageData(internal.LIMIT_COLOUR, x, y);
				}
	
			}
	
		}
	
		internal.sprite.texture.baseTexture.update();
	
	};
	
	
	
	
	/**
	 * Returns an array of offsets from entity's current offset to specified destination that avoids collisions.
	 *  
	 * @param {game.entity} entity
	 * @param {vec3} destination
	 * @return {vec3[]}
	 */
	cells.search = function (entity, destination) {
		
		var cost;
		var gScore;
		
		// Clean dirty nodes
		for (var node in internal.dirtyNodes) {
			node = internal.dirtyNodes[node];
			node.f = 0;
	        node.g = 0;
	        node.h = 0;
	        node.visited = false;
	        node.closed = false;
	        node.parent = null;
			node.debugPath = false;
	    }
	
	    internal.dirtyNodes = [];
	
		var startNode = internal.nodeAtOffset(entity.offset);
		var endNode = internal.nodeAtOffset(destination);
		
		var closestNode = startNode;
		
		if (!endNode) {
			game.debug('destination is outside cells range');
			return internal.pathTo(closestNode);
		}
	
		startNode.h = internal.heuristic(startNode, endNode);
		internal.dirtyNodes.push(startNode);
		
		// Add the new node to the end of the array
		var binaryheap = [startNode];
	
	
		while (binaryheap.length) {
	
			if (binaryheap.length > internal.MAX_SEARCH_LENGTH) {
				return internal.pathTo(closestNode);
			}
			
			// Grab the lowest f(x) to process next.  Heap keeps this sorted for us
			var currentNode = internal.pop(binaryheap);
			
			// End case -- result has been found, return the traced path
			if (currentNode === endNode) {
				return internal.pathTo(currentNode, destination);
			}
			
			// Normal case -- move currentNode from open to closed, process each of its neighbors
			currentNode.closed = true;
			
			// Find all neighbors for the current node
			for (var neighbour in currentNode.neighbours) {
	
				neighbour = currentNode.neighbours[neighbour];
				
				var beenVisited = neighbour.visited;
				
				if (currentNode.parent && internal.lineOfSight(entity, currentNode.parent, neighbour)) {
					
					cost = internal.getCost(entity, currentNode.parent, neighbour);
					
					if (neighbour.closed || cost === 0) {
						// Not a valid node to process, skip to next neighbour
						continue;
					}
					
					gScore = currentNode.parent.g + cost;
					
					if (!beenVisited || gScore < neighbour.g) {
						
						// Found an optimal (so far) path to this node.  Take score for node to see how good it is.
						neighbour.visited = true;
		                neighbour.parent = currentNode.parent;
		                neighbour.h = neighbour.h || internal.heuristic(neighbour, endNode);
		                neighbour.g = gScore;
		                neighbour.f = neighbour.g + neighbour.h;
		                internal.dirtyNodes.push(neighbour);
						
						// If the neighbour is closer than the current closestNode or if it's equally close but has
		                // a cheaper path than the current closest node then it becomes the closest node
		                if (neighbour.h < closestNode.h || (neighbour.h === closestNode.h && neighbour.g < closestNode.g)) {
		                    closestNode = neighbour;
		                }
		
						if (!beenVisited) {
		                    // Pushing to heap will put it in proper place based on the 'f' value.
		                    binaryheap.push(neighbour);
							internal.sinkDown(binaryheap, binaryheap.length - 1);
		                }
		                else {
		                    // Already seen the node, but since it has been rescored we need to reorder it in the heap
		                    internal.sinkDown(binaryheap, binaryheap.indexOf(neighbour));
		                }
						
					}
						
				} else {
				
					cost = internal.getCost(entity, currentNode, neighbour);
	
					if (neighbour.closed || cost === 0) {
						// Not a valid node to process, skip to next neighbor.
						continue;
					}
			
					gScore = currentNode.g + cost;
	
					if (!beenVisited || gScore < neighbour.g) {
						
						// Found an optimal (so far) path to this node.  Take score for node to see how good it is.
		                neighbour.visited = true;
		                neighbour.parent = currentNode;
		                neighbour.h = neighbour.h || internal.heuristic(neighbour, endNode);
		                neighbour.g = gScore;
		                neighbour.f = neighbour.g + neighbour.h;
		                internal.dirtyNodes.push(neighbour);
						
						// If the neighbour is closer than the current closestNode or if it's equally close but has
		                // a cheaper path than the current closest node then it becomes the closest node
		                if (neighbour.h < closestNode.h || (neighbour.h === closestNode.h && neighbour.g < closestNode.g)) {
		                    closestNode = neighbour;
		                }
		
						if (!beenVisited) {
		                    // Pushing to heap will put it in proper place based on the 'f' value.
		                    binaryheap.push(neighbour);
							internal.sinkDown(binaryheap, binaryheap.length - 1);
		                } else {
		                    // Already seen the node, but since it has been rescored we need to reorder it in the heap
		                    internal.sinkDown(binaryheap, binaryheap.indexOf(neighbour));
		                }
		
					}
					
				}
	
			}
	
		}
	
		return internal.pathTo(closestNode);
	
	};
	
	
	
	cells.willCollideAt = function (entity, offset) {
	
		if (!entity.collisionBox) return false;
	
		internal.offset.x = Math.round(internal.centre + offset.x * internal.CELLS_PER_METRE);
		internal.offset.y = Math.round(internal.centre + offset.y * internal.CELLS_PER_METRE);
		
		internal.collisionBox.x = Math.ceil(0.5 * entity.collisionBox.x * entity.size.x * internal.CELLS_PER_METRE) - 1;
		internal.collisionBox.y = Math.ceil(0.5 * entity.collisionBox.y * entity.size.y * internal.CELLS_PER_METRE) - 1;
		
		internal.min.x = Math.min(Math.max(internal.offset.x - internal.collisionBox.x, 0), internal.GRID_SIZE - 1);
		internal.max.x = Math.min(Math.max(internal.offset.x + internal.collisionBox.x, 0), internal.GRID_SIZE - 1);
		internal.min.y = Math.min(Math.max(internal.offset.y - internal.collisionBox.y, 0), internal.GRID_SIZE - 1);
		internal.max.y = Math.min(Math.max(internal.offset.y + internal.collisionBox.y, 0), internal.GRID_SIZE - 1);
	
		for (var y = internal.min.y; y <= internal.max.y; ++y) {
			
			for (var x = internal.min.x; x <= internal.max.x; ++x) {
				
				var node = internal.grid[y][x];
				
				if (node.weight === 0 && node.entities.indexOf(entity) === -1) {
					return true;
				}
				
			}
			
		}
	
		return false;
	
	};
	
	
	
	
	internal.nodeAtOffset = function (offset) {
	
		var x = Math.round(internal.centre + offset.x * internal.CELLS_PER_METRE);
		var y = Math.round(internal.centre + offset.y * internal.CELLS_PER_METRE);
	
		if (x < 0 || x >= internal.GRID_SIZE || y < 0 || y >= internal.GRID_SIZE) return null;
	
		return internal.grid[y][x];
	
	};
	
	
	
	/**
	 * Returns true if there are no collisions with entity in a straight line from start to end; other false.
	 *  
	 * @param {game.entity} entity
	 * @param {GridNode} start
	 * @param {GridNode} end
	 * @return {boolean}
	 */
	internal.lineOfSight = function (entity, start, end) {
		
		var offset = Vec3(start.offset);
		var vector = Vec3.subtractVectors(end.offset, offset);
		var previousDistance = 999999;
		var distance;
		
		Vec3.normalise(vector);
		Vec3.multiplyScalar(vector, internal.LINE_OF_SIGHT_DELTAS);
		
		while ((distance = Vec3.distanceTo(offset, end.offset)) < previousDistance) {
			if (cells.willCollideAt(entity, offset)) return false;
			Vec3.add(offset, vector);
			previousDistance = distance;
		}
		
		return true;
		
	};
	
	
	
	internal.sinkDown = function (binaryheap, i) {
		
		// Fetch the element that has to be sunk.
		var element = binaryheap[i];
	
		// When at 0, an element can not sink any further.
		while (i > 0) {
	
			// Compute the parent element's index, and fetch it.
			var parentN = ((i + 1) >> 1) - 1;
			var parent = binaryheap[parentN];
			
			// Swap the elements if the parent is greater.
			if (element.f < parent.f) {
	
				binaryheap[parentN] = element;
				binaryheap[i] = parent;
				
				// Update 'n' to continue at the new position.
				i = parentN;
	
			} else {
				
				// Found a parent that is less, no need to sink any further.
				break;
	
			}
	
		}
	
	};
	
	
	
	internal.pop = function (binaryheap) {
		
		// Store the first element so we can return it later
		var result = binaryheap[0];
		
		// Get the element at the end of the array
		var end = binaryheap.pop();
		
		// If there are any elements left, put the end element at the start, and var it bubble up
		if (binaryheap.length) {
			binaryheap[0] = end;
			internal.bubbleUp(binaryheap, 0);
		}
	
		return result;
	
	};
	
	
	
	internal.bubbleUp = function (binaryheap, i) {
		
		// Look up the target element and its score.
		var length = binaryheap.length;
		var element = binaryheap[i];
		var elemScore = element.f;
	
		while (true) {
			
			// Compute the indices of the child elements.
			var child2N = (i + 1) << 1;
			var child1N = child2N - 1;
			
			// This is used to store the new position of the element, if any.
			var swap = null;
			var child1Score;
			
			// If the first child exists (is inside the array)...
			if (child1N < length) {
				
				// Look it up and compute its score.
				var child1 = binaryheap[child1N];
				child1Score = child1.f;
	
				// If the score is less than our element's, we need to swap.
				if (child1Score < elemScore) {
					swap = child1N;
				}
	
			}
	
			// Do the same checks for the other child.
			if (child2N < length) {
	
				var child2 = binaryheap[child2N];
				var child2Score = child2.f;
	
				if (child2Score < (swap === null ? elemScore : child1Score)) {
					swap = child2N;
				}
	
			}
	
			// If the element needs to be moved, swap it, and continue.
			if (swap !== null) {
	
				binaryheap[i] = binaryheap[swap];
				binaryheap[swap] = element;
				i = swap;
	
			} else {
				
				// Otherwise, we are done.
				break;
	
			}
	
		}
	
	};
	
	
	
	internal.pathTo = function (node, endOffset) {
	
	    var curr = node;
	    var offsets = [];
	
	    while (curr.parent) {
			offsets.push(curr.offset);
			curr.debugPath = true;
	        curr = curr.parent;
	    }
		
		if (endOffset) {
			offsets[0] = endOffset;
		}
		
	    return offsets.reverse();
	
	};
	
	
	
	
	internal.heuristic = function (start, end) {
	
		var dx = start.x - end.x;
		var dy = start.y - end.y;
	
		return Math.sqrt(dx * dx + dy * dy);
	
	};
	
	
	internal.getCost = function (entity, node, neighbour) {
	
		if (cells.willCollideAt(entity, neighbour.offset).length) return 0;
	
		var weight = neighbour.weight;
	
		if (neighbour.entities.length === 1 && neighbour.entities[0] === entity) {
			weight = 1;
		}
		
		return weight * internal.heuristic(node, neighbour);
	
	};

	
	cells.internal = internal;
	
	
} (cells.internal || {}));

export default cells;