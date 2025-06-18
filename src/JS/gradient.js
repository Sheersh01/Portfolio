const canvas = document.getElementById('gradient');

// Enhanced mobile detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 window.innerWidth < 768 || 
                 ('ontouchstart' in window) || 
                 (navigator.maxTouchPoints > 0);

// Try WebGL2 first, fallback to WebGL1 for better mobile compatibility
const gl = canvas.getContext('webgl2', {
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
}) || canvas.getContext('webgl', {
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
}) || canvas.getContext('experimental-webgl', {
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false
});

if (!gl) {
    alert('WebGL not supported');
}

const isWebGL2 = gl instanceof WebGL2RenderingContext;

// Adaptive quality settings based on device
const qualitySettings = {
    pixelRatio: isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio,
    precision: isMobile ? 'mediump' : 'highp',
    targetFPS: isMobile ? 30 : 60
};

// Performance monitoring
let frameCount = 0;
let lastFPSCheck = performance.now();
let currentFPS = 60;

function updateFPS() {
    frameCount++;
    const now = performance.now();
    if (now - lastFPSCheck >= 1000) {
        currentFPS = Math.round((frameCount * 1000) / (now - lastFPSCheck));
        frameCount = 0;
        lastFPSCheck = now;
        
        // Adaptive quality based on performance
        if (isMobile && currentFPS < 25) {
            qualitySettings.pixelRatio = Math.max(1, qualitySettings.pixelRatio * 0.8);
            resizeCanvas();
        }
    }
}

// Throttled resize for better mobile performance
let resizeTimeout;
let isResizing = false;

function resizeCanvas() {
    if (isResizing) return;
    isResizing = true;
    
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const pixelRatio = qualitySettings.pixelRatio;
        const displayWidth = Math.floor(window.innerWidth * pixelRatio);
        const displayHeight = Math.floor(window.innerHeight * pixelRatio);
        
        // Clamp maximum resolution on mobile
        const maxWidth = isMobile ? 1920 : displayWidth;
        const maxHeight = isMobile ? 1080 : displayHeight;
        
        canvas.width = Math.min(displayWidth, maxWidth);
        canvas.height = Math.min(displayHeight, maxHeight);
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        
        gl.viewport(0, 0, canvas.width, canvas.height);
        isResizing = false;
    }, isMobile ? 100 : 50);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

// Optimized shader sources with mobile considerations
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

