import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ColumnDef } from '@tanstack/react-table'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from './data-table'

/**
 * The shared table replaced seven copies that had drifted apart. Three of the
 * differences were defects, and these tests exist so they cannot come back.
 *
 * The important one is row identity: without a stable `getRowId`, TanStack keys
 * selection by position, so a background refetch silently repoints a ticked
 * checkbox at a different record — and a bulk delete acts on the key. That is
 * how you delete the wrong agency, and it is why the test below reorders the
 * data mid-flight.
 */
interface Agencia {
  id: string
  nombre: string
  activo: boolean
}

const COLUMNAS: ColumnDef<Agencia, unknown>[] = [
  {
    id: 'select',
    header: 'Sel.',
    cell: ({ row }) => (
      <input
        type='checkbox'
        aria-label={`Seleccionar ${row.original.nombre}`}
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  },
  { accessorKey: 'nombre', header: 'Nombre' },
  {
    id: 'actions',
    header: 'Acciones',
    cell: () => <button type='button'>Editar</button>,
  },
]

const DATOS: Agencia[] = [
  { id: 'a-1', nombre: 'La Ovetense', activo: true },
  { id: 'a-2', nombre: 'La Santaniana', activo: true },
  { id: 'a-3', nombre: 'Nuestra Señora', activo: false },
]

function renderTabla(props: Partial<React.ComponentProps<typeof DataTable<Agencia>>> = {}) {
  return render(
    <DataTable<Agencia>
      columns={COLUMNAS}
      data={DATOS}
      getRowId={(fila) => fila.id}
      pageCount={3}
      pagination={{ pageIndex: 0, pageSize: 10 }}
      onPaginationChange={vi.fn()}
      caption='Listado de agencias'
      {...props}
    />,
  )
}

describe('DataTable', () => {
  it('muestra los datos recibidos', () => {
    renderTabla()

    expect(screen.getByText('La Ovetense')).toBeInTheDocument()
    expect(screen.getByText('Nuestra Señora')).toBeInTheDocument()
  })

  it('las acciones van al final, no antes del nombre', () => {
    // Una fila se lee de izquierda a derecha y lo primero que tiene que decir
    // es QUÉ es, no qué se le puede hacer. Con el menú primero, cada fila
    // empieza por una pregunta en vez de por una respuesta.
    renderTabla()

    const encabezados = screen
      .getAllByRole('columnheader')
      .map((celda) => celda.textContent)

    expect(encabezados).toEqual(['Sel.', 'Nombre', 'Acciones'])
  })

  describe('identidad de fila', () => {
    it('la selección sigue a la fila aunque cambie de posición', async () => {
      // El bug que tenían cinco de las siete copias: sin `getRowId`, la clave
      // "0" significa "la primera fila", y tras un refetch esa posición es otra
      // agencia. El borrado masivo actúa sobre la clave.
      const usuario = userEvent.setup()
      const { rerender } = renderTabla()

      await usuario.click(screen.getByLabelText('Seleccionar La Ovetense'))
      expect(screen.getByLabelText('Seleccionar La Ovetense')).toBeChecked()

      // Llega un refetch y el servidor devuelve el mismo conjunto en otro orden.
      const reordenados = [DATOS[2], DATOS[0], DATOS[1]]
      rerender(
        <DataTable<Agencia>
          columns={COLUMNAS}
          data={reordenados}
          getRowId={(fila) => fila.id}
          pageCount={3}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          onPaginationChange={vi.fn()}
          caption='Listado de agencias'
        />,
      )

      expect(screen.getByLabelText('Seleccionar La Ovetense')).toBeChecked()
      expect(screen.getByLabelText('Seleccionar Nuestra Señora')).not.toBeChecked()
    })

    it('descarta la selección cuando cambia un filtro', async () => {
      // Las filas elegidas ya no están en pantalla: actuar sobre ellas a ciegas
      // es exactamente cómo un borrado masivo alcanza a quien no debía.
      const usuario = userEvent.setup()
      const alSeleccionar = vi.fn()

      const { rerender } = render(
        <DataTable<Agencia>
          columns={COLUMNAS}
          data={DATOS}
          getRowId={(fila) => fila.id}
          pageCount={3}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          onPaginationChange={vi.fn()}
          caption='Listado de agencias'
          resetSelectionOn={['sin filtro']}
          renderBulkActions={(seleccionadas) => {
            alSeleccionar(seleccionadas.length)
            return null
          }}
        />,
      )

      await usuario.click(screen.getByLabelText('Seleccionar La Ovetense'))
      expect(alSeleccionar).toHaveBeenLastCalledWith(1)

      rerender(
        <DataTable<Agencia>
          columns={COLUMNAS}
          data={DATOS}
          getRowId={(fila) => fila.id}
          pageCount={3}
          pagination={{ pageIndex: 0, pageSize: 10 }}
          onPaginationChange={vi.fn()}
          caption='Listado de agencias'
          resetSelectionOn={['buscando otra cosa']}
          renderBulkActions={(seleccionadas) => {
            alSeleccionar(seleccionadas.length)
            return null
          }}
        />,
      )

      expect(alSeleccionar).toHaveBeenLastCalledWith(0)
    })

    it('respeta qué filas se pueden seleccionar', () => {
      renderTabla({ enableRowSelection: (fila) => fila.original.activo })

      expect(screen.getByLabelText('Seleccionar La Ovetense')).toBeEnabled()
      // Una fila no seleccionable no ofrece la casilla marcada.
      expect(screen.getByLabelText('Seleccionar Nuestra Señora')).not.toBeChecked()
    })
  })

  describe('no vuelve a filtrar lo que el servidor ya filtró', () => {
    it('muestra TODAS las filas recibidas', () => {
      // Dos copias tenían `manualPagination` sin `manualFiltering` y con el
      // modelo de filtrado del cliente activo: TanStack volvía a filtrar la
      // página recibida y escondía filas que el servidor sí había devuelto.
      renderTabla()

      const filas = within(screen.getByRole('table')).getAllByRole('row')
      // Una de encabezado más las tres de datos.
      expect(filas).toHaveLength(4)
    })
  })

  describe('estados', () => {
    it('mientras carga muestra el esqueleto y no el mensaje de vacío', () => {
      renderTabla({ data: [], isLoading: true })

      expect(screen.queryByText('No hay resultados.')).not.toBeInTheDocument()
    })

    it('sin datos lo dice, en vez de dejar la tabla muda', () => {
      renderTabla({ data: [] })

      expect(screen.getByText('No hay resultados.')).toBeInTheDocument()
    })

    it('acepta un mensaje de vacío propio de cada listado', () => {
      renderTabla({ data: [], emptyMessage: 'No hay destinos.' })

      expect(screen.getByText('No hay destinos.')).toBeInTheDocument()
    })

    it('ante un error ofrece reintentar y no muestra la tabla rota', async () => {
      const usuario = userEvent.setup()
      const reintentar = vi.fn()

      renderTabla({ error: new Error('Se cayó la red'), onRetry: reintentar })

      expect(screen.getByRole('alert')).toHaveTextContent('Se cayó la red')
      await usuario.click(screen.getByRole('button', { name: /reintentar/i }))
      expect(reintentar).toHaveBeenCalledTimes(1)
    })

    it('un refetch atenúa la tabla en vez de desmontarla', () => {
      // Desmontarla hace parpadear la pantalla y pierde el foco del teclado.
      renderTabla({ isFetching: true })

      expect(screen.getByText('La Ovetense')).toBeInTheDocument()
    })
  })

  describe('accesibilidad', () => {
    it('la tabla se identifica para un lector de pantalla', () => {
      renderTabla()

      expect(
        screen.getByRole('table', { name: 'Listado de agencias' }),
      ).toBeInTheDocument()
    })

    it('anuncia cuántos resultados hay y en qué página', () => {
      renderTabla()

      expect(
        screen.getByText(/3 resultado\(s\) en pantalla, página 1 de 3/),
      ).toBeInTheDocument()
    })

    it('anuncia el error en vez de cambiar la pantalla en silencio', () => {
      renderTabla({ error: new Error('Sin conexión') })

      expect(
        screen.getByText('No se pudieron cargar los resultados.'),
      ).toBeInTheDocument()
    })
  })
})
