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
  datosConPasajerosCargados,
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

/**
 * Los pasajeros ya vienen cargados del paso anterior.
 *
 * La planilla es su propia pantalla: acá se revisa lo que se cargó, se elige
 * cómo paga y se confirma. Cargar y confirmar en la misma pantalla hacía que
 * el vendedor apretara «confirmar» arriba sin haber visto lo de abajo.
 */
function abrirElResumen() {
  const api = mockearApi(rutasBase())

  renderVenta(<RoundTripCheckoutPage />, {
    datosIniciales: datosConPasajerosCargados(),
    pasoInicial: 'resumen',
  })

  return api
}

/** A nombre de quién sale la factura. */
async function completarLaFacturacion(
  usuario: ReturnType<typeof userEvent.setup>,
) {
  await usuario.type(screen.getByLabelText(/RUC o documento/i), '4969917-2')
  await usuario.type(
    screen.getByLabelText(/Razón social o nombre/i),
    'Sebastian Castro',
  )
}

/** Con qué paga el cliente. Obligatorio antes de confirmar. */
async function elegirComoPaga(
  usuario: ReturnType<typeof userEvent.setup>,
  metodo = 'Efectivo',
) {
  await usuario.click(screen.getByRole('radio', { name: metodo }))
}

describe('RoundTripCheckoutPage', () => {
  it('muestra el desglose de lo que paga el cliente, sin la comisión', () => {
    abrirElResumen()

    // Pasaje 150.000 + cargo 10% (15.000) = 165.000
    expect(screen.getByText('Pasajes')).toBeInTheDocument()
    expect(screen.getByText('Cargo por servicio')).toBeInTheDocument()
    expect(screen.getByTestId('total-a-cobrar')).toHaveTextContent('165.000')

    // La comisión es un acuerdo con la empresa: nunca se le muestra al cliente.
    expect(screen.queryByText(/comisión/i)).not.toBeInTheDocument()
  })

  it('no deja confirmar hasta que todos los pasajeros están cargados', () => {
    // Se puede llegar acá con la planilla a medio llenar: el botón lo dice y
    // no deja seguir.
    mockearApi(rutasBase())

    renderVenta(<RoundTripCheckoutPage />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'resumen',
    })

    expect(
      screen.getByRole('button', { name: /Faltan 1 pasajero/i }),
    ).toBeDisabled()
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
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'resumen',
    })

    await completarLaFacturacion(usuario)
    await elegirComoPaga(usuario)

    await usuario.click(screen.getByRole('button', { name: /^Cobrar / }))

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
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'resumen',
    })

    await completarLaFacturacion(usuario)
    await elegirComoPaga(usuario)

    const boton = screen.getByRole('button', {
      name: /^Cobrar /,
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
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'resumen',
    })

    await completarLaFacturacion(usuario)
    await elegirComoPaga(usuario)
    await usuario.click(screen.getByRole('button', { name: /^Cobrar / }))

    expect(
      await screen.findByText(/rechazó el precio de la venta/i),
    ).toBeInTheDocument()

    // El pasajero sigue registrado: se puede corregir y reintentar.
    // El pasajero sigue en la lista: el rechazo no borró lo cargado.
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(api.llamadasA('confirmar-nueva')).toBe(1)
  })

  describe('cómo paga se elige acá, antes de confirmar', () => {
    it('ofrece los cuatro métodos que la API acepta', () => {
      abrirElResumen()

      for (const metodo of ['Efectivo', 'Transferencia', 'Wepa', 'Bancard']) {
        expect(screen.getByRole('radio', { name: metodo })).toBeInTheDocument()
      }
    })

    it('sin elegir, el botón lo pide y no deja confirmar', () => {
      abrirElResumen()

      expect(
        screen.getByRole('button', { name: /Elegí cómo paga/i }),
      ).toBeDisabled()
    })

    it('no deja confirmar sin los datos de facturación', async () => {
      const usuario = userEvent.setup()
      abrirElResumen()

      await elegirComoPaga(usuario)

      expect(
        screen.getByRole('button', { name: /Faltan los datos de facturación/i }),
      ).toBeDisabled()
    })

    it('la venta se manda CON el método elegido', async () => {
      // Mandaba `EFECTIVO` fijo y el paso siguiente lo corregía: una venta que
      // expiraba sin cobrarse quedaba registrada como efectivo para siempre.
      // Dejarlo vacío tampoco sirve: una venta sin método es una venta que no
      // se sabe cómo se cobró.
      const api = mockearApi([
        ...rutasBase(),
        { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
      ])
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConPasajerosCargados(),
        pasoInicial: 'resumen',
      })

      await completarLaFacturacion(usuario)
      await elegirComoPaga(usuario, 'Transferencia')

      await usuario.click(screen.getByRole('button', { name: /^Cobrar / }))

      await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

      const [enviado] = api.cuerposDe('confirmar-nueva') as [
        { ventas: Array<Record<string, unknown>> },
      ]

      for (const venta of enviado.ventas) {
        expect(venta.metodoPago).toBe('TRANSFERENCIA')
      }
    })

    it('los dos tramos van con el mismo método y la misma facturación', async () => {
      // Es una compra sola partida en dos ventas porque así lo exige la
      // empresa. El cliente factura una vez y paga una vez.
      const api = mockearApi([
        ...rutasBase(),
        { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
      ])
      const usuario = userEvent.setup()

      renderVenta(<RoundTripCheckoutPage />, {
        datosIniciales: datosConPasajerosCargados(),
        pasoInicial: 'resumen',
      })

      await completarLaFacturacion(usuario)
      await elegirComoPaga(usuario)

      await usuario.click(screen.getByRole('button', { name: /^Cobrar / }))

      await waitFor(() => expect(api.llamadasA('confirmar-nueva')).toBe(1))

      const [enviado] = api.cuerposDe('confirmar-nueva') as [
        { ventas: Array<Record<string, unknown>> },
      ]

      for (const venta of enviado.ventas) {
        expect(venta.metodoPago).toBe('EFECTIVO')
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
