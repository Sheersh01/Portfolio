// Debug logging function
function debugLog(message) {
    // console.log(`[WebGL Debug] ${message}`);
}

const canvas = document.getElementById('gradient');
if (!canvas) {
    debugLog('ERROR: Canvas element not found!');
    throw new Error('Canvas element with id "gradient" not found');
}

// Mobile detection and performance settings
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
const isLowEndDevice = navigator.hardwareConcurrency <= 4 || navigator.deviceMemory <= 4;

debugLog(`Mobile: ${isMobile}, Low-end device: ${isLowEndDevice}`);
debugLog(`Hardware concurrency: ${navigator.hardwareConcurrency}, Device memory: ${navigator.deviceMemory}`);

// Try WebGL2 first, fallback to WebGL1 for better mobile compatibility
const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

if (!gl) {
    debugLog('ERROR: WebGL not supported');
    alert('WebGL not supported');
    throw new Error('WebGL not supported');
}

const isWebGL2 = gl instanceof WebGL2RenderingContext;
debugLog(`WebGL version: ${isWebGL2 ? '2.0' : '1.0'}`);

// Dynamic quality settings for mobile
const qualitySettings = {
    pixelRatio: isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio,
    precision: (isMobile && isLowEndDevice) ? 'mediump' : 'highp',
    complexNoise: !isMobile || !isLowEndDevice,
    frameSkipping: isMobile && isLowEndDevice
};

debugLog(`Quality settings: ${JSON.stringify(qualitySettings)}`);

let resizeTimeout;
function resizeCanvas() {
    // Debounce resize for mobile
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const pixelRatio = qualitySettings.pixelRatio;
        const displayWidth = Math.floor(window.innerWidth * pixelRatio);
        const displayHeight = Math.floor(window.innerHeight * pixelRatio);
        
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        
        gl.viewport(0, 0, displayWidth, displayHeight);
        
        debugLog(`Canvas resized: ${displayWidth}x${displayHeight} (display: ${window.innerWidth}x${window.innerHeight})`);
    }, isMobile ? 150 : 50);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Optimized shader versions
const vertexShaderSource = isWebGL2 ? `#version 300 es
    in vec2 a_position;
    out vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
    }
` : `
    attribute vec2 a_position;
    varying vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
    }
`;

// Simplified noise function for mobile
const simpleNoiseFunction = `
    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
    }
    
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    
    float cnoise(vec3 p) {
        return noise(p.xy + p.z * 0.1);
    }
`;

const complexNoiseFunction = `
    vec4 permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0 - 15.0) + 10.0); }

    float cnoise(vec3 P) {
        vec3 Pi0 = floor(P), Pi1 = Pi0 + 1.0;
        Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P), Pf1 = Pf0 - 1.0;
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz, iz1 = Pi1.zzzz;
        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);
        vec4 gx0 = ixy0 / 7.0, gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = 0.5 - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
        vec4 gx1 = ixy1 / 7.0, gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = 0.5 - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);
        vec3 g000 = vec3(gx0.x, gy0.x, gz0.x), g100 = vec3(gx0.y, gy0.y, gz0.y),
             g010 = vec3(gx0.z, gy0.z, gz0.z), g110 = vec3(gx0.w, gy0.w, gz0.w),
             g001 = vec3(gx1.x, gy1.x, gz1.x), g101 = vec3(gx1.y, gy1.y, gz1.y),
             g011 = vec3(gx1.z, gy1.z, gz1.z), g111 = vec3(gx1.w, gy1.w, gz1.w);
        vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000), dot(g010,g010), dot(g100,g100), dot(g110,g110)));
        g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001), dot(g011,g011), dot(g101,g101), dot(g111,g111)));
        g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
        float n000 = dot(g000, Pf0), n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)), n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)), n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)), n111 = dot(g111, Pf1);
        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000,n100,n010,n110), vec4(n001,n101,n011,n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
    }
`;

