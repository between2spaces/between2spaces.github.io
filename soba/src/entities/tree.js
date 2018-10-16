import Entity from '../entity';
import Vec3 from '../vec3';

/**
 * @struct TreeEntity
 * @param {TreeEntity=} treeentity
 * @return {TreeEntity}
 */
export default function TreeEntity (treeentity) {
	
	treeentity = treeentity || {};
	treeentity.model = '/soba/builds/0.1.0/models/tree';
	treeentity.name = treeentity.name ? treeentity.name : 'tree';
	treeentity.offset = treeentity.offset ? Vec3(treeentity.offset) : Vec3();
	treeentity.size = treeentity.size ? Vec3(treeentity.size) : Vec3({ x: 3, y: 6 });
	treeentity.anchor = Vec3({ x: 0.54, y: 0.87 });
	treeentity.collisionBox = Vec3({ x: 0.3, y: 0.12 });
	
	return Entity(treeentity);

};