// Optimized noise function - same visual result, better mobile performance
const optimizedNoiseFunction = `
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
        vec4 gx0 = ixy0 * (1.0 / 7.0), gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);
        vec4 gx1 = ixy1 * (1.0 / 7.0), gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
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

    ${optimizedNoiseFunction}

    vec2 domainWarp(vec2 p, float time) {
        float warpX = cnoise(vec3(p * u_warpScale, time * 0.3));
        float warpY = cnoise(vec3(p * u_warpScale + 100.0, time * 0.3));
        vec2 warp1 = vec2(warpX, warpY) * u_warpStrength;
        vec2 warpedP = p + warp1;
        
        float warpX2 = cnoise(vec3(warpedP * u_warpScale * 0.7, time * 0.2));
        float warpY2 = cnoise(vec3(warpedP * u_warpScale * 0.7 + 200.0, time * 0.2));
        vec2 warp2 = vec2(warpX2, warpY2) * u_warpStrength * 0.5;
        return p + warp1 + warp2;
    }

    float gradientBands(vec2 p, float time) {
        vec2 warpedP = domainWarp(p, time);
        float angle = atan(warpedP.y, warpedP.x);
        float radius = length(warpedP);
        float bands1 = sin(radius * u_bandFreq + time * 2.0);
        float bands2 = sin(angle * 3.0 + time * 1.5);
        float bands3 = sin((warpedP.x + warpedP.y) * u_bandFreq * 0.8 + time);
        float combined = (bands1 + bands2 * 0.6 + bands3 * 0.4) / 2.2;
        
        float flow = cnoise(vec3(warpedP * 0.5, time * 0.4)) * 0.3;
        return combined + flow;
    }

    vec3 getColor(float t) {
        t = (t + 1.0) * 0.5;
        t = smoothstep(0.0, 1.0, t);
        return mix(u_color1, u_color2, t);
    }

    void main() {
        vec2 uv = v_texCoord;
        vec2 pos = (uv - 0.5) * min(u_resolution.x, u_resolution.y) * u_scale;
        float gradientValue = gradientBands(pos, u_time);
        vec3 color = getColor(gradientValue);
        
        float brightness = 0.85 + 0.3 * cnoise(vec3(pos * 1.5, u_time * 0.1));
        color *= brightness;
        
        float dist = length(uv - 0.5);
        float vignette = 1.0 - smoothstep(0.3, 0.8, dist);
        color *= 0.7 + 0.3 * vignette;
        
        ${isWebGL2 ? 'fragColor' : 'gl_FragColor'} = vec4(color, 1.0);
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
}

const uniforms = {
    time: gl.getUniformLocation(program, 'u_time'),
    resolution: gl.getUniformLocation(program, 'u_resolution'),
    scale: gl.getUniformLocation(program, 'u_scale'),
    warpStrength: gl.getUniformLocation(program, 'u_warpStrength'),
    warpScale: gl.getUniformLocation(program, 'u_warpScale'),
    bandFreq: gl.getUniformLocation(program, 'u_bandFreq'),
    color1: gl.getUniformLocation(program, 'u_color1'),
    color2: gl.getUniformLocation(program, 'u_color2')
};

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

// Use VAO for WebGL2, fallback for WebGL1
let vao;
if (isWebGL2) {
    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
}

gl.enableVertexAttribArray(positionAttributeLocation);
gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

// Same visual parameters - no changes to pattern
const speed = 0.08;
const scale = 0.001;
const warpStrength = 8.0;
const warpScale = 0.5;
const bandFreq = 4.0;
const color1 = [1.0, 0.1, 0.1];  // bright red
const color2 = [0.0, 0.0, 0.0];  // black

let startTime = Date.now();
let lastFrameTime = 0;
const targetFrameTime = 1000 / qualitySettings.targetFPS;

function render(currentTime) {
    // Frame rate limiting for mobile
    if (currentTime - lastFrameTime < targetFrameTime) {
        requestAnimationFrame(render);
        return;
    }
    lastFrameTime = currentTime;

    const time = (Date.now() - startTime) * 0.001 * speed;

    gl.useProgram(program);
    
    if (isWebGL2) {
        gl.bindVertexArray(vao);
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
    }

    gl.uniform1f(uniforms.time, time);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.scale, scale);
    gl.uniform1f(uniforms.warpStrength, warpStrength);
    gl.uniform1f(uniforms.warpScale, warpScale);
    gl.uniform1f(uniforms.bandFreq, bandFreq);
    gl.uniform3f(uniforms.color1, ...color1);
    gl.uniform3f(uniforms.color2, ...color2);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    updateFPS();
    requestAnimationFrame(render);
}

// Enhanced visibility management
let isPageVisible = true;
let wasVisible = true;

function handleVisibilityChange() {
    isPageVisible = !document.hidden;
    
    if (isPageVisible && !wasVisible) {
        // Resume rendering when page becomes visible
        startTime = Date.now() - (performance.now() * speed * 0.001); // Maintain time continuity
        requestAnimationFrame(render);
    }
    
    wasVisible = isPageVisible;
}

document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

// Mobile-specific event listeners for better performance
if (isMobile) {
    // Pause rendering when scrolling on mobile
    let scrollTimeout;
    let isScrolling = false;
    
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            isScrolling = true;
        }
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            isScrolling = false;
        }, 150);
    }, { passive: true });
    
    // Reduce quality during touch interactions
    canvas.addEventListener('touchstart', () => {
        qualitySettings.pixelRatio = Math.max(1, qualitySettings.pixelRatio * 0.7);
        resizeCanvas();
    }, { passive: true });
    
    canvas.addEventListener('touchend', () => {
        setTimeout(() => {
            qualitySettings.pixelRatio = Math.min(window.devicePixelRatio, 2);
            resizeCanvas();
        }, 300);
    }, { passive: true });
}

// Battery and thermal management
if ('getBattery' in navigator) {
    navigator.getBattery().then(battery => {
        function updateBatteryStatus() {
            if (battery.level < 0.2 && !battery.charging) {
                // Reduce quality on low battery
                qualitySettings.targetFPS = 20;
                qualitySettings.pixelRatio = Math.max(1, qualitySettings.pixelRatio * 0.6);
                resizeCanvas();
            }
        }
        
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
        updateBatteryStatus();
    });
}

// Start rendering
if (isPageVisible) {
    requestAnimationFrame(render);
}

// Enhanced memory cleanup
window.addEventListener('beforeunload', () => {
    gl.deleteBuffer(positionBuffer);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    if (vao) gl.deleteVertexArray(vao);
});

// Prevent context loss on mobile
canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    console.log('WebGL context lost');
}, false);

canvas.addEventListener('webglcontextrestored', () => {
    console.log('WebGL context restored');
    // Reinitialize if needed
}, false);