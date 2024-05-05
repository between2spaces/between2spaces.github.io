const World = {
    initialise: (map) => {
        map.add({ type: 'fence', x: 0, y: 0 }).assignBorder('east');
        map.add({ type: 'wall', x: 0, y: 0 }).assignBorder('north');
        map.add({ type: 'wall', x: 0, y: 0 }).assignBorder('west');

        map.add({ type: 'fence', x: 0, y: 1 });
        map.add({ type: 'campfire', x: 0, y: 1 });
        //map.tiles['0x1'].setType('grass');

    }
}

export default World;
