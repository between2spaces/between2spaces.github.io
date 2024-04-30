
const EntityTypeTemplate = {
	'═': {
		type: 'wall',
        contents: [
            { char: '═', x: -0.5, y: 0 },
            { char: '═', x: 0, y: 0 },
            { char: '═', x: 0.5, y: 0 }
        ],
	},
    '🚪': {
        type: 'door',
        contents: [
            { char: '╔', x: -0.5, y: 0 },
            { char: '╗', x: 0.5, y: 0 }
        ],
    },
	'⛆': {
		type: 'grass',
        char: '⛆',
	},
	'♨': {
		type: 'campfire',
        char: '♨',
	},
	'ᚔ': {
		type: 'fence',
        char: 'ᚔ',
	},
};

export default EntityTypeTemplate;
