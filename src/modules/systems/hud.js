import ecs from '../ecs'
import components from '../components'

var health = 100, shells = 0;
var num2str = function(number) {
	return number.toString().replace(/1/g, "I").replace(/0/g, "O");
};

// https://github.com/Modernizr/Modernizr/blob/master/feature-detects/touchevents.js
if (('ontouchstart' in window) || (window.DocumentTouch && document instanceof window.DocumentTouch)) {
	document.getElementById('instructions').innerHTML = 'Touch on left side to move, right side to turn. Touch on the right side with a second finger to shoot.'
	document.getElementById('mouse-hint').innerHTML = ''
}

export default { update: function(dt) {
	ecs.for_each([components.Hero], function(player) {
		var hero = player.get(components.Hero);

		if (health !== Math.round(hero.health)) document.getElementById("health").innerHTML = num2str(health = Math.round(hero.health));
		if (shells !== Math.round(hero.shells)) document.getElementById("shells").innerHTML = num2str(shells = Math.round(hero.shells));

		return true;
	});
}};
