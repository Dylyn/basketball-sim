export { resetStats, setShootingPosition };
// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xeeeeee);

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  60, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  70
);
camera.position.set(0, 1.65, 6.25); // 6 units back, looking at hoop

// Renderer
const renderer = new THREE.WebGLRenderer({ 
  canvas: document.getElementById('three-canvas'), 
  antialias: true,
  alpha: true
});

renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.5;
// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 7.5);
scene.add(mainLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 2);
fillLight.position.set(-5, 0, 15);
scene.add(fillLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 1);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

const bouncyMaterial = new CANNON.Material("bouncy");
bouncyMaterial.restitution = 0.7; // Higher = more bounce (try values between 0.5 - 1)

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x2D2D2D })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
floor.position.set(0, -0.15, 0);
scene.add(floor);

// Loaders
const loader = new THREE.GLTFLoader();

// Raycaster and mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let ballObject = null;
let isDragging = false;
let dragStart = new THREE.Vector2();
export let flickVelocity = new THREE.Vector3();

let ballPosZ = 5.3

// ball model
loader.load('./assets/ball.glb', glb => {
  const ball = glb.scene;
  ball.position.set(0, 1.5, ballPosZ); // In front of camera
  ball.scale.set(0.65, 0.65, 0.65);
  ball.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
    }
  });
  ballObject = ball;
  scene.add(ball);
  
}, undefined, error => console.error('Error loading ball:', error));

// ball collision
const ballShape = new CANNON.Sphere(0.25);
const ballBody = new CANNON.Body({ 
  mass: 0, 
  shape: ballShape, 
  material: bouncyMaterial,
});
ballBody.position.set(0, 1.5, ballPosZ);
world.addBody(ballBody);

// score
export let score = 0;
let attempts = 0;
let canScore = true;

function increaseScore() {
  if (!canScore) return;
  
  score++;
  document.getElementById('scoreDisplay').textContent = `Score: ${score}`;
  document.getElementById('scoreDisplay').style.color = 'rgb(55, 255, 82)';
  
  setTimeout(() => {
    document.getElementById('scoreDisplay').style.color = 'white';
  }, 300);
  
  // Prevent multiple scoring
  canScore = false;
  setTimeout(() => canScore = true, 1000);
}

function increaseAttempts() {
  if (!canScore) return;
  
  attempts++;
  document.getElementById('attemptsDisplay').textContent = `Attempts: ${attempts}`;
  
  setTimeout(() => {
    document.getElementById('scoreDisplay').style.color = 'white';
  }, 300);
  
  // Prevent multiple scoring
  canScore = false;
  setTimeout(() => canScore = true, 1000);
}

function resetStats() {
  attempts = 0;
  score = 0;
  document.getElementById('attemptsDisplay').textContent = `Attempts: ${attempts}`;
  document.getElementById('scoreDisplay').textContent = `Score: ${score}`;

}

// hoop model
loader.load('./assets/new court comp.glb', glb => {
  const hoop = glb.scene;
  hoop.position.set(.6, 0, 6); // Aligned with ball and camera
  hoop.rotation.set(0, -1.56, 0);
  hoop.scale.set(1, 1, 1);
  hoop.traverse(child => {
    if (child.isMesh) {
      child.receiveShadow = true;
      child.alpha = true;
    }
  });
  scene.add(hoop);
}, undefined, error => console.error('Error loading net:', error));

// floor collision
const floorShape = new CANNON.Plane();
const floorBody = new CANNON.Body({ mass: 0 });
floorBody.material = bouncyMaterial;
floorBody.addShape(floorShape);
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
floorBody.position.set(0, 0, 0);
world.addBody(floorBody);

// backboard collision
const backboardShape = new CANNON.Box(new CANNON.Vec3(0.9, 0.5, 0.05)); // Half-extents
const backboardBody = new CANNON.Body({ mass: 0 });
backboardBody.material = bouncyMaterial;
backboardBody.addShape(backboardShape);
backboardBody.position.set(0, 3.3, 0.5);
world.addBody(backboardBody);

// visual backboard
/*
const backboardGeometry = new THREE.BoxGeometry(1.8, 1, 0.1); // Full size = 2x half-extents
const backboardMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
  transparent: true,
  opacity: 0.5
});
const backboardMesh = new THREE.Mesh(backboardGeometry, backboardMaterial);
scene.add(backboardMesh);
*/

// fence
const fenceShape = new CANNON.Box(new CANNON.Vec3(13, 3.5, 0.05)); // Half-extents
const fenceBody = new CANNON.Body({ mass: 0 });
fenceBody.material = bouncyMaterial;
fenceBody.addShape(fenceShape);
fenceBody.position.set(0, 3.5, -6);
world.addBody(fenceBody);

// visual fence
/*
const fenceGeometry = new THREE.BoxGeometry(26, 7, 0.1); // Full size = 2x half-extents
const fenceMaterial = new THREE.MeshBasicMaterial({
  color: 0xff0000,
  wireframe: true,
  transparent: true,
  opacity: 0.5
});
const fenceMesh = new THREE.Mesh(fenceGeometry, fenceMaterial);
fenceMesh.position.copy(fenceBody.position);
fenceMesh.quaternion.copy(fenceBody.quaternion);
scene.add(fenceMesh);
*/

// Orbit Controls (for testing view)
/*
const controls = new THREE.OrbitControls(camera, renderer.domElement);
 controls.target.set(0, 1.2, 0);
controls.update();
*/

