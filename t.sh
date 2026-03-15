cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'renderer'),
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    minify: 'oxc',
    target: 'chrome110',
    cssMinify: true,
    reportCompressedSize: false,
    sourcemap: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer/src'),
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  }
})
EOF

npx vite build 2>&1 | tail -10