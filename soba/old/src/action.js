import game from './game';
import Vec3 from './vec3';
import Entity from './entity';
import cells from './cells';


var Action = Action || function () {};


(function (internal) {
				
	/**
	 * @struct Action
	 * @param {Action=} action
	 * @return {Action}
	 */
	Action = function (action) {
		
		var instance = {
			type: /** {string} */(!action || !action.type) ? 'default' : action.type
		};
		
		return instance;
		
	};
	
	
	Action.update = function (action) {
		
		return Action[action.type].update(action);
		
	};
	
	
	/**
	 * Action.Destination
	 * 
	 * @param {Action.Destination} destination
	 * @return {Action.Destination}
	 */
	Action.Destination = function (destination) {
		
		var instance = Action({ type: 'Destination' });
		
		instance.entity = (!destination || !destination.entity) ? null : destination.entity;
		instance.next_offset = (!destination || !destination.next_offset) ? null : Vec3(destination.next_offset);
		instance.final_offset = (!destination || !destination.final_offset) ? Vec3() : Vec3(destination.final_offset);
		instance.last_update = (!destination || !destination.last_update) ? game.timestamp : destination.last_update;
		
		return instance;
		
	};
	
	
	Action.Destination.update = function (destination) {
		
		var entity = destination.entity;
		
		// Nothing more to calculate if entity movement speed is zero
		if (entity.movement_speed === 0) return true;
		
		// How far should the entity have travelled since the last update given their current movement speed
		var travelled = (game.timestamp - destination.last_update) * (entity.movement_speed / 1000);
		
		destination.last_update = game.timestamp;
		
		// Nothing more to calculate if not travelled any distance; covers case when time since last update is zero or negative
		if (travelled <= 0) return false;
		
		// If we dont' have a next offset, calculate a path to the final offset
		if (!destination.next_offset) {
			
			var offsets = cells.search(entity, destination.final_offset);
			 
			// First offset on path will be our next offset
			destination.next_offset = offsets[0];
			
			// Last offset on path will be our final offset (can be different to original desired final if not reachable)
			destination.final_offset = offsets.pop();
			
		}
		
		// Get a vector from current offset to next offset
		var vector = Vec3.subtractVectors(destination.next_offset, entity.offset);
		var distanceSq = Vec3.lenSq(vector);
		
		// Set the length of the vector to the length travelled at the current speed
		Vec3.normalise(vector);
		Vec3.multiplyScalar(vector, travelled);
		
		if (Vec3.lenSq(vector) >= distanceSq) {
			
			// Travelling along the vector to the next offset at the current speed would takes us past the offset
			
			if (Vec3.equals(destination.next_offset, destination.final_offset)) {
				
				// If next offset is the final offset, then set the entities offset to final offset and we are done
				Entity.setOffset(entity, destination.final_offset);
				return true;
				
			}
			
			// Else re-calculate path
			var offsets = cells.search(entity, destination.final_offset);
			 
			// First offset on path will be our next offset
			destination.next_offset = offsets[0];
			
			// Last offset on path will be our final offset (can be different to original desired final if not reachable)
			destination.final_offset = offsets.pop();
			
			// Get new vector from current offset to next offset
			vector = Vec3.subtractVectors(destination.next_offset, entity.offset);
			
			// Set the length of the vector to the length travelled at the current speed
			Vec3.normalise(vector);
			Vec3.multiplyScalar(vector, travelled);
			
		}
		
		// Calculate what the new offset will be
		Vec3.add(vector, entity.offset);
		
		// Update entity offset to new offset
		Entity.setOffset(entity, vector);
		
		// We still have more moving to do
		return false;
	
	};

	
	Action.internal = internal;
	
	
} (Action.internal || {}));


export default Action;