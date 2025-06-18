import * as THREE from "three";
import vertex from "./shaders/vertex.glsl?raw";
import fragment from "./shaders/fragment.glsl?raw";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile(),
  alpha: true,
  powerPreference: "high-performance",
});

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

renderer.setPixelRatio(getDevicePixelRatio());
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("preloader").appendChild(renderer.domElement);

// Key viewport handling variables
let baseViewportHeight = window.innerHeight; // The "reference" viewport height
let currentScaleFactor = 1.0; // Track how much we need to scale to maintain size
let fixedViewportWidth = window.innerWidth;
let fixedViewportHeight = window.innerHeight;

// Calculate the scale factor needed to maintain consistent text size
function calculateScaleFactor() {
  // When viewport gets shorter (URL bar appears), we need to scale UP to maintain size
  // When viewport gets taller (URL bar disappears), we need to scale DOWN
  return baseViewportHeight / window.innerHeight;
}

function createTextTexture(text, color = "white") {
  const width = window.innerWidth;
  const dpr = getDevicePixelRatio();
  const mobile = isMobile();

  let fontScale = 1;
  let geometryScale = 1;

  if (width < 480) {
    fontScale = 0.7;
    geometryScale = 0.6;
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

  let scale;
  if (mobile) {
    scale = Math.max(1.5, dpr * 1.5);
  } else {
    scale = Math.max(2, dpr * 2);
  }

  const baseWidth = mobile ? 512 : 1024;
  const baseHeight = mobile ? 128 : 256;
  const canvasWidth = baseWidth * scale;
  const canvasHeight = baseHeight * scale;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = !mobile;
  if (!mobile) {
    ctx.imageSmoothingQuality = "high";
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = color;

  const baseFontSize = mobile ? 100 : 120;
  const responsiveFontSize = baseFontSize * fontScale;

  ctx.font = `bold ${responsiveFontSize}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, baseWidth / 2, baseHeight / 2);

  const texture = new THREE.CanvasTexture(canvas);

  if (mobile) {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  } else {
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
  }
  texture.generateMipmaps = false;
  texture.anisotropy = mobile ? 1 : renderer.capabilities.getMaxAnisotropy();
  texture.needsUpdate = true;
  return { texture, geometryScale };
}

function getResponsiveLayout() {
  const width = window.innerWidth;

  if (width < 640) {
    const spacing = width < 480 ? 0.4 : 0.6;
    return {
      positions: [0, 0, 0],
      yOffsets: [spacing, 0, -spacing],
    };
  } else {
    const spacing = width < 768 ? 0.9 :0.9;
    return {
      positions: [-spacing, 0, spacing],
      yOffsets: [0, 0, 0],
    };
  }
}

const texts = ["Looks", "Doesn't", "Matter"];
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
      uIsRedWord: { value: text === "Doesn't" },
    },
    transparent: true,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.x = positions[i];
  mesh.position.y = yOffsets[i];
  scene.add(mesh);
  materials.push(material);
});

const textMeshes = [];
const textGroup = new THREE.Group();
let mainContentScene;
let animationComplete = false;

function setupMainContentScene() {
  if (mainContentScene) {
    mainContentScene.clear();
  }
  mainContentScene = new THREE.Scene();
  mainContentScene.add(textGroup);
}

// Modified screenToWorld function - simplified, no compensation needed
function screenToWorld(rect, camera) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Use current viewport - no tricks needed
  const x = (centerX / window.innerWidth) * 2 - 1;
  const y = -(centerY / window.innerHeight) * 2 + 1;
  
  const distance = camera.position.z;
  const vFOV = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const currentAspect = window.innerWidth / window.innerHeight;
  const width = height * currentAspect;
  
  const worldX = x * (width / 2);
  const worldY = y * (height / 2);

  return new THREE.Vector3(worldX, worldY, 0);
}

// Modified getWorldSize function - simplified
function getWorldSize(rect, camera) {
  const distance = camera.position.z;
  const vFOV = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  
  const currentAspect = window.innerWidth / window.innerHeight;
  const width = height * currentAspect;
  
  const worldWidth = (rect.width / window.innerWidth) * width;
  const worldHeight = (rect.height / window.innerHeight) * height;

  return { width: worldWidth, height: worldHeight };
}

// Enhanced isElementInView that accounts for viewport offset
function isElementInView(rect) {
  const mobile = isMobile();
  const vhBuffer = mobile ? 0.25 : 0.1;
  const vwBuffer = mobile ? 0.25 : 0.1;
  
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  const bufferTop = viewportHeight * vhBuffer;
  const bufferBottom = viewportHeight * vhBuffer;
  const bufferLeft = viewportWidth * vwBuffer;
  const bufferRight = viewportWidth * vwBuffer;
  
  const isVisible =
    rect.bottom > -bufferTop &&
    rect.top < viewportHeight + bufferBottom &&
    rect.right > -bufferLeft &&
    rect.left < viewportWidth + bufferRight;

  return isVisible;
}

function createEnhancedTextTexture(
  text,
  fontSize,
  color = "white",
  alignment = "center",
  fontFamily = "Arial",
  fontWeight = "normal"
) {
  const dpr = getDevicePixelRatio();
  const mobile = isMobile();
  let scale;
  if (mobile) {
    scale = Math.max(2, dpr * 1.5);
  } else {
    scale = Math.max(3, dpr * 2);
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const scaledFontSize = fontSize * scale;
  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  const lines = text.split("\n");
  const lineHeight = scaledFontSize * 1.2;
  const maxWidth = Math.max(
    ...lines.map((line) => ctx.measureText(line).width)
  );
  const padding = (mobile ? 10 : 20) * scale;
  const minWidth = mobile ? 256 : 512;
  const minHeight = mobile ? 64 : 128;
  canvas.width = Math.max(maxWidth + padding * 2, minWidth);
  canvas.height = Math.max(lines.length * lineHeight + padding * 2, minHeight);

  ctx.imageSmoothingEnabled = !mobile;
  if (!mobile) {
    ctx.imageSmoothingQuality = "high";
  }
  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${scaledFontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";
  if (alignment === "left") {
    ctx.textAlign = "left";
  } else if (alignment === "right") {
    ctx.textAlign = "right";
  } else {
    ctx.textAlign = "center";
  }

  lines.forEach((line, index) => {
    let x;
    if (alignment === "left") {
      x = padding;
    } else if (alignment === "right") {
      x = canvas.width - padding;
    } else {
      x = canvas.width / 2;
    }

    const y = padding + index * lineHeight;
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

function setupTextMeshes() {
  textGroup.clear();
  textMeshes.length = 0;
  const elements = document.querySelectorAll(".text-canvas");

  // Update base viewport height when setting up meshes
  baseViewportHeight = window.innerHeight;
  currentScaleFactor = 1.0;

  elements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const text = el.innerText.trim();
    const computedStyle = getComputedStyle(el);
    const color = computedStyle.color;

    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    const fontSize = parseFloat(computedStyle.fontSize);
    const textAlign = computedStyle.textAlign;
    const fontFamily = computedStyle.fontFamily || "Arial";
    const fontWeight = computedStyle.fontWeight || "normal";
    const worldPosition = screenToWorld(rect, camera);
    const worldSize = getWorldSize(rect, camera);
    const texture = createEnhancedTextTexture(
      text,
      fontSize,
      color,
      textAlign,
      fontFamily,
      fontWeight
    );
    const geo = new THREE.PlaneGeometry(worldSize.width, worldSize.height);
    const mat = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTime: { value: -1 },
        uCanvasTime: { value: 0 },
        uTextTexture: { value: texture },
        uIsRedWord: { value: false },
      },
      transparent: true,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(worldPosition);
    mesh.visible = true;
    mesh.userData = {
      startTime: null,
      wasVisible: false,
      element: el,
      elementIndex: index,
      baseScale: 1.0 // Store the original scale
    };
    textGroup.add(mesh);
    textMeshes.push({ el, mesh, mat });
  });
}

function updateTextMeshPositions() {
  const mobile = isMobile();
  
  // Calculate current scale factor
  currentScaleFactor = calculateScaleFactor();
  
  textMeshes.forEach(({ el, mesh, mat }, index) => {
    const rect = el.getBoundingClientRect();
    const isVisible = isElementInView(rect);

    if (isVisible) {
      // Update position normally
      const worldPosition = screenToWorld(rect, camera);
      mesh.position.copy(worldPosition);
      
      // Apply scale compensation to maintain consistent size
      mesh.scale.setScalar(currentScaleFactor);
      
      // Update geometry size if needed (for interaction/collision detection)
      const worldSize = getWorldSize(rect, camera);
      const threshold = mobile ? 0.2 : 0.1;
      const currentGeo = mesh.geometry;
      
      // Compare against base size (before scale compensation)
      const baseWorldWidth = worldSize.width / currentScaleFactor;
      const baseWorldHeight = worldSize.height / currentScaleFactor;
      
      const widthDiff = Math.abs(currentGeo.parameters.width - baseWorldWidth);
      const heightDiff = Math.abs(currentGeo.parameters.height - baseWorldHeight);

      if (widthDiff > threshold || heightDiff > threshold) {
        currentGeo.dispose();
        mesh.geometry = new THREE.PlaneGeometry(baseWorldWidth, baseWorldHeight);
      }
      
      mesh.visible = true;
    } else {
      mesh.visible = false;
      mesh.userData.wasVisible = false;
    }
  });
}

// Visual Viewport API handler for additional precision
function setupVisualViewportHandler() {
  if (window.visualViewport && isMobile()) {
    let initialVisualViewportHeight = window.visualViewport.height;
    
    window.visualViewport.addEventListener('resize', () => {
      if (animationComplete) {
        // Update positions immediately when visual viewport changes
        updateTextMeshPositions();
      }
    });
    
    // Reset on significant changes
    window.visualViewport.addEventListener('scroll', () => {
      if (Math.abs(window.visualViewport.height - initialVisualViewportHeight) > 150) {
        initialVisualViewportHeight = window.visualViewport.height;
      }
    });
  }
}

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  if (!animationComplete) {
    materials.forEach((mat) => {
      mat.uniforms.uTime.value = elapsed;
    });
    renderer.render(scene, camera);
    if (elapsed > 6.2) {
      animationComplete = true;
      document.getElementById("preloader").style.display = "none";
      document.getElementById("main-content").style.display = "block";
      const mainContentDiv = document.getElementById("main-content");
      renderer.domElement.style.position = "fixed";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.width = "100vw";
      renderer.domElement.style.height = "100vh";
      renderer.domElement.style.pointerEvents = "none";
      renderer.domElement.style.zIndex = "100";
      mainContentDiv.appendChild(renderer.domElement);
      setupMainContentScene();
      setTimeout(() => {
        setupTextMeshes();
        setupVisualViewportHandler();
      }, 200);
      window.dispatchEvent(new CustomEvent("preloaderComplete"));
    }
  } else {
    textMeshes.forEach(({ el, mesh, mat }) => {
      const rect = el.getBoundingClientRect();
      const isVisible = isElementInView(rect);
      if (isVisible) {
        const worldPosition = screenToWorld(rect, camera);
        mesh.position.copy(worldPosition);
        
        // Apply scale compensation
        mesh.scale.setScalar(currentScaleFactor);
        
        if (!mesh.userData.wasVisible) {
          mesh.userData.startTime = elapsed;
          mesh.userData.wasVisible = true;
        }
        const canvasTime = elapsed - (mesh.userData.startTime || elapsed);
        mat.uniforms.uCanvasTime.value = canvasTime;
        mesh.visible = true;
      } else {
        mesh.visible = false;
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

// Simplified resize handler
window.addEventListener("resize", () => {
  const oldPixelRatio = renderer.getPixelRatio();
  const newPixelRatio = getDevicePixelRatio();
  renderer.setPixelRatio(newPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (animationComplete) {
    const mobile = isMobile();
    
    // Always update camera aspect ratio to prevent stretching
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    // Determine if this is a real resize or just URL bar
    const isRealResize = !mobile || 
      Math.abs(window.innerWidth - fixedViewportWidth) > 10 ||
      Math.abs(window.innerHeight - fixedViewportHeight) > 200;
    
    if (isRealResize) {
      // Real resize - reset base viewport and recreate meshes
      baseViewportHeight = window.innerHeight;
      fixedViewportWidth = window.innerWidth;
      fixedViewportHeight = window.innerHeight;
      
      const debounceTime = mobile ? 300 : 100;
      clearTimeout(window.resizeTimeout);
      window.resizeTimeout = setTimeout(() => {
        setupTextMeshes();
      }, debounceTime);
    } else {
      // URL bar change - just update positions with scale compensation
      updateTextMeshPositions();
    }
  } else {
    // During preloader animation
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
});

// Optimized scroll handler
let lastScrollY = window.scrollY;
let scrollTimeout;

function handleScroll() {
  const currentScrollY = window.scrollY;
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);
  if (scrollDelta > 5) {
    updateTextMeshPositions();
  }
  lastScrollY = currentScrollY;
}

window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(handleScroll, 50);
});

// Event handlers
window.addEventListener("preloaderComplete", () => {
  requestAnimationFrame(() => {
    setTimeout(setupTextMeshes, 300);
  });
  setTimeout(() => {
    const gradient = document.getElementById("gradient");
    if (gradient) {
      gradient.style.opacity = "0.2";
    }
  }, 500);
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  materials.forEach((mat) => {
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