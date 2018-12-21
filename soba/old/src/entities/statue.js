import Entity from '../entity';
import Vec3 from '../vec3';

/**
 * @struct StatueEntity
 * @param {StatueEntity=} statueentity
 * @return {StatueEntity}
 */
export default function StatueEntity (statueentity) {
	
	statueentity = statueentity || {};
	statueentity.model = '/soba/builds/0.5.0/models/statue';
	statueentity.name = statueentity.name ? statueentity.name : 'statue';
	statueentity.offset = statueentity.offset ? Vec3(statueentity.offset) : Vec3();
	statueentity.size = statueentity.size ? Vec3(statueentity.size) : Vec3({ x: 4, y: 5 });
	statueentity.anchor = Vec3({ x: 0.17, y: 0.85 });
	statueentity.collisionBox = Vec3({ x: 0.38, y: 0.25 });
	
	return Entity(statueentity);

};