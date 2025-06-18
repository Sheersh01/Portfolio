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
  texture.anisotropy = mobile ? 1 : renderer.capabilities.getMaxAnisotropy(); // Disable anisotropy on mobile
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
    const spacing = width < 768 ? 0.9 : 1.0;
    return {
      positions: [-spacing, 0, spacing],
      yOffsets: [0, 0, 0],
    };
  }
}

const texts = ["Looks", "Doesn`t", "Matter"];
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
      uIsRedWord: { value: text === "Doesn`t" },
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
let initialViewportWidth = window.innerWidth;
let initialViewportHeight = window.innerHeight;
let isInitialSetup = true;
let fixedViewportWidth = window.innerWidth;
let fixedViewportHeight = window.innerHeight;
let fixedAspectRatio = window.innerWidth / window.innerHeight;
let currentViewportOffset = 0; // Track the URL bar offset

function setupMainContentScene() {
  if (mainContentScene) {
    mainContentScene.clear();
  }
  mainContentScene = new THREE.Scene();
  mainContentScene.add(textGroup);
}

// Modified screenToWorld function that compensates for URL bar offset
function screenToWorld(rect, camera) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  // Compensate for URL bar changes by adjusting the Y coordinate
  const compensatedCenterY = centerY - (currentViewportOffset / 2);
  
  // Use fixed viewport dimensions for consistency
  const x = (centerX / fixedViewportWidth) * 2 - 1;
  const y = -(compensatedCenterY / fixedViewportHeight) * 2 + 1;
  
  const distance = camera.position.z;
  const vFOV = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const width = height * fixedAspectRatio;
  
  const worldX = x * (width / 2);
  const worldY = y * (height / 2);

  return new THREE.Vector3(worldX, worldY, 0);
}

// Keep getWorldSize unchanged as it doesn't depend on position
function getWorldSize(rect, camera) {
  const distance = camera.position.z;
  const vFOV = (camera.fov * Math.PI) / 180;
  const height = 2 * Math.tan(vFOV / 2) * distance;
  const width = height * fixedAspectRatio;
  
  const worldWidth = (rect.width / fixedViewportWidth) * width;
  const worldHeight = (rect.height / fixedViewportHeight) * height;

  return { width: worldWidth, height: worldHeight };
}

// Enhanced isElementInView that accounts for viewport offset
function isElementInView(rect) {
  const mobile = isMobile();
  const vhBuffer = mobile ? 0.25 : 0.1;
  const vwBuffer = mobile ? 0.25 : 0.1;
  
  // Use the current viewport height for visibility checking
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

// Improved isRealResize function
function isRealResize() {
  const mobile = isMobile();
  if (!mobile) {
    return true;
  }
  
  const widthChanged = Math.abs(window.innerWidth - initialViewportWidth) > 10;
  const heightChangedSignificantly = Math.abs(window.innerHeight - initialViewportHeight) > 150;
  
  return widthChanged || heightChangedSignificantly;
}

function setupTextMeshes() {
  textGroup.clear();
  textMeshes.length = 0;
  const elements = document.querySelectorAll(".text-canvas");

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
    };
    textGroup.add(mesh);
    textMeshes.push({ el, mesh, mat });
  });
  if (isInitialSetup) {
    initialViewportWidth = window.innerWidth;
    initialViewportHeight = window.innerHeight;
    fixedViewportWidth = window.innerWidth;
    fixedViewportHeight = window.innerHeight;
    fixedAspectRatio = window.innerWidth / window.innerHeight;
    isInitialSetup = false;
  }
}

function updateTextMeshPositions() {
  const mobile = isMobile();
  textMeshes.forEach(({ el, mesh, mat }, index) => {
    const rect = el.getBoundingClientRect();
    const isVisible = isElementInView(rect);

    if (isVisible) {
      const worldPosition = screenToWorld(rect, camera);
      const worldSize = getWorldSize(rect, camera);
      mesh.position.copy(worldPosition);
      const threshold = mobile ? 0.2 : 0.1;
      const currentGeo = mesh.geometry;
      const widthDiff = Math.abs(currentGeo.parameters.width - worldSize.width);
      const heightDiff = Math.abs(
        currentGeo.parameters.height - worldSize.height
      );

      if (widthDiff > threshold || heightDiff > threshold) {
        currentGeo.dispose();
        mesh.geometry = new THREE.PlaneGeometry(
          worldSize.width,
          worldSize.height
        );
      }
      mesh.visible = true;
    } else {
      mesh.visible = false;
      mesh.userData.wasVisible = false;
    }
  });
}

// Alternative approach: Use Visual Viewport API if available
function setupVisualViewportHandler() {
  if (window.visualViewport && isMobile()) {
    let initialVisualViewportHeight = window.visualViewport.height;
    
    window.visualViewport.addEventListener('resize', () => {
      if (animationComplete) {
        // Calculate offset based on visual viewport change
        const visualViewportOffset = window.visualViewport.height - initialVisualViewportHeight;
        currentViewportOffset = visualViewportOffset;
        
        // Update positions immediately
        updateTextMeshPositions();
      }
    });
    
    // Reset on orientation change
    window.visualViewport.addEventListener('scroll', () => {
      if (Math.abs(window.visualViewport.height - initialVisualViewportHeight) > 150) {
        initialVisualViewportHeight = window.visualViewport.height;
        currentViewportOffset = 0;
      }
    });
  }
}

const clock = new THREE.Clock();
let animationComplete = false;

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
        // Call this after the main setup
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

// Enhanced resize handler that compensates for mobile URL bar changes
window.addEventListener("resize", () => {
  const oldPixelRatio = renderer.getPixelRatio();
  const newPixelRatio = getDevicePixelRatio();
  renderer.setPixelRatio(newPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  if (animationComplete && isRealResize()) {
    // This is a real orientation/window resize - reset everything
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    initialViewportWidth = window.innerWidth;
    initialViewportHeight = window.innerHeight;
    fixedViewportWidth = window.innerWidth;
    fixedViewportHeight = window.innerHeight;
    fixedAspectRatio = window.innerWidth / window.innerHeight;
    currentViewportOffset = 0; // Reset offset
    
    const debounceTime = isMobile() ? 200 : 100;
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
      setupTextMeshes();
    }, debounceTime);
  } else if (animationComplete) {
    // This is likely a URL bar show/hide
    // Calculate the viewport offset caused by URL bar
    currentViewportOffset = window.innerHeight - initialViewportHeight;
    
    // Keep the original camera settings
    camera.aspect = fixedAspectRatio;
    camera.updateProjectionMatrix();
    
    // Update positions to compensate for the viewport change
    updateTextMeshPositions();
  } else {
    // During preloader animation
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
});

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

window.addEventListener("preloaderComplete", () => {
  requestAnimationFrame(() => {
    setTimeout(setupTextMeshes, 300);
  });
  setTimeout(() => {
    document.getElementById("gradient").style.opacity = "0.2";
  }, 500);
});

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