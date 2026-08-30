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
/**
 * Carga la fila de un pasajero en la planilla.
 *
 * Ya no hay un formulario por pasajero con su botón de guardar: es una fila
 * por butaca, y los clientes se dan de alta todos juntos al confirmar.
 */
async function registrarPasajero(usuario: ReturnType<typeof userEvent.setup>) {
  await usuario.type(screen.getByLabelText('Documento'), '1234567')
  await usuario.type(screen.getByLabelText('Nombres'), 'Ana')
  await usuario.type(screen.getByLabelText('Apellidos'), 'Pérez')
  await usuario.selectOptions(screen.getByLabelText('Tipo doc.'), 'CI')
  await usuario.selectOptions(screen.getByLabelText('Nacionalidad'), 'PY')
  await usuario.type(screen.getByLabelText('Residencia'), 'Paraguay')
  await usuario.type(screen.getByLabelText('F. nacim.'), '1990-05-10')
  await usuario.selectOptions(screen.getByLabelText('Género'), 'M')
  await usuario.selectOptions(screen.getByLabelText('Ocupación'), 'Empleado')
  await usuario.type(screen.getByLabelText('Teléfono'), '0981111111')
  await usuario.type(screen.getByLabelText('Email'), 'pasajero@test.com')

  return screen.findByText('1 de 1 completos')
}

/**
 * Completa a nombre de quién se factura, que es lo único que este paso pide
 * además de los pasajeros.
 *
 * **No elige método de pago**: se elige al cobrar, en el paso siguiente. En el
 * mostrador la venta se confirma antes de que el cliente diga cómo paga.
 */
async function completarLaFacturacion(
  usuario: ReturnType<typeof userEvent.setup>,
) {
  await usuario.type(screen.getByLabelText(/RUC o documento/i), '4969917-2')
  await usuario.type(
    screen.getByLabelText(/Razón social o nombre/i),
    'Sebastian Castro',
  )
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

    const boton = screen.getByRole('button', { name: /Faltan 1 pasajero/i })
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
    await completarLaFacturacion(usuario)

    await usuario.click(
      screen.getByRole('button', { name: /Confirmar venta y continuar/i }),
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
    await completarLaFacturacion(usuario)

    const boton = screen.getByRole('button', {
      name: /Confirmar venta y continuar/i,
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
    await completarLaFacturacion(usuario)
    await usuario.click(
      screen.getByRole('button', { name: /Confirmar venta y continuar/i }),
    )

    expect(
      await screen.findByText(/rechazó el precio de la venta/i),
    ).toBeInTheDocument()

    // El pasajero sigue registrado: se puede corregir y reintentar.
    // La fila cargada sigue completa: el rechazo no borró lo tipeado.
    expect(screen.getByText('1 de 1 completos')).toBeInTheDocument()
    expect(api.llamadasA('confirmar-nueva')).toBe(1)
  })

  describe('el método de pago no se elige acá', () => {
    // En el mostrador la venta se confirma antes de que el cliente diga cómo
    // paga: se cargan los pasajeros, se confirma con la transportista y recién
    // en el paso siguiente se cobra. Pedirlo acá obligaba a inventarlo, y lo
    // que se inventaba era `'EFECTIVO'`: la caja terminaba diciendo que había
    // entrado efectivo por ventas pagadas con tarjeta.

    it('no hay dónde elegirlo', async () => {
      mockearApi(rutasBase())
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConAsientosBloqueados(),
        pasoInicial: 'checkout',
      })

      await registrarPasajero(usuario)

      expect(screen.queryByLabelText('Método de pago')).not.toBeInTheDocument()
    })

    it('avisa que se elige en el paso siguiente', () => {
      mockearApi(rutasBase())

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConAsientosBloqueados(),
        pasoInicial: 'checkout',
      })

      expect(
        screen.getByText(/se elige en el paso siguiente/i),
      ).toBeInTheDocument()
    })

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

    it('la venta se manda SIN método: no se inventa ninguno', async () => {
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
      await completarLaFacturacion(usuario)

      await usuario.click(
        screen.getByRole('button', { name: /Confirmar venta y continuar/i }),
      )

      await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

      const [enviado] = api.cuerposDe('confirmar-nueva') as [
        { ventas: Array<Record<string, unknown>> },
      ]

      for (const venta of enviado.ventas) {
        expect(venta.metodoPago).toBeUndefined()
        expect(venta.estadoPago).toBeUndefined()
      }
    })

    it('los dos tramos van con la misma facturación', async () => {
      // Es una compra sola partida en dos ventas porque así lo exige la
      // empresa. El cliente factura una vez.
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
      await completarLaFacturacion(usuario)

      await usuario.click(
        screen.getByRole('button', { name: /Confirmar venta y continuar/i }),
      )

      await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

      const [enviado] = api.cuerposDe('confirmar-nueva') as [
        { ventas: Array<Record<string, unknown>> },
      ]

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
