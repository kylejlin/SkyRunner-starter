import ecs from '../ecs'
import components from '../components'

import * as THREE from 'three'

var euler = new THREE.Euler(0, 0, 0, 'YXZ');

export default { update: function(dt) {
	ecs.for_each([components.Body, components.Motion], function(entity) {
		var body = entity.get(components.Body);
		var motion = entity.get(components.Motion);

		euler.x = motion.rotation.x;
		euler.y = motion.rotation.y;
		body.object.quaternion.setFromEuler(euler);

		body.object.position.copy(motion.position);

		body.object.position.y += body.height;
	});
}};
