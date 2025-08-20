// 3D astronaut scene with scroll-driven path
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const canvas = document.getElementById('scene3d');
if (!canvas) throw new Error('scene3d canvas missing');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.setSize(window.innerWidth, window.innerHeight, true);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.2, 6);

// Lights
const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
keyLight.position.set(4, 6, 8);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x88aaff, 0.6);
fillLight.position.set(-6, 3, -4);
scene.add(fillLight);
scene.add(new THREE.AmbientLight(0x223355, 0.6));

// Optional controls (disabled interactions by default)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;

// Astronaut placeholder (if model fails): a simple capsule
let astro;
function createFallbackAstronaut() {
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.5, 1.2, 8, 16),
    new THREE.MeshStandardMaterial({ color: 0x9fb5ff, metalness: 0.2, roughness: 0.6, emissive: 0x112244, emissiveIntensity: 0.3 })
  );
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x223355, roughness: 0.2, metalness: 0.9, transmission: 0.2, transparent: true })
  );
  visor.position.set(0, 0.4, 0.38);
  const group = new THREE.Group();
  group.add(body);
  group.add(visor);
  group.scale.setScalar(1.6);
  return group;
}

// Load GLB astronaut: try user's Astronsut.glb, then astronaut.glb, then fallback
const loader = new GLTFLoader();
function fitToHeight(object, desiredHeight = 2.2) {
  const box = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  box.getSize(size);
  const h = Math.max(0.0001, size.y);
  const scale = desiredHeight / h;
  object.scale.multiplyScalar(scale);
}
function loadModel(urls, onDone) {
  if (!urls.length) { onDone(null); return; }
  const [url, ...rest] = urls;
  loader.load(
    url,
    (gltf) => onDone(gltf.scene),
    undefined,
    () => loadModel(rest, onDone)
  );
}

loadModel([
  'assets/Astronaut.glb',
  'assets/astronaut.glb'
], (sceneRoot) => {
  if (!sceneRoot) {
    astro = createFallbackAstronaut();
  } else {
    astro = sceneRoot;
    let hasMesh = false;
    astro.traverse((obj) => { if (obj.isMesh) { hasMesh = true; obj.castShadow = obj.receiveShadow = false; } });
    if (!hasMesh) astro = createFallbackAstronaut();
    else try { fitToHeight(astro, 2.4); } catch (e) {}
  }
  scene.add(astro);
});

// Path defined in NDC-ish space mapped to world; progresses with scroll from 0..1
const pathPoints = [
  new THREE.Vector3(-2.2, 1.2, 0.0),
  new THREE.Vector3(-0.6, 0.6, -0.6),
  new THREE.Vector3(0.3, 0.2, 0.2),
  new THREE.Vector3(1.4, -0.2, -0.4),
  new THREE.Vector3(-0.4, -0.9, 0.3),
  new THREE.Vector3(0.8, -1.4, -0.2),
];
const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'centripetal');

let progress = 0; // 0..1 according to scroll position
let targetProgress = 0;

function updateScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  targetProgress = docHeight <= 0 ? 0 : Math.max(0, Math.min(1, scrollTop / docHeight));
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// Resize
function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, true);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

// Animate along curve, face travel direction
const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
function animate(now) {
  requestAnimationFrame(animate);
  // ease progress for smoothness
  progress += (targetProgress - progress) * 0.08;

  if (astro) {
    const p = curve.getPoint(Math.max(0.001, Math.min(0.999, progress)));
    const f = curve.getTangent(Math.max(0.001, Math.min(0.999, progress)), tmp);
    astro.position.copy(p);
    // billboard slightly and rotate towards tangent
    tmp2.copy(p).add(f);
    astro.lookAt(tmp2);
    astro.rotation.z += Math.sin((now || 0) * 0.001) * 0.004;
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(animate);


