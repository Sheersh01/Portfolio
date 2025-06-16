import * as THREE from 'three'; 
import vertex from './shaders/vertex.glsl?raw'; 
import fragment from './shaders/fragment.glsl?raw'; 
 
const scene = new THREE.Scene(); 
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100); 
camera.position.z = 5; 
 
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); 
renderer.setSize(window.innerWidth, window.innerHeight); 
document.getElementById('preloader').appendChild(renderer.domElement); 

// Get device pixel ratio for high-DPI displays
function getDevicePixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance
}
 
function createTextTexture(text, color = 'white') { 
  // Enhanced responsive scaling with device pixel ratio
  const width = window.innerWidth;
  const dpr = getDevicePixelRatio();
  
  let fontScale = 1;
  let geometryScale = 1;
  
  if (width < 480) {
    fontScale = 0.8;
    geometryScale = 0.5;
  } else if (width < 640) {
    fontScale = 0.8;
    geometryScale = 0.8;
  } else if (width < 768) {
    fontScale = 0.7;
    geometryScale = 0.8;
  } else if (width < 1024) {
    fontScale = 0.85;
    geometryScale = 0.9;
  } else if (width < 1280) {
    fontScale = 0.8;
    geometryScale = 1.0;
  } else {
    fontScale = 0.8;
    geometryScale = 1.25;
  }

  // Increased scale factor for better quality, especially on mobile
  const scale = Math.max(4, dpr * 2); // Minimum 4x, scales with device pixel ratio
  const baseWidth = 1024; 
  const baseHeight = 256; 
  const canvasWidth = baseWidth * scale; 
  const canvasHeight = baseHeight * scale; 
 
  const canvas = document.createElement('canvas'); 
  canvas.width = canvasWidth; 
  canvas.height = canvasHeight; 
  const ctx = canvas.getContext('2d'); 
 
  // Enable high-quality text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.textRenderingOptimization = 'optimizeQuality';
 
  ctx.scale(scale, scale); 
  ctx.fillStyle = color; 
  
  // Apply responsive font sizing
  const baseFontSize = 120;
  const responsiveFontSize = baseFontSize * fontScale;
  
  ctx.font = `bold ${responsiveFontSize}px Arial`; 
  ctx.textAlign = 'center'; 
  ctx.textBaseline = 'middle'; 
  ctx.fillText(text, baseWidth / 2, baseHeight / 2); 
 
  const texture = new THREE.CanvasTexture(canvas); 
  texture.minFilter = THREE.LinearFilter; 
  texture.magFilter = THREE.LinearFilter; // Important for upscaling quality
  texture.generateMipmaps = false; 
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); 
  texture.needsUpdate = true; 
 
  return { texture, geometryScale }; 
}

// Update your preloader setup section
const texts = ['Looks', 'Doesn`t', 'Matter']; 
const materials = []; 

// Responsive positioning
function getResponsiveLayout() {
  const width = window.innerWidth;
  
  if (width < 640) {
    // Vertical stack for mobile
    const spacing = width < 480 ? 0.5 : 1.1;
    return {
        positions: [-spacing, 0, spacing],
      yOffsets: [0.0, 0, 0.0] // Adjust spacing as needed
    };
  } else {
    // Horizontal layout for larger screens
    const spacing = width < 1024 ? 1.0 : 1.1;
    return {
      positions: [-spacing, 0, spacing],
      yOffsets: [0, 0, 0]
    };
  }
}

const { positions, yOffsets } = getResponsiveLayout();

texts.forEach((text, i) => { 
  const { texture, geometryScale } = createTextTexture(text);
  
  const geometry = new THREE.PlaneGeometry(
    2.5 * geometryScale, 
    0.625 * geometryScale
  ); 
  
  const material = new THREE.ShaderMaterial({ 
    vertexShader: vertex, 
    fragmentShader: fragment, 
    uniforms: { 
      uTime: { value: 0 }, 
      uTextTexture: { value: texture }, 
      uIsRedWord: { value: text === 'Doesn`t' } 
    }, 
    transparent: true, 
  }); 
 
  const mesh = new THREE.Mesh(geometry, material); 
  mesh.position.x = positions[i];
  mesh.position.y = yOffsets[i];
  scene.add(mesh); 
  materials.push(material); 
});

// TEXT-CANVAS MESH SETUP
const textMeshes = [];
const textGroup = new THREE.Group();
let mainContentScene;

