A hobby project of a 40+yo husband and father of two to make a loot grinding roguelite rpg.

TODO
* Use ThreeJS Object3D's onBeforeRender() call in partitions to detect when a partition is in view. Existing WorldObject's in the partition should than be told to create there visible objects and add to scene. WorldObjects being added to a partition check the partitions visibility flag and only create visible components when needed.