const rimRadius = 0.275;
const rimThickness = 0.00001;
const rimWidth = 0.1;
const rimSegments = 12;

const rimBodies = [];
const rimMeshes = [];

// rim
for (let i = 0; i < rimSegments; i++) {
  const angle = (i / rimSegments) * Math.PI * 2;
  const x = Math.cos(angle) * rimRadius;
  const y = 2.9; // just under the backboard
  const z = Math.sin(angle) * rimRadius + 0.845; // slight offset from backboard

  // Physics shape (small box segment)
  const boxHalfExtents = new CANNON.Vec3(rimThickness / 2, rimThickness / 2, rimWidth / 2);
  const boxShape = new CANNON.Box(boxHalfExtents);
  const rimBody = new CANNON.Body({ mass: 0 });
  rimBody.addShape(boxShape);
  rimBody.position.set(x, y, z);

  // Rim physics
  rimBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, -1, 0), angle);

  world.addBody(rimBody);
  rimBodies.push(rimBody);

  // rIm visual
  /*
  const meshGeometry = new THREE.BoxGeometry(
    boxHalfExtents.x * 2,
    boxHalfExtents.y * 2,
    boxHalfExtents.z * 2
  );
  const meshMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const mesh = new THREE.Mesh(meshGeometry, meshMaterial);
  mesh.position.copy(rimBody.position);
  mesh.quaternion.copy(rimBody.quaternion);
  scene.add(mesh);
  rimMeshes.push(mesh);
  */
}

const hoopCenter = new CANNON.Vec3(0, 2.75, 0.85); // adjust to your hoop's net center
const scoreRadius = 0.15; // adjust based on hoop size
let ballScored = false;

function checkScoreByDistance() {
  const dx = ballBody.position.x - hoopCenter.x;
  const dy = ballBody.position.y - hoopCenter.y;
  const dz = ballBody.position.z - hoopCenter.z;

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (distance < scoreRadius) {
    if (!ballScored) {
      ballScored = true;
      console.log("Scored by distance!");
      increaseScore();
    }
  } else {
    ballScored = false; // reset if ball exits the scoring area
  }
}

const bouncyContact = new CANNON.ContactMaterial(
  bouncyMaterial,
  bouncyMaterial,
  {
    friction: 0.3,
    restitution: 0.9
  }
);
world.addContactMaterial(bouncyContact);

function setShootingPosition(cameraZ, ballZ) {

  camera.position.set(0, 1.65, cameraZ); // change camera z for distnace

  ballPosZ = ballZ;

  // ball visual
  if (ballObject) {
    ballObject.position.set(0, 1.5, ballZ);
  }

  // physics body
  if (ballBody) {
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    ballBody.position.set(0, 1.5, ballZ);
    ballBody.quaternion.set(0, 0, 0, 1);
    ballBody.mass = 0;
    ballBody.type = CANNON.Body.STATIC;
    ballBody.updateMassProperties();
  }
}

// Drag logic
function onMouseDown(event) {
  if (!ballObject) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(ballObject, true);

  if (intersects.length > 0) {
    isDragging = true;
    dragStart.set(event.clientX, event.clientY);
    flickVelocity.set(0, 0, 0);
  }
}

function onMouseUp(event) {
  if (!isDragging || !ballObject || !ballBody) return;
  isDragging = false;

  const dragEnd = new THREE.Vector2(event.clientX, event.clientY);
  const dragDelta = dragEnd.clone().sub(dragStart);

  // Calculate flick velocity
  flickVelocity.set(
    -dragDelta.x * 0.04,         // left/right
    dragDelta.y * 0.03,           // up
    -Math.abs(dragDelta.y) * 0.02 // forward (Z)
  );

  // Enable physics (if not already dynamic)
  if (ballBody.mass === 0) {
    ballBody.mass = 1;
    ballBody.type = CANNON.Body.DYNAMIC;
    ballBody.updateMassProperties();
  }

  // Apply velocity
  ballBody.velocity.set(
    flickVelocity.x,
    flickVelocity.y,
    flickVelocity.z
  );

  increaseAttempts();

  setTimeout(() => {
    // Stop motion
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
  
    // Set it back to original position
    ballBody.position.set(0, 1.5, ballPosZ);
    ballBody.quaternion.set(0, 0, 0, 1);
  
    // Make it static again (until next flick)
    ballBody.mass = 0;
    ballBody.type = CANNON.Body.STATIC;
    ballBody.updateMassProperties();
  }, 2800);
}


window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate loop
const clock = new THREE.Clock();
const fixedTimeStep = 1 / 60; // 60 Hz physics step
const maxSubSteps = 3;

const animate = () => {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  world.step(fixedTimeStep, delta, maxSubSteps);

  // ball
  if (ballObject && ballBody) {
    ballObject.position.copy(ballBody.position);
    ballObject.quaternion.copy(ballBody.quaternion);
  }

  checkScoreByDistance();
  
  //visuals mesh
  /*
  for (let i = 0; i < rimBodies.length; i++) {
    rimMeshes[i].position.copy(rimBodies[i].position);
    rimMeshes[i].quaternion.copy(rimBodies[i].quaternion);
  }
  // backboard
  
  if (backboardMesh && backboardBody) {
    backboardMesh.position.copy(backboardBody.position);
    backboardMesh.quaternion.copy(backboardBody.quaternion);
  }
  */
  renderer.render(scene, camera);
};

animate();

