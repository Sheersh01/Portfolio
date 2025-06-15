varying vec2 vUv;

uniform sampler2D uTextTexture;
uniform float uTime;
uniform float uCanvasTime; // NEW: Separate time for canvas effects
uniform bool uIsRedWord;

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

void main() {
  // Use uTime for preloader effects, uCanvasTime for canvas text effects
  bool isCanvasText = uTime < 0.0;
  float timeToUse = isCanvasText ? uCanvasTime : uTime;
  
  float noise = cnoise(vec3(vUv * 40.0, timeToUse * 0.5)) * 0.5 + 0.5;

  // For canvas text: Only fade in, no fade out
  float fadeIn = smoothstep(noise - 0.1, noise + 0.1, clamp(timeToUse / 2.0, 0.0, 1.0));
  
  // For preloader: Keep original behavior with fade out
  float preloaderFadeOut = isCanvasText ? 1.0 : smoothstep(noise + 0.2, noise - 0.2, clamp((uTime - 4.5) / 1.0, 0.0, 1.0));
  
  vec4 textColor = texture2D(uTextTexture, vUv);

  if (uIsRedWord && !isCanvasText) {
    // Red effect only for preloader
    float holdColor = smoothstep(2.5, 3.5, uTime);
    vec3 red = mix(textColor.rgb, vec3(1.0, 0.0, 0.0), holdColor);
    gl_FragColor = vec4(red, textColor.a * fadeIn * preloaderFadeOut);
  } else if (!isCanvasText) {
    // Preloader text with fade out
    gl_FragColor = vec4(textColor.rgb, textColor.a * fadeIn * preloaderFadeOut);
  } else {
    // Canvas text - only fade in, stays visible
    gl_FragColor = vec4(textColor.rgb, textColor.a * fadeIn);
  }
}