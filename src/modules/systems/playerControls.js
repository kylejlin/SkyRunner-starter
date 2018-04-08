import ecs from '../ecs'
import components from '../components'

import THREE from '../../polyfilledThree/index'
import $ from '../../shimmedJquery'

const IS_MOBILE = ('ontouchstart' in window) || (window.DocumentTouch && document instanceof window.DocumentTouch)
const TAU = Math.PI * 2
const IS_TAP_TO_SHOOT_ENABLED = true

const keys = { SP: 32, W: 87, A: 65, S: 83, D: 68, UP: 38, LT: 37, DN: 40, RT: 39 };

const keysPressed = {};

(function(watchedKeyCodes) {
	var handler = function(down) {
		return function(e) {
			var index = watchedKeyCodes.indexOf(e.keyCode);
			if (index >= 0) {
				keysPressed[watchedKeyCodes[index]] = down; e.preventDefault();
			}
		};
	}
	$(document).keydown(handler(true));
	$(document).keyup(handler(false));
})([
	keys.SP, keys.W, keys.A, keys.S, keys.D, keys.UP, keys.LT, keys.DN, keys.RT
]);


const forward = new THREE.Vector3();
const sideways = new THREE.Vector3();

const rightTouch = {
	initialX: 0,
	initialY: 0,
	x: 0,
	y: 0,
	identifier: null
}
const leftTouch = {
	initialX: 0,
	initialY: 0,
	x: 0,
	y: 0,
	identifier: null
}
const otherTouch = {
	identifier: null
}

let isShotPending = false

document.addEventListener('touchmove', e => {
	e.preventDefault()
}, { passive: false })

document.addEventListener('touchstart', e => {
	Array.from(e.changedTouches).forEach(touch => {
		if (rightTouch.identifier === null && touch.clientX > (window.innerWidth / 2)) {
			rightTouch.identifier = touch.identifier
			rightTouch.initialX = touch.clientX
			rightTouch.initialY = touch.clientY
			rightTouch.x = touch.clientX
			rightTouch.y = touch.clientY
		} else if (leftTouch.identifier === null && touch.clientX < (window.innerWidth / 2)) {
			leftTouch.identifier = touch.identifier
			leftTouch.initialX = touch.clientX
			leftTouch.initialY = touch.clientY
		} else if (otherTouch.identifier === null){
			otherTouch.identifier = touch.identifier
		}
	})
})
document.addEventListener('touchmove', e => {
	Array.from(e.changedTouches).forEach(touch => {
		switch (touch.identifier) {
			case rightTouch.identifier:
				const dx = touch.clientX - rightTouch.x
				const dy = touch.clientY - rightTouch.y

				mouse.x += dx
				mouse.y += dy

				if (mouse.y < 0) {
					mouse.y = 0
				}
				if (mouse.y > window.innerHeight) {
					mouse.y = window.innerHeight
				}

				rightTouch.x = touch.clientX
				rightTouch.y = touch.clientY
				break
			case leftTouch.identifier:
			  leftTouch.x = touch.clientX
				leftTouch.y = touch.clientY
				break
			default:
			  break
		}
	})
})
document.addEventListener('touchend', e => {
	Array.from(e.changedTouches).forEach(touch => {
		switch (touch.identifier) {
			case rightTouch.identifier:
			  if (
					IS_TAP_TO_SHOOT_ENABLED
					&& rightTouch.initialX === touch.clientX
					&& rightTouch.initialY === touch.clientY
				) {
					isShotPending = true
				}
			  rightTouch.identifier = null
				break
			case leftTouch.identifier:
			  if (
					IS_TAP_TO_SHOOT_ENABLED
					&& leftTouch.initialX === touch.clientX
					&& leftTouch.initialY === touch.clientY
				) {
					isShotPending = true
				}
			  leftTouch.identifier = null
				leftTouch.initialX = 0
				leftTouch.initialY = 0
				leftTouch.x = 0
				leftTouch.y = 0
				break
			case otherTouch.identifier:
			  otherTouch.identifier = null
				break
			default:
			  break
		}
	})
})

const mouse = {
	x: 0,
	y: 0,
	isLocked: false
}

document.body.addEventListener('mousemove', e => {
	if (mouse.isLocked) {
		mouse.x += e.movementX
		mouse.y += e.movementY

		if (mouse.y < 0) {
			mouse.y = 0
		}
		if (mouse.y > window.innerHeight) {
			mouse.y = window.innerHeight
		}
	}
})

document.body.addEventListener('click', () => {
	document.body.requestPointerLock()
})

document.addEventListener('pointerlockchange', () => {
	mouse.isLocked = !!document.pointerLockElement
});

export default { update: function (dt) {
	ecs.for_each([components.Hero, components.Motion], function(player) {
		const motion = player.get(components.Motion);
		if(!motion.airborne) {
			// Look around
			if (mouse.isLocked /* Mouse controls */) {
				const rx = ((mouse.y / window.innerHeight) - 0.5) * -2
	      const ry = (mouse.x / window.innerWidth) * -TAU
				motion.rotation.set(rx, ry)
			} else if (!IS_MOBILE /* Keyboard controls */) {
				const sx = (keysPressed[keys.UP] ? 0.04 : (keysPressed[keys.DN] ? -0.04 : 0));
				const sy = (keysPressed[keys.LT] ? 0.04 : (keysPressed[keys.RT] ? -0.04 : 0));

				if(Math.abs(sx) >= Math.abs(motion.spinning.x)) motion.spinning.x = sx;
				if(Math.abs(sy) >= Math.abs(motion.spinning.y)) motion.spinning.y = sy;
			} else /* Touch controls */ {
				const rx = ((mouse.y / window.innerHeight) - 0.5) * -2
				const ry = (mouse.x / window.innerWidth) * -TAU
				motion.rotation.set(rx, ry)
			}


			const joystickX = leftTouch.x - leftTouch.initialX
			const joystickY = leftTouch.y - leftTouch.initialY
			const joystickUnitVector = (new THREE.Vector2(joystickX, joystickY)).normalize()

			// move around
			// calculate forward direction in the horizontal plane from rotation
			forward.set(Math.sin(motion.rotation.y), 0, Math.cos(motion.rotation.y));
			// calculate sideways direction from forward direction
			sideways.set(forward.z, 0, -forward.x);

			forward.multiplyScalar(
				!IS_MOBILE
				  ? (keysPressed[keys.W] ? -0.1 : (keysPressed[keys.S] ? 0.1 : 0))
					: joystickUnitVector.y * 0.1
			);
			sideways.multiplyScalar(
				!IS_MOBILE
				  ? keysPressed[keys.A] ? -0.1 : (keysPressed[keys.D] ? 0.1 : 0)
					: joystickUnitVector.x * 0.1
			);

			const combined = forward.add(sideways);
			if(Math.abs(combined.x) >= Math.abs(motion.velocity.x)) motion.velocity.x = combined.x;
			if(Math.abs(combined.y) >= Math.abs(motion.velocity.y)) motion.velocity.y = combined.y;
			if(Math.abs(combined.z) >= Math.abs(motion.velocity.z)) motion.velocity.z = combined.z;

		}

		// if player has the shotgun...
		const shotgun = player.get(components.Shotgun);
		if(shotgun) {
			// ...try to use it
			shotgun.pullingTrigger = keysPressed[keys.SP] || otherTouch.identifier !== null
			if (isShotPending) {
				shotgun.isShotPending = true
				isShotPending = false
			}
		}

		return true;
	});
}};
