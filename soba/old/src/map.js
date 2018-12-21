import Vec3 from './vec3';
import TreeEntity from './entities/tree';
import RockEntity from './entities/rock';
import GrassEntity from './entities/grass';
import BaseEntity from './entities/base';
import StatueEntity from './entities/statue';

var map = map || {};

map.base = map.base || BaseEntity({ offset: Vec3({ x: 0, y: 0, z: -1 }) });

// left clump
map.tree001 = map.tree001 || TreeEntity({ name: 'tree001', offset: Vec3({ x: -9, y: 1 }), size: Vec3({ x: 4, y: 6 }) });
map.tree002 = map.tree002 || TreeEntity({ name: 'tree002', offset: Vec3({ x: -6, y: -1 }), size: Vec3({ x: 4, y: 5 }) });
map.tree003 = map.tree003 || TreeEntity({ name: 'tree003', offset: Vec3({ x: -9, y: 5 }), size: Vec3({ x: 4, y: 5 }) });
map.tree004 = map.tree004 || TreeEntity({ name: 'tree004', offset: Vec3({ x: -5, y: 3 }), size: Vec3({ x: 6, y: 5 }) });

map.rock001 = map.rock001 || RockEntity({ name: 'rock001', offset: Vec3({ x: -4, y: -2 }), size: Vec3({ x: 3, y: 3 }) });
map.rock002 = map.rock002 || RockEntity({ name: 'rock002', offset: Vec3({ x: -7.2, y: 2.5 }), size: Vec3({ x: 3.5, y: 7.5 }) });
map.rock003 = map.rock003 || RockEntity({ name: 'rock003', offset: Vec3({ x: -6.5, y: 0.2 }), size: Vec3({ x: 2, y: 3.8 }) });
map.rock004 = map.rock004 || RockEntity({ name: 'rock004', offset: Vec3({ x: -8.8, y: -1 }), size: Vec3({ x: 3, y: 3 }) });

map.statue001 = map.statue001 || StatueEntity({ name: 'statue001', offset: Vec3({ x: 4, y: -2 }) });

export default map;
