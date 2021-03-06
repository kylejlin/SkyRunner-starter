/**
 * Sky box
 * http://blog.romanliutikov.com/post/58705840698/skybox-and-environment-map-in-three-js
 */
import * as THREE from 'three'

const MorphAnimMesh = function ( geometry, material ) {

	THREE.Mesh.call( this, geometry, material );

	// API

	this.duration = 1000; // milliseconds
	this.mirroredLoop = false;
	this.time = 0;

	// internals

	this.lastKeyframe = 0;
	this.currentKeyframe = 0;

	this.direction = 1;
	this.directionBackwards = false;

	this.setFrameRange( 0, this.geometry.morphTargets.length - 1 );

};

MorphAnimMesh.prototype = Object.create( THREE.Mesh.prototype );

MorphAnimMesh.prototype.setFrameRange = function ( start, end ) {

	this.startKeyframe = start;
	this.endKeyframe = end;

	this.length = this.endKeyframe - this.startKeyframe + 1;

};

MorphAnimMesh.prototype.setDirectionForward = function () {

	this.direction = 1;
	this.directionBackwards = false;

};

MorphAnimMesh.prototype.setDirectionBackward = function () {

	this.direction = -1;
	this.directionBackwards = true;

};

MorphAnimMesh.prototype.parseAnimations = function () {

	var geometry = this.geometry;

	if ( ! geometry.animations ) geometry.animations = {};

	var firstAnimation, animations = geometry.animations;

	var pattern = /([a-z]+)(\d+)/;

	for ( var i = 0, il = geometry.morphTargets.length; i < il; i ++ ) {

		var morph = geometry.morphTargets[ i ];
		var parts = morph.name.match( pattern );

		if ( parts && parts.length > 1 ) {

			var label = parts[ 1 ];

			if ( ! animations[ label ] ) animations[ label ] = { start: Infinity, end: -Infinity };

			var animation = animations[ label ];

			if ( i < animation.start ) animation.start = i;
			if ( i > animation.end ) animation.end = i;

			if ( ! firstAnimation ) firstAnimation = label;

		}

	}

	geometry.firstAnimation = firstAnimation;

};

MorphAnimMesh.prototype.setAnimationLabel = function ( label, start, end ) {

	if ( ! this.geometry.animations ) this.geometry.animations = {};

	this.geometry.animations[ label ] = { start: start, end: end };

};

MorphAnimMesh.prototype.playAnimation = function ( label, fps ) {

	var animation = this.geometry.animations[ label ];

	if ( animation ) {

		this.setFrameRange( animation.start, animation.end );
		this.duration = 1000 * ( ( animation.end - animation.start ) / fps );
		this.time = 0;

	} else {

		console.warn( "animation[" + label + "] undefined" );

	}

};

MorphAnimMesh.prototype.updateAnimation = function ( delta ) {

	var frameTime = this.duration / this.length;

	this.time += this.direction * delta;

	if ( this.mirroredLoop ) {

		if ( this.time > this.duration || this.time < 0 ) {

			this.direction *= -1;

			if ( this.time > this.duration ) {

				this.time = this.duration;
				this.directionBackwards = true;

			}

			if ( this.time < 0 ) {

				this.time = 0;
				this.directionBackwards = false;

			}

		}

	} else {

		this.time = this.time % this.duration;

		if ( this.time < 0 ) this.time += this.duration;

	}

	var keyframe = this.startKeyframe + THREE.Math.clamp( Math.floor( this.time / frameTime ), 0, this.length - 1 );

	if ( keyframe !== this.currentKeyframe ) {

		this.morphTargetInfluences[ this.lastKeyframe ] = 0;
		this.morphTargetInfluences[ this.currentKeyframe ] = 1;

		this.morphTargetInfluences[ keyframe ] = 0;

		this.lastKeyframe = this.currentKeyframe;
		this.currentKeyframe = keyframe;

	}

	var mix = ( this.time % frameTime ) / frameTime;

	if ( this.directionBackwards ) {

		mix = 1 - mix;

	}

	this.morphTargetInfluences[ this.currentKeyframe ] = mix;
	this.morphTargetInfluences[ this.lastKeyframe ] = 1 - mix;

};

