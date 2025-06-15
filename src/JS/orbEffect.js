// Scene Setup
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pointsVertexShader from '../shaders/orbVertex.glsl?raw';
import pointsFragmentShader from '../shaders/orbFragment.glsl?raw';

gsap.registerPlugin(ScrollTrigger);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1);

// Create Points from Icosahedron Geometry
const geometry = new THREE.IcosahedronGeometry(2, 80); // High subdivision for more points
const pointsMaterial = new THREE.ShaderMaterial({
    vertexShader: pointsVertexShader,
    fragmentShader: pointsFragmentShader,
    uniforms: {
        uTime: { value: 0.0 },
        uColorChange: { value: 0.0 },
        uNoiseIntensity: { value: 0.3 },
        uPointSize: { value: 15.0 },
        uCameraPosition: { value: camera.position },
        uOpacity: { value: 0.0 }, // Start invisible
        uScale: { value: 0.0 } // Start with zero scale
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

const pointsMesh = new THREE.Points(geometry, pointsMaterial);
scene.add(pointsMesh);

// Enhanced Lighting
const ambientLight = new THREE.AmbientLight(0x330000, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xff0000, 0.4);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xff0000, 0.6, 12);
pointLight.position.set(0, 0, 3);
scene.add(pointLight);

// Mouse interaction
let mouseX = 0, mouseY = 0;

window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
});

// Animation parameters
let animationSpeed = 1.0;
let colorChange = 0.0;
let noiseIntensity = 1.0;
let pointSize = 2.0;

// GSAP Fade-in Animation - Only starts after preloader completes
function initializeAnimations() {
    // Add loaded class to body to prevent color flash
    document.body.classList.add('loaded');
    
    // Create a master timeline
    const tl = gsap.timeline();
    
    // Fade in canvas
    tl.to(canvas, {
        opacity: 1,
        duration: 1.5,
        ease: "power2.out"
    });
    
    // Fade in the orb opacity
    tl.to(pointsMaterial.uniforms.uOpacity, {
        value: 1.0,
        duration: 2,
        ease: "power2.out"
    }, "-=1");
    
    // Slow, smooth scale up the orb
    tl.to(pointsMaterial.uniforms.uScale, {
        value: 1.0,
        duration: 4,
        ease: "power2.out"
    }, "-=2");
    
    const heroText = document.querySelectorAll("#hero h1");
    tl.to(heroText, {
        opacity: 1,
        y: 0,
        duration: 2,
        stagger: 0.3,
        ease: "power3.out"
    }, "-=3");
   const navText = document.querySelectorAll("nav");
    tl.to(navText, {
        opacity: 1,
        y: 0,
        duration: 2,
        stagger: 0.3,
        ease: "power3.out"
    }, "-=3");

}

// Listen for preloader completion instead of window load
window.addEventListener('preloaderComplete', () => {
    // Small delay to ensure smooth transition
    setTimeout(initializeAnimations, 200);
});

// Animation Loop
const clock = new THREE.Clock();

function animate() {
    const elapsedTime = clock.getElapsedTime() * animationSpeed;
    
    // Update main points uniforms
    pointsMaterial.uniforms.uTime.value = elapsedTime;
    pointsMaterial.uniforms.uColorChange.value = colorChange;
    pointsMaterial.uniforms.uNoiseIntensity.value = noiseIntensity;
    pointsMaterial.uniforms.uPointSize.value = pointSize;
    pointsMaterial.uniforms.uCameraPosition.value.copy(camera.position);

    // Enhanced rotation with eerie movement
    pointsMesh.rotation.y = elapsedTime * 0.15 + mouseX * 0.3;
    pointsMesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.2 + mouseY * 0.2;
    pointsMesh.rotation.z = Math.cos(elapsedTime * 0.1) * 0.1;

    // Spooky camera movement
    camera.position.x = Math.sin(elapsedTime * 0.3) * 0.8;
    camera.position.y = Math.cos(elapsedTime * 0.2) * 0.6;
    camera.position.z = 5 + Math.sin(elapsedTime * 0.1) * 0.5;
    camera.lookAt(scene.position);

    // Make point light flicker and move
    pointLight.intensity = 0.6 + Math.sin(elapsedTime * 12) * 0.2;
    pointLight.position.x = Math.sin(elapsedTime * 0.5) * 2;
    pointLight.position.y = Math.cos(elapsedTime * 0.7) * 2;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();

// Responsive handling
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Auto color transition
setInterval(() => {
    if (Math.random() > 0.7) {
        const targetColor = Math.random();
        const currentColor = colorChange;
        const steps = 60;
        let step = 0;
        
        const colorTransition = setInterval(() => {
            step++;
            colorChange = currentColor + (targetColor - currentColor) * (step / steps);
            
            if (step >= steps) {
                clearInterval(colorTransition);
            }
        }, 50);
    }
}, 3000);