function setupMainContentScene() {
  if (mainContentScene) {
    mainContentScene.clear();
  }
  mainContentScene = new THREE.Scene();
  mainContentScene.add(textGroup);
}

// Enhanced coordinate conversion functions
function screenToWorld(rect, camera) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const x = (centerX / window.innerWidth) * 2 - 1;
  const y = -(centerY / window.innerHeight) * 2 + 1;
  
  const distance = camera.position.z;
  const vFOV = camera.fov * Math.PI / 180;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const width = height * camera.aspect;
  
  const worldX = x * (width / 2);
  const worldY = y * (height / 2);
  
  return new THREE.Vector3(worldX, worldY, 0);
}

function getWorldSize(rect, camera) {
  const distance = camera.position.z;
  const vFOV = camera.fov * Math.PI / 180;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const width = height * camera.aspect;
  
  const worldWidth = (rect.width / window.innerWidth) * width;
  const worldHeight = (rect.height / window.innerHeight) * height;
  
  return { width: worldWidth, height: worldHeight };
}

// SIGNIFICANTLY IMPROVED text texture creation for canvas text
function createEnhancedTextTexture(text, fontSize, color = 'white', alignment = 'center', fontFamily = 'Arial', fontWeight = 'normal') {
  const dpr = getDevicePixelRatio();
  
  // Much higher scale factor for canvas text quality
  const scale = Math.max(6, dpr * 3); // Minimum 6x, scales with device pixel ratio
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set font to measure text with scaled font size
  const scaledFontSize = fontSize * scale;
  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  
  // Handle multi-line text
  const lines = text.split('\n');
  const lineHeight = scaledFontSize * 1.2;
  const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  
  // Calculate canvas size with proper padding
  const padding = 20 * scale;
  canvas.width = Math.max(maxWidth + padding * 2, 512);
  canvas.height = Math.max(lines.length * lineHeight + padding * 2, 128);
  
  // CRITICAL: Enable high-quality rendering settings
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.textRenderingOptimization = 'optimizeQuality';
  
  // Clear and set up context again after resizing
  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';
  
  // Set text alignment
  if (alignment === 'left') {
    ctx.textAlign = 'left';
  } else if (alignment === 'right') {
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'center';
  }
  
  // Draw each line
  lines.forEach((line, index) => {
    let x;
    if (alignment === 'left') {
      x = padding;
    } else if (alignment === 'right') {
      x = canvas.width - padding;
    } else {
      x = canvas.width / 2;
    }
    
    const y = padding + index * lineHeight;
    ctx.fillText(line, x, y);
  });
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter; // Critical for quality
  texture.generateMipmaps = false;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  
  return texture;
}

function setupTextMeshes() {
  console.log('Setting up text meshes...');
  textGroup.clear();
  textMeshes.length = 0;

  const elements = document.querySelectorAll('.text-canvas');
  console.log('Found elements:', elements.length);

  elements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const text = el.innerText.trim();
    const computedStyle = getComputedStyle(el);
    const color = computedStyle.color;
    
    if (rect.width === 0 || rect.height === 0) return; // Skip invisible elements

    // Get font size from computed style
    const fontSize = parseFloat(computedStyle.fontSize);
    
    // Get text alignment
    const textAlign = computedStyle.textAlign;
    
    // Get font family and weight
    const fontFamily = computedStyle.fontFamily || 'Arial';
    const fontWeight = computedStyle.fontWeight || 'normal';

    const worldPosition = screenToWorld(rect, camera);
    const worldSize = getWorldSize(rect, camera);

    // Create texture with ENHANCED quality settings
    const texture = createEnhancedTextTexture(text, fontSize, color, textAlign, fontFamily, fontWeight);

    const geo = new THREE.PlaneGeometry(worldSize.width, worldSize.height);
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: -1 }, // Signal this is canvas text
        uCanvasTime: { value: 0 }, // NEW: Separate time variable for canvas effects
        uTextTexture: { value: texture },
        uIsRedWord: { value: false }
      },
      transparent: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(worldPosition);
    mesh.visible = true;
    
    // Track animation state
    mesh.userData = {
      startTime: null,
      wasVisible: false,
      element: el // Store reference to original element
    };
    
    textGroup.add(mesh);
    textMeshes.push({ el, mesh, mat });
  });
  
  console.log('Total text meshes created:', textMeshes.length);
}

