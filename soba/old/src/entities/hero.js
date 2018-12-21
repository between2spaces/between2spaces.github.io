import Entity from '../entity';
import Vec3 from '../vec3';

/**
 * @struct HeroEntity
 * @param {HeroEntity=} heroentity
 * @return {HeroEntity}
 */
export default function HeroEntity (heroentity) {
	
	heroentity = heroentity || {};
	heroentity.model = '/soba/builds/0.1.0/models/troubadour';
	heroentity.name = heroentity.name ? heroentity.name : 'hero';
	heroentity.offset = heroentity.offset ? Vec3(heroentity.offset) : Vec3();
	heroentity.size = heroentity.size ? Vec3(heroentity.size) : Vec3({ x: 1.2, y: 1.8 });
	heroentity.anchor = Vec3({ x: 0.38, y: 0.84 });
	heroentity.collisionBox = Vec3({ x: 0.6, y: 0.2 });
	heroentity.movement_speed = 2;
	
	return Entity(heroentity);

};