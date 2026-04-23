// vite.config.js
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      compress: true,
    }),
     tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          gsap: ['gsap', 'gsap/ScrollTrigger'],
        }
      }
    },
    target: 'es2020',
  }
});