const fragmentShaderSource = (isWebGL2 ? `#version 300 es\n` : '') + `
    precision ${qualitySettings.precision} float;

    ${isWebGL2 ? 'in' : 'varying'} vec2 v_texCoord;
    ${isWebGL2 ? 'out vec4 fragColor;' : ''}

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_scale;
    uniform float u_warpStrength;
    uniform float u_warpScale;
    uniform float u_bandFreq;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform bool u_isMobile;        
    uniform float u_brightness;     
    uniform float u_contrast;

    ${qualitySettings.complexNoise ? complexNoiseFunction : simpleNoiseFunction}

    // Mobile color enhancement function
    vec3 enhanceForMobile(vec3 color) {
        if (u_isMobile) {
            // Reduce overall brightness for mobile
            color *= 0.8;
            
            // Apply subtle brightness and contrast adjustments
            color = (color - 0.5) * u_contrast + 0.5 + u_brightness;
            
            // Gentle saturation adjustment (much less aggressive)
            float luminance = dot(color, vec3(0.299, 0.587, 0.114));
            color = mix(vec3(luminance), color, 1.1);
            
            // Apply gamma correction for mobile displays (lighter gamma)
           
        }
        
        return clamp(color, 0.0, 1.0);
    }

    vec2 domainWarp(vec2 p, float time) {
        float warpX = cnoise(vec3(p * u_warpScale, time * 0.3));
        float warpY = cnoise(vec3(p * u_warpScale + 100.0, time * 0.3));
        vec2 warp1 = vec2(warpX, warpY) * u_warpStrength;
        vec2 warpedP = p + warp1;
        
        ${qualitySettings.complexNoise ? `
        float warpX2 = cnoise(vec3(warpedP * u_warpScale * 0.7, time * 0.2));
        float warpY2 = cnoise(vec3(warpedP * u_warpScale * 0.7 + 200.0, time * 0.2));
        vec2 warp2 = vec2(warpX2, warpY2) * u_warpStrength * 0.5;
        return p + warp1 + warp2;
        ` : `
        return warpedP;
        `}
    }

    float gradientBands(vec2 p, float time) {
        vec2 warpedP = domainWarp(p, time);
        float angle = atan(warpedP.y, warpedP.x);
        float radius = length(warpedP);
        float bands1 = sin(radius * u_bandFreq + time * 2.0);
        float bands2 = sin(angle * 3.0 + time * 1.5);
        float bands3 = sin((warpedP.x + warpedP.y) * u_bandFreq * 0.8 + time);
        float combined = (bands1 + bands2 * 0.6 + bands3 * 0.4) / 2.2;
        
        ${qualitySettings.complexNoise ? `
        float flow = cnoise(vec3(warpedP * 0.5, time * 0.4)) * 0.3;
        return combined + flow;
        ` : `
        return combined;
        `}
    }

    vec3 getColor(float t) {
        t = (t + 1.0) * 0.5;
        
        // Enhanced smoothstep for mobile - wider transition range
        if (u_isMobile) {
            t = smoothstep(0.1, 0.9, t);
        } else {
            t = smoothstep(0.0, 1.0, t);
        }
        
        vec3 color = mix(u_color1, u_color2, t);
        
        // Apply mobile enhancement
        return enhanceForMobile(color);
    }

    void main() {
        vec2 uv = v_texCoord;
        vec2 pos = (uv - 0.5) * min(u_resolution.x, u_resolution.y) * u_scale;
        float gradientValue = gradientBands(pos, u_time);
        vec3 color = getColor(gradientValue);
        
        ${qualitySettings.complexNoise ? `
float brightness = u_isMobile ? 0.8 : 0.9;  // Fixed constant values
color *= brightness;
` : `
color *= u_isMobile ? 0.8 : 0.9;
`}
        
        // Enhanced vignette for mobile - stronger darkening
        float dist = length(uv - 0.5);
        float vignetteStart = u_isMobile ? 0.2 : 0.3;
        float vignetteEnd = u_isMobile ? 0.8 : 0.8;
        float vignetteStrength = u_isMobile ? 0.7 : 0.3;
        
        float vignette = 1.0 - smoothstep(vignetteStart, vignetteEnd, dist);
        color *= (1.0 - vignetteStrength) + vignetteStrength * vignette;
        
        ${isWebGL2 ? 'fragColor' : 'gl_FragColor'} = vec4(color, 1.0);
    }
`;

function createShader(gl, type, source) {
    debugLog(`Creating ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader`);
    
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        debugLog(`ERROR: Shader compile error: ${error}`);
        console.error('Shader source:', source);
        gl.deleteShader(shader);
        return null;
    }
    
    debugLog(`${type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment'} shader compiled successfully`);
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

if (!vertexShader || !fragmentShader) {
    debugLog('ERROR: Failed to create shaders');
    throw new Error('Failed to create shaders');
}

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const error = gl.getProgramInfoLog(program);
    debugLog(`ERROR: Program link error: ${error}`);
    throw new Error(`Program link error: ${error}`);
}

debugLog('Program linked successfully');

// Get all uniform locations with error checking
const uniforms = {
    time: gl.getUniformLocation(program, 'u_time'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    scale: gl.getUniformLocation(program, 'u_scale'),
    warpStrength: gl.getUniformLocation(program, 'u_warpStrength'),
    warpScale: gl.getUniformLocation(program, 'u_warpScale'),
    bandFreq: gl.getUniformLocation(program, 'u_bandFreq'),
    color1: gl.getUniformLocation(program, 'u_color1'),
    color2: gl.getUniformLocation(program, 'u_color2'),
    isMobile: gl.getUniformLocation(program, 'u_isMobile'),
    brightness: gl.getUniformLocation(program, 'u_brightness'),
    contrast: gl.getUniformLocation(program, 'u_contrast')
};

// Check for missing uniforms
Object.entries(uniforms).forEach(([name, location]) => {
    if (location === null) {
        debugLog(`WARNING: Uniform '${name}' not found in shader`);
    }
});

const positions = new Float32Array([
    -1, -1,
     1, -1,
    -1,  1,
     1,  1
]);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
if (positionAttributeLocation === -1) {
    debugLog('ERROR: Position attribute not found');
    throw new Error('Position attribute not found');
}

// Use VAO for WebGL2, fallback for WebGL1
let vao;
if (isWebGL2) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    debugLog('Using WebGL2 VAO');
}

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Mobile-optimized parameters
const speed = isMobile ? 0.070 : 0.08;
const scale = isMobile ? 0.001 : 0.001;
const warpStrength = isMobile ? 8.0 : 8.0;
const warpScale = isMobile ? 0.5 : 0.5;
const bandFreq = isMobile ? 3.5 : 4.0;
const color1 = [0.8, 0.2, 0.2];  // darker, more muted red
const color2 = [0.0, 0.0, 0.0];     // black
const brightness = isMobile ? 0.0 : 0.0;  // negative brightness for mobile
const contrast = isMobile ? 1.0 : 1.0;     // lower contrast for mobile

