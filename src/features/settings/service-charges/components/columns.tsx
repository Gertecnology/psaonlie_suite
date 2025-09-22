import { type ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { type ServiceCharge } from '../models/service-charge.model'
import { ServiceChargeRowActions } from './service-charge-row-actions'

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
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='h-8 px-2 lg:px-3'
        >
          Nombre
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className='font-medium max-w-[200px] truncate' title={row.getValue('nombre')}>
        {row.getValue('nombre')}
      </div>
    ),
  },
  {
    accessorKey: 'descripcion',
    header: 'Descripción',
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
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipoAplicacion') as string
      return (
        <Badge variant={tipo === 'PORCENTUAL' ? 'default' : 'secondary'}>
          {tipo}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'porcentaje',
    header: 'Porcentaje',
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
    header: 'Monto Fijo',
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
    header: 'Global',
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
    header: 'Estado',
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
    header: 'Fecha Inicio',
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
    header: 'Fecha Fin',
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
    enableHiding: false,
    cell: ({ row }) => {
      return <ServiceChargeRowActions serviceCharge={row.original} />
    },
  },
]
