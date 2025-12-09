import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Fixed: 'process.cwd()' replaced with '.' to avoid type error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    define: {
      // Shim process.env.API_KEY for the Google GenAI SDK
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || ''),
      // Prevent other "process is not defined" errors
      'process.env': {}
    },
    build: {
      outDir: 'dist',
      target: 'esnext'
    },
    server: {
      port: 3000
    }
  };
});