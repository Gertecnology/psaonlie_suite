import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoundTripPaymentPage } from './round-trip-payment-page'
import { mockearApi } from '@/test/api-mock'
import { renderVenta } from '@/test/render-venta'
import {
  VENTA_CONFIRMADA_OK,
  datosConAsientosBloqueados,
} from '@/test/fixtures-venta'
import type { RoundTripSearchData } from '../../models/sales.model'

function datosConVentaConfirmada(): RoundTripSearchData {
  const base = datosConAsientosBloqueados()
  return {
    ida: {
      ...base.ida,
      ventaConfirmada: VENTA_CONFIRMADA_OK.resultados[0].venta,
    },
  }
}

async function elegirMetodoPago(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.click(screen.getByRole('combobox'))
  await usuario.click(await screen.findByRole('option', { name: 'Efectivo' }))
}

describe('RoundTripPaymentPage', () => {
  it('muestra el total a cobrar con el cargo por servicio incluido', () => {
    mockearApi([])

    renderVenta(<RoundTripPaymentPage />, {
      datosIniciales: datosConVentaConfirmada(),
      pasoInicial: 'payment',
    })

    // Pasaje 150.000 + cargo 10% (15.000) = 165.000
    expect(screen.getByTestId('total-a-cobrar')).toHaveTextContent('165.000')
  })

  it('NO reporta el cobro cuando el backend responde 200 con success: false', async () => {
    // El backend viejo devuelve 200 con `success: false`. Decidir sólo con
    // `response.ok` mostraba el toast verde sobre un cobro que no se registró.
    mockearApi([
      {
        url: 'actualizar-estado-pago',
        status: 200,
        body: {
          success: false,
          statusCode: 500,
          message: 'No se pudo actualizar el estado de la venta',
        },
      },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripPaymentPage />, {
      datosIniciales: datosConVentaConfirmada(),
      pasoInicial: 'payment',
    })

    await elegirMetodoPago(usuario)
    await usuario.click(screen.getByRole('button', { name: /Confirmar cobro/i }))

    expect(
      await screen.findByText(
        /No se pudo actualizar el estado de la venta/i,
      ),
    ).toBeInTheDocument()

    // Sin cobro confirmado no se ofrece descargar la factura.
    expect(
      screen.queryByRole('button', { name: /Descargar factura/i }),
    ).not.toBeInTheDocument()
  })

  it('registra el cobro y recién ahí ofrece la factura', async () => {
    mockearApi([
      {
        url: 'actualizar-estado-pago',
        status: 200,
        body: {
          ventaId: 'V-1',
          numeroTransaccion: 'TXN-1',
          estadoAnterior: 'PENDIENTE',
          estadoNuevo: 'PAGADO',
          fechaActualizacion: '2026-08-21T10:05:00.000Z',
          mensaje: 'Estado actualizado',
        },
      },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripPaymentPage />, {
      datosIniciales: datosConVentaConfirmada(),
      pasoInicial: 'payment',
    })

    await elegirMetodoPago(usuario)
    await usuario.click(screen.getByRole('button', { name: /Confirmar cobro/i }))

    expect(
      await screen.findByRole('button', { name: /Descargar factura Ida/i }),
    ).toBeInTheDocument()
  })

  it('no cobra dos veces si el operador hace doble click', async () => {
    const api = mockearApi([
      {
        url: 'actualizar-estado-pago',
        status: 200,
        body: {
          ventaId: 'V-1',
          numeroTransaccion: 'TXN-1',
          estadoAnterior: 'PENDIENTE',
          estadoNuevo: 'PAGADO',
          fechaActualizacion: '2026-08-21T10:05:00.000Z',
          mensaje: 'Estado actualizado',
        },
      },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripPaymentPage />, {
      datosIniciales: datosConVentaConfirmada(),
      pasoInicial: 'payment',
    })

    await elegirMetodoPago(usuario)
    const boton = screen.getByRole('button', { name: /Confirmar cobro/i })

    await Promise.all([usuario.click(boton), usuario.click(boton)])

    await screen.findByRole('button', { name: /Descargar factura Ida/i })
    await waitFor(() =>
      expect(api.llamadasA('actualizar-estado-pago')).toBe(1),
    )
  })
})
