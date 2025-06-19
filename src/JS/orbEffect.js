// Scene Setup
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import pointsVertexShader from '../shaders/orbVertex.glsl?raw';
import pointsFragmentShader from '../shaders/orbFragment.glsl?raw';

gsap.registerPlugin(ScrollTrigger);

// Enhanced mobile detection and device capabilities
function isMobile() {
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
        ) || window.innerWidth < 768
    );
}

function getDevicePixelRatio() {
    if (isMobile()) {
        return Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x on mobile
    }
    return Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x on desktop
}

const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;
const mobile = isMobile();

// Advanced viewport tracking - following the reference pattern
let baseViewportHeight = window.innerHeight; // The "reference" viewport height
let currentScaleFactor = 1.0; // Track how much we need to scale to maintain size
let fixedViewportWidth = window.innerWidth;
let fixedViewportHeight = window.innerHeight;

// Calculate the scale factor needed to maintain consistent orb size
function calculateScaleFactor() {
    // When viewport gets shorter (URL bar appears), we need to scale UP to maintain size
    // When viewport gets taller (URL bar disappears), we need to scale DOWN
    return baseViewportHeight / window.innerHeight;
}

// Enhanced viewport dimension getter with visual viewport support
const getViewportDimensions = () => {
    if (window.visualViewport && mobile) {
        return {
            width: window.visualViewport.width,
            height: window.visualViewport.height
        };
    }
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
};

// Initialize dimensions
const viewport = getViewportDimensions();
baseViewportHeight = viewport.height;
fixedViewportWidth = viewport.width;
fixedViewportHeight = viewport.height;

// Dynamic quality settings based on device
const qualitySettings = {
    subdivisions: mobile ? (isLowEndDevice ? 70 : 70) : 80,
    pixelRatio: getDevicePixelRatio(),
    pointSize: mobile ? 8.0 : 15.0,
    antialias: !mobile || !isLowEndDevice,
    shadowMapEnabled: false, // Disable shadows for mobile
    maxLights: mobile ? 2 : 3
};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, fixedViewportWidth / fixedViewportHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ 
    canvas: canvas, 
    antialias: qualitySettings.antialias, 
    alpha: true,
    powerPreference: mobile ? "low-power" : "high-performance"
});

// Set initial size using fixed viewport dimensions
renderer.setSize(fixedViewportWidth, fixedViewportHeight);
renderer.setPixelRatio(qualitySettings.pixelRatio);
renderer.setClearColor(0x000000, 1);

// Disable unnecessary features for mobile
if (mobile) {
    renderer.shadowMap.enabled = false;
    renderer.physicallyCorrectLights = false;
}

const radius = mobile ? 1.5 : 2;

