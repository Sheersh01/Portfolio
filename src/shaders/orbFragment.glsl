varying vec2 vUv;
varying float vElevation;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vDistance;

uniform float uTime;
uniform float uColorChange;
uniform vec3 uCameraPosition;
uniform float uOpacity;
uniform bool uIsMobile; // true if on mobile

void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    if (dist > 0.5) discard;

    // DARK DESKTOP PALETTE
    vec4 dark1 = vec4(0.0, 0.0, 0.0, 1.0);      // Pure black
    vec4 dark2 = vec4(0.2, 0.0, 0.0, 1.0);      // Dark red
    vec4 dark3 = vec4(0.8, 0.0, 0.0, 1.0);      // Blood red
    vec4 dark4 = vec4(1.0, 1.0, 1.0, 1.0);      // Pure white

    // LIGHT MOBILE PALETTE
    vec4 light1 = vec4(0.1, 0.05, 0.05, 1.0);   // Soft dark
    vec4 light2 = vec4(0.6, 0.2, 0.2, 1.0);     // Soft red
    vec4 light3 = vec4(1.0, 0.4, 0.4, 1.0);     // Bright red
    vec4 light4 = vec4(1.0, 1.0, 1.0, 1.0);     // White

    // Select palette
    vec4 c1 = uIsMobile ? light1 : dark1;
    vec4 c2 = uIsMobile ? light2 : dark2;
    vec4 c3 = uIsMobile ? light3 : dark3;
    vec4 c4 = uIsMobile ? light4 : dark4;

    // Elevation mapping
    float normalizedElevation = (vElevation + 0.5) * 0.5;
    float v = smoothstep(0.2, 0.8, normalizedElevation);

    // Gradient
    vec4 color1 = mix(c1, c3, v);
    vec4 color2 = mix(c2, c4, v);
    vec4 finalColor = mix(color1, color2, uColorChange);

    // Fresnel
    float fresnel = 1.0 - dist * (uIsMobile ? 1.5 : 2.0);
    finalColor.rgb += fresnel * (uIsMobile ? 0.2 : 0.3) * vec3(1.0, 0.0, 0.0);

    // Pulse & flicker
    float pulse = sin(uTime * 3.0 + vPosition.x * 2.0) * 0.2 + (uIsMobile ? 0.9 : 0.8);
    float flicker = sin(uTime * 15.0 + vPosition.y * 3.0) * 0.1 + (uIsMobile ? 0.95 : 0.9);
    finalColor.rgb *= pulse * flicker;

    // Alpha
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= (1.0 - vDistance * 0.1);
    alpha *= uOpacity;

    gl_FragColor = vec4(finalColor.rgb, alpha);
}
