import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

/**
 * jsdom no implementa varias APIs del navegador que shadcn/Radix y recharts
 * usan al montarse. Sin estos polyfills, cualquier test que renderice un
 * Select, un Popover o un gráfico explota antes de llegar a la aserción.
 */
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// Radix mide los elementos con estas APIs, que jsdom deja sin implementar.
// Sin ellas los combos del formulario de pasajeros no se abren.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = vi.fn()
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn()
}

/**
 * Red cortada por defecto.
 *
 * El `.env` de este repo apunta a produccion: una llamada real desde un test
 * podria bloquear asientos o emitir un boleto contra una empresa de verdad.
 * Cada test tiene que instalar su propio mock de `fetch`; si no lo hace, el
 * test falla en vez de salir a la red.
 */
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      throw new Error(
        `Llamada de red no mockeada en un test: ${String(input)}. Mockeá globalThis.fetch.`
      )
    })
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.clearAllTimers()
  localStorage.clear()
})