// Create Points from Icosahedron Geometry with dynamic quality
const geometry = new THREE.IcosahedronGeometry(radius, qualitySettings.subdivisions);
const pointsMaterial = new THREE.ShaderMaterial({
    vertexShader: pointsVertexShader,
    fragmentShader: pointsFragmentShader,
    uniforms: {
        uTime: { value: 0.0 },
        uColorChange: { value: 0.0 },
        uNoiseIntensity: { value: mobile ? 0.2 : 0.3 },
        uPointSize: { value: qualitySettings.pointSize },
        uCameraPosition: { value: camera.position },
        uOpacity: { value: 0.0 }, // Start invisible
        uScale: { value: 0.0 }, // Start with zero scale
        uIsMobile: { value: mobile }    
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});

const pointsMesh = new THREE.Points(geometry, pointsMaterial);
scene.add(pointsMesh);

// Store original orb scale for compensation
let originalOrbScale = 1.0;

// Optimized Lighting for mobile
const ambientLight = new THREE.AmbientLight(0x330000, mobile ? 0.3 : 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xff0000, mobile ? 0.3 : 0.4);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Only add point light if not low-end mobile
let pointLight;
if (!mobile || !isLowEndDevice) {
    pointLight = new THREE.PointLight(0xff0000, 0.6, 12);
    pointLight.position.set(0, 0, 3);
    scene.add(pointLight);
}

// Enhanced touch and mouse interaction
let mouseX = 0, mouseY = 0;
let isInteracting = false;

// Mouse events with viewport-aware coordinates
window.addEventListener('mousemove', (event) => {
    if (!isInteracting) {
        const viewport = getViewportDimensions();
        mouseX = (event.clientX / viewport.width) * 2 - 1;
        mouseY = -(event.clientY / viewport.height) * 2 + 1;
    }
});

// Animation parameters with mobile optimization
let animationSpeed = mobile ? 0.8 : 1.0;
let colorChange = 0.0;
let noiseIntensity = mobile ? 0.8 : 1.0;
let pointSize = mobile ? 1.5 : 2.0;

// Frame rate management for mobile
let lastTime = 0;
const targetFPS = mobile ? 30 : 60;
const frameInterval = 1000 / targetFPS;

// Function to update orb positioning and scaling with viewport compensation
function updateOrbScale() {
    // Calculate current scale factor
    currentScaleFactor = calculateScaleFactor();
    
    // Apply scale compensation to maintain consistent orb size
    const compensatedScale = originalOrbScale * currentScaleFactor;
    pointsMesh.scale.setScalar(compensatedScale);
    
    // Adjust camera if needed to maintain relative positioning
    const baseCameraZ = 5;
    camera.position.z = baseCameraZ * currentScaleFactor;
}

// Visual Viewport API handler for additional precision
function setupVisualViewportHandler() {
    if (window.visualViewport && mobile) {
        let initialVisualViewportHeight = window.visualViewport.height;
        
        window.visualViewport.addEventListener('resize', () => {
            // Update orb scale immediately when visual viewport changes
            updateOrbScale();
        });
        
        // Reset on significant changes
        window.visualViewport.addEventListener('scroll', () => {
            if (Math.abs(window.visualViewport.height - initialVisualViewportHeight) > 150) {
                initialVisualViewportHeight = window.visualViewport.height;
            }
        });
    }
}

// GSAP Fade-in Animation - Only starts after preloader completes
function initializeAnimations() {
    // Add loaded class to body to prevent color flash
    document.body.classList.add('loaded');
    
    // Create a master timeline
    const tl = gsap.timeline();
    
    // Fade in canvas
    tl.to(canvas, {
        opacity: 1,
        duration: mobile ? 1 : 1.5,
        ease: "power2.out"
    });
    
    // Fade in the orb opacity
    tl.to(pointsMaterial.uniforms.uOpacity, {
        value: 1.0,
        duration: mobile ? 1.5 : 2,
        ease: "power2.out"
    }, "-=1");
    
    // Slow, smooth scale up the orb - store this as original scale
    tl.to(pointsMaterial.uniforms.uScale, {
        value: 1.0,
        duration: mobile ? 3 : 4,
        ease: "power2.out",
        onUpdate: function() {
            originalOrbScale = pointsMaterial.uniforms.uScale.value;
        }
    }, "-=2.0");
    
    const heroText = document.querySelectorAll("#hero h1");
    tl.to(heroText, {
        opacity: 1,
        y: 0,
        duration: mobile ? 1.5 : 2,
        stagger: 0.3,
        ease: "power3.out"
    }, "-=2.5");
    
    const navText = document.querySelectorAll("nav");
    tl.to(navText, {
        opacity: 1,
        y: 0,
        duration: mobile ? 1.5 : 2,
        stagger: 0.3,
        ease: "power3.out"
    }, "-=2.5");
    
    // Setup viewport handler after animations
    setupVisualViewportHandler();
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
        if (fps < 20 && mobile) {
            // Reduce particle count or other quality settings
            pointsMaterial.uniforms.uNoiseIntensity.value *= 0.8;
            animationSpeed *= 0.9;
        }
        
        frameCount = 0;
        lastFPSCheck = now;
    }
}

