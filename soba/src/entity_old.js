import game from './game';
import Vec3 from './vec3';
import Action from './action';
import cells from './cells';
import message from './message';


var Entity = Entity || function () {};

(function (internal) {
		
	internal.byId = internal.byId || {};
	internal.DEBUG_ANCHOR = true;
	internal.DEBUG_COLLISIONBOX = false;
	internal.COLLISIONSPACE_UPDATES_MS = 333;
	
	/**
	 * @struct Entity
	 * @param {Entity=} entity
	 * @return {Entity}
	 */
	Entity = function (entity) {
	
		var instance = {
			
			id: /** {number} */(!entity || !entity.id) ?  /*b*/ 0 << 16 | /*g*/ 0 << 8 | /*r*/ 0 : entity.id,
	
			name: /** {string} */(!entity || !entity.name) ? '' : entity.name,
	
			offset: /** {Vec3} */(!entity || !entity.offset) ? Vec3() : Vec3(entity.offset),
			size: /** {Vec3} */(!entity || !entity.size) ? Vec3({x: 0.5, y: 0.5}) : Vec3(entity.size),
			
			// anchor is percentages of size. i.e. 0.5, 0.5 is centre
			anchor: /** {Vec3} */(!entity || !entity.anchor) ? Vec3({x: 0.5, y: 0.5}) : Vec3(entity.anchor),
			
			// collisionBox is percentages of size. i.e. 0.5, 0.5 is half width, half height
			collisionBox: /** {Vec3} */(!entity || !entity.collisionBox) ? null : Vec3(entity.collisionBox),
			nextCollisionSpaceUpdate: /** {number} */0,
			lastCollisionSpaceOffset: /** {number} */Vec3(),
			
			rotation: /** {number} */(!entity || !entity.rotation) ? 0 : entity.rotation,
			
			movement_speed: /** {number} */(!entity || !entity.movement_speed) ? 0 : entity.movement_speed,
	
			parent: /** {Entity} */null,
			children: /** {Entity[]} */[],
			
			actions: /** {Action[]} */[],
	
			model: /** {Model} */(!entity || !entity.model) ? '/soba/builds/0.1.0/models/blank' : entity.model,
			
			spriteContainer: /** {PIXI.Container} */new PIXI.Container(),
			spriteModel: /** {PIXI.Sprite} */null
			
		};
		
		instance.spriteContainer.name = instance.name;
		instance.spriteContainer.zOrder = instance.offset.y + instance.offset.z * 1000;
		
		instance.spriteModel = PIXI.Sprite.fromImage(instance.model + '/sprite.png');
		instance.spriteModel.anchor.x = 0.5;
		instance.spriteModel.anchor.y = 0.5;
		instance.spriteModel.alpha = 0.9;
		instance.spriteContainer.addChild(instance.spriteModel);
		
		
		if (internal.DEBUG_ANCHOR) {
			
			var anchorGraphic = new PIXI.Graphics();
			anchorGraphic.beginFill(0x000000);
			anchorGraphic.drawRect(0, 0, 0.15 * game.PIXELS_PER_METRE, 0.15 * game.PIXELS_PER_METRE);
			
			var anchorSprite = new PIXI.Sprite(anchorGraphic.generateTexture());
			anchorSprite.anchor.x = 0.5;
			anchorSprite.anchor.y = 0.5;
			anchorSprite.alpha = 0.5;
			instance.spriteContainer.addChild(anchorSprite);
			
		}
		
		if (internal.DEBUG_COLLISIONBOX && instance.collisionBox) {
			
			var collisionGraphic = new PIXI.Graphics();
			collisionGraphic.beginFill(0x000000);
			collisionGraphic.drawRect(0, 0, instance.collisionBox.x * instance.size.x * game.PIXELS_PER_METRE, instance.collisionBox.y * instance.size.y * game.PIXELS_PER_METRE);
			
			var collisionSprite = new PIXI.Sprite(collisionGraphic.generateTexture());
			collisionSprite.anchor.x = 0.5;
			collisionSprite.anchor.y = 0.5;
			collisionSprite.alpha = 0.1;
			instance.spriteContainer.addChild(collisionSprite);
			
		}
		
		
		// Find an unused ID
		while (!instance.id || internal.byId.hasOwnProperty(instance.id)) {
	
			instance.id = /** {number} */ /*b*/ ~~(200 + Math.random() * 32) << 16 | /*g*/ ~~(200 + Math.random() * 32) << 8 | /*r*/ ~~(200 + Math.random() * 32);
	
		}
	
		internal.byId[instance.id] = instance;
		
		
		// Append new Entity to the parent of the entity we are copying from
		if (entity && entity.parent) {
			Entity.addChild(entity.parent, instance);
		} else if (game.world) {
			Entity.addChild(game.world, instance);
		}
		
		Entity.setOffset(instance, instance.offset);
		
		// Deep copy all children of the entity we are copying from
		if (entity && entity.children && entity.children.length) {
			for (var child_index = 0; child_index < entity.children.length; ++child_index) {
				Entity(entity.children[child_index]);
			}
		}
		
		Entity.update(instance);
		
		game.update(instance.id, function () {
			
			Entity.update(instance);
			
			this.timestamp = game.timestamp + 30;
			
		});
		
		return instance;
	
	};
	
	
	Entity.byId = internal.byId;
	
	
	
	Entity.addChild = function (parent, child) {
		
		// Do nothing if child's parent is parent
		if (child.parent === parent) return;
		
		// Remove entity from its current parent
		if (child.parent) {
			Entity.removeChild(child.parent, child);
		}
			
		parent.children.push(child);
		parent.spriteContainer.addChild(child.spriteContainer);
		child.parent = parent;
		
		Entity.sortChild(child);
		
	};
	
	
	
	
	Entity.removeChild = function (child) {
		
		var child_index = child.parent.children.indexOf(child);
		
		if (child_index > -1) {
			child.parent.children.splice(child_index, 1);
		}
		
		parent.spriteContainer.removeChild(child.spriteContainer);
		
		child.parent = null;
		
	};
	
	
	
	
	Entity.sortChild = function (child) {
		
		if (!child.parent) return;
		
		var zOrder = child.spriteContainer.zOrder;
		var parentContainerChildren = child.parent.spriteContainer.children;
		var position = parentContainerChildren.indexOf(child.spriteContainer);
		
		var lowerSibling = position > 0 ? parentContainerChildren[position - 1] : null;
		var higherSibling = position < parentContainerChildren.length ? parentContainerChildren[position + 1] : null;
		
		if (lowerSibling && lowerSibling.zOrder > zOrder) {
			
			parentContainerChildren.splice(position, 1);
			
			while (position > 0 && lowerSibling.zOrder > zOrder) {
				lowerSibling = parentContainerChildren[--position - 1];
			}
			
			parentContainerChildren.splice(position, 0, child.spriteContainer);
			
		} else if (higherSibling && higherSibling.zOrder < zOrder) {
			
			parentContainerChildren.splice(position, 1);
			
			while (position < parentContainerChildren.length && higherSibling.zOrder < zOrder) {
				higherSibling = parentContainerChildren[++position];
			}
			
			parentContainerChildren.splice(position, 0, child.spriteContainer);
			
		} 
		
	};
	
	
	
	Entity.update = function (entity) {
		
		var action_index = entity.actions.length - 1;
		
		while (action_index > -1) {
	
			var action = entity.actions[action_index];
	
			if (Action.update(action)) {
	
				entity.actions.splice(action_index, 1);
	
			}
			
			--action_index;
	
		}
		
		//entity.spriteContainer.rotation = entity.rotation;
		
		if (entity !== game.world) {
			
			var horizonScale = 1 + (game.world ? entity.offset.y - game.world.offset.y : -entity.offset.y) * game.VERTICAL_PARRALAX;
			
			entity.spriteModel.width = (entity.size.x * horizonScale * game.PIXELS_PER_METRE);
			entity.spriteModel.height = (entity.size.y * horizonScale * game.PIXELS_PER_METRE);
			
			entity.spriteModel.position.x = -((entity.anchor.x - 0.5) * entity.spriteModel.width);
			entity.spriteModel.position.y = -((entity.anchor.y - 0.5) * entity.spriteModel.height);
			
			
			if (entity.nextCollisionSpaceUpdate === 0 || (entity.movement_speed > 0 && entity.nextCollisionSpaceUpdate <= game.timestamp)) {
				
				entity.nextCollisionSpaceUpdate = game.timestamp + internal.COLLISIONSPACE_UPDATES_MS;
				
				if (entity.lastCollisionSpaceOffset.x !== entity.offset.x || entity.lastCollisionSpaceOffset.y !== entity.offset.y) {
				
					entity.lastCollisionSpaceOffset = Vec3(entity.offset);
					
					var collisions = cells.updateCollisionSpace(entity);
					
					if (collisions.length) {
						
						var names = '';
						
						for (var collision in collisions) {
							collision = collisions[collision];
							names += names.length ? (', ' + collision.name) : collision.name; 
						}
						
						message(entity.name + ' collides with ' + names);
						
					}
					
				}
				
			}
			
		}
		
	};
	
	
	
	Entity.move = function (entity, offset) {
		
		// Reuse an existing 'Destination' Action if available
		for (var action in entity.actions) {
	
			action = entity.actions[action];
	
			if (action.type === 'Destination') {
				
				action.next_offset = null;
				action.final_offset.x = offset.x;
				action.final_offset.y = offset.y;
				return;
	
			}
	
		}
		
		entity.actions.push(Action.Destination({ entity: entity, final_offset: offset }));
		
	};
	
	
	
	
	Entity.setOffset = function (entity, offset) {
		
		entity.offset.x = offset.x;
		entity.offset.y = offset.y;
		
		entity.spriteContainer.position.x = entity.offset.x * game.PIXELS_PER_METRE;
		entity.spriteContainer.position.y = entity.offset.y * game.PIXELS_PER_METRE;
		
		if (entity !== game.world) {
			
			entity.spriteContainer.zOrder = entity.offset.y + entity.offset.z * 1000;
			Entity.sortChild(entity);
			
		} else {
			
			game.world.spriteContainer.position.x = -game.world.spriteContainer.position.x;
			game.world.spriteContainer.position.y = -game.world.spriteContainer.position.y;
		
		}
		
		if (entity.name === 'hero') {
			Entity.setOffset(game.world, entity.offset);
		}
		
	};
	
	
	Entity.internal = internal;
	
	
} (Entity.internal || {}));


export default Entity;