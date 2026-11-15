import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages sert le site sous /papille/
export default defineConfig({
  base: '/papille/',
  plugins: [react()],
  server: { port: 5173 },
});
