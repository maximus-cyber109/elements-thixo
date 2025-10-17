import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const loadingScreen = document.getElementById('loading-screen');

// Loading Manager
const loadingManager = new THREE.LoadingManager();

loadingManager.onLoad = () => {
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
    }, 500);
};

loadingManager.onProgress = (url, loaded, total) => {
    console.log(`Loading: ${Math.round((loaded / total) * 100)}%`);
};

loadingManager.onError = (url) => {
    console.error('Error loading:', url);
    loadingScreen.innerHTML = '<p>Error: Check if model exists</p>';
};

// Three.js Scene
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    35,
    1, // Fixed aspect ratio
    0.1,
    1000
);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    antialias: true 
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

// Lighting - Brighter for cyan background
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(5, 5, 5);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x7dd3c0, 0.6);
fillLight.position.set(-5, 0, -5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
rimLight.position.set(0, -5, 3);
scene.add(rimLight);

// Controls - NO ZOOM
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 2;
controls.enableZoom = false; // DISABLED
controls.enablePan = false;

// Load Model
const loader = new GLTFLoader(loadingManager);
let model;

loader.load(
    './models/thixotropic-gel.glb',
    (gltf) => {
        model = gltf.scene;
        
        // Center and scale BIGGER
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        model.position.sub(center);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 5 / maxDim; // BIGGER
        model.scale.setScalar(scale);
        
        // Tilt
        model.rotation.x = Math.PI / 12;
        model.rotation.z = -Math.PI / 24;
        
        scene.add(model);
        console.log('✓ Model loaded');
        
        initScrollAnimations();
    },
    (progress) => {
        if (progress.total > 0) {
            console.log(`Model: ${Math.round((progress.loaded / progress.total) * 100)}%`);
        }
    },
    (error) => {
        console.error('Model error:', error);
        loadingScreen.innerHTML = '<p>Model failed to load</p>';
    }
);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Lenis Smooth Scroll
let lenis;

window.addEventListener('load', () => {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    
    console.log('✓ Lenis ready');
});

// Scroll Animations
function initScrollAnimations() {
    const sections = gsap.utils.toArray('.content-section');
    
    sections.forEach((section) => {
        const position = section.getAttribute('data-position');
        const targetX = position === 'left' ? -30 : 30;
        const rotationY = position === 'left' ? Math.PI / 3 : -Math.PI / 3;
        
        ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            scrub: 1,
            onUpdate: (self) => {
                const progress = self.progress;
                
                gsap.to(container, {
                    x: `${targetX * progress}vw`,
                    duration: 0.3,
                });
                
                if (model) {
                    gsap.to(model.rotation, {
                        y: rotationY * progress,
                        duration: 0.3,
                    });
                }
            }
        });
    });
    
    // CTA: Center
    ScrollTrigger.create({
        trigger: '.cta-section',
        start: 'top center',
        end: 'center center',
        scrub: 1,
        onUpdate: (self) => {
            gsap.to(container, {
                x: 0,
                scale: 1.3,
                duration: 0.5,
            });
            
            if (model) {
                gsap.to(model.rotation, {
                    y: Math.PI * 2,
                    duration: 0.5,
                });
            }
            
            controls.autoRotate = self.progress > 0.5;
        }
    });
    
    console.log('✓ Animations ready');
}

// Copy Coupon
const copyBtn = document.getElementById('copyBtn');
const couponCode = document.getElementById('couponCode');

copyBtn.addEventListener('click', () => {
    const code = couponCode.textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 2500);
    }).catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        copyBtn.classList.add('copied');
        setTimeout(() => copyBtn.classList.remove('copied'), 2500);
    });
});

// Resize
window.addEventListener('resize', () => {
    renderer.setSize(container.clientWidth, container.clientHeight);
    ScrollTrigger.refresh();
});
