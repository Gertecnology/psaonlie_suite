import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type Company } from '../models/company.model'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const companyColumns: ColumnDef<Company>[] = [
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
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Seleccionar fila'
        className='translate-y-[2px]'
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
    cell: ({ row }) => {
      const id = String(row.original.id)
      return (
        <div className='flex space-x-2'>
          <Link
            to='/companies/$id'
            params={{ id }}
            className='max-w-32 cursor-pointer truncate font-medium hover:text-blue-800 sm:max-w-72 md:max-w-[31rem]'
          >
            {row.getValue('nombre')}
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: 'activo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estado' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('activo')

      return (
        <Badge variant={isActive ? 'default' : 'destructive'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },
  {
    accessorKey: 'usuario',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Usuario' />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('usuario') ?? 'Sin usuario'}</div>
    },
  },
  {
    accessorKey: 'agenciaPrincipal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Agencia Principal' />
    ),
    cell: ({ row }) => {
      return (
        <div>{row.getValue('agenciaPrincipal') ?? 'Sin agencia principal'}</div>
      )
    },
  },
  {
    accessorKey: 'url',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='URL' />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('url') ?? 'Sin URL'}</div>
    },
  },
  {
    accessorKey: 'porcentajeVentas',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Porcentaje de ventas' />
    ),
    cell: ({ row }) => {
      return (
        <div>
          {row.getValue('porcentajeVentas') ?? 'Sin porcentaje de ventas'}
        </div>
      )
    },
  },
  {
    accessorKey: 'serviceCharge',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cargo por Servicio' />
    ),
    cell: ({ row }) => {
      const serviceCharge = row.getValue(
        'serviceCharge'
      ) as Company['serviceCharge']

      if (!serviceCharge) {
        return (
          <div className='text-muted-foreground text-sm'>
            Sin cargo asignado
          </div>
        )
      }

      return (
        <div className='space-y-1'>
          <div className='flex items-center space-x-2'>
            <Badge
              variant={serviceCharge.activo ? 'default' : 'secondary'}
              className='text-xs'
            >
              {serviceCharge.tipoAplicacion === 'PORCENTUAL'
                ? 'Porcentual'
                : 'Fijo'}
            </Badge>
            {serviceCharge.tipoAplicacion === 'PORCENTUAL' &&
            serviceCharge.porcentaje ? (
              <span className='font-mono text-sm font-medium text-blue-600'>
                {parseFloat(serviceCharge.porcentaje).toFixed(2)}%
              </span>
            ) : serviceCharge.tipoAplicacion === 'FIJO' &&
              serviceCharge.montoFijo ? (
              <span className='font-mono text-sm font-medium text-green-600'>
                ${serviceCharge.montoFijo.toLocaleString('es-PY')}
              </span>
            ) : null}
          </div>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const serviceCharge = row.getValue(id) as Company['serviceCharge']
      if (!serviceCharge) return value.includes('sin-cargo')

      if (
        value.includes('porcentual') &&
        serviceCharge.tipoAplicacion === 'PORCENTUAL'
      ) {
        return true
      }
      if (value.includes('fijo') && serviceCharge.tipoAplicacion === 'FIJO') {
        return true
      }
      if (value.includes('activo') && serviceCharge.activo) {
        return true
      }
      if (value.includes('inactivo') && !serviceCharge.activo) {
        return true
      }

      return false
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
