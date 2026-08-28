import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/caja.service', () => ({
  obtenerFacturasDeLaVenta: vi.fn(),
  verDocumento: vi.fn(),
  descargarDocumento: vi.fn(),
  descargarFactura: vi.fn(),
  enviarDocumentos: vi.fn(),
  obtenerListadoDeCaja: vi.fn(),
  obtenerBoletosDeLaVenta: vi.fn(),
  anularVenta: vi.fn(),
}))

import { renderConProveedores } from '@/test/utils'
import type { FacturaDeLaVenta } from '../models/caja.model'
import {
  descargarDocumento,
  obtenerFacturasDeLaVenta,
  verDocumento,
} from '../services/caja.service'
import { LosDocumentosDeLaVenta } from './los-documentos-de-la-venta'

/**
 * Lo que la venta produjo, para verlo antes de entregarlo.
 *
 * El vendedor tiene al cliente enfrente. Entregar a ciegas lo que no vio es
 * cómo se imprime el boleto equivocado en una venta de tres pasajeros.
 */
describe('los documentos de la venta', () => {
  const BOLETO: FacturaDeLaVenta = {
    id: 'doc-boleto',
    tipo: 'BOLETO',
    archivo: 'boleto-150040010167.pdf',
    numeroBoleto: '150040010167',
    tamano: 69178,
    emitidaEn: '2026-08-28T03:27:35Z',
    esFiscal: false,
  }

  const FACTURA: FacturaDeLaVenta = {
    id: 'doc-factura',
    tipo: 'FACTURA_PASAJE',
    archivo: 'factura-150040010167.pdf',
    numeroBoleto: '150040010167',
    tamano: 41000,
    emitidaEn: '2026-08-28T03:27:36Z',
    razonSocial: 'CASTRO SAMANIEGO, ANGEL SEBASTIAN',
    documento: '4969917-2',
    esFiscal: false,
  }

  const CARGO: FacturaDeLaVenta = {
    id: 'doc-cargo',
    tipo: 'CARGO_SERVICIO',
    archivo: 'cargo-servicio.pdf',
    tamano: 12000,
    emitidaEn: '2026-08-28T03:27:37Z',
    esFiscal: true,
  }

  const montar = (documentos: FacturaDeLaVenta[] = [BOLETO, FACTURA, CARGO]) => {
    vi.mocked(obtenerFacturasDeLaVenta).mockResolvedValue(documentos)

    return renderConProveedores(
      <LosDocumentosDeLaVenta numeroTransaccion='TXN11311703245' />,
    )
  }

  // jsdom no implementa la API de object URLs. El doble no es una comodidad:
  // sin él, `revokeObjectURL` revienta y no se puede comprobar que se libere.
  const revocar = vi.fn()

  beforeEach(() => {
    URL.revokeObjectURL = revocar
    revocar.mockClear()
    vi.mocked(obtenerFacturasDeLaVenta).mockReset()
    vi.mocked(verDocumento).mockReset()
    vi.mocked(descargarDocumento).mockReset()
    vi.mocked(verDocumento).mockResolvedValue({ url: 'blob:el-pdf' })
    vi.mocked(descargarDocumento).mockResolvedValue(undefined)
  })

  it('muestra el boleto, no sólo las facturas', async () => {
    // El listado traía sólo FACTURA_*, así que lo único que la persona necesita
    // para subir al bus era lo único que no figuraba.
    montar()

    expect(await screen.findByText('Boleto 150040010167')).toBeInTheDocument()
    expect(
      screen.getByText('Factura del pasaje 150040010167'),
    ).toBeInTheDocument()
    expect(screen.getByText('Cargo por servicio')).toBeInTheDocument()
  })

  it('abre el documento que se pidió, no cualquiera', async () => {
    // En una venta de tres pasajeros, servir el equivocado es entregarle a
    // alguien el pasaje de un tercero.
    montar()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Ver Boleto 150040010167' }),
    )

    await waitFor(() => expect(verDocumento).toHaveBeenCalledWith('doc-boleto'))
  })

  it('lo muestra en pantalla, no lo descarga', async () => {
    montar()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Ver Boleto 150040010167' }),
    )

    const visor = await screen.findByTitle(/Vista previa de Boleto/i)

    expect(visor).toHaveAttribute('src', 'blob:el-pdf')
    expect(descargarDocumento).not.toHaveBeenCalled()
  })

  it('no lo vuelve a traer si ya se abrió', async () => {
    // Cada apertura crea un object URL: traerlo dos veces deja uno colgado en
    // memoria por cada clic.
    montar()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Ver Boleto 150040010167' }),
    )
    await screen.findByTitle(/Vista previa/i)

    await userEvent.click(
      screen.getByRole('button', { name: 'Cerrar la vista previa' }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Ver Boleto 150040010167' }),
    )

    await screen.findByTitle(/Vista previa/i)
    expect(verDocumento).toHaveBeenCalledTimes(1)
  })

  it('cada documento se puede descargar por separado', async () => {
    montar()

    await userEvent.click(
      await screen.findByRole('button', {
        name: /Descargar Factura del pasaje 150040010167/i,
      }),
    )

    await waitFor(() =>
      expect(descargarDocumento).toHaveBeenCalledWith(
        'doc-factura',
        'factura-150040010167.pdf',
      ),
    )
  })

  it('avisa cuando ninguna factura es fiscal', async () => {
    montar([BOLETO, FACTURA])

    expect(
      await screen.findByText(/no son facturas ante la SET/i),
    ).toBeInTheDocument()
  })

  it('el boleto no cuenta para ese aviso', async () => {
    // Un boleto nunca es un documento fiscal. Contarlo haría saltar la
    // advertencia hasta en las ventas que sí facturaron bien.
    montar([BOLETO, CARGO])

    expect(await screen.findByText('Cargo por servicio')).toBeInTheDocument()
    expect(
      screen.queryByText(/no son facturas ante la SET/i),
    ).not.toBeInTheDocument()
  })

  it('libera el PDF al salir de la pantalla', async () => {
    // Un object URL vive hasta que se lo libera. Sin esto, un vendedor que
    // abre veinte ventas en un turno se queda con veinte PDF en memoria.
    const { unmount } = montar()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Ver Boleto 150040010167' }),
    )
    await screen.findByTitle(/Vista previa/i)

    unmount()

    expect(revocar).toHaveBeenCalledWith('blob:el-pdf')
  })

  it('una venta sin documentos lo dice', async () => {
    montar([])

    expect(
      await screen.findByText(/todavía no tiene documentos generados/i),
    ).toBeInTheDocument()
  })
})
