import ecs from './ecs'
import game from './game'
import components from './components'
import {
	loadJSON,
	loadImage,
	loadAudio
} from './loaders'

import resetHero from './systems/resetHero'
import spawnItems from './systems/spawnItems'
import spawnMonsters from './systems/spawnMonsters'
import addObjects from './systems/addObjects'
import jumpPads from './systems/jumpPads'
import playerControls from './systems/playerControls'
import controlMonsters from './systems/controlMonsters'
import applyPhysics from './systems/applyPhysics'
import renderBodies from './systems/renderBodies'
import footSteps from './systems/footSteps'
import glowingPlates from './systems/glowingPlates'
import animateObjects from './systems/animateObjects'
import dissolvingEffect from './systems/dissolvingEffect'
import pickItems from './systems/pickItems'
import killHero from './systems/killHero'
import killMonsters from './systems/killMonsters'
import removeObjects from './systems/removeObjects'
import handleShotgun from './systems/handleShotgun'
import plasmaBalls from './systems/plasmaBalls'
import hud from './systems/hud'

import $ from 'jquery'
import THREE from './polyfilledThree/index'

import {
	SkyBox,
	AnimatedMD2Model,
	StaticMD2Model,
	DissolvingEffect,
	createMeshForPlate,
	createPlasmaBall
} from './misc3d'

const IS_MOBILE = ('ontouchstart' in window) || (window.DocumentTouch && document instanceof window.DocumentTouch)

Promise.all([
	 loadImage("assets/skybox/Side1.jpg")
	,loadImage("assets/skybox/Side2.jpg")
	,loadImage("assets/skybox/Side3.jpg")
	,loadImage("assets/skybox/Side4.jpg")
	,loadImage("assets/skybox/Side5.jpg")
	,loadImage("assets/skybox/Side6.jpg")
	,loadJSON("assets/arena/arena.json")
	,loadImage("assets/arena/arena.jpg")
	,loadJSON("assets/shotgun/hud/Dreadus-Shotgun.json")
	,loadImage("assets/shotgun/hud/Dreadus-Shotgun.jpg")
	,loadAudio("assets/sounds/step1.mp3")
	,loadAudio("assets/sounds/step2.mp3")
	,loadAudio("assets/sounds/step3.mp3")
	,loadJSON("assets/shells/shells.json")
	,loadImage("assets/shells/shells.jpg")
	,loadJSON("assets/shotgun/item/W-Shotgun.json")
	,loadImage("assets/shotgun/item/W-Shotgun.jpg")
	,loadImage("assets/misc/itemLight.jpg")
	,loadImage("assets/misc/itemPlate.jpg")
	,loadAudio("assets/sounds/itemAppeared.mp3")
	,loadAudio("assets/sounds/itemPicked.mp3")
	,loadAudio("assets/sounds/shotgunFired.mp3")
	,loadImage("assets/misc/monsterLight.jpg")
	,loadImage("assets/misc/monsterPlate.jpg")
	,loadAudio("assets/sounds/monsterAppeared.mp3")
	,loadJSON("assets/imp/imp.json")
	,loadImage("assets/imp/skin.jpg")
	,loadImage("assets/misc/noise.jpg")
	,loadImage("assets/misc/plasma.jpg")
	,loadAudio("assets/sounds/pain1.mp3")
	,loadAudio("assets/sounds/pain2.mp3")
	,loadAudio("assets/sounds/death1.mp3")
	,loadAudio("assets/sounds/death2.mp3")
]).then(function([
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
]){
	// create and store various stuff on game.assets

	game.scene.add(new SkyBox([
		skyboxSide3, skyboxSide5, skyboxSide6, skyboxSide1, skyboxSide2, skyboxSide4
	], 1400));

	arenaModel = new StaticMD2Model(arenaModel, arenaTexture);
	arenaModel.material.map.anisotropy = game.maxAnisotropy;
	game.scene.add(arenaModel);

	game.assets.arenaModel = arenaModel;

	shotgunModel = new AnimatedMD2Model(shotgunModel, shotgunTexture);
	shotgunModel.rotation.y = -Math.PI / 2;
	game.camera.add(shotgunModel);

	game.assets.itemShellsModel = new StaticMD2Model(itemShellsModel, itemShellsTexture);

	game.assets.itemShotgunModel = new StaticMD2Model(itemShotgunModel, itemShotgunTexture);

	game.assets.steps = [step1, step2, step3];

	game.assets.itemLight = createMeshForPlate(itemLightTexture, { side: THREE.DoubleSide });
	game.assets.itemPlate = createMeshForPlate(itemPlateTexture, { polygonOffset: true, polygonOffsetFactor: -0.1 });

	game.assets.itemAppeared = itemAppeared;
	game.assets.itemPicked = itemPicked;

	game.assets.monsterLight = createMeshForPlate(monsterLightTexture, { side: THREE.DoubleSide });
	game.assets.monsterPlate = createMeshForPlate(monsterPlateTexture, { polygonOffset: true, polygonOffsetFactor: -0.1 });

	game.assets.monsterAppeared = monsterAppeared;

	game.assets.shotgunFired = shotgunFired;

	game.assets.monsterModel = new AnimatedMD2Model(monsterModel, monsterTexture, "stand", 2600);

	DissolvingEffect.prototype.noiseTexture = new THREE.Texture(noiseTexture);
	DissolvingEffect.prototype.noiseTexture.needsUpdate = true;

	game.assets.plasmaBall = createPlasmaBall(plasmaTexture);

	game.assets.pain = [pain1, pain2];
	game.assets.death = [death1, death2];


	// add 3D scene to the webpage

	$("#loadingImageContainer").replaceWith(game.domElement);
	var gameViewportSize = function() { return {
		width: window.innerWidth, height: window.innerHeight
	}};


	// show hud and fade welcome message out

	//$("#hud").show();
	//$("#instructions").delay(6000).fadeOut();


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

	$('#mainMenu-playButton').on('click', () => {
		$('#hud').show()
		$('#canvasPlaceholder').replaceWith(game.domElement)
		game.start(gameLoop, gameViewportSize)
		$('#mainMenu').hide()
	})

	$('#mainMenu-controlsButton').on('click', () => {
    $('#mainMenu').hide()
		$('#controlsMenu').show()
	})

	$('#controlsMenu-backButton').on('click', () => {
		$('#controlsMenu').hide()
		$('#mainMenu').show()
	})

	if (IS_MOBILE) {
		$('#controlsMenu-controls').html(`
			<p>Tap anywhere on the right half to shoot.</p>
      <p>Swipe on the left half to move.</p>
			<p>Swipe on the right half to aim.</p>
		`)
	}


}).catch(function(error) {
	console.log(error);

	alert("Failure: " + (error.statusText || error.message || error));
})
