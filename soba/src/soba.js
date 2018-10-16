import game from './game'
import Entity from './entity'
import Vec3 from './vec3'
import cells from './cells'
import message from './message'
import HeroEntity from './entities/hero'
import map from './map'

var soba = soba || {};

(function (internal) {
	
	
	if (!internal.mouseLastDown) {
		
		message('build 0.5.0');
				
	}
		
	internal.mouseLastDown = internal.mouseLastDown || game.BEFORE_STARTTIME;
	internal.HERO_MOVE_DEADZONE = 0.15;
	internal.HERO_MOVE_TIMEGAP = 250;
	
	map.hero = map.hero || HeroEntity({ offset: Vec3({ x: 0, y: 0 }) });
	
	game.update('main', function () {
		
		cells.debugView();
		
		var leftButton = game.input(game.MOUSE_LBUTTON);
		var rightButton = game.input(game.MOUSE_RBUTTON);
	
		if (leftButton.lastDown > leftButton.lastUp || rightButton.lastDown > rightButton.lastUp || leftButton.lastDown > internal.mouseLastDown || rightButton.lastDown > internal.mouseLastDown) {
	
			if (game.timestamp - internal.mouseLastDown > internal.HERO_MOVE_TIMEGAP) {
				
				internal.mouseLastDown = game.timestamp;
				
				var mouseOffset = Vec3(game.input(game.MOUSE_OFFSET));
				
				if (Vec3.distanceToSq(map.hero.offset, mouseOffset) > internal.HERO_MOVE_DEADZONE) {
		
					Entity.move(map.hero, mouseOffset);
					
				}
				
			}
	
		}
		
		this.timestamp = game.timestamp + 1;
	
	});

	
	soba.internal = internal;
	
	
} (soba.internal || {}));