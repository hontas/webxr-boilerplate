import * as THREE from 'three';

import WEBVR from './webvr.js';
import VRStats from './vrstats.js';

import {
  POINTER_CLICK,
  POINTER_ENTER,
  POINTER_EXIT,
  Pointer
} from './pointer.js';

//JQuery-like selector
const $ = (sel) => document.querySelector(sel);
const on = (elem, type, cb) => elem.addEventListener(type, cb);

// global constants and variables for your app go here
let camera, scene, renderer, pointer, stats;

let cube;
//called on setup. Customize this
function initContent(scene, camera, renderer) {
  //set the background color of the scene
  scene.background = new THREE.Color(0xcccccc);

  //load a cat texture
  const texture_loader = new THREE.TextureLoader();
  const texture = texture_loader.load('./cat.jpg');

  //create a cube
  cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshLambertMaterial({ color: 'white', map: texture })
  );
  //camera is at z=0, so move the cube back so we can see it
  cube.position.z = -5;
  //move cube up to camera height (~1.5m)
  cube.position.y = 1.5;
  //make it clickable
  cube.userData.clickable = true;
  scene.add(cube);

  //a standard light
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  // enable stats visible inside VR
  stats = new VRStats(renderer);
  camera.add(stats);
  scene.add(camera);

  //class which handles mouse and VR controller
  pointer = new Pointer(scene, renderer, camera, {
    //Pointer searches everything in the scene by default
    //override this to match just certain things
    intersectionFilter: (o) => o.userData.clickable,

    //make the camera pan when moving the mouse. good for simulating head turning on desktop
    cameraFollowMouse: false,

    // set to true to move the controller node forward and tilt with the mouse.
    // good for testing VR controls on desktop
    mouseSimulatesController: false
  });

  //change cube to red BG when clicking
  on(cube, POINTER_CLICK, () => {
    console.log('clicking on the cube');
    cube.material.color.set(0xff0000);
  });
  //change cube to green BG when hovering over it
  on(cube, POINTER_ENTER, () => {
    console.log('entering the cube');
    cube.material.color.set(0x00ff00);
  });
  on(cube, POINTER_EXIT, () => {
    console.log('exiting the cube');
    cube.material.color.set(0xffffff);
  });
}

//called on every frame. customize this
function render(time) {
  //update the pointer and stats, if configured
  if (pointer) pointer.tick(time);
  if (stats) stats.update(time);
  //rotate the cube on every tick
  if (cube) cube.rotation.y += 0.002;
  renderer.render(scene, camera);
}

// you shouldn't need to modify much below here

function initScene() {
  //create DIV for the canvas
  const container = document.createElement('div');
  document.body.appendChild(container);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    50
  );
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.gammaOutput = true;
  renderer.vr.enabled = true;
  container.appendChild(renderer.domElement);
  document.body.appendChild(WEBVR.createButton(renderer));

  initContent(scene, camera, renderer);

  window.addEventListener(
    'resize',
    () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );

  THREE.DefaultLoadingManager.onStart = (url, loaded, total) => {
    console.log(`loading ${url}.  loaded ${loaded} of ${total}`);
  };
  THREE.DefaultLoadingManager.onLoad = () => {
    console.log(`loading complete`);
    console.log('really setting it up now');
    $('#loading-indicator').style.display = 'none';
    $('#click-to-play').style.display = 'block';
    const overlay = $('#overlay');
    $('#click-to-play').addEventListener('click', () => {
      overlay.style.visibility = 'hidden';
      if ($('#enter-vr')) $('#enter-vr').removeAttribute('disabled');
    });
  };
  THREE.DefaultLoadingManager.onProgress = (url, loaded, total) => {
    console.log(`prog ${url}.  loaded ${loaded} of ${total}`);
    $('#progress').setAttribute('value', 100 * (loaded / total));
  };
  THREE.DefaultLoadingManager.onError = (url) => {
    console.log(`error loading ${url}`);
  };
}

// initPage()
initScene();
renderer.setAnimationLoop(render);
