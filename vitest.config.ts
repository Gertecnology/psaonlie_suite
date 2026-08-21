import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

/**
 * Configuración separada de `vite.config.ts` a propósito: los tests no
 * necesitan el plugin de rutas ni Tailwind, y `VITE_API_URL` se pisa con un
 * host falso para que ningún test pueda pegarle al backend de producción.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    env: {
      VITE_API_URL: 'http://backend.invalido.test',
    },
    restoreMocks: true,
  },
})
