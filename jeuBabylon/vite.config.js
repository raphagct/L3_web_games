import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // Augmente la limite pour éviter les warnings bloquants
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Force la séparation des bibliothèques externes (Babylon) du code de ton jeu
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});