// Enhanced update function for better responsiveness
function updateTextMeshPositions() {
  textMeshes.forEach(({ el, mesh, mat }) => {
    const rect = el.getBoundingClientRect();
    const computedStyle = getComputedStyle(el);
    
    const isVisible = rect.bottom > 0 && rect.top < window.innerHeight && 
                     rect.right > 0 && rect.left < window.innerWidth;
    
    if (isVisible) {
      // Update position for scrolling
      const worldPosition = screenToWorld(rect, camera);
      const worldSize = getWorldSize(rect, camera);
      
      mesh.position.copy(worldPosition);
      
      // Update geometry if size changed significantly
      const currentGeo = mesh.geometry;
      if (Math.abs(currentGeo.parameters.width - worldSize.width) > 0.1 ||
          Math.abs(currentGeo.parameters.height - worldSize.height) > 0.1) {
        
        currentGeo.dispose();
        mesh.geometry = new THREE.PlaneGeometry(worldSize.width, worldSize.height);
      }
      
      mesh.visible = true;
    } else {
      mesh.visible = false;
      // Reset when out of view so it can animate again when back in view
      mesh.userData.wasVisible = false;
    }
  });
}
 
const clock = new THREE.Clock(); 
let animationComplete = false;

function animate() { 
  const elapsed = clock.getElapsedTime(); 
  
  if (!animationComplete) {
    // PRELOADER PHASE - Keep your original perfect logic
    materials.forEach((mat) => { 
      mat.uniforms.uTime.value = elapsed; 
    }); 
   
    renderer.render(scene, camera); 
   
    // When preloader animation is complete - Your original timing!
    if (elapsed > 6.2) { 
      animationComplete = true;
      
      console.log('Preloader complete, transitioning to main content...');
      
      // Hide preloader and show main content
      document.getElementById('preloader').style.display = 'none'; 
      document.getElementById('main-content').style.display = 'block'; 
      
      // Move renderer canvas to main content
      const mainContentDiv = document.getElementById('main-content');
      renderer.domElement.style.position = 'fixed';
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      renderer.domElement.style.width = '100vw';
      renderer.domElement.style.height = '100vh';
      renderer.domElement.style.pointerEvents = 'none';
      renderer.domElement.style.zIndex = '100';
      mainContentDiv.appendChild(renderer.domElement);
      
      setupMainContentScene();
      
      // Setup text meshes after DOM settles
      setTimeout(() => {
        setupTextMeshes();
      }, 200);
      
      // Dispatch custom event to signal home page animation can start
      window.dispatchEvent(new CustomEvent('preloaderComplete'));
    } 
  } else {
    // MAIN CONTENT PHASE - Text canvas effects
    textMeshes.forEach(({ el, mesh, mat }) => {
      const rect = el.getBoundingClientRect();
      
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight && 
                       rect.right > 0 && rect.left < window.innerWidth;
      
      if (isVisible) {
        // Update position for scrolling
        const worldPosition = screenToWorld(rect, camera);
        mesh.position.copy(worldPosition);
        
        // Handle separate canvas time
        if (!mesh.userData.wasVisible) {
          mesh.userData.startTime = elapsed;
          mesh.userData.wasVisible = true;
        }
        
        // Use separate time variables
        const canvasTime = elapsed - (mesh.userData.startTime || elapsed);
        mat.uniforms.uCanvasTime.value = canvasTime; // Use this for canvas-specific effects
        
        mesh.visible = true;
      } else {
        mesh.visible = false;
        // Reset when out of view so it can animate again when back in view
        mesh.userData.wasVisible = false;
      }
    });

    if (mainContentScene) {
      renderer.render(mainContentScene, camera);
    }
  }

  requestAnimationFrame(animate); 
} 
 
animate(); 
 
// Enhanced resize handler
window.addEventListener('resize', () => { 
  camera.aspect = window.innerWidth / window.innerHeight; 
  camera.updateProjectionMatrix(); 
  renderer.setSize(window.innerWidth, window.innerHeight); 
  
  if (animationComplete) {
    // Debounce resize to avoid too many recalculations
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      setupTextMeshes(); // Recalculate positions on resize
    }, 100);
  }
});

// Handle scrolling with throttling
let scrollTimeout;
window.addEventListener('scroll', () => {
  if (animationComplete && !scrollTimeout) {
    scrollTimeout = setTimeout(() => {
      updateTextMeshPositions();
      scrollTimeout = null;
    }, 16); // ~60fps
  }
});

// Additional setup when preloader completes
window.addEventListener('preloaderComplete', () => {
  setTimeout(setupTextMeshes, 100);
});