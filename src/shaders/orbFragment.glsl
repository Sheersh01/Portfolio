varying vec2 vUv;
    varying float vElevation;
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying float vDistance;
    uniform float uTime;
    uniform float uColorChange;
    uniform vec3 uCameraPosition;
    uniform float uOpacity;

    void main() {
        // Create circular points
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center);
        
        // Discard pixels outside circle
        if (dist > 0.5) discard;
        
        // Spooky black, white, red color palette
        vec4 c1 = vec4(0.0, 0.0, 0.0, 1.0);      // Pure black
        vec4 c2 = vec4(0.2, 0.0, 0.0, 1.0);      // Dark red
        vec4 c3 = vec4(0.8, 0.0, 0.0, 1.0);      // Blood red
        vec4 c4 = vec4(1.0, 1.0, 1.0, 1.0);      // Pure white

        // Enhanced elevation mapping for dramatic contrast
        float normalizedElevation = (vElevation + 0.5) * 0.5;
        float v = smoothstep(0.2, 0.8, normalizedElevation);
        
        // Create spooky color gradients
        vec4 color1 = mix(c1, c3, v);
        vec4 color2 = mix(c2, c4, v);
        
        // Final color blend
        vec4 finalColor = mix(color1, color2, uColorChange);
        
        // Add menacing fresnel effect based on point distance from center
        float fresnel = 1.0 - dist * 2.0; // Bright center, dark edges
        finalColor.rgb += fresnel * 0.3 * vec3(1.0, 0.0, 0.0);
        
        // Add eerie pulsing effect
        float pulse = sin(uTime * 3.0 + vPosition.x * 2.0) * 0.2 + 0.8;
        finalColor.rgb *= pulse;
        
        // Add flickering effect like dying lights
        float flicker = sin(uTime * 15.0 + vPosition.y * 3.0) * 0.1 + 0.9;
        finalColor.rgb *= flicker;
        
        // Distance-based alpha for depth
        float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
        alpha *= (1.0 - vDistance * 0.1); // Fade with distance
        alpha *= uOpacity; // Global opacity control
        
        gl_FragColor = vec4(finalColor.rgb, alpha);
    }