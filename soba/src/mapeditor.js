import game from './game';
import Vec3 from './vec3';
import cells from './cells';
import message from './message';
import map from './map';



var __mapeditor__ = __mapeditor__ || {};

__mapeditor__.DEBUG_COLLISIONBOX = true;
__mapeditor__.mouseLastDown = __mapeditor__.mouseLastDown || game.BEFORE_STARTTIME;



game.update = function () {
	
	cells.debugView();

	var leftButton = game.input(game.MOUSE_LBUTTON);
	var rightButton = game.input(game.MOUSE_RBUTTON);

	if (leftButton.isDown || rightButton.isDown || leftButton.lastDown > __mapeditor__.mouseLastDown || rightButton.lastDown > __mapeditor__.mouseLastDown) {

		__mapeditor__.mouseLastDown = game.timestamp;
			
		var mouseOffset = Vec3(game.input(game.MOUSE_OFFSET));

	}

};