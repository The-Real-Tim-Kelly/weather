import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // base must match the GitHub repository name so asset paths resolve correctly
  // on GitHub Pages: https://the-real-tim-kelly.github.io/weather/
  base: '/weather/',
});