MorphAnimMesh.prototype.clone = function ( object ) {

	if ( object === undefined ) object = new MorphAnimMesh( this.geometry, this.material );

	object.duration = this.duration;
	object.mirroredLoop = this.mirroredLoop;
	object.time = this.time;

	object.lastKeyframe = this.lastKeyframe;
	object.currentKeyframe = this.currentKeyframe;

	object.direction = this.direction;
	object.directionBackwards = this.directionBackwards;

	THREE.Mesh.prototype.clone.call( this, object );

	return object;

};

const SkyBox = function(images, side) {

	var skyboxTexture = new THREE.Texture(images);
	skyboxTexture.flipY = false;
	skyboxTexture.format = THREE.RGBFormat;
	skyboxTexture.needsUpdate = true;

	var skyboxShader = THREE.ShaderLib['cube'];
	skyboxShader.uniforms['tCube'].value = skyboxTexture;

	THREE.Mesh.call(this,
		new THREE.BoxGeometry(side, side, side),
		new THREE.ShaderMaterial({
			fragmentShader: skyboxShader.fragmentShader, vertexShader: skyboxShader.vertexShader,
			uniforms: skyboxShader.uniforms, depthWrite: false, side: THREE.BackSide
		})
	);
};

SkyBox.prototype = Object.create(THREE.Mesh.prototype);


/**
 * Classes to work with MD2 files (pre-converted to JSON)
 * http://oos.moxiecode.com/js_webgl/md2_converter/
 */
const AnimatedMD2Model = function(json, image, defaultAnimation, defaultAnimationTime) {
	if (json.constructor === THREE.Geometry) {
		// avoid needless re-init in clone() call
		MorphAnimMesh.call(this, json, image);

	} else {
		var texture = new THREE.Texture(image);
		texture.needsUpdate = true;

		var material = new THREE.MeshBasicMaterial({ map: texture, morphTargets: true });

		var loader = new THREE.JSONLoader();
		var model = loader.parse(json);
		var geometry = model.geometry;
		geometry.computeFaceNormals();
		geometry.computeVertexNormals();

		geometry.computeMorphNormals();
		MorphAnimMesh.call(this, geometry, material);

		this.parseAnimations();
	}

	this.playingAnimation = null;
	this.defaultAnimation = defaultAnimation ? { animation: defaultAnimation, time: defaultAnimationTime, callback: null } : null;

	this.playOnce(this.defaultAnimation);
};

AnimatedMD2Model.prototype = Object.create(MorphAnimMesh.prototype);

AnimatedMD2Model.prototype.interpolateTargets = function(a, b, t) {
	for(var i = 0, n = this.morphTargetInfluences.length; i < n; i++) {
		this.morphTargetInfluences[i] = 0;
	}
	if(a > -1) this.morphTargetInfluences[a] = 1 - t;
	if(b > -1) this.morphTargetInfluences[b] = t;
};

AnimatedMD2Model.prototype.getVertexCoordinates = (function(){
	var temp = new THREE.Vector3();
	return function(index, vector3) {
		vector3 = vector3 || new THREE.Vector3();
		vector3.set(0, 0, 0);
		var targets = this.geometry.morphTargets;
		for (var i = 0, n = targets.length; i < n; i++) {
			vector3.add(temp.copy(targets[i].vertices[index]).multiplyScalar(this.morphTargetInfluences[i]));
		}
		return vector3;
	};
}) ();

