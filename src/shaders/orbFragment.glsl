varying vec2 vUv;
varying float vElevation;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vDistance;
uniform float uTime;
uniform float uColorChange;
uniform vec3 uCameraPosition;
uniform float uOpacity;
uniform bool uIsMobile;        // Add this uniform
uniform float uBrightness;     // Add this uniform
uniform float uContrast;       // Add this uniform

// Mobile-friendly color enhancement function
vec3 enhanceForMobile(vec3 color) {
    if (uIsMobile) {
        // Apply gamma correction for darker mobile screens
        color = pow(color, vec3(1.0/2.4));
        
        // Increase brightness and contrast
        color = (color - 0.5) * uContrast + 0.5 + uBrightness;
        
        // Boost color saturation
        float gray = dot(color, vec3(0.299, 0.587, 0.114));
        color = mix(vec3(gray), color, 1.4);
        
        // Expand dynamic range
        color *= 1.6;
    }
    
    return clamp(color, 0.0, 1.0);
}

void main() {
    // Create circular points
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    // Discard pixels outside circle
    if (dist > 0.5) discard;
    
    // Enhanced mobile-friendly color palette
    vec4 c1, c2, c3, c4;
    
    if (uIsMobile) {
        // Brighter, more visible colors for mobile
        c1 = vec4(0.15, 0.15, 0.15, 1.0);    // Dark gray instead of pure black
        c2 = vec4(0.5, 0.1, 0.1, 1.0);       // Brighter dark red
        c3 = vec4(1.0, 0.2, 0.2, 1.0);       // More vibrant blood red
        c4 = vec4(0.95, 0.95, 0.95, 1.0);    // Slightly off-white
    } else {
        // Original colors for desktop
        c1 = vec4(0.0, 0.0, 0.0, 1.0);       // Pure black
        c2 = vec4(0.2, 0.0, 0.0, 1.0);       // Dark red
        c3 = vec4(0.8, 0.0, 0.0, 1.0);       // Blood red
        c4 = vec4(1.0, 1.0, 1.0, 1.0);       // Pure white
    }

    // Enhanced elevation mapping for dramatic contrast
    float normalizedElevation = (vElevation + 0.5) * 0.5;
    float v = smoothstep(0.15, 0.85, normalizedElevation); // Wider range for mobile
    
    // Create spooky color gradients
    vec4 color1 = mix(c1, c3, v);
    vec4 color2 = mix(c2, c4, v);
    
    // Final color blend
    vec4 finalColor = mix(color1, color2, uColorChange);
    
    // Enhanced fresnel effect for mobile visibility
    float fresnel = 1.0 - dist * 2.0;
    float fresnelIntensity = uIsMobile ? 0.5 : 0.3;
    finalColor.rgb += fresnel * fresnelIntensity * vec3(1.0, 0.2, 0.2);
    
    // Enhanced pulsing effect
    float pulseIntensity = uIsMobile ? 0.3 : 0.2;
    float pulse = sin(uTime * 3.0 + vPosition.x * 2.0) * pulseIntensity + (1.0 - pulseIntensity);
    finalColor.rgb *= pulse;
    
    // Enhanced flickering effect
    float flickerIntensity = uIsMobile ? 0.15 : 0.1;
    float flicker = sin(uTime * 15.0 + vPosition.y * 3.0) * flickerIntensity + (1.0 - flickerIntensity);
    finalColor.rgb *= flicker;
    
    // Apply mobile enhancement
    finalColor.rgb = enhanceForMobile(finalColor.rgb);
    
    // Distance-based alpha for depth
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= (1.0 - vDistance * 0.1);
    alpha *= uOpacity;
    
    // Boost alpha for mobile visibility
    if (uIsMobile) {
        alpha = min(alpha * 1.3, 1.0);
    }
    
    gl_FragColor = vec4(finalColor.rgb, alpha);
}