// Scene Setup
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pointsVertexShader from '../shaders/orbVertex.glsl?raw';
import pointsFragmentShader from '../shaders/orbFragment.glsl?raw';

gsap.registerPlugin(ScrollTrigger);

// Enhanced mobile detection and performance settings
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 window.innerWidth < 768 || 
                 ('ontouchstart' in window);
const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

// Mobile-specific color and brightness settings
const colorSettings = {
    mobile: {
        brightness: 0.3,
        contrast: 1.5,
        pointSizeMult: 1.2,
        intensityBoost: 1.4,
        noiseReduction: 0.7
    },
    desktop: {
        brightness: 0.0,
        contrast: 1.0,
        pointSizeMult: 1.0,
        intensityBoost: 1.0,
        noiseReduction: 1.0
    }
};

const deviceSettings = isMobile ? colorSettings.mobile : colorSettings.desktop;

// Dynamic quality settings based on device
const qualitySettings = {
    subdivisions: isMobile ? (isLowEndDevice ? 70 : 70) : 80,
    pixelRatio: isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2),
    pointSize: (isMobile ? 8.0 : 15.0) * deviceSettings.pointSizeMult,
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

// Apply CSS enhancement for mobile
if (isMobile) {
    canvas.style.filter = 'brightness(1.3) contrast(1.2) saturate(1.4)';
    canvas.style.opacity = '1.0';
}

// Create Points from Icosahedron Geometry with dynamic quality
const geometry = new THREE.IcosahedronGeometry(2, qualitySettings.subdivisions);
const pointsMaterial = new THREE.ShaderMaterial({
    vertexShader: pointsVertexShader,
    fragmentShader: pointsFragmentShader,
    uniforms: {
        uTime: { value: 0.0 },
        uColorChange: { value: 0.0 },
        uNoiseIntensity: { value: (isMobile ? 0.2 : 0.3) * deviceSettings.noiseReduction },
        uPointSize: { value: qualitySettings.pointSize },
        uCameraPosition: { value: camera.position },
        uOpacity: { value: 0.0 }, // Start invisible
        uScale: { value: 0.0 }, // Start with zero scale
        // Mobile optimization uniforms
        uIsMobile: { value: isMobile },
        uBrightness: { value: deviceSettings.brightness },
        uContrast: { value: deviceSettings.contrast }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

const pointsMesh = new THREE.Points(geometry, pointsMaterial);
scene.add(pointsMesh);

// Enhanced lighting for mobile visibility
const ambientLightIntensity = isMobile ? 0.4 : 0.2;
const ambientLight = new THREE.AmbientLight(0x440000, ambientLightIntensity); // Slightly brighter red for mobile
scene.add(ambientLight);

const directionalLightIntensity = isMobile ? 0.5 : 0.4;
const directionalLight = new THREE.DirectionalLight(0xff2222, directionalLightIntensity); // Brighter red for mobile
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Only add point light if not low-end mobile
let pointLight;
if (!isMobile || !isLowEndDevice) {
    const pointLightIntensity = isMobile ? 0.8 : 0.6;
    pointLight = new THREE.PointLight(0xff1111, pointLightIntensity, 12); // Enhanced for mobile
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

// Touch events for mobile (uncommented and enhanced for better mobile experience)
// window.addEventListener('touchstart', (event) => {
//     isInteracting = true;
//     const touch = event.touches[0];
//     mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
//     mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
// }, { passive: true });

// window.addEventListener('touchmove', (event) => {
//     if (event.touches.length === 1) { // Only handle single touch to avoid conflicts with scrolling
//         const touch = event.touches[0];
//         mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
//         mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
//     }
// }, { passive: true });

// window.addEventListener('touchend', () => {
//     isInteracting = false;
// }, { passive: true });

// Animation parameters with mobile optimization
let animationSpeed = isMobile ? 0.8 : 1.0; // Slightly slower on mobile for better performance
let colorChange = 0.0;
let noiseIntensity = (isMobile ? 0.8 : 1.0) * deviceSettings.intensityBoost;
let pointSize = (isMobile ? 1.5 : 2.0) * deviceSettings.pointSizeMult;

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
    
    // Fade in the orb opacity with higher final value for mobile
    tl.to(pointsMaterial.uniforms.uOpacity, {
        value: isMobile ? 1.2 : 1.0, // Slightly more opaque on mobile
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

// Performance monitoring with mobile-specific adjustments
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
            // Reduce visual effects but maintain visibility
            deviceSettings.intensityBoost *= 0.95;
        } else if (fps > 35 && isMobile) {
            // Performance is good, can increase quality slightly
            deviceSettings.intensityBoost = Math.min(deviceSettings.intensityBoost * 1.02, 1.6);
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

    // Make point light flicker and move with enhanced intensity for mobile (only if it exists)
    if (pointLight) {
        const baseIntensity = isMobile ? 0.8 : 0.6;
        const flickerAmount = isMobile ? 0.3 : 0.2;
        pointLight.intensity = baseIntensity + Math.sin(elapsedTime * 12) * flickerAmount;
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

// Enhanced responsive handling with mobile color adjustments
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
            const newPointSize = (newIsMobile ? 8.0 : 15.0) * deviceSettings.pointSizeMult;
            pointsMaterial.uniforms.uPointSize.value = newPointSize;
            pointsMaterial.uniforms.uIsMobile.value = newIsMobile;
            
            // Update CSS filters
            if (newIsMobile) {
                canvas.style.filter = 'brightness(1.3) contrast(1.2) saturate(1.4)';
            } else {
                canvas.style.filter = 'none';
            }
        }
    }, 150);
});

// Enhanced auto color transition with mobile-friendly transitions
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

// Enhanced visibility check for mobile battery optimization
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause heavy animations but maintain minimal animation for smooth resume
        animationSpeed = 0.1;
    } else {
        // Page is visible again, resume with brief boost for mobile visibility
        animationSpeed = isMobile ? 1.0 : 1.0; // Temporary boost
        setTimeout(() => {
            animationSpeed = isMobile ? 0.8 : 1.0; // Return to normal
        }, 1000);
    }
});

// Screen brightness and orientation change handlers for mobile
if (isMobile) {
    // Handle orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            // Adjust color settings based on new orientation
            const isLandscape = window.innerWidth > window.innerHeight;
            if (isLandscape) {
                // Landscape might have different lighting conditions
                pointsMaterial.uniforms.uBrightness.value = deviceSettings.brightness * 0.9;
            } else {
                // Portrait mode
                pointsMaterial.uniforms.uBrightness.value = deviceSettings.brightness;
            }
        }, 100);
    });
    
    // Handle potential dark mode changes
    if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        darkModeQuery.addEventListener('change', (e) => {
            if (e.matches) {
                // Dark mode - increase brightness more
                pointsMaterial.uniforms.uBrightness.value = deviceSettings.brightness + 0.1;
                pointsMaterial.uniforms.uContrast.value = deviceSettings.contrast + 0.1;
            } else {
                // Light mode - normal settings
                pointsMaterial.uniforms.uBrightness.value = deviceSettings.brightness;
                pointsMaterial.uniforms.uContrast.value = deviceSettings.contrast;
            }
        });
    }
}

// Memory cleanup for mobile
window.addEventListener('beforeunload', () => {
    // Clean up Three.js resources
    geometry.dispose();
    pointsMaterial.dispose();
    renderer.dispose();
});

// Console log for debugging mobile settings
if (isMobile) {
    console.log('Mobile optimizations applied:', {
        deviceSettings,
        qualitySettings,
        isLowEndDevice,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
}