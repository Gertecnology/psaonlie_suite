import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerInforme } from './informes.service'

/**
 * The query string is where this can fail silently.
 *
 * The API declares `forbidNonWhitelisted`, so a parameter it does not know is a
 * 400, not a no-op — and an empty one counts. The panel's own field names also
 * differ from the API's (`desde` here, `fechaDesde` there), so a rename on
 * either side breaks the mapping without breaking the types.
 */
const apiFetch = vi.fn()

vi.mock('@/utils/api-client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  apiDownload: vi.fn(),
  descargarBlob: vi.fn(),
}))

/** The path the service asked for, minus the base. */
function consultaEnviada(): URLSearchParams {
  const ruta = apiFetch.mock.calls[0][0] as string
  return new URLSearchParams(ruta.split('?')[1] ?? '')
}

describe('obtenerInforme', () => {
  beforeEach(() => {
    apiFetch.mockReset()
    apiFetch.mockResolvedValue({})
  })

  it('traduce los nombres del panel a los que espera la API', async () => {
    await obtenerInforme('resumen-financiero', {
      desde: '2026-08-01',
      hasta: '2026-08-31',
    })

    const query = consultaEnviada()
    expect(query.get('fechaDesde')).toBe('2026-08-01')
    expect(query.get('fechaHasta')).toBe('2026-08-31')
    // Los nombres del panel no viajan: la API los rechazaría.
    expect(query.has('desde')).toBe(false)
    expect(query.has('hasta')).toBe(false)
  })

  it('no manda parámetros vacíos', async () => {
    // Con `forbidNonWhitelisted`, mandar `agenciaId=` es un 400 y no un filtro
    // ignorado.
    await obtenerInforme('resumen-financiero', {
      desde: '2026-08-01',
      hasta: '2026-08-31',
      agenciaId: undefined,
      metodoPago: undefined,
    })

    const query = consultaEnviada()
    expect(query.has('agenciaId')).toBe(false)
    expect(query.has('metodoPago')).toBe(false)
    expect([...query.keys()]).toEqual(['fechaDesde', 'fechaHasta'])
  })

  it('nunca manda `generado`: es del panel, no de la API', async () => {
    await obtenerInforme('resumen-financiero', {
      desde: '2026-08-01',
      hasta: '2026-08-31',
      generado: true,
    })

    expect(consultaEnviada().has('generado')).toBe(false)
  })

  it('la paginación viaja como page y limit', async () => {
    await obtenerInforme('por-agencia', {
      desde: '2026-08-01',
      hasta: '2026-08-31',
      pagina: 3,
      tamano: 50,
    })

    const query = consultaEnviada()
    expect(query.get('page')).toBe('3')
    expect(query.get('limit')).toBe('50')
    expect(query.has('pagina')).toBe(false)
    expect(query.has('tamano')).toBe(false)
  })

  it('manda todos los filtros que la API declara', async () => {
    await obtenerInforme('serie-temporal', {
      desde: '2026-08-01',
      hasta: '2026-08-31',
      agenciaId: '11111111-1111-1111-1111-111111111111',
      metodoPago: 'BANCARD',
      origenId: '22222222-2222-2222-2222-222222222222',
      destinoId: '33333333-3333-3333-3333-333333333333',
      agruparPor: 'semana',
      comparativoDesde: '2026-07-01',
      comparativoHasta: '2026-07-31',
    })

    const query = consultaEnviada()
    expect(query.get('agenciaId')).toBe('11111111-1111-1111-1111-111111111111')
    expect(query.get('metodoPago')).toBe('BANCARD')
    expect(query.get('origenId')).toBe('22222222-2222-2222-2222-222222222222')
    expect(query.get('destinoId')).toBe('33333333-3333-3333-3333-333333333333')
    expect(query.get('agruparPor')).toBe('semana')
    expect(query.get('comparativoDesde')).toBe('2026-07-01')
    expect(query.get('comparativoHasta')).toBe('2026-07-31')
  })

  it('pega contra el módulo de informes, no contra el de ventas', async () => {
    // El panel consumía `/api/admin/ventas/estadisticas` y calculaba los saldos
    // encima. Los endpoints de informes existían desde siempre.
    await obtenerInforme('por-agencia', { desde: '2026-08-01', hasta: '2026-08-31' })

    expect(apiFetch.mock.calls[0][0]).toContain('/api/admin/informes/por-agencia')
  })
})
