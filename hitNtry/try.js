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

// 🔥 NEW: Configuration for words that should turn red
const RED_WORDS_CONFIG = {
  // Add your words/phrases here - they will turn red when scrolled into view
  words: [
    "doesn`t",
    "don't",
    'care', 
    'Sheersh',
    'frontend',
    'transform',
    'future',
    'success',
    'excellence',
    // Add more words as needed
  ],
  // You can also specify phrases (case-insensitive matching)
  phrases: [
    'cutting edge',
    'next level',
    'game changer',
    // Add more phrases as needed
  ],
  // Color configuration
  redColor: '#ff0000', // Pure red
  normalColor: '#ffffff', // White
  transitionDuration: 0.5 // Seconds for color transition
};

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

  // Check if this preloader text should be red
  const hasRedWords = checkForRedWords(text);
  console.log(`Preloader text "${text}" - hasRedWords: ${hasRedWords}`);

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uTime: { value: 0 },
      uCanvasTime: { value: 0 }, // Add this
      uTextTexture: { value: texture },
      uIsRedWord: { value: hasRedWords }, // Use dynamic detection instead of hardcoded
      uRedTransition: { value: 0.0 }, // Start at 0
      uRedColor: { value: new THREE.Color(RED_WORDS_CONFIG.redColor) },
      uNormalColor: { value: new THREE.Color(RED_WORDS_CONFIG.normalColor) }
    },
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = positions[i];
  mesh.position.y = yOffsets[i];
  
  // Add metadata for red transitions
  mesh.userData = {
    hasRedWords: hasRedWords,
    redTransitionStart: null // Will be set when transition should start
  };
  
  scene.add(mesh);
  materials.push(material);
});

// TEXT-CANVAS MESH SETUP
const textMeshes = [];
const textGroup = new THREE.Group();
let mainContentScene;
// 🔧 NEW: Track processed elements to prevent re-rendering
const processedElements = new WeakSet();

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

