import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { type ServiceCharge } from '../models/service-charge.model'
import { ServiceChargeRowActions } from './service-charge-row-actions'

/**
 * Columns of the service charge list.
 *
 * Headers go through the shared `DataTableColumnHeader`: the hand-rolled
 * button this file used to draw on "Nombre" toggled sorting but offered no way
 * to hide the column, and the rest of the headers were plain text, so the same
 * gesture worked on one column and did nothing on the next.
 */
export const columns: ColumnDef<ServiceCharge>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Seleccionar todo'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Seleccionar fila'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nombre' />
    ),
    cell: ({ row }) => (
      <div className='font-medium max-w-[200px] truncate' title={row.getValue('nombre')}>
        {row.getValue('nombre')}
      </div>
    ),
  },
  {
    accessorKey: 'descripcion',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Descripción' />
    ),
    cell: ({ row }) => {
      const descripcion = row.getValue('descripcion') as string
      return descripcion ? (
        <div className='max-w-[200px] truncate text-sm text-muted-foreground' title={descripcion}>
          {descripcion}
        </div>
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
    },
  },
  {
    accessorKey: 'tipoAplicacion',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tipo' />
    ),
    cell: ({ row }) => {
      const tipo = row.getValue('tipoAplicacion') as string
      return (
        <Badge variant={tipo === 'PORCENTUAL' ? 'default' : 'secondary'}>
          {tipo}
        </Badge>
      )
    },
    // Sin filterFn: el filtro por tipo lo resuelve el backend
    // (`?tipoAplicacion=`), que es el único que ve la lista completa.
  },
  {
    accessorKey: 'porcentaje',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Porcentaje' />
    ),
    cell: ({ row }) => {
      const porcentaje = row.getValue('porcentaje') as string
      return porcentaje ? (
        <span className='font-mono text-sm font-medium text-muted-foreground'>
          {parseFloat(porcentaje).toFixed(2)}%
        </span>
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
    },
  },
  {
    accessorKey: 'montoFijo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Monto Fijo' />
    ),
    cell: ({ row }) => {
      const monto = row.getValue('montoFijo') as number
      return monto ? (
        <span className='font-mono text-sm font-medium text-green-600'>
          ${monto.toLocaleString('es-PY')}
        </span>
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
    },
  },
  {
    accessorKey: 'esGlobal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Global' />
    ),
    cell: ({ row }) => {
      const esGlobal = row.getValue('esGlobal') as boolean
      return (
        <Badge variant={esGlobal ? 'default' : 'outline'}>
          {esGlobal ? 'Sí' : 'No'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'activo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estado' />
    ),
    cell: ({ row }) => {
      const activo = row.getValue('activo') as boolean
      return (
        <Badge variant={activo ? 'default' : 'destructive'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'fechaInicio',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fecha Inicio' />
    ),
    cell: ({ row }) => {
      const fecha = row.getValue('fechaInicio') as string
      return fecha ? (
        <span className='text-sm font-mono'>
          {new Date(fecha).toLocaleDateString('es-PY')}
        </span>
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
    },
  },
  {
    accessorKey: 'fechaFin',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fecha Fin' />
    ),
    cell: ({ row }) => {
      const fecha = row.getValue('fechaFin') as string
      return fecha ? (
        <span className='text-sm font-mono'>
          {new Date(fecha).toLocaleDateString('es-PY')}
        </span>
      ) : (
        <span className='text-muted-foreground'>-</span>
      )
    },
  },
  {
    id: 'actions',
    // Una columna sin encabezado no se anuncia: un lector de pantalla lee la
    // celda sin decir de qué columna es.
    header: 'Acciones',
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      return <ServiceChargeRowActions serviceCharge={row.original} />
    },
  },
]
