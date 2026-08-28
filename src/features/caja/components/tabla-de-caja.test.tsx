import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TablaDeCaja } from './tabla-de-caja'
import type { FilaDeCaja } from '../models/caja.model'

/**
 * La tabla tiene dos formas según quién mira.
 *
 * Y las columnas se deciden por lo que llegó en los datos, no por un flag del
 * frontend. Si `cargoServicio` no vino, esa persona no tiene derecho a verlo:
 * no es que la pantalla lo esconde, es que el backend no lo mandó.
 */
describe('la tabla de la caja', () => {
  const sinAcciones = {
    onVerBoletos: vi.fn(),
    onVerFacturas: vi.fn(),
    onEnviar: vi.fn(),
    onAnular: vi.fn(),
    cargando: false,
  }

  /** Lo que recibe un vendedor: sus ventas, su comisión, nada del negocio. */
  const COMO_VENDEDOR: FilaDeCaja = {
    ventaId: 'v-1',
    numeroTransaccion: 'TXN87593508090',
    fechaVenta: '2026-08-28T03:26:33Z',
    documentoCliente: '4969917',
    nombreCliente: 'Sebastian Castro',
    empresa: 'Expressso Paraguay',
    estadoPago: 'PAGADO',
    estadoVenta: 'CONFIRMADO',
    monto: 84000,
    boletos: 1,
    miComision: 400,
  }

  /** Lo que recibe quien administra: además, los números del negocio. */
  const COMO_ADMIN: FilaDeCaja = {
    ...COMO_VENDEDOR,
    vendedor: 'Ana Gómez',
    cargoServicio: 4000,
    comisionEmpresa: 16000,
    porcentajeComision: 20,
  }

  describe('para el vendedor', () => {
    it('muestra su comisión', () => {
      render(
        <TablaDeCaja filas={[COMO_VENDEDOR]} soloMisVentas {...sinAcciones} />,
      )

      expect(screen.getByText('Mi comisión')).toBeInTheDocument()
    })

    it('NO muestra las columnas del negocio', () => {
      render(
        <TablaDeCaja filas={[COMO_VENDEDOR]} soloMisVentas {...sinAcciones} />,
      )

      expect(screen.queryByText('Cargo')).not.toBeInTheDocument()
      expect(screen.queryByText('Comisión')).not.toBeInTheDocument()
      expect(screen.queryByText('Vendedor')).not.toBeInTheDocument()
    })
  })

  describe('para quien administra', () => {
    it('muestra quién vendió y los números del negocio', () => {
      render(
        <TablaDeCaja
          filas={[COMO_ADMIN]}
          soloMisVentas={false}
          {...sinAcciones}
        />,
      )

      expect(screen.getByText('Vendedor')).toBeInTheDocument()
      expect(screen.getByText('Ana Gómez')).toBeInTheDocument()
      expect(screen.getByText('Cargo')).toBeInTheDocument()
    })

    it('marca como "Web" la venta que no hizo nadie', () => {
      // Sin vendedor no es un dato faltante: es una venta que hizo el cliente
      // por su cuenta, y decirlo evita que alguien la busque como error.
      render(
        <TablaDeCaja
          filas={[{ ...COMO_ADMIN, vendedor: undefined }]}
          soloMisVentas={false}
          {...sinAcciones}
        />,
      )

      expect(screen.getByText('Web')).toBeInTheDocument()
    })
  })

  describe('una venta anulada', () => {
    const ANULADA: FilaDeCaja = {
      ...COMO_VENDEDOR,
      // El pago sigue en PAGADO: el dinero se cobró de verdad, y el reembolso
      // es otro hecho. Por eso el estado de la VENTA manda sobre el del pago.
      estadoPago: 'PAGADO',
      estadoVenta: 'CANCELADO',
    }

    it('se ve como anulada, no como pagada', () => {
      render(<TablaDeCaja filas={[ANULADA]} soloMisVentas {...sinAcciones} />)

      expect(screen.getByText('Anulada')).toBeInTheDocument()
      expect(screen.queryByText('Pagado')).not.toBeInTheDocument()
    })

    it('dice que el cobro había entrado', () => {
      // Es lo que explica que haya un reembolso pendiente.
      render(<TablaDeCaja filas={[ANULADA]} soloMisVentas {...sinAcciones} />)

      expect(screen.getByText('cobrada')).toBeInTheDocument()
    })

    it('ya no ofrece anularla de nuevo', () => {
      render(<TablaDeCaja filas={[ANULADA]} soloMisVentas {...sinAcciones} />)

      expect(
        screen.queryByLabelText('Anular la venta TXN87593508090'),
      ).not.toBeInTheDocument()
    })

    it('una expirada también se ve por su estado de venta', () => {
      render(
        <TablaDeCaja
          filas={[{ ...ANULADA, estadoPago: 'PENDIENTE', estadoVenta: 'EXPIRADO' }]}
          soloMisVentas
          {...sinAcciones}
        />,
      )

      expect(screen.getByText('Expirada')).toBeInTheDocument()
    })
  })

  describe('la acción de anular', () => {
    it('se ofrece en una venta pagada', () => {
      render(
        <TablaDeCaja filas={[COMO_VENDEDOR]} soloMisVentas {...sinAcciones} />,
      )

      expect(
        screen.getByLabelText('Anular la venta TXN87593508090'),
      ).toBeInTheDocument()
    })

    it('NO se ofrece en una que nunca se cobró', () => {
      // Anular algo que no se cobró no devuelve nada, y ofrecerlo sugiere que
      // sí.
      render(
        <TablaDeCaja
          filas={[{ ...COMO_VENDEDOR, estadoPago: 'PENDIENTE' }]}
          soloMisVentas
          {...sinAcciones}
        />,
      )

      expect(
        screen.queryByLabelText('Anular la venta TXN87593508090'),
      ).not.toBeInTheDocument()
    })

    it('tampoco en una ya cancelada', () => {
      render(
        <TablaDeCaja
          filas={[{ ...COMO_VENDEDOR, estadoPago: 'CANCELADO' }]}
          soloMisVentas
          {...sinAcciones}
        />,
      )

      expect(
        screen.queryByLabelText('Anular la venta TXN87593508090'),
      ).not.toBeInTheDocument()
    })
  })

  it('dice que no hay ventas en vez de mostrar una tabla vacía', () => {
    render(<TablaDeCaja filas={[]} soloMisVentas {...sinAcciones} />)

    expect(screen.getByText(/No hay ventas en este período/)).toBeInTheDocument()
  })

  it('cada acción nombra su venta, para quien usa lector de pantalla', () => {
    render(<TablaDeCaja filas={[COMO_VENDEDOR]} soloMisVentas {...sinAcciones} />)

    expect(
      screen.getByLabelText('Ver los boletos de TXN87593508090'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Enviar los documentos de TXN87593508090'),
    ).toBeInTheDocument()
  })
})