// 🔥 NEW: Function to check if text contains red words/phrases
function checkForRedWords(text) {
  const lowerText = text.toLowerCase();
  
  // Create word boundaries for more precise matching
  const words = lowerText.match(/\b\w+\b/g) || [];
  
  // Check for individual words with exact word boundary matching
  for (const word of RED_WORDS_CONFIG.words) {
    const wordLower = word.toLowerCase();
    // Use word boundaries to match complete words only
    const wordRegex = new RegExp(`\\b${wordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (wordRegex.test(lowerText)) {
      return true;
    }
  }
  
  // Check for phrases (keep as is since phrases should match substrings)
  for (const phrase of RED_WORDS_CONFIG.phrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}


// 🔥 NEW: Enhanced text texture creation with red word detection
// 🔥 SIMPLIFIED: Remove canvas-level red word rendering completely
function createEnhancedTextTexture(text, fontSize, color = 'white', alignment = 'center', fontFamily = 'Arial', fontWeight = 'normal') {
  const dpr = getDevicePixelRatio();
  const mobile = isMobile();

  let scale;
  if (mobile) {
    scale = Math.max(2, dpr * 1.5);
  } else {
    scale = Math.max(3, dpr * 2);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const scaledFontSize = fontSize * scale;
  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;

  const lines = text.split('\n');
  const lineHeight = scaledFontSize * 1.2;
  const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));

  const padding = (mobile ? 10 : 20) * scale;
  const minWidth = mobile ? 256 : 512;
  const minHeight = mobile ? 64 : 128;

  canvas.width = Math.max(maxWidth + padding * 2, minWidth);
  canvas.height = Math.max(lines.length * lineHeight + padding * 2, minHeight);

  ctx.imageSmoothingEnabled = !mobile;
  if (!mobile) {
    ctx.imageSmoothingQuality = 'high';
  }

  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  ctx.textBaseline = 'top';

  if (alignment === 'left') {
    ctx.textAlign = 'left';
  } else if (alignment === 'right') {
    ctx.textAlign = 'right';
  } else {
    ctx.textAlign = 'center';
  }

  // 🔥 SIMPLE: Render all text normally - let shader handle red effects
  ctx.fillStyle = color;
  
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
    // Just render the line normally - no special red word handling
    ctx.fillText(line, x, y);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.anisotropy = mobile ? 1 : renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;

  return texture;
}

function createTextMeshForElement(el) {
  const rect = el.getBoundingClientRect();
  const text = el.innerText.trim();
  const computedStyle = getComputedStyle(el);
  const color = computedStyle.color;

  if (rect.width === 0 || rect.height === 0) return null;

  const fontSize = parseFloat(computedStyle.fontSize);
  const textAlign = computedStyle.textAlign;
  const fontFamily = computedStyle.fontFamily || 'Arial';
  const fontWeight = computedStyle.fontWeight || 'normal';

  const worldPosition = screenToWorld(rect, camera);
  const worldSize = getWorldSize(rect, camera);

  const hasRedWords = checkForRedWords(text);
  console.log(`Canvas element "${text}" - hasRedWords: ${hasRedWords}`);
  
  const texture = createEnhancedTextTexture(text, fontSize, color, textAlign, fontFamily, fontWeight);

  const geo = new THREE.PlaneGeometry(worldSize.width, worldSize.height);
  const mat = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: {
      uTime: { value: -1 }, // Signal this is canvas text
      uCanvasTime: { value: 0 },
      uTextTexture: { value: texture },
      uIsRedWord: { value: hasRedWords },
      uRedTransition: { value: 0.0 },
      uRedColor: { value: new THREE.Color(RED_WORDS_CONFIG.redColor) },
      uNormalColor: { value: new THREE.Color(RED_WORDS_CONFIG.normalColor) }
    },
    transparent: true
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(worldPosition);
  mesh.visible = true;

  mesh.userData = {
    startTime: null,
    wasVisible: false,
    element: el,
    everVisible: false,
    hasRedWords: hasRedWords,
    redTransitionStart: null
  };

  return { mesh, mat };
}

// 🔥 FIX 5: Test function to force immediate red transitions
function testRedTransitions() {
  console.log('🧪 Testing red transitions...');
  const currentTime = performance.now();
  
  // Force preloader red transitions
  scene.children.forEach((mesh, index) => {
    if (mesh.userData && mesh.userData.hasRedWords) {
      mesh.userData.redTransitionStart = currentTime;
      console.log(`🔥 Forced red transition for preloader: "${texts[index]}"`);
    }
  });
  
  // Force canvas red transitions
  textMeshes.forEach(({ mesh, el }) => {
    if (mesh.userData.hasRedWords) {
      mesh.userData.redTransitionStart = currentTime;
      console.log(`🔥 Forced red transition for canvas: "${el.innerText.trim()}"`);
    }
  });
}

// 🔧 FIXED: Only create meshes for new elements, keep existing ones
function setupTextMeshes() {
  const elements = document.querySelectorAll('.text-canvas');
  
  elements.forEach((el) => {
    // Skip if already processed
    if (processedElements.has(el)) {
      return;
    }

    const meshData = createTextMeshForElement(el);
    if (meshData) {
      const { mesh, mat } = meshData;
      
      textGroup.add(mesh);
      textMeshes.push({ el, mesh, mat });
      
      // Mark as processed
      processedElements.add(el);
    }
  });
}

// 🔧 FIXED: Only update positions, don't recreate meshes
function updateTextMeshPositions() {
  const mobile = isMobile();

  textMeshes.forEach(({ el, mesh, mat }) => {
    const rect = el.getBoundingClientRect();
    const isVisible = isElementInView(rect);

    if (isVisible) {
      // Update position for scrolling
      const worldPosition = screenToWorld(rect, camera);
      mesh.position.copy(worldPosition);

      // 🔧 FIXED: Once visible, stay visible (don't hide mesh)
      if (!mesh.userData.everVisible) {
        mesh.userData.everVisible = true;
        
        // 🔥 NEW: Start red transition for elements with red words
        if (mesh.userData.hasRedWords && mesh.userData.redTransitionStart === null) {
          mesh.userData.redTransitionStart = performance.now();
          console.log(`Starting red transition for: "${el.innerText.trim()}"`);
        }
      }

      // Only update geometry if there's a significant size change
      // and only if the element hasn't been visible before
      if (!mesh.userData.wasVisible) {
        const worldSize = getWorldSize(rect, camera);
        const threshold = mobile ? 0.3 : 0.2; // Larger threshold to reduce updates
        const currentGeo = mesh.geometry;
        
        if (Math.abs(currentGeo.parameters.width - worldSize.width) > threshold ||
            Math.abs(currentGeo.parameters.height - worldSize.height) > threshold) {
          currentGeo.dispose();
          mesh.geometry = new THREE.PlaneGeometry(worldSize.width, worldSize.height);
        }
      }

      mesh.visible = true;
    } else {
      // 🔧 FIXED: Only hide if it was never visible before
      if (!mesh.userData.everVisible) {
        mesh.visible = false;
      }
      // Don't reset wasVisible anymore - let it stay persistent
    }
  });
}

const clock = new THREE.Clock();
let animationComplete = false;

function animate() {
  const elapsed = clock.getElapsedTime();
  const currentTime = performance.now();

  if (!animationComplete) {
    // PRELOADER PHASE
    materials.forEach((mat, index) => {
      mat.uniforms.uTime.value = elapsed;
      
      // Handle red transitions for preloader text
      const mesh = scene.children[index];
      if (mesh && mesh.userData.hasRedWords && mesh.userData.redTransitionStart !== null) {
        // Check if it's time to start the transition
        if (currentTime >= mesh.userData.redTransitionStart) {
          const transitionStartTime = mesh.userData.redTransitionStart;
          const transitionElapsed = (currentTime - transitionStartTime) / 1000;
          const transitionProgress = Math.min(transitionElapsed / RED_WORDS_CONFIG.transitionDuration, 1.0);
          
          mat.uniforms.uRedTransition.value = transitionProgress;
          
          // Debug log
          if (transitionProgress < 1.0 && transitionProgress > 0) {
            console.log(`Preloader "${texts[index]}" red transition: ${(transitionProgress * 100).toFixed(1)}%`);
          }
        }
      }
    });

    renderer.render(scene, camera);

    if (elapsed > 6.2) {
      animationComplete = true;
      
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

      setTimeout(() => {
        setupTextMeshes();
      }, 200);

      window.dispatchEvent(new CustomEvent('preloaderComplete'));
    }
  } else {
    // MAIN CONTENT PHASE
    textMeshes.forEach(({ el, mesh, mat }) => {
      const rect = el.getBoundingClientRect();
      const isVisible = isElementInView(rect);

      if (isVisible) {
        const worldPosition = screenToWorld(rect, camera);
        mesh.position.copy(worldPosition);

        if (!mesh.userData.wasVisible) {
          mesh.userData.startTime = elapsed;
          mesh.userData.wasVisible = true;
        }

        const canvasTime = elapsed - (mesh.userData.startTime || elapsed);
        mat.uniforms.uCanvasTime.value = canvasTime;

        // 🔥 IMPROVED: Start red transition when element becomes visible
        if (mesh.userData.hasRedWords) {
          if (mesh.userData.redTransitionStart === null) {
            mesh.userData.redTransitionStart = currentTime;
            console.log(`Starting red transition for canvas text: "${el.innerText.trim()}"`);
          }
          
          const transitionElapsed = (currentTime - mesh.userData.redTransitionStart) / 1000;
          const transitionProgress = Math.min(transitionElapsed / RED_WORDS_CONFIG.transitionDuration, 1.0);
          
          mat.uniforms.uRedTransition.value = transitionProgress;
          
          // Debug log
          if (transitionProgress < 1.0 && transitionProgress > 0) {
            console.log(`Canvas "${el.innerText.trim()}" red transition: ${(transitionProgress * 100).toFixed(1)}%`);
          }
        }

        mesh.userData.everVisible = true;
        mesh.visible = true;
      } else {
        if (!mesh.userData.everVisible) {
          mesh.visible = false;
        }
      }
    });

    if (mainContentScene) {
      renderer.render(mainContentScene, camera);
    }
  }

  requestAnimationFrame(animate);
}

animate();

// 🔧 FIXED: Prevent mesh recreation on mobile browser URL bar changes
let isResizing = false;
let resizeTimeout;

window.addEventListener('resize', () => {
  if (isResizing) return; // Prevent multiple simultaneous resize handlers
  isResizing = true;
  
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  // Update pixel ratio on resize (important for device orientation changes)
  renderer.setPixelRatio(getDevicePixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight);

  // 🔧 FIXED: Don't recreate meshes, just update positions
  if (animationComplete) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateTextMeshPositions(); // Only update positions, don't recreate
      isResizing = false;
    }, 100); // Shorter timeout since we're not recreating
  } else {
    isResizing = false;
  }
});

// 🔧 IMPROVED: More efficient scroll handling
let lastScrollY = window.scrollY;
let scrollTimeout;
let isScrolling = false;

function handleScroll() {
  if (isScrolling) return;
  isScrolling = true;
  
  const currentScrollY = window.scrollY;
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);

  // Only update on significant scroll (>3px) - reduced threshold
  if (scrollDelta > 3) {
    updateTextMeshPositions();
  }
  lastScrollY = currentScrollY;
  
  // Reset scroll flag
  setTimeout(() => {
    isScrolling = false;
  }, 16); // ~60fps
}

window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(handleScroll, 16); // Reduced timeout for smoother updates
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

// 🔧 IMPROVED: Cleanup with proper disposal
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

  // Clear the processed elements set
  processedElements.clear();
  
  renderer.dispose();
});

// 🔥 NEW: Utility functions for dynamic red word management
window.TextEffects = {
  // Add new red words at runtime
  addRedWords: function(words) {
    if (Array.isArray(words)) {
      RED_WORDS_CONFIG.words.push(...words);
    } else {
      RED_WORDS_CONFIG.words.push(words);
    }
  },
  
  // Add new red phrases at runtime
  addRedPhrases: function(phrases) {
    if (Array.isArray(phrases)) {
      RED_WORDS_CONFIG.phrases.push(...phrases);
    } else {
      RED_WORDS_CONFIG.phrases.push(phrases);
    }
  },
  
  // Update red color
  setRedColor: function(color) {
    RED_WORDS_CONFIG.redColor = color;
  },
  
  // Get current configuration
  getConfig: function() {
    return { ...RED_WORDS_CONFIG };
  }
};

// 🔥 FIX 6: Enhanced debug function
function debugRedWords() {
  console.log('=== RED WORDS DEBUG ===');
  console.log('RED_WORDS_CONFIG:', RED_WORDS_CONFIG);
  
  // Test detection
  const testTexts = ['Looks', 'Doesn`t', 'Matter', "don't", "care", "frontend"];
  testTexts.forEach(text => {
    const hasRed = checkForRedWords(text);
    console.log(`Text "${text}" -> hasRedWords: ${hasRed}`);
  });
  
  // Check preloader materials
  console.log('\n=== PRELOADER MATERIALS ===');
  materials.forEach((mat, index) => {
    const mesh = scene.children[index];
    console.log(`Preloader ${index} ("${texts[index]}"):`, {
      uIsRedWord: mat.uniforms.uIsRedWord?.value,
      uRedTransition: mat.uniforms.uRedTransition?.value,
      hasRedWords: mesh?.userData?.hasRedWords,
      redTransitionStart: mesh?.userData?.redTransitionStart
    });
  });
  
  // Check canvas text meshes
  console.log('\n=== CANVAS TEXT MESHES ===');
  console.log(`Total text meshes: ${textMeshes.length}`);
  textMeshes.forEach(({ el, mesh, mat }, index) => {
    const text = el.innerText.trim();
    console.log(`Canvas ${index} ("${text}"):`, {
      hasRedWords: mesh.userData.hasRedWords,
      uIsRedWord: mat.uniforms.uIsRedWord?.value,
      uRedTransition: mat.uniforms.uRedTransition?.value,
      redTransitionStart: mesh.userData.redTransitionStart
    });
  });
}


// 🔥 USAGE: Call these functions to test
// Add to your window event listener:
window.addEventListener('preloaderComplete', () => {
  setTimeout(() => {
    debugRedWords();
    
    // Uncomment this line to force immediate red transitions for testing:
    // testRedTransitions();
  }, 1000);
});

// 🔥 QUICK TEST: Add this to console to test immediately
window.forceRedTest = testRedTransitions;
window.debugRed = debugRedWords;