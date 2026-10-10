import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' : l'app fonctionne aussi servie depuis un sous-dossier ou un hébergement statique.
export default defineConfig({
  base: './',
  plugins: [react()],
});
