import '@testing-library/jest-dom/vitest'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

/**
 * jsdom no implementa la API de Pointer Capture ni `scrollIntoView`, que Radix
 * usa en los `Select`. Sin estos stubs los combos del formulario de pasajeros
 * no se abren y el test no puede completarlo.
 */
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()

  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

/**
 * Red cortada por defecto.
 *
 * El `.env` de este repo apunta a producción: una llamada real desde un test
 * podría bloquear asientos o emitir un boleto contra una empresa de verdad.
 * Cada test tiene que instalar su propio mock de `fetch`; si no lo hace, el
 * test falla en vez de salir a la red.
 */
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      throw new Error(
        `Llamada de red no mockeada en un test: ${String(input)}. Mockeá globalThis.fetch.`,
      )
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllTimers()
})
