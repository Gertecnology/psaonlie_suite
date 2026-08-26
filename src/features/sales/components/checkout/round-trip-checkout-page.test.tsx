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
    await usuario.click(
      screen.getByRole('button', { name: /Confirmar venta y continuar/i }),
    )

    expect(
      await screen.findByText(/rechazó el precio de la venta/i),
    ).toBeInTheDocument()

    // El pasajero sigue registrado: se puede corregir y reintentar.
    expect(screen.getByText(/Pasajero registrado/i)).toBeInTheDocument()
    expect(api.llamadasA('confirmar-nueva')).toBe(1)
  })
})
