import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoundTripCheckoutPage } from './round-trip-checkout-page'
import { mockearApi } from '@/test/api-mock'
import { renderVenta } from '@/test/render-venta'
import {
  CLIENTE_CREADO,
  VENTA_CONFIRMADA_OK,
  datosConAsientosBloqueados,
} from '@/test/fixtures-venta'

const TIPOS_DOCUMENTO = [
  {
    id: 'td-1',
    idExterno: 1,
    codigo: 'CI',
    descripcion: 'Cédula de identidad',
    activo: true,
    ordenVisualizacion: 1,
  },
]

const PAISES = [
  {
    empresa: 'Empresa Sol',
    success: true,
    url: '',
    id: 'EMP-1',
    data: [
      {
        diffgr_id: 'p1',
        rowOrder: '0',
        id: '1',
        Codigo: 'PY',
        Descripcion: 'Paraguay',
      },
    ],
  },
]

function rutasBase() {
  return [
    { url: 'tipos-documento', status: 200, body: TIPOS_DOCUMENTO },
    { url: '/api/paises', status: 200, body: PAISES },
    { url: '/api/clientes', status: 201, body: CLIENTE_CREADO },
  ]
}

/** Completa y envía el formulario del único pasajero. */
async function registrarPasajero(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByPlaceholderText('Nombres'), 'Ana')
  await usuario.type(screen.getByPlaceholderText('Apellidos'), 'Pérez')
  await usuario.type(screen.getByPlaceholderText('Número'), '1234567')
  await usuario.type(screen.getByPlaceholderText('Ej: Paraguay'), 'Paraguay')
  await usuario.type(screen.getByPlaceholderText('Ej: 975622233'), '0981111111')
  await usuario.type(
    screen.getByPlaceholderText('ejemplo@correo.com'),
    'pasajero@test.com',
  )

  const fecha = document.querySelector('input[type="date"]') as HTMLInputElement
  await usuario.type(fecha, '1990-05-10')

  // Los combos de Radix se identifican por su posición en el formulario:
  // tipo de documento, nacionalidad, género y ocupación.
  await elegirOpcion(usuario, 0, 'Cédula de identidad')
  await elegirOpcion(usuario, 1, 'Paraguay')
  await elegirOpcion(usuario, 2, 'Masculino')
  await elegirOpcion(usuario, 3, 'Empleado')

  await usuario.click(
    screen.getByRole('button', { name: /Registrar pasajero/i }),
  )

  return screen.findByText(/Pasajero registrado/i)
}

/**
 * Completa lo que hace falta para confirmar: a nombre de quién se factura y con
 * qué se cobra. Faltaba en esta pantalla, y sin eso los dos tramos se
 * registraban con `'EFECTIVO'` fijo.
 */
async function completarElCobro(
  usuario: ReturnType<typeof userEvent.setup>,
  metodo = 'Efectivo',
) {
  await usuario.type(screen.getByLabelText(/RUC o documento/i), '4969917-2')
  await usuario.type(
    screen.getByLabelText(/Razón social o nombre/i),
    'Sebastian Castro',
  )

  await usuario.click(screen.getByLabelText('Método de pago'))
  await usuario.click(await screen.findByRole('option', { name: metodo }))
}

async function elegirOpcion(
  usuario: ReturnType<typeof userEvent.setup>,
  indice: number,
  opcion: string,
) {
  await usuario.click(screen.getAllByRole('combobox')[indice])
  await usuario.click(await screen.findByRole('option', { name: opcion }))
}

