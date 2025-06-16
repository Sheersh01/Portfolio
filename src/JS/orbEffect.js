// Scene Setup
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pointsVertexShader from '../shaders/orbVertex.glsl?raw';
import pointsFragmentShader from '../shaders/orbFragment.glsl?raw';

gsap.registerPlugin(ScrollTrigger);

// Mobile detection and performance settings
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

// Dynamic quality settings based on device
const qualitySettings = {
    subdivisions: isMobile ? (isLowEndDevice ? 70 : 70) : 80,
    pixelRatio: isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2),
    pointSize: isMobile ? 8.0 : 15.0,
    antialias: !isMobile || !isLowEndDevice,
    shadowMapEnabled: false, // Disable shadows for mobile
    maxLights: isMobile ? 2 : 3
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: qualitySettings.antialias, 
    alpha: true,
    powerPreference: isMobile ? "low-power" : "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(qualitySettings.pixelRatio);
renderer.setClearColor(0x000000, 1);

// Disable unnecessary features for mobile
if (isMobile) {
    renderer.shadowMap.enabled = false;
    renderer.physicallyCorrectLights = false;
}

// Create Points from Icosahedron Geometry with dynamic quality
const geometry = new THREE.IcosahedronGeometry(2, qualitySettings.subdivisions);
const pointsMaterial = new THREE.ShaderMaterial({
    vertexShader: pointsVertexShader,
    fragmentShader: pointsFragmentShader,
    uniforms: {
        uTime: { value: 0.0 },
        uColorChange: { value: 0.0 },
        uNoiseIntensity: { value: isMobile ? 0.2 : 0.3 },
        uPointSize: { value: qualitySettings.pointSize },
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

// Optimized Lighting for mobile
const ambientLight = new THREE.AmbientLight(0x330000, isMobile ? 0.3 : 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xff0000, isMobile ? 0.3 : 0.4);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Only add point light if not low-end mobile
let pointLight;
if (!isMobile || !isLowEndDevice) {
    pointLight = new THREE.PointLight(0xff0000, 0.6, 12);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);
}

// Enhanced touch and mouse interaction
let mouseX = 0, mouseY = 0;
let isInteracting = false;

// Mouse events
window.addEventListener('mousemove', (event) => {
    if (!isInteracting) {
        mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }
});

// Touch events for mobile
window.addEventListener('touchstart', (event) => {
    isInteracting = true;
    const touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
}, { passive: true });

window.addEventListener('touchmove', (event) => {
    event.preventDefault(); // Prevent scrolling while touching the orb
    const touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
}, { passive: false });

window.addEventListener('touchend', () => {
    isInteracting = false;
}, { passive: true });

// Animation parameters with mobile optimization
let animationSpeed = isMobile ? 0.8 : 1.0; // Slightly slower on mobile for better performance
let colorChange = 0.0;
let noiseIntensity = isMobile ? 0.8 : 1.0;
let pointSize = isMobile ? 1.5 : 2.0;

// Frame rate management for mobile
let lastTime = 0;
const targetFPS = isMobile ? 30 : 60;
const frameInterval = 1000 / targetFPS;

// GSAP Fade-in Animation - Only starts after preloader completes
function initializeAnimations() {
    // Add loaded class to body to prevent color flash
    document.body.classList.add('loaded');
    
    // Create a master timeline
    const tl = gsap.timeline();
    
    // Fade in canvas
    tl.to(canvas, {
        opacity: 1,
        duration: isMobile ? 1 : 1.5,
        ease: "power2.out"
    });
    
    // Fade in the orb opacity
    tl.to(pointsMaterial.uniforms.uOpacity, {
        value: 1.0,
        duration: isMobile ? 1.5 : 2,
        ease: "power2.out"
    }, "-=1");
    
    // Slow, smooth scale up the orb
    tl.to(pointsMaterial.uniforms.uScale, {
        value: 1.0,
        duration: isMobile ? 3 : 4,
        ease: "power2.out"
    }, "-=2.0");
    
    const heroText = document.querySelectorAll("#hero h1");
    tl.to(heroText, {
        opacity: 1,
        y: 0,
        duration: isMobile ? 1.5 : 2,
        stagger: 0.3,
        ease: "power3.out"
    }, "-=2.5");
    
    const navText = document.querySelectorAll("nav");
    tl.to(navText, {
        opacity: 1,
        y: 0,
        duration: isMobile ? 1.5 : 2,
        stagger: 0.3,
        ease: "power3.out"
    }, "-=2.5");
}

// Listen for preloader completion instead of window load
window.addEventListener('preloaderComplete', () => {
    // Small delay to ensure smooth transition
    setTimeout(initializeAnimations, 200);
});

// Performance monitoring
let frameCount = 0;
let lastFPSCheck = performance.now();

function checkPerformance() {
    frameCount++;
    const now = performance.now();
    
    if (now - lastFPSCheck >= 5000) { // Check every 5 seconds
        const fps = (frameCount * 1000) / (now - lastFPSCheck);
        
        // Dynamically adjust quality if performance is poor
        if (fps < 20 && isMobile) {
            // Reduce particle count or other quality settings
            pointsMaterial.uniforms.uNoiseIntensity.value *= 0.8;
            animationSpeed *= 0.9;
        }
        
        frameCount = 0;
        lastFPSCheck = now;
    }
}

// Animation Loop with frame rate control
const clock = new THREE.Clock();

function animate(currentTime = 0) {
    // Frame rate limiting for mobile
    if (currentTime - lastTime < frameInterval) {
        requestAnimationFrame(animate);
        return;
    }
    lastTime = currentTime;
    
    const elapsedTime = clock.getElapsedTime() * animationSpeed;
    
    // Update main points uniforms
    pointsMaterial.uniforms.uTime.value = elapsedTime;
    pointsMaterial.uniforms.uColorChange.value = colorChange;
    pointsMaterial.uniforms.uNoiseIntensity.value = noiseIntensity;
    pointsMaterial.uniforms.uPointSize.value = pointSize;
    pointsMaterial.uniforms.uCameraPosition.value.copy(camera.position);

    // Enhanced rotation with eerie movement (reduced intensity on mobile)
    const rotationMultiplier = isMobile ? 0.7 : 1.0;
    pointsMesh.rotation.y = elapsedTime * 0.15 * rotationMultiplier + mouseX * (isMobile ? 0.2 : 0.3);
    pointsMesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.2 * rotationMultiplier + mouseY * (isMobile ? 0.15 : 0.2);
    pointsMesh.rotation.z = Math.cos(elapsedTime * 0.1) * 0.1 * rotationMultiplier;

    // Reduced camera movement intensity on mobile
    const cameraMultiplier = isMobile ? 0.5 : 1.0;
    camera.position.x = Math.sin(elapsedTime * 0.3) * 0.8 * cameraMultiplier;
    camera.position.y = Math.cos(elapsedTime * 0.2) * 0.6 * cameraMultiplier;
    camera.position.z = 5 + Math.sin(elapsedTime * 0.1) * 0.5 * cameraMultiplier;
    camera.lookAt(scene.position);

    // Make point light flicker and move (only if it exists)
    if (pointLight) {
        pointLight.intensity = 0.6 + Math.sin(elapsedTime * 12) * 0.2;
        pointLight.position.x = Math.sin(elapsedTime * 0.5) * 2;
        pointLight.position.y = Math.cos(elapsedTime * 0.7) * 2;
    }

    renderer.render(scene, camera);
    
    // Performance monitoring
    if (isMobile) {
        checkPerformance();
    }
    
    requestAnimationFrame(animate);
}

animate();

// Enhanced responsive handling
let resizeTimeout;
window.addEventListener('resize', () => {
    // Debounce resize events for mobile
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(qualitySettings.pixelRatio);
        
        // Re-check if device is mobile after rotation
        const newIsMobile = window.innerWidth < 768;
        if (newIsMobile !== isMobile) {
            // Adjust settings if orientation changed significantly
            pointsMaterial.uniforms.uPointSize.value = newIsMobile ? 8.0 : 15.0;
        }
    }, 150);
});

// Optimized auto color transition with longer intervals on mobile
const colorTransitionInterval = isMobile ? 5000 : 3000;
setInterval(() => {
    if (Math.random() > 0.7) {
        const targetColor = Math.random();
        const currentColor = colorChange;
        const steps = isMobile ? 30 : 60; // Fewer steps on mobile
        let step = 0;
        
        const colorTransition = setInterval(() => {
            step++;
            colorChange = currentColor + (targetColor - currentColor) * (step / steps);
            
            if (step >= steps) {
                clearInterval(colorTransition);
            }
        }, isMobile ? 100 : 50); // Slower transition on mobile
    }
}, colorTransitionInterval);

// Pause animation when page is not visible (mobile battery optimization)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause heavy animations
        animationSpeed = 0;
    } else {
        // Page is visible again, resume
        animationSpeed = isMobile ? 0.8 : 1.0;
    }
});

// Memory cleanup for mobile
window.addEventListener('beforeunload', () => {
    // Clean up Three.js resources
    geometry.dispose();
    pointsMaterial.dispose();
    renderer.dispose();
});