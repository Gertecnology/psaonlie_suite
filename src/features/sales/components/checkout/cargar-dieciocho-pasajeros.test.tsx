import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import { renderVenta } from '@/test/render-venta'
import { PlanillaDePasajeros } from './planilla-de-pasajeros'

/**
 * Cargar dieciocho pasajeros.
 *
 * Son once campos obligatorios por persona: con dieciocho butacas, ciento
 * noventa y ocho celdas. El panel pedía un formulario por pasajero, cada uno
 * en su tarjeta con su botón de guardar.
 *
 * Estos casos son sobre la PANTALLA: se carga como carga quien vende —con el
 * teclado— y se mira qué queda en la planilla.
 */

const sinLibreta = () =>
  mockearApi([
    { url: 'tipos-documento', body: [{ id: '1', codigo: 'CI', descripcion: 'Cédula' }] },
    {
      url: 'paises',
      body: [
        {
          success: true,
          data: [{ Codigo: 'PY', Descripcion: 'Paraguay' }],
        },
      ],
    },
    { url: 'pasajero-conocido', body: { encontrado: false } },
  ])

const abrirLaPlanilla = (butacas = ['01', '02', '03']) => {
  sinLibreta()
  return renderVenta(
    <PlanillaDePasajeros butacas={butacas} agenciaId='agencia-1' />,
    { pasoInicial: 'checkout' }
  )
}

/** La fila de una butaca, para no confundir celdas entre filas. */
const filaDe = (butaca: string) => {
  const celda = screen.getByText(butaca, { selector: 'div' })
  return celda.closest('tr') as HTMLElement
}

describe('cargar dieciocho pasajeros', () => {
  it('hay una fila por butaca', () => {
    abrirLaPlanilla(['01', '02', '03'])

    expect(screen.getAllByRole('row')).toHaveLength(4) // 3 + el encabezado
    expect(screen.getByText('0 de 3 completos')).toBeInTheDocument()
  })

  it('el documento va primero: la pila de cédulas está en la mano', () => {
    abrirLaPlanilla(['01'])

    const columnas = screen.getAllByRole('columnheader').map((th) => th.textContent)

    expect(columnas[0]).toBe('Estado')
    expect(columnas[1]).toBe('Butaca')
    expect(columnas[2]).toContain('Documento')
  })

  it('cuenta las filas completas mientras se carga', async () => {
    const usuario = userEvent.setup()
    abrirLaPlanilla(['01', '02'])

    const primera = filaDe('01')
    await usuario.type(within(primera).getByLabelText('Documento'), '3481220')
    await usuario.type(within(primera).getByLabelText('Nombres'), 'Ana')
    await usuario.type(within(primera).getByLabelText('Apellidos'), 'Duarte')
    await usuario.selectOptions(within(primera).getByLabelText('Tipo doc.'), 'CI')
    await usuario.selectOptions(
      within(primera).getByLabelText('Nacionalidad'),
      'PY'
    )
    await usuario.type(within(primera).getByLabelText('Residencia'), 'Paraguay')
    await usuario.type(
      within(primera).getByLabelText('F. nacim.'),
      '1988-03-12'
    )
    await usuario.selectOptions(within(primera).getByLabelText('Género'), 'F')
    await usuario.selectOptions(
      within(primera).getByLabelText('Ocupación'),
      'Docente'
    )
    await usuario.type(within(primera).getByLabelText('Teléfono'), '0981224118')
    await usuario.type(
      within(primera).getByLabelText('Email'),
      'ana@example.com'
    )

    expect(screen.getByText('1 de 2 completos')).toBeInTheDocument()
  })

  it('⌘↓ copia la celda hacia abajo, sin pisar lo cargado', async () => {
    const usuario = userEvent.setup()
    abrirLaPlanilla(['01', '02', '03'])

    // La segunda ya tiene apellido propio: el atajo no debe perderlo.
    await usuario.type(within(filaDe('02')).getByLabelText('Apellidos'), 'Ayala')

    const primera = within(filaDe('01')).getByLabelText('Apellidos')
    await usuario.type(primera, 'Duarte')
    await usuario.keyboard('{Meta>}{ArrowDown}{/Meta}')

    expect(within(filaDe('02')).getByLabelText('Apellidos')).toHaveValue('Ayala')
    expect(within(filaDe('03')).getByLabelText('Apellidos')).toHaveValue(
      'Duarte'
    )
  })

  it('Enter baja a la misma columna de la fila siguiente', async () => {
    const usuario = userEvent.setup()
    abrirLaPlanilla(['01', '02'])

    const primera = within(filaDe('01')).getByLabelText('Teléfono')
    await usuario.click(primera)
    await usuario.keyboard('{Enter}')

    expect(within(filaDe('02')).getByLabelText('Teléfono')).toHaveFocus()
  })

  it('los atajos están escritos al pie, no hay que adivinarlos', () => {
    abrirLaPlanilla(['01'])

    expect(screen.getByText('Tab')).toBeInTheDocument()
    expect(screen.getByText('Enter')).toBeInTheDocument()
    expect(screen.getByText('⌘↓')).toBeInTheDocument()
  })

  it('aguanta dieciocho filas sin perder ninguna', () => {
    const dieciocho = Array.from({ length: 18 }, (_, i) =>
      String(i + 1).padStart(2, '0')
    )
    abrirLaPlanilla(dieciocho)

    expect(screen.getByText('0 de 18 completos')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(19)
  })
})