debugLog(`Animation parameters: speed=${speed}, scale=${scale}, warpStrength=${warpStrength}`);

let startTime = Date.now();
let lastFrameTime = 0;
let frameCount = 0;
let lastFPSCheck = performance.now();
let renderErrors = 0;

// Frame rate management for mobile
const targetFPS = isMobile ? 30 : 60;
const frameInterval = 1000 / targetFPS;

// Performance monitoring
function checkPerformance() {
    frameCount++;
    const now = performance.now();
    
    if (now - lastFPSCheck >= 5000) { // Check every 5 seconds
        const fps = (frameCount * 1000) / (now - lastFPSCheck);
        debugLog(`Performance: ${fps.toFixed(1)} FPS, Render errors: ${renderErrors}`);
        
        // If performance is poor on mobile, could trigger further optimizations
        if (fps < 20 && isMobile) {
            debugLog('WARNING: Low FPS detected');
        }
        
        frameCount = 0;
        lastFPSCheck = now;
        renderErrors = 0;
    }
}

function render(currentTime = 0) {
    try {
        // Frame rate limiting for mobile
        if (qualitySettings.frameSkipping && currentTime - lastFrameTime < frameInterval) {
            requestAnimationFrame(render);
            return;
        }
        lastFrameTime = currentTime;

        const time = (Date.now() - startTime) * 0.001 * speed;

        // Check for WebGL context loss
        if (gl.isContextLost()) {
            debugLog('ERROR: WebGL context lost');
            return;
        }

        gl.useProgram(program);
        
        if (isWebGL2) {
            gl.bindVertexArray(vao);
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            gl.enableVertexAttribArray(positionAttributeLocation);
            gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
        }

        // Set uniforms with error checking
        if (uniforms.time) gl.uniform1f(uniforms.time, time);
        if (uniforms.resolution) gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        if (uniforms.scale) gl.uniform1f(uniforms.scale, scale);
        if (uniforms.warpStrength) gl.uniform1f(uniforms.warpStrength, warpStrength);
        if (uniforms.warpScale) gl.uniform1f(uniforms.warpScale, warpScale);
        if (uniforms.bandFreq) gl.uniform1f(uniforms.bandFreq, bandFreq);
        if (uniforms.color1) gl.uniform3f(uniforms.color1, ...color1);
        if (uniforms.color2) gl.uniform3f(uniforms.color2, ...color2);
        if (uniforms.isMobile) gl.uniform1i(uniforms.isMobile, isMobile ? 1 : 0);
        if (uniforms.brightness) gl.uniform1f(uniforms.brightness, brightness);
        if (uniforms.contrast) gl.uniform1f(uniforms.contrast, contrast);

        // Check for GL errors before drawing
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
            debugLog(`WARNING: GL error before draw: ${error}`);
            renderErrors++;
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Check for GL errors after drawing
        const drawError = gl.getError();
        if (drawError !== gl.NO_ERROR) {
            debugLog(`ERROR: GL error after draw: ${drawError}`);
            renderErrors++;
        }

        // Performance monitoring for mobile
        if (isMobile) {
            checkPerformance();
        }

    } catch (error) {
        debugLog(`ERROR in render loop: ${error.message}`);
        renderErrors++;
        console.error(error);
    }

    requestAnimationFrame(render);
}

// Pause rendering when page is not visible (mobile battery optimization)
let isPageVisible = true;
document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    debugLog(`Page visibility changed: ${isPageVisible ? 'visible' : 'hidden'}`);
    if (isPageVisible) {
        // Resume rendering
        render();
    }
    // Animation automatically pauses when page is hidden due to requestAnimationFrame
});

// Handle WebGL context loss/restore
canvas.addEventListener('webglcontextlost', (event) => {
    debugLog('WebGL context lost');
    event.preventDefault();
});

canvas.addEventListener('webglcontextrestored', () => {
    debugLog('WebGL context restored - would need to reinitialize');
    // Would need to recreate all WebGL resources here
});

// Memory cleanup for mobile
window.addEventListener('beforeunload', () => {
    debugLog('Cleaning up WebGL resources');
    // Clean up WebGL resources
    gl.deleteBuffer(positionBuffer);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    if (vao) gl.deleteVertexArray(vao);
});

// Start rendering only if page is visible
debugLog('Starting render loop');
if (isPageVisible) {
    render();
}