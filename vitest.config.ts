import path from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

/**
 * Configuración de tests.
 *
 * Va aparte de `vite.config.ts` a propósito: el plugin del router de TanStack
 * regenera `routeTree.gen.ts` al arrancar, y no tiene nada que hacer en una
 * corrida de tests.
 *
 * `TZ=America/Asuncion` no se fija acá sino en el script de npm: los tests de
 * fechas dependen de la zona horaria local y tienen que dar igual en la máquina
 * de cualquiera y en CI.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/utils/**', 'src/features/dashboard/**', 'src/features/reports/**'],
    },
  },
})
