import Entity from '../entity';
import Vec3 from '../vec3';

/**
 * @struct RockEntity
 * @param {RockEntity=} rockentity
 * @return {RockEntity}
 */
export default function RockEntity (rockentity) {
	
	rockentity = rockentity || {};
	rockentity.model = '/soba/builds/0.2.0/models/rock';
	rockentity.name = rockentity.name ? rockentity.name : 'rock';
	rockentity.offset = rockentity.offset ? Vec3(rockentity.offset) : Vec3();
	rockentity.size = rockentity.size ? Vec3(rockentity.size) : Vec3({ x: 2, y: 2 });
	rockentity.anchor = Vec3({ x: 0.38, y: 0.6 });
	rockentity.collisionBox = Vec3({ x: 0.7, y: 0.4 });
	
	return Entity(rockentity);

};