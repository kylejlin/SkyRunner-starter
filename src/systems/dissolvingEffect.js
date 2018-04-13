import ecs from '../ecs'
import components from '../components'

export default { update: function(dt) {
	ecs.for_each([components.Dissolving], function(entity) {
		if(entity.get(components.Dissolving).effect.update(dt)) {
			entity.remove(components.Dissolving);
		}
	});
}};
