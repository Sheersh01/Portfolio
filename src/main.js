import * as THREE from 'three';
import vertex from './shaders/vertex.glsl?raw';
import fragment from './shaders/fragment.glsl?raw';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile(), // Disable antialiasing on mobile for better performance
  alpha: true,
  powerPreference: "high-performance" // Request high-performance GPU on mobile
});

// Enhanced mobile detection
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768;
}

// Get device pixel ratio with mobile-specific caps
function getDevicePixelRatio() {
  if (isMobile()) {
    return Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x on mobile
  }
  return Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x on desktop
}

// 🔧 FIX 1: Set pixel ratio immediately after creating renderer
renderer.setPixelRatio(getDevicePixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('preloader').appendChild(renderer.domElement);

function createTextTexture(text, color = 'white') {
  // Enhanced responsive scaling with mobile-first approach
  const width = window.innerWidth;
  const dpr = getDevicePixelRatio();
  const mobile = isMobile();

  let fontScale = 1;
  let geometryScale = 1;

  if (width < 480) {
    fontScale = 0.7; // Slightly smaller for very small screens
    geometryScale = 0.6; // More aggressive scaling
  } else if (width < 640) {
    fontScale = 0.6;
    geometryScale = 0.6;
  } else if (width < 768) {
    fontScale = 0.8;
    geometryScale = 0.8;
  } else if (width < 1024) {
    fontScale = 0.75;
    geometryScale = 0.75;
  } else if (width < 1280) {
    fontScale = 0.6;
    geometryScale = 1.0;
  } else {
    fontScale = 0.8;
    geometryScale = 1.0;
  }

  // 🔧 FIX 4: Mobile-optimized texture scaling
  let scale;
  if (mobile) {
    scale = Math.max(1.5, dpr * 1.5); // Lower minimum for mobile
  } else {
    scale = Math.max(2, dpr * 2);
  }

  const baseWidth = mobile ? 512 : 1024; // Smaller base size for mobile
  const baseHeight = mobile ? 128 : 256;
  const canvasWidth = baseWidth * scale;
  const canvasHeight = baseHeight * scale;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Mobile-optimized rendering settings
  ctx.imageSmoothingEnabled = !mobile; // Disable on mobile for performance
  if (!mobile) {
    ctx.imageSmoothingQuality = 'high';
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = color;

  // Apply responsive font sizing
  const baseFontSize = mobile ? 100 : 120; // Smaller base font for mobile
  const responsiveFontSize = baseFontSize * fontScale;

  ctx.font = `bold ${responsiveFontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, baseWidth / 2, baseHeight / 2);

  const texture = new THREE.CanvasTexture(canvas);

  // Mobile-optimized filtering
  if (mobile) {
    texture.minFilter = THREE.LinearFilter; // Always use linear on mobile
    texture.magFilter = THREE.LinearFilter;
  } else {
    // 🔧 FIX 3: Option for sharper filtering on desktop
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }

  texture.generateMipmaps = false;
  texture.anisotropy = mobile ? 1 : renderer.capabilities.getMaxAnisotropy(); // Disable anisotropy on mobile
  texture.needsUpdate = true;

  return { texture, geometryScale };
}

// Enhanced responsive layout with better mobile handling
function getResponsiveLayout() {
  const width = window.innerWidth;
  // const mobile = isMobile();

  if (width < 640) {
    // Vertical stack for mobile with tighter spacing
    const spacing = width < 480 ? 0.4 : 0.6;
    return {
      positions: [0, 0, 0], // All centered horizontally
      yOffsets: [spacing, 0, -spacing] // Vertical stack
    };
  } else {
    // Horizontal layout for larger screens
    const spacing = width < 768 ? 0.9 : 1.0;
    return {
      positions: [-spacing, 0, spacing],
      yOffsets: [0, 0, 0]
    };
  }
}

// Update your preloader setup section
const texts = ['Looks', 'Doesn`t', 'Matter'];
const materials = [];

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

function isElementInView(rect) {
  const mobile = isMobile();
  // Use percentage-based buffers for better responsiveness
  const vhBuffer = mobile ? 0.25 : 0.1; // 25% on mobile, 10% on desktop
  const vwBuffer = mobile ? 0.25 : 0.1;

  const bufferTop = window.innerHeight * vhBuffer;
  const bufferBottom = window.innerHeight * vhBuffer;
  const bufferLeft = window.innerWidth * vwBuffer;
  const bufferRight = window.innerWidth * vwBuffer;

  return (
    rect.bottom > -bufferTop &&
    rect.top < window.innerHeight + bufferBottom &&
    rect.right > -bufferLeft &&
    rect.left < window.innerWidth + bufferRight
  );
}

// Mobile-optimized text texture creation
function createEnhancedTextTexture(text, fontSize, color = 'white', alignment = 'center', fontFamily = 'Arial', fontWeight = 'normal') {
  const dpr = getDevicePixelRatio();
  const mobile = isMobile();

  // 🔧 FIX 4: Mobile-optimized scaling
  let scale;
  if (mobile) {
    scale = Math.max(2, dpr * 1.5); // Lower scaling for mobile
  } else {
    scale = Math.max(3, dpr * 2);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Set font to measure text with scaled font size
  const scaledFontSize = fontSize * scale;
  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;

  // Handle multi-line text
  const lines = text.split('\n');
  const lineHeight = scaledFontSize * 1.2;
  const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));

  // Calculate canvas size with proper padding - mobile optimized
  const padding = (mobile ? 10 : 20) * scale;
  const minWidth = mobile ? 256 : 512;
  const minHeight = mobile ? 64 : 128;

  canvas.width = Math.max(maxWidth + padding * 2, minWidth);
  canvas.height = Math.max(lines.length * lineHeight + padding * 2, minHeight);

  // Mobile-optimized rendering settings
  ctx.imageSmoothingEnabled = !mobile; // Disable on mobile
  if (!mobile) {
    ctx.imageSmoothingQuality = 'high';
  }

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

  // Mobile-optimized texture settings
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = mobile ? 1 : renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;

  return texture;
}

// Mobile-optimized mesh setup with culling
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

    // Create texture with mobile-optimized settings
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

// Mobile-optimized update with frustum culling
function updateTextMeshPositions() {
  const mobile = isMobile();

  textMeshes.forEach(({ el, mesh, mat }) => {
    const rect = el.getBoundingClientRect();

    // More aggressive culling on mobile
    const isVisible = isElementInView(rect);

    if (isVisible) {
      // Update position for scrolling
      const worldPosition = screenToWorld(rect, camera);
      const worldSize = getWorldSize(rect, camera);

      mesh.position.copy(worldPosition);

      // Less frequent geometry updates on mobile
      const threshold = mobile ? 0.2 : 0.1;
      const currentGeo = mesh.geometry;
      if (Math.abs(currentGeo.parameters.width - worldSize.width) > threshold ||
        Math.abs(currentGeo.parameters.height - worldSize.height) > threshold) {

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
    // MAIN CONTENT PHASE - Text canvas effects with mobile optimization
    textMeshes.forEach(({ el, mesh, mat }) => {
      const rect = el.getBoundingClientRect();

      // More aggressive culling on mobile
      const isVisible = isElementInView(rect);

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

// 🔧 FIX 2: Enhanced resize handler with mobile-specific optimizations
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update pixel ratio on resize (important for device orientation changes)
  renderer.setPixelRatio(getDevicePixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (animationComplete) {
    // Longer debounce on mobile to reduce CPU usage
    const debounceTime = isMobile() ? 200 : 100;
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      setupTextMeshes(); // Recalculate positions on resize
    }, debounceTime);
  }
});

// NEW: Improved scroll handling with delta check
let lastScrollY = window.scrollY;
let scrollTimeout;

function handleScroll() {
  const currentScrollY = window.scrollY;
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);

  // Only update on significant scroll (>5px)
  if (scrollDelta > 5) {
    updateTextMeshPositions();
  }
  lastScrollY = currentScrollY;
}

window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(handleScroll, 50);
});

// Additional setup when preloader completes
window.addEventListener('preloaderComplete', () => {
  // Wait for browser to finish rendering
  requestAnimationFrame(() => {
    setTimeout(setupTextMeshes, 300);
  });
  setTimeout(() => {
  document.getElementById('gradient').style.opacity = '0.2';
}, 500); 
});

// Memory cleanup on page unload (important for mobile)
window.addEventListener('beforeunload', () => {
  // Dispose of geometries and materials
  materials.forEach(mat => {
    if (mat.uniforms.uTextTexture.value) {
      mat.uniforms.uTextTexture.value.dispose();
    }
    mat.dispose();
  });

  textMeshes.forEach(({ mesh, mat }) => {
    mesh.geometry.dispose();
    if (mat.uniforms.uTextTexture.value) {
      mat.uniforms.uTextTexture.value.dispose();
    }
    mat.dispose();
  });

  renderer.dispose();
});
