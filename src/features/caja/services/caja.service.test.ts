import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/api-client', () => ({
  apiFetch: vi.fn(),
  apiDownload: vi.fn(),
  descargarBlob: vi.fn(),
}))

import { apiDownload, apiFetch, descargarBlob } from '@/utils/api-client'
import {
  descargarFactura,
  enviarDocumentos,
  obtenerListadoDeCaja,
} from './caja.service'

/**
 * El cliente de los endpoints de caja.
 *
 * Lo que se prueba acá es qué se pide, no qué se recibe: la API rechaza
 * cualquier parámetro que no declara, así que mandar uno vacío es un 400 y no
 * un no-op.
 */
describe('el cliente de la caja', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset().mockResolvedValue({} as never)
    vi.mocked(apiDownload)
      .mockReset()
      .mockResolvedValue({ blob: new Blob(), nombreArchivo: undefined })
    vi.mocked(descargarBlob).mockReset()
  })

  const rutaPedida = () => vi.mocked(apiFetch).mock.calls[0][0] as string

  describe('el listado', () => {
    it('no manda los filtros vacíos', async () => {
      // La API los rechaza: un parámetro vacío es un 400, no un filtro que se
      // ignora.
      await obtenerListadoDeCaja({ busqueda: '', estadoPago: undefined })

      expect(rutaPedida()).toBe('/api/admin/ventas/caja?')
    })

    it('manda los filtros que sí tienen valor', async () => {
      await obtenerListadoDeCaja({
        desde: '2026-08-01',
        hasta: '2026-08-28',
        busqueda: '4969917',
        origen: 'CAJA',
        pagina: 2,
      })

      const ruta = rutaPedida()

      expect(ruta).toContain('fechaDesde=2026-08-01')
      expect(ruta).toContain('fechaHasta=2026-08-28')
      expect(ruta).toContain('busqueda=4969917')
      expect(ruta).toContain('origen=CAJA')
      expect(ruta).toContain('page=2')
    })

    it('NO manda un filtro por vendedor', async () => {
      // No existe en la API a propósito: si se pudiera pedir, cualquiera leería
      // las ventas y las comisiones de un compañero cambiando un número.
      await obtenerListadoDeCaja({ busqueda: 'x' })

      expect(rutaPedida()).not.toContain('usuario')
      expect(rutaPedida()).not.toContain('vendedor')
    })
  })

  describe('el envío de documentos', () => {
    it('sin correo, manda el cuerpo vacío', async () => {
      // Cada documento va a quien le corresponde.
      await enviarDocumentos('TXN1')

      const opciones = vi.mocked(apiFetch).mock.calls[0][1]

      expect(opciones?.body).toBe('{}')
    })

    it('con correo, lo manda en el cuerpo', async () => {
      await enviarDocumentos('TXN1', 'cliente@ejemplo.py')

      const opciones = vi.mocked(apiFetch).mock.calls[0][1]

      expect(opciones?.body).toBe('{"correoDestino":"cliente@ejemplo.py"}')
    })

    it('escapa el número de transacción en la ruta', async () => {
      await enviarDocumentos('TXN/1 raro')

      expect(rutaPedida()).toContain('TXN%2F1%20raro')
    })
  })

  describe('la descarga de la factura', () => {
    it('pide el ticket térmico cuando se lo eligió', async () => {
      await descargarFactura('TXN1', 'TERMICA')

      const ruta = vi.mocked(apiDownload).mock.calls[0][0]

      expect(ruta).toContain('tipoImpresion=TERMICA')
    })

    it('va por apiDownload y no por un enlace', async () => {
      // El endpoint necesita el token: un `<a href>` no manda credenciales y
      // vuelve 401.
      await descargarFactura('TXN1', 'NORMAL')

      expect(apiDownload).toHaveBeenCalledTimes(1)
      expect(descargarBlob).toHaveBeenCalledTimes(1)
    })

    it('nombra el archivo distinto según la impresión', async () => {
      await descargarFactura('TXN1', 'TERMICA')

      expect(descargarBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        'factura-TXN1-ticket.pdf',
      )
    })

    it('respeta el nombre que manda el servidor', async () => {
      vi.mocked(apiDownload).mockResolvedValue({
        blob: new Blob(),
        nombreArchivo: 'factura-150040010161.pdf',
      })

      await descargarFactura('TXN1', 'NORMAL')

      expect(descargarBlob).toHaveBeenCalledWith(
        expect.any(Blob),
        'factura-150040010161.pdf',
      )
    })
  })
})
