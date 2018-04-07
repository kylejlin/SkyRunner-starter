import ecs from '../ecs'
import game from '../game'
import components from '../components'

import THREE from '../../polyfilledThree/index'

var lastPosition = new THREE.Vector3();

export default { update: function(dt) {
	ecs.for_each([components.Hero, components.Motion], function(player) {
		var motion = player.get(components.Motion);
		if(!motion.airborne) {
			if(lastPosition.distanceToSquared(motion.position) > 3) {
				lastPosition.copy(motion.position);
				game.assets.steps[ Math.round(game.assets.steps.length * Math.random()) % game.assets.steps.length ].cloneNode().play();
			}
		}
		return true;
	});
}};