AnimatedMD2Model.prototype.setDefaultAnimation = function(animation, time) {
	if (this.defaultAnimation && (this.defaultAnimation.animation !== animation)) {
		var playingDefaultAnimation = this.playingAnimation && (
			this.playingAnimation.animation === this.defaultAnimation.animation
		);
		this.defaultAnimation.animation = animation;
		this.defaultAnimation.time = time;
		if (playingDefaultAnimation) {
			this.playOnce(this.defaultAnimation);
		}
	}
};

AnimatedMD2Model.prototype.playOnce = function(animation, time, callback) {
	var animationObject = (arguments.length > 1) ? { animation: animation, time: time, callback: callback } : animation;

	// finish current animation
	if(this.playingAnimation) {
		this.interpolateTargets(this.endKeyframe, -1, 0);
	}

	// set (or clear) playingAnimation
	this.playingAnimation = animationObject;

	if(animationObject) {
		// select requested animation
		this.playAnimation(animationObject.animation, 1);
		// fix duration, miscalculated in playAnimation() call above
		this.duration = animationObject.time;
		// store actual time in this.time
		this.time = Date.now();
		// show first frame of requested animation
		this.interpolateTargets(this.startKeyframe, -1, 0);
	}
};

AnimatedMD2Model.prototype.update = function() {
	if(this.playingAnimation) {
		// calculate current frame
		var frame = this.startKeyframe + (this.endKeyframe - this.startKeyframe) * (Date.now() - this.time) / this.duration

		// update the animation
		if(frame < this.endKeyframe) {
			// seek to frame
			this.interpolateTargets(Math.floor(frame), Math.ceil(frame), frame - Math.floor(frame));
		} else {
			// show last frame
			this.interpolateTargets(this.endKeyframe, -1, 0);
			// if there is callback, call it
			if(this.playingAnimation.callback) this.playingAnimation.callback();
			// set animation back to default
			this.playOnce(this.defaultAnimation);
		}
	}
};

AnimatedMD2Model.prototype.clone = function() {

	var a = this.defaultAnimation ? this.defaultAnimation.animation : undefined;
	var t = this.defaultAnimation ? this.defaultAnimation.time : undefined;
	var o = new AnimatedMD2Model(this.geometry, this.material, a, t);

	MorphAnimMesh.prototype.clone.call(this, o);

	return o;
};


const StaticMD2Model = function(json, image) {
	var texture = new THREE.Texture(image);
	texture.needsUpdate = true;

	var material = new THREE.MeshBasicMaterial({ map: texture });

	var loader = new THREE.JSONLoader();
	var model = loader.parse(json);
	var geometry = model.geometry;
	geometry.computeFaceNormals();
	geometry.computeVertexNormals();

	THREE.Mesh.call(this, geometry, material);
};

StaticMD2Model.prototype = Object.create(THREE.Mesh.prototype);


/**
 * Glowing plate helper
 */
const createMeshForPlate = (image, materialParams) => {
	var texture = new THREE.Texture(image);
	texture.needsUpdate = true;

	materialParams.map = texture;
	materialParams.opacity = 0;
	materialParams.transparent = true;
	materialParams.blending = THREE.AdditiveBlending;
	materialParams.depthWrite = false;

	var width = 9e-3 * image.width, height = 9e-3 * image.height;
	var plate = new THREE.Mesh(
		new THREE.PlaneGeometry(width, height),
		new THREE.MeshBasicMaterial(materialParams)
	);

	plate.geometry.computeBoundingSphere();

	return plate;
};

/**
 * Plasma "ball".
 */
const createPlasmaBall = (image) => {
	var texture = new THREE.Texture(image);
	texture.needsUpdate = true;

	var width = 0.015 * image.width;
	var plane = new THREE.Mesh(new THREE.PlaneGeometry(width, width), new THREE.MeshBasicMaterial({
		map: texture, transparent: true, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
	}));

	var object = new THREE.Object3D();
	for (var i = 0; i < 5; i++) {
		var p = plane.clone();
		p.rotation.z = 2 * Math.PI * Math.random();
		if (i % 2) p.rotation.x = Math.PI;
		object.add(p);
	}

	return object;
};

