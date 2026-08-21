import path from 'path'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vitest/config'

/**
 * Configuración de tests.
 *
 * Va aparte de `vite.config.ts` a propósito: el plugin del router de TanStack
 * regenera `routeTree.gen.ts` al arrancar y no tiene nada que hacer en una
 * corrida de tests.
 *
 * `VITE_API_URL` se pisa con un host inexistente para que ningún test pueda
 * pegarle al backend de producción, ni siquiera por accidente.
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
      // Sin este alias, importar un icono arrastra el barrel entero de tabler
      // y cada archivo de test tarda varios segundos en resolverlo.
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    restoreMocks: true,
    env: {
      VITE_API_URL: 'http://backend.invalido.test',
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/**',
        'src/utils/**',
        'src/features/dashboard/**',
        'src/features/reports/**',
        'src/features/sales/**',
      ],
    },
  },
})
