
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
        color: '#ccc',
        chars: [
            { char: '"', rotation: 68, x: -0.2, y: -0.2, size: 0.4 },
            { char: '`', rotation: -100, x: 0.3, y: -0.2, size: 0.4 },
            { char: '`', rotation: -129, x: 0.8, y: -0.2, size: 0.4 },
            { char: "'", rotation: -135, x: 1.3, y: -0.2, size: 0.4 },
            { char: '"', rotation: 11, x: 1.8, y: -0.2, size: 0.4 },
            { char: '"', rotation: 102, x: -0.2, y: 0.3, size: 0.4 },
            { char: '`', rotation: -174, x: 0.3, y: 0.3, size: 0.4 },
            { char: '"', rotation: -33, x: 0.8, y: 0.3, size: 0.4 },
            { char: '"', rotation: 65, x: 1.3, y: 0.3, size: 0.4 },
            { char: '"', rotation: 29, x: 1.8, y: 0.3, size: 0.4 },
            { char: '"', rotation: 3, x: -0.2, y: 0.8, size: 0.4 },
            { char: '"', rotation: 77, x: 0.3, y: 0.8, size: 0.4 },
            { char: "'", rotation: -167, x: 0.8, y: 0.8, size: 0.4 },
            { char: "'", rotation: 8, x: 1.3, y: 0.8, size: 0.4 },
            { char: "'", rotation: 120, x: 1.8, y: 0.8, size: 0.4 },
            { char: '`', rotation: -120, x: -0.2, y: 1.3, size: 0.4 },
            { char: '"', rotation: -10, x: 0.3, y: 1.3, size: 0.4 },
            { char: "'", rotation: 93, x: 0.8, y: 1.3, size: 0.4 },
            { char: '"', rotation: 25, x: 1.3, y: 1.3, size: 0.4 },
            { char: '"', rotation: 6, x: 1.8, y: 1.3, size: 0.4 },
            { char: '"', rotation: 130, x: -0.2, y: 1.8, size: 0.4 },
            { char: '"', rotation: -17, x: 0.3, y: 1.8, size: 0.4 },
            { char: "'", rotation: -43, x: 0.8, y: 1.8, size: 0.4 },
            { char: "'", rotation: -157, x: 1.3, y: 1.8, size: 0.4 },
            { char: "'", rotation: -138, x: 1.8, y: 1.8, size: 0.4 }
        ]
    },
    'dirt': {
        color: '#eee',
        zIndex: -2,
        chars: [
            { char: ':', rotation: 68, x: -0.2, y: -0.2, size: 0.4 },
            { char: '.', rotation: -100, x: 0.3, y: -0.2, size: 0.4 },
            { char: ':', rotation: -129, x: 0.8, y: -0.2, size: 0.4 },
            { char: ':', rotation: 11, x: 1.8, y: -0.2, size: 0.4 },
            { char: '.', rotation: 102, x: -0.2, y: 0.3, size: 0.4 },
            { char: ':', rotation: -174, x: 0.3, y: 0.3, size: 0.4 },
            { char: '.', rotation: -33, x: 0.8, y: 0.3, size: 0.4 },
            { char: ':', rotation: 65, x: 1.3, y: 0.3, size: 0.4 },
            { char: '.', rotation: 29, x: 1.8, y: 0.3, size: 0.4 },
            { char: ':', rotation: 3, x: -0.2, y: 0.8, size: 0.4 },
            { char: '.', rotation: 77, x: 0.3, y: 0.8, size: 0.4 },
            { char: ":", rotation: -167, x: 0.8, y: 0.8, size: 0.4 },
            { char: ".", rotation: 8, x: 1.3, y: 0.8, size: 0.4 },
            { char: ":", rotation: 120, x: 1.8, y: 0.8, size: 0.4 },
            { char: ':', rotation: -10, x: 0.3, y: 1.3, size: 0.4 },
            { char: ".", rotation: 93, x: 0.8, y: 1.3, size: 0.4 },
            { char: ':', rotation: 25, x: 1.3, y: 1.3, size: 0.4 },
            { char: '.', rotation: 6, x: 1.8, y: 1.3, size: 0.4 },
            { char: ':', rotation: 130, x: -0.2, y: 1.8, size: 0.4 },
            { char: ":", rotation: -43, x: 0.8, y: 1.8, size: 0.4 },
            { char: ".", rotation: -157, x: 1.3, y: 1.8, size: 0.4 },
            { char: ":", rotation: -138, x: 1.8, y: 1.8, size: 0.4 }
        ]
    },
    //////////////////////////////////////////////////////////////////////////
    'campfire': {
        char: '♨'
    },
    'person': {
        char: '웃',
        size: 0.5
    }
};

export default Glyphs;
