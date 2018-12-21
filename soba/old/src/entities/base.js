import Entity from '../entity';
import Vec3 from '../vec3';

/**
 * @struct BaseEntity
 * @param {BaseEntity=} baseentity
 * @return {BaseEntity}
 */
export default function BaseEntity (baseentity) {
	
	baseentity = baseentity || {};
	baseentity.model = '/soba/builds/0.2.0/models/base';
	baseentity.name = baseentity.name ? baseentity.name : 'base';
	baseentity.offset = baseentity.offset ? Vec3(baseentity.offset) : Vec3();
	baseentity.size = baseentity.size ? Vec3(baseentity.size) : Vec3({ x: 10, y: 10 });
	baseentity.anchor = Vec3({ x: 0.5, y: 0.5 });
	
	return Entity(baseentity);

};