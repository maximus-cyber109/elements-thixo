import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ===== LENIS SMOOTH SCROLL =====
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Integrate with GSAP
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

// ===== THREE.JS SETUP =====
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
);
camera.position.set(0, 0, 8);

// Renderer
const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true 
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight1.position.set(5, 5, 5);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0x764ba2, 0.6);
directionalLight2.position.set(-5, 0, -5);
scene.add(directionalLight2);

const rimLight = new THREE.DirectionalLight(0xec4899, 0.4);
rimLight.position.set(0, -5, 0);
scene.add(rimLight);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 3.0;
controls.enableZoom = true;
controls.minDistance = 4;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI / 1.5;
controls.minPolarAngle = Math.PI / 3;

// Load GLB Model
const loader = new GLTFLoader();
let model;

loader.load(
    'models/thixotropic-gel.glb',
    (gltf) => {
        model = gltf.scene;
        
        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Scale
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.setScalar(scale);
        
        scene.add(model);
        console.log('✓ Model loaded successfully');
    },
    (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
    },
    (error) => {
        console.error('Error loading model:', error);
    }
);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// ===== SCROLL ANIMATIONS =====

// Section 1: Model moves to RIGHT
ScrollTrigger.create({
    trigger: '#section1',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
    onUpdate: (self) => {
        const progress = self.progress;
        gsap.to('#canvas-container', {
            x: progress * (window.innerWidth * 0.3),
            duration: 0.3,
        });
        
        if (model) {
            gsap.to(model.rotation, {
                y: model.rotation.y + 0.01,
                duration: 0.3,
            });
        }
    }
});

// Section 2: Model moves to LEFT
ScrollTrigger.create({
    trigger: '#section2',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
    onUpdate: (self) => {
        const progress = self.progress;
        gsap.to('#canvas-container', {
            x: (1 - progress) * (window.innerWidth * 0.3) - progress * (window.innerWidth * 0.3),
            duration: 0.3,
        });
    }
});

// Section 3: Model stays LEFT
ScrollTrigger.create({
    trigger: '#section3',
    start: 'top center',
    end: 'bottom center',
    scrub: 1,
    onUpdate: (self) => {
        const progress = self.progress;
        gsap.to('#canvas-container', {
            x: -(1 - progress * 0.5) * (window.innerWidth * 0.3),
            duration: 0.3,
        });
    }
});

// CTA Section: Model returns to CENTER
ScrollTrigger.create({
    trigger: '#cta',
    start: 'top center',
    end: 'center center',
    scrub: 1,
    onUpdate: (self) => {
        const progress = self.progress;
        gsap.to('#canvas-container', {
            x: -(1 - progress) * (window.innerWidth * 0.3),
            scale: 1 + (progress * 0.1),
            duration: 0.3,
        });
        
        // Stop auto-rotation in CTA
        controls.autoRotate = progress < 0.5;
    }
});

// Mobile: Disable horizontal movement
if (window.innerWidth < 968) {
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    gsap.set('#canvas-container', { x: 0 });
}

// ===== COPY COUPON CODE =====
const copyButton = document.getElementById('copyButton');
const couponCode = document.getElementById('couponCode');

copyButton.addEventListener('click', () => {
    const code = couponCode.textContent;
    
    // Modern clipboard API
    navigator.clipboard.writeText(code).then(() => {
        copyButton.classList.add('copied');
        
        setTimeout(() => {
            copyButton.classList.remove('copied');
        }, 3000);
    }).catch(err => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        copyButton.classList.add('copied');
        setTimeout(() => {
            copyButton.classList.remove('copied');
        }, 3000);
    });
});

// ===== WINDOW RESIZE =====
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    // Refresh ScrollTrigger
    ScrollTrigger.refresh();
});
