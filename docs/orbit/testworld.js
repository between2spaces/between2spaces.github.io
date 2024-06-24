const TestWorld = {
    initialise: (map) => {

        map.tile(0, 0);
        //map.tile(1, 0);

        // map.add({ type: 'fence', x: 0, y: 0 }).assignBorder('east');
        // map.add({ type: 'wall', x: 0, y: 0 }).assignBorder('north');
        // map.add({ type: 'wall', x: 0, y: 0 }).assignBorder('west');

        // map.add({ type: 'fence', x: 0, y: 1 }).assignBorder('west');
        // map.tiles['0x1'].setType('grass');

        // //map.add({ type: 'fence', x: 1, y: 1 }).assignBorder('east');
        // for (let y = -5; y < 5; y++) {
        //     for (let x = -5; x < 5; x++) {
        //         map.tile(x, y);
        //     }
        // }

        // map.add({ type: 'person', x: 2, y: 3 })

    }
}

export default TestWorld;
