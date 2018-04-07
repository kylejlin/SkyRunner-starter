import ecs from './modules/ecs'
import game from './modules/game'
import components from './modules/components'
import resetHero from './modules/systems/resetHero'
import spawnItems from './modules/systems/spawnItems'
import spawnMonsters from './modules/systems/spawnMonsters'
import addObjects from './modules/systems/addObjects'
import jumpPads from './modules/systems/jumpPads'
import playerControls from './modules/systems/playerControls'
import controlMonsters from './modules/systems/controlMonsters'
import applyPhysics from './modules/systems/applyPhysics'
import renderBodies from './modules/systems/renderBodies'
import footSteps from './modules/systems/footSteps'
import glowingPlates from './modules/systems/glowingPlates'
import animateObjects from './modules/systems/animateObjects'
import dissolvingEffect from './modules/systems/dissolvingEffect'
import pickItems from './modules/systems/pickItems'
import killHero from './modules/systems/killHero'
import killMonsters from './modules/systems/killMonsters'
import removeObjects from './modules/systems/removeObjects'
import handleShotgun from './modules/systems/handleShotgun'
import plasmaBalls from './modules/systems/plasmaBalls'
import hud from './modules/systems/hud'

import $ from './shimmedJquery'
import THREE from './polyfilledThree/index'

import {
	SkyBox,
	AnimatedMD2Model,
	StaticMD2Model,
	DissolvingEffect,
	createMeshForPlate,
	createPlasmaBall,
	topSide
} from './misc3d'

