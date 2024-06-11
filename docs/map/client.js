import Game from './game.js';
import TestWorld from './testworld.js';

export default function main(container) {
	game = new Game(container);
	TestWorld.initialise(game.map);
	game.run();
}
