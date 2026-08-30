import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import {
  PASAJERO_CARGADO,
  datosConAsientosBloqueados,
  datosConPasajerosCargados,
} from '@/test/fixtures-venta'
import { renderVenta } from '@/test/render-venta'
import { RoundTripFlow } from '../round-trip-flow'

/**
 * Primero se carga, después se cobra.
 *
 * Cargar los pasajeros y confirmar la venta estaban en la misma pantalla: con
 * dieciocho butacas eso no entra en una notebook, y el vendedor apretaba
 * «confirmar» arriba sin haber visto lo que cargó abajo.
 *
 * Ahora son dos pasos. Estos casos son sobre el PASO entre uno y otro: qué se
 * ve, qué se lleva y qué pasa al volver.
 */

const rutas = () =>
  mockearApi([
    {
      url: 'tipos-documento',
      body: [{ id: '1', codigo: 'CI', descripcion: 'Cédula' }],
    },
    {
      url: '/api/paises',
      body: [{ success: true, data: [{ Codigo: 'PY', Descripcion: 'Paraguay' }] }],
    },
  ])

describe('primero se carga, después se cobra', () => {
  it('el paso 4 es la planilla, y nada más', () => {
    rutas()
    renderVenta(<RoundTripFlow />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'checkout',
    })

    expect(
      screen.getByRole('heading', { name: 'Pasajeros' })
    ).toBeInTheDocument()
    expect(screen.getByText('0 de 1 completos')).toBeInTheDocument()

    // Cobrar es el paso siguiente: acá no hay dónde elegir cómo paga.
    expect(screen.queryByRole('radio', { name: 'Efectivo' })).not.toBeInTheDocument()
  })

  it('sin la planilla completa, el botón dice cuántos faltan y no deja pasar', () => {
    rutas()
    renderVenta(<RoundTripFlow />, {
      datosIniciales: datosConAsientosBloqueados(),
      pasoInicial: 'checkout',
    })

    expect(
      screen.getByRole('button', { name: /Faltan 1 pasajero/i })
    ).toBeDisabled()
  })

  it('con todo cargado, se pasa al resumen y los pasajeros están ahí', async () => {
    rutas()
    const usuario = userEvent.setup()

    renderVenta(<RoundTripFlow />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'checkout',
    })

    await usuario.click(
      screen.getByRole('button', { name: /Revisar y cobrar/i })
    )

    expect(
      await screen.findByRole('heading', { name: 'Resumen y cobro' })
    ).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
  })

  it('volver del resumen no pierde lo cargado', async () => {
    rutas()
    const usuario = userEvent.setup()

    renderVenta(<RoundTripFlow />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'resumen',
    })

    await usuario.click(screen.getByRole('button', { name: /^Volver$/i }))

    // Dieciocho filas de tipeo no se pierden por ir a corregir un apellido.
    expect(await screen.findByText('1 de 1 completos')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombres')).toHaveValue(
      PASAJERO_CARGADO.nombre
    )
  })
})
