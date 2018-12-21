import Entity from '../entity';
import Vec3 from '../vec3';

/**
 * @struct GrassEntity
 * @param {GrassEntity=} grassentity
 * @return {GrassEntity}
 */
export default function GrassEntity (grassentity) {
	
	grassentity = grassentity || {};
	grassentity.model = '/soba/builds/0.1.0/models/grass';
	grassentity.name = grassentity.name ? grassentity.name : 'grass';
	grassentity.offset = grassentity.offset ? Vec3(grassentity.offset) : Vec3();
	grassentity.size = grassentity.size ? Vec3(grassentity.size) : Vec3({ x: 2, y: 1 });
	grassentity.anchor = Vec3({ x: 0.5, y: 0.7 });
	
	return Entity(grassentity);

};