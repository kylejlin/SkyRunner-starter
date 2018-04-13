import ecs from '../ecs'
import components from '../components'

export default { update: function(dt) {
	ecs.for_each([components.AnimatedObject], function(entity) {
		entity.get(components.AnimatedObject).object.update();
	});
}};
