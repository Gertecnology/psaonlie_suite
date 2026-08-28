import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `public/serve.json` configura al servidor estático que corre en producción:
 * Vite lo copia a `dist/` y el contenedor arranca con
 * `serve -s dist -l 3002`.
 *
 * `serve` valida ese archivo contra un JSON Schema estricto
 * (`additionalProperties: false`) y, si no pasa, **sale con error antes de
 * escuchar el puerto**. No degrada ni ignora la configuración: el contenedor
 * muere y el panel entero responde 502.
 *
 * Ya pasó una vez, con un `"$schema"` agregado para tener autocompletado en el
 * editor. El despliegue se veía sano hasta el paso de verificación, que sólo
 * informaba `HTTP 502` sin decir por qué.
 */

// Las únicas claves que acepta serve v14. Cualquier otra tumba el arranque.
const CLAVES_PERMITIDAS = [
  'public',
  'cleanUrls',
  'rewrites',
  'redirects',
  'headers',
  'directoryListing',
  'unlisted',
  'trailingSlash',
  'renderSingle',
  'symlinks',
  'etag',
]

const configuracion = JSON.parse(
  readFileSync(resolve(__dirname, '../../public/serve.json'), 'utf8'),
) as Record<string, unknown>

describe('public/serve.json', () => {
  it('no declara ninguna clave que serve rechace', () => {
    const noPermitidas = Object.keys(configuracion).filter(
      (clave) => !CLAVES_PERMITIDAS.includes(clave),
    )

    expect(noPermitidas).toEqual([])
  })

  it('no lleva $schema: es la clave que ya tumbó el panel', () => {
    expect(configuracion).not.toHaveProperty('$schema')
  })

  it('reescribe cualquier ruta al index para que el router del panel resuelva', () => {
    expect(configuracion.rewrites).toContainEqual({
      source: '**',
      destination: '/index.html',
    })
  })

  it('pide que el HTML no se cachee, que es lo que dejaba ver una versión vieja', () => {
    const headers = configuracion.headers as Array<{
      source: string
      headers: Array<{ key: string; value: string }>
    }>
    const delHtml = headers.find((entrada) => entrada.source === '**/*.html')

    expect(delHtml?.headers).toContainEqual({
      key: 'Cache-Control',
      value: 'no-cache, must-revalidate',
    })
  })
})
