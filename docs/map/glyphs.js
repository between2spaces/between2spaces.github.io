
const Glyphs = {
    '?': {
        type: 'undefined',
        char: '?'
    },
    /////////// tile borders //////////////////////////////////////////////////
    'wall': {
        chars: [
            { char: '═', size: 0.5, x: -0.21, y: 0.45 },
            { char: '═', size: 0.5, x: 0.5, y: 0.45 },
            { char: '═', size: 0.5, x: 1.21, y: 0.45 },
        ]
    },
    'door': {
        chars: [
            { char: '═', size: 0.5, x: -0.21, y: 0.5 },
            { char: '⌔', size: 0.7, x: 0.25, y: 0.05, rotation: 45 },
            { char: '═', size: 0.5, x: 1.21, y: 0.5 },
        ]
    },
    'fence': {
        chars: [
            { char: 'ᚔ', size: 1.2, x: -0.1, y: -0.15 },
        ]
    },
    /////////// tile types //////////////////////////////////////////////////
    'floorboards': {
        overflow: 'hidden',
        chars: [
            { char: '⛆', x: 0, y: 0.3, rotation: 45 },
            { char: '⛆', x: -0.6, y: -0.29, rotation: 45 },
            { char: '⛆', x: 0.6, y: -0.29, rotation: 45 },
            { char: '⛆', x: -0.05, y: -1.1, rotation: 45 },
        ]
    },
    'tiled': {
        chars: [
            { char: '⛆', size: 0.55, x: -0.05, y: -0.15 },
            { char: '⛆', size: 0.55, x: 0.95, y: -0.05, rotation: 90 },
            { char: '⛆', size: 0.55, x: -0.05, y: 0.9, rotation: 90 },
            { char: '⛆', size: 0.55, x: 0.85, y: 0.85 },
        ]
    },
    'grass': {
        color: '#aaa',
        chars: [
            { char: '`', rotation: -30, x: 0.5, y: 0.2, size: 0.5 },
            { char: '"', rotation: 20, x: -0.2, y: 0.2, size: 0.5 },
            { char: "'", rotation: 50, x: -0.1, y: 0.6, size: 0.5 },
            { char: '`', rotation: 30, x: 0.8, y: 0.9, size: 0.5 },
            { char: '"', rotation: -50, x: -0.15, y: 1.1, size: 0.5 },
            { char: "'", rotation: -30, x: 0.5, y: 1.2, size: 0.5 },
            { char: '"', rotation: 200, x: 1.2, y: -0.1, size: 0.5 },
            { char: "'", rotation: 140, x: 1.3, y: 1.2, size: 0.5 },
        ]
    },
    //////////////////////////////////////////////////////////////////////////
    'campfire': {
        char: '♨'
    },
};

export default Glyphs;