/**
 * Creates semi-valid geometry version with top side faces only.
 */
const topSide = (geometry) => {
	var result = new THREE.Geometry();
	result.vertices = geometry.vertices;
	var up = new THREE.Vector3(0, 1, 0);
	for (var i = 0, n = geometry.faces.length; i < n; i++) {
		var face = geometry.faces[i];
		if (face.normal.dot(up) > 0.1 /* ~6° */) {
			result.faces.push(face);
			result.faceVertexUvs[0].push(geometry.faceVertexUvs[0][i])
		}
	}
	return result;
};

/*
 * Dissolving effect.
 */
const DissolvingEffect = function(object, color, duration, fadeOut) {
	var active = true;
	var speed = (fadeOut ? +1.0 : -1.0) / duration;
	var originalMaterial = fadeOut ? new THREE.MeshBasicMaterial({ visible:false }) : object.material;

	object.material = new THREE.ShaderMaterial({
		uniforms: {
			texture: {
				type: 't',
				value: object.material.map
			},
			noise: {
				type: 't',
				value: this.noiseTexture
			},
			color: {
				type: 'c',
				value: new THREE.Color(color)
			},
			dissolve: {
				type: 'f',
				value: fadeOut ? 0.0 : 1.0
			}
		},
		morphTargets: object.material.morphTargets,
		vertexShader: this.vertexShader,
		fragmentShader: this.fragmentShader,
		shading: THREE.SmoothShading
	});

	this.dispose = function() {
		if(active) {
			active = false;
			object.material.dispose();
			object.material = originalMaterial;
		}
	};

	this.update = function(dt) {
		if(active) {
			var dissolve = object.material.uniforms.dissolve.value;
			if (((speed < 0) && (dissolve > 0)) || ((speed > 0) && (dissolve < 1))) {
				object.material.uniforms.dissolve.value = dissolve + dt * speed;

				// not yet done
				return false;
			}

			this.dispose();
		}

		// done
		return true;
	}
};

DissolvingEffect.prototype = {
	vertexShader: `varying vec2 vUv;
		uniform float morphTargetInfluences[ 8 ];
		void main() {
			vUv = uv;
			vec3 morphed = vec3( 0.0 );

			#ifdef USE_MORPHTARGETS

			morphed += ( morphTarget0 - position ) * morphTargetInfluences[ 0 ];
			morphed += ( morphTarget1 - position ) * morphTargetInfluences[ 1 ];
			morphed += ( morphTarget2 - position ) * morphTargetInfluences[ 2 ];
			morphed += ( morphTarget3 - position ) * morphTargetInfluences[ 3 ];
			morphed += ( morphTarget4 - position ) * morphTargetInfluences[ 4 ];
			morphed += ( morphTarget5 - position ) * morphTargetInfluences[ 5 ];
			morphed += ( morphTarget6 - position ) * morphTargetInfluences[ 6 ];
			morphed += ( morphTarget7 - position ) * morphTargetInfluences[ 7 ];

			#endif

			morphed += position;
			gl_Position = projectionMatrix * (modelViewMatrix * vec4( morphed, 1.0 ));
		}`,
	fragmentShader: `varying vec2 vUv;
		uniform sampler2D texture;
		uniform sampler2D noise;
		uniform vec3 color;
		uniform float dissolve;
		void main() {
			vec4 c4 = texture2D( texture, vUv );
			float n = texture2D( noise, vUv ).x - dissolve;
			if (n < 0.0) { discard; }
			if (n < 0.05) { c4.rgb = color; }
			gl_FragColor = c4;
		}`
};



export {
	SkyBox,
	AnimatedMD2Model,
	StaticMD2Model,
	DissolvingEffect,
	createMeshForPlate,
	createPlasmaBall,
	topSide
}