// load game assets
// http://css-tricks.com/multiple-simultaneous-ajax-requests-one-callback-jquery/
$.when(
	 $.loadImage("assets/skybox/Side1.jpg")
	,$.loadImage("assets/skybox/Side2.jpg")
	,$.loadImage("assets/skybox/Side3.jpg")
	,$.loadImage("assets/skybox/Side4.jpg")
	,$.loadImage("assets/skybox/Side5.jpg")
	,$.loadImage("assets/skybox/Side6.jpg")
	,$.getJSON("assets/arena/arena.json")
	,$.loadImage("assets/arena/arena.jpg")
	,$.getJSON("assets/shotgun/hud/Dreadus-Shotgun.json")
	,$.loadImage("assets/shotgun/hud/Dreadus-Shotgun.jpg")
	,$.loadAudio("assets/sounds/step1.mp3")
	,$.loadAudio("assets/sounds/step2.mp3")
	,$.loadAudio("assets/sounds/step3.mp3")
	,$.getJSON("assets/shells/shells.json")
	,$.loadImage("assets/shells/shells.jpg")
	,$.getJSON("assets/shotgun/item/W-Shotgun.json")
	,$.loadImage("assets/shotgun/item/W-Shotgun.jpg")
	,$.loadImage("assets/misc/itemLight.jpg")
	,$.loadImage("assets/misc/itemPlate.jpg")
	,$.loadAudio("assets/sounds/itemAppeared.mp3")
	,$.loadAudio("assets/sounds/itemPicked.mp3")
	,$.loadAudio("assets/sounds/shotgunFired.mp3")
	,$.loadImage("assets/misc/monsterLight.jpg")
	,$.loadImage("assets/misc/monsterPlate.jpg")
	,$.loadAudio("assets/sounds/monsterAppeared.mp3")
	,$.getJSON("assets/imp/imp.json")
	,$.loadImage("assets/imp/skin.jpg")
	,$.loadImage("assets/misc/noise.jpg")
	,$.loadImage("assets/misc/plasma.jpg")
	,$.loadAudio("assets/sounds/pain1.mp3")
	,$.loadAudio("assets/sounds/pain2.mp3")
	,$.loadAudio("assets/sounds/death1.mp3")
	,$.loadAudio("assets/sounds/death2.mp3")
).then(function(
	 skyboxSide1
	,skyboxSide2
	,skyboxSide3
	,skyboxSide4
	,skyboxSide5
	,skyboxSide6
	,arenaModel
	,arenaTexture
	,shotgunModel
	,shotgunTexture
	,step1
	,step2
	,step3
	,itemShellsModel
	,itemShellsTexture
	,itemShotgunModel
	,itemShotgunTexture
	,itemLightTexture
	,itemPlateTexture
	,itemAppeared
	,itemPicked
	,shotgunFired
	,monsterLightTexture
	,monsterPlateTexture
	,monsterAppeared
	,monsterModel
	,monsterTexture
	,noiseTexture
	,plasmaTexture
	,pain1
	,pain2
	,death1
	,death2
){
	// create and store various stuff on game.assets

	game.scene.add(new SkyBox([
		skyboxSide3, skyboxSide5, skyboxSide6, skyboxSide1, skyboxSide2, skyboxSide4
	], 1400));

	arenaModel = new StaticMD2Model(arenaModel[0], arenaTexture);
	arenaModel.material.map.anisotropy = game.maxAnisotropy;
	game.scene.add(arenaModel);

	game.assets.arenaModel = arenaModel;

	shotgunModel = new AnimatedMD2Model(shotgunModel[0], shotgunTexture);
	shotgunModel.rotation.y = -Math.PI / 2;
	game.camera.add(shotgunModel);

	game.assets.itemShellsModel = new StaticMD2Model(itemShellsModel[0], itemShellsTexture);

	game.assets.itemShotgunModel = new StaticMD2Model(itemShotgunModel[0], itemShotgunTexture);

	game.assets.steps = [step1, step2, step3];

	game.assets.itemLight = createMeshForPlate(itemLightTexture, { side: THREE.DoubleSide });
	game.assets.itemPlate = createMeshForPlate(itemPlateTexture, { polygonOffset: true, polygonOffsetFactor: -0.1 });

	game.assets.itemAppeared = itemAppeared;
	game.assets.itemPicked = itemPicked;

	game.assets.monsterLight = createMeshForPlate(monsterLightTexture, { side: THREE.DoubleSide });
	game.assets.monsterPlate = createMeshForPlate(monsterPlateTexture, { polygonOffset: true, polygonOffsetFactor: -0.1 });

	game.assets.monsterAppeared = monsterAppeared;

	game.assets.shotgunFired = shotgunFired;

	game.assets.monsterModel = new AnimatedMD2Model(monsterModel[0], monsterTexture, "stand", 2600);

	DissolvingEffect.prototype.noiseTexture = new THREE.Texture(noiseTexture);
	DissolvingEffect.prototype.noiseTexture.needsUpdate = true;

	game.assets.plasmaBall = createPlasmaBall(plasmaTexture);

	game.assets.pain = [pain1, pain2];
	game.assets.death = [death1, death2];


	// add 3D scene to the webpage

	$("#a").replaceWith(game.domElement);
	var gameViewportSize = function() { return {
		width: window.innerWidth, height: window.innerHeight
	}};


	// show hud and fade welcome message out

	$("#c").show();
	$("#f").delay(6000).fadeOut();


	// create entities

	new ecs.Entity()
		.add(new components.Hero())
		.add(new components.Body(game.camera, 3.0))
		.add(new components.AnimatedObject(shotgunModel))
		.add(new components.Motion(0, -321, 0));


	// start the game

	var gameLoop = function(dt) {

		resetHero.update(dt);
		spawnItems.update(dt);
		spawnMonsters.update(dt);
		addObjects.update(dt);
		jumpPads.update(dt);
		playerControls.update(dt);
		controlMonsters.update(dt);
		applyPhysics.update(dt);
		renderBodies.update(dt);
		footSteps.update(dt);
		glowingPlates.update(dt);
		animateObjects.update(dt);
		dissolvingEffect.update(dt);
		pickItems.update(dt);
		killHero.update(dt);
		killMonsters.update(dt);
		removeObjects.update(dt);
		handleShotgun.update(dt);
		plasmaBalls.update(dt);
		hud.update(dt);

	};

	game.start(gameLoop, gameViewportSize);

}).fail(function(err, msg) {
	console.log(err, msg);

	alert("Failure: " + (err.statusText || msg || err));
});
