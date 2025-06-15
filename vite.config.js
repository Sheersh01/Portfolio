// vite.config.js
import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      // Optional: remove comments and compress shader strings
      compress: false,
    }),
     tailwindcss(),
  ]
});
