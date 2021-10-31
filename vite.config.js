/* eslint-disable import/no-extraneous-dependencies */
import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import reactJsx from 'vite-react-jsx'

export default defineConfig({
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  plugins: [reactJsx(), reactRefresh()],
  resolve: {
    alias: {
      // Resolve symlink ourselves
      '@react-three/fiber': resolve('node_modules', '@react-three', 'fiber'),
      '@react-three/cannon': resolve('../use-cannon'),
      three: resolve('node_modules', 'three'),
    },
  },
})