describe('RoundTripCheckoutPage', () => {
  it('muestra el desglose de lo que paga el cliente, sin la comisión', () => {
    mockearApi(rutasBase())

    renderVenta(<RoundTripCheckoutPage />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'checkout',
    })

    // Pasaje 150.000 + cargo 10% (15.000) = 165.000
    expect(screen.getByText('Pasajes')).toBeInTheDocument()
    expect(screen.getByText('Cargo por servicio')).toBeInTheDocument()
    expect(screen.getByTestId('total-a-cobrar')).toHaveTextContent('165.000')

    // La comisión es un acuerdo con la empresa: nunca se le muestra al cliente.
    expect(screen.queryByText(/comisión/i)).not.toBeInTheDocument()
  })

  it('no deja confirmar hasta que todos los pasajeros están registrados', () => {
    mockearApi(rutasBase())

    renderVenta(<RoundTripCheckoutPage />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'checkout',
    })

    const boton = screen.getByRole('button', { name: /Faltan los datos de/i })
    expect(boton).toBeDisabled()
  })

  it('crea el pasajero una sola vez y usa su id para confirmar la venta', async () => {
    // Antes el formulario creaba el cliente y el checkout lo volvía a crear
    // para conseguir el id: cada pasajero se daba de alta dos veces.
    const api = mockearApi([
      ...rutasBase(),
      { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripCheckoutPage />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'checkout',
    })

    await registrarPasajero(usuario)
    await completarElCobro(usuario)

    await usuario.click(
      screen.getByRole('button', { name: /Cobrar en efectivo/i }),
    )

    await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

    // Una sola alta de cliente en todo el checkout.
    const altas = api
      .fetchMock.mock.calls.filter((llamada) => {
        const url = String(llamada[0])
        const metodo = (llamada[1] as RequestInit | undefined)?.method
        return url.endsWith('/api/clientes') && metodo === 'POST'
      })
    expect(altas).toHaveLength(1)

    // El importe enviado son sólo los pasajes: el cargo por servicio lo
    // calcula el backend.
    const [pedido] = api.cuerposDe('confirmar-nueva') as Array<{
      ventas: Array<{ importeTotal: number; asiento: Array<{ clienteId: string }> }>
    }>
    expect(pedido.ventas[0].importeTotal).toBe(150000)
    expect(pedido.ventas[0].asiento[0].clienteId).toBe('CLI-1')
  })

  it('no confirma dos veces si el operador hace doble click', async () => {
    const api = mockearApi([
      ...rutasBase(),
      { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripCheckoutPage />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'checkout',
    })

    await registrarPasajero(usuario)
    await completarElCobro(usuario)

    const boton = screen.getByRole('button', {
      name: /Cobrar en efectivo/i,
    })
    await Promise.all([usuario.click(boton), usuario.click(boton)])

    await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))
  })

  it('muestra el rechazo por precio inválido sin perder los pasajeros cargados', async () => {
    // El backend valida el precio contra la tarifa real y puede rechazar.
    const api = mockearApi([
      ...rutasBase(),
      {
        url: 'confirmar-nueva',
        status: 201,
        body: {
          esVentaIndividual: false,
          totalProcesadas: 1,
          exitosas: 0,
          fallidas: 1,
          tiempoProcesamiento: 80,
          resultados: [
            {
              indice: 0,
              exitoso: false,
              error: {
                codigo: 'VALIDATION_ERROR',
                mensaje: 'El precio enviado no coincide con la tarifa vigente',
                detalles: {},
              },
            },
          ],
        },
      },
      {
        url: 'liberar-bloqueo',
        status: 200,
        body: { success: true, message: 'Bloqueo liberado' },
      },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripCheckoutPage />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'checkout',
    })

    await registrarPasajero(usuario)
    await completarElCobro(usuario)
    await usuario.click(
      screen.getByRole('button', { name: /Cobrar en efectivo/i }),
    )

    expect(
      await screen.findByText(/rechazó el precio de la venta/i),
    ).toBeInTheDocument()

    // El pasajero sigue registrado: se puede corregir y reintentar.
    expect(screen.getByText(/Pasajero registrado/i)).toBeInTheDocument()
    expect(api.llamadasA('confirmar-nueva')).toBe(1)
  })

  describe('ida y vuelta se cobra como corresponde', () => {
    // Esta pantalla no tenía ni facturación ni elección de método de pago: los
    // dos tramos se registraban con `'EFECTIVO'` fijo aunque se cobrara con
    // tarjeta. La caja, los movimientos y los informes decían algo que no había
    // pasado. La pantalla de viaje simple sí lo tenía; ésta quedó sin tocar.

    it('no deja confirmar sin los datos de facturación', async () => {
      mockearApi(rutasBase())
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConAsientosBloqueados(),
        pasoInicial: 'checkout',
      })

      await registrarPasajero(usuario)

      expect(
        screen.getByRole('button', { name: /Faltan los datos de facturación/i }),
      ).toBeDisabled()
    })

    it('no deja confirmar sin elegir con qué paga', async () => {
      mockearApi(rutasBase())
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConAsientosBloqueados(),
        pasoInicial: 'checkout',
      })

      await registrarPasajero(usuario)
      await usuario.type(screen.getByLabelText(/RUC o documento/i), '4969917-2')
      await usuario.type(
        screen.getByLabelText(/Razón social o nombre/i),
        'Sebastian Castro',
      )

      expect(
        screen.getByRole('button', { name: /Elegí con qué va a pagar/i }),
      ).toBeDisabled()
    })

    it('manda el método elegido, no EFECTIVO', async () => {
      const api = mockearApi([
        ...rutasBase(),
        { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
      ])
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConAsientosBloqueados(),
        pasoInicial: 'checkout',
      })

      await registrarPasajero(usuario)
      await completarElCobro(usuario, 'Bancard')

      await usuario.click(
        screen.getByRole('button', { name: /Confirmar venta y continuar/i }),
      )

      await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

      const [enviado] = api.cuerposDe('confirmar-nueva') as [{ ventas: Array<Record<string, unknown>> }]

      for (const venta of enviado.ventas) {
        expect(venta.metodoPago).toBe('BANCARD')
        // Con tarjeta la plata todavía no está: la confirma el callback.
        expect(venta.estadoPago).toBe('PENDIENTE')
      }
    })

    it('en efectivo la venta nace pagada', async () => {
      // El vendedor aprieta confirmar con los billetes en la mano, y la API
      // rechaza PENDIENTE porque nadie manda después un callback diciendo
      // «ya te pagó en efectivo».
      const api = mockearApi([
        ...rutasBase(),
        { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
      ])
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConAsientosBloqueados(),
        pasoInicial: 'checkout',
      })

      await registrarPasajero(usuario)
      await completarElCobro(usuario)

      await usuario.click(
        screen.getByRole('button', { name: /Cobrar en efectivo/i }),
      )

      await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

      const [enviado] = api.cuerposDe('confirmar-nueva') as [{ ventas: Array<Record<string, unknown>> }]

      for (const venta of enviado.ventas) {
        expect(venta.metodoPago).toBe('EFECTIVO')
        expect(venta.estadoPago).toBe('PAGADO')
      }
    })

    it('los dos tramos van con la misma facturación', async () => {
      // Es una compra sola partida en dos ventas porque así lo exige la
      // empresa. El cliente paga una vez y factura una vez.
      const api = mockearApi([
        ...rutasBase(),
        { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
      ])
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConAsientosBloqueados(),
        pasoInicial: 'checkout',
      })

      await registrarPasajero(usuario)
      await completarElCobro(usuario)

      await usuario.click(
        screen.getByRole('button', { name: /Cobrar en efectivo/i }),
      )

      await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

      const [enviado] = api.cuerposDe('confirmar-nueva') as [{ ventas: Array<Record<string, unknown>> }]

      for (const venta of enviado.ventas) {
        expect(venta.facturacion).toEqual({
          documento: '4969917-2',
          razonSocial: 'Sebastian Castro',
          email: undefined,
          direccion: undefined,
        })
      }
    })
  })
})
