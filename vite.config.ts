import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Handle React Native Web and provide fallback
      "react-native": path.resolve(__dirname, "./src/lib/react-native-mock.ts"),
    },
  },
  optimizeDeps: {
    exclude: [
      'react-native',
      'react-native-web',
      '@react-native-async-storage/async-storage',
      'expo',
      '@expo/metro-runtime',
      '@testing-library/react-native'
    ],
    esbuildOptions: {
      // Handle React Native modules
      resolveExtensions: ['.web.js', '.js', '.ts', '.web.ts', '.tsx', '.web.tsx'],
      loader: {
        '.js': 'jsx',
      },
      // Exclude React Native from processing
      external: ['react-native', 'react-native-web'],
      // Handle Flow types
      target: 'es2020',
    },
  },
  build: {
    rollupOptions: {
      external: ['react-native', 'react-native-web'],
    },
  },
  define: {
    // Handle React Native globals
    global: 'globalThis',
  },
  // Add specific handling for React Native files
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  // Handle React Native specific files
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
}));
