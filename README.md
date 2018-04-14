# SkyRunner Starter
For those not sure where to start with building a first-person-shooter in JavaScript, this starter-kit will let you get up and running in a snap.

## TL;DR
```bash
git clone https://github.com/kylejlin/SkyRunner-starter.git path/to/project

npm install
npm run start
```

## Under the hood
I used [create-react-app](https://github.com/facebook/create-react-app), even though this project doesn't use React. This is nice because
 1. It's much faster than manually setting up Webpack, Babel, and ESLint.
 2. Many people are familiar with create-react-app's simple structure and scripts.

The shooter was ported from (https://github.io/makc/fps-three.js) and rewritten to use ES6 Modules instead of require.js. I also improved the controls, and got sound to work for mobile via [howler](https://github.com/goldfire/howler.js).

## Usage
Same as create-react-app. It's pretty self explanatory IMO, but on the off-chance you never used anything like create-react-app before, I will briefly explain:


### Structure
 - Source code is in `src/`
 - Production code is in `build/`
 - Static resources (HTML, manifest, images, audio, meshes) are in `public/`

### Scripts
```bash
npm run start # Start in dev mode with hot reloading
npm run build # Build for production
```

## Controls

### Desktop
Aiming: Mouse

Movement: WASD

Shooting: Space

### Mobile
Aiming: Right half of screen

Movement: Left half of screen (like an invisible joystick appears wherever you place your finger)

Shooting: There are two ways to choose shoot:
 - Tap on the right half. This is the simplest but slowest option because the device has to wait for a `touchend` to fire before it can be certain the gesture is a tap, not a swipe.
 - Touch on either half with a second finger. That is, if you already have a finger on the right half, touch on the right half, and if you already have a finger on the left half, touch on the left half. This option can be convenient when both your thumbs are occupied with aiming and moving, as you can use an index finger to shoot. This option is the most responsive because it fires on `touchstart` (it doesn't require the gesture to be a tap).