// Animation Loop with frame rate control and viewport compensation
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
    const rotationMultiplier = mobile ? 0.7 : 1.0;
    pointsMesh.rotation.y = elapsedTime * 0.15 * rotationMultiplier + mouseX * (mobile ? 0.2 : 0.3);
    pointsMesh.rotation.x = Math.sin(elapsedTime * 0.2) * 0.2 * rotationMultiplier + mouseY * (mobile ? 0.15 : 0.2);
    pointsMesh.rotation.z = Math.cos(elapsedTime * 0.1) * 0.1 * rotationMultiplier;

    // Reduced camera movement intensity on mobile with scale compensation
    const cameraMultiplier = mobile ? 0.5 : 1.0;
    const baseCameraZ = 5;
    camera.position.x = Math.sin(elapsedTime * 0.3) * 0.8 * cameraMultiplier;
    camera.position.y = Math.cos(elapsedTime * 0.2) * 0.6 * cameraMultiplier;
    camera.position.z = baseCameraZ + Math.sin(elapsedTime * 0.1) * 0.5 * cameraMultiplier;
    camera.lookAt(scene.position);

    // Apply ongoing scale compensation for viewport changes
    updateOrbScale();

    // Make point light flicker and move (only if it exists)
    if (pointLight) {
        pointLight.intensity = 0.6 + Math.sin(elapsedTime * 12) * 0.2;
        pointLight.position.x = Math.sin(elapsedTime * 0.5) * 2;
        pointLight.position.y = Math.cos(elapsedTime * 0.7) * 2;
    }

    renderer.render(scene, camera);
    
    // Performance monitoring
    if (mobile) {
        checkPerformance();
    }
    
    requestAnimationFrame(animate);
}

animate();

// Enhanced resize handler following reference pattern
let resizeTimeout;

function handleResize() {
    const viewport = getViewportDimensions();
    
    // Determine if this is a real resize or just URL bar behavior
    const isRealResize = !mobile || 
        Math.abs(viewport.width - fixedViewportWidth) > 10 ||
        Math.abs(viewport.height - fixedViewportHeight) > 200;
    
    if (isRealResize) {
        // Real resize - reset base viewport and update everything
        baseViewportHeight = viewport.height;
        fixedViewportWidth = viewport.width;
        fixedViewportHeight = viewport.height;
        currentScaleFactor = 1.0;
        
        // Update camera and renderer
        camera.aspect = viewport.width / viewport.height;
        camera.updateProjectionMatrix();
        renderer.setSize(viewport.width, viewport.height);
        renderer.setPixelRatio(getDevicePixelRatio());
        
        // Update point size if device type changed
        const newIsMobile = viewport.width < 768;
        if (newIsMobile !== mobile) {
            pointsMaterial.uniforms.uPointSize.value = newIsMobile ? 8.0 : 15.0;
        }
    } else {
        // URL bar change - just update scale compensation
        updateOrbScale();
        
        // Update camera aspect ratio to prevent stretching
        camera.aspect = viewport.width / viewport.height;
        camera.updateProjectionMatrix();
    }
}

// Handle regular resize events with debouncing
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    const debounceTime = mobile ? 300 : 100;
    resizeTimeout = setTimeout(handleResize, debounceTime);
});

// Handle visual viewport changes (for URL bar hide/show) with immediate response
if (window.visualViewport && mobile) {
    window.visualViewport.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleResize, 50);
    });
}

// Handle orientation changes specifically
window.addEventListener('orientationchange', () => {
    // Wait for orientation change to complete
    setTimeout(() => {
        const viewport = getViewportDimensions();
        baseViewportHeight = viewport.height;
        fixedViewportWidth = viewport.width;
        fixedViewportHeight = viewport.height;
        currentScaleFactor = 1.0;
        handleResize();
    }, 500);
});

// Optimized auto color transition with longer intervals on mobile
const colorTransitionInterval = mobile ? 5000 : 3000;
setInterval(() => {
    if (Math.random() > 0.7) {
        const targetColor = Math.random();
        const currentColor = colorChange;
        const steps = mobile ? 30 : 60; // Fewer steps on mobile
        let step = 0;
        
        const colorTransition = setInterval(() => {
            step++;
            colorChange = currentColor + (targetColor - currentColor) * (step / steps);
            
            if (step >= steps) {
                clearInterval(colorTransition);
            }
        }, mobile ? 100 : 50); // Slower transition on mobile
    }
}, colorTransitionInterval);

// Pause animation when page is not visible (mobile battery optimization)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, pause heavy animations
        animationSpeed = 0;
    } else {
        // Page is visible again, resume
        animationSpeed = mobile ? 0.8 : 1.0;
    }
});

// Memory cleanup for mobile
window.addEventListener('beforeunload', () => {
    // Clean up Three.js resources
    geometry.dispose();
    pointsMaterial.dispose();
    renderer.dispose();
});