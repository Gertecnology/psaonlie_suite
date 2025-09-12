import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type Venta } from '../models/sales.model'
import { DataTableColumnHeader } from '@/features/companies/components/data-table-column-header'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEstadoPagoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'PAGADO':
      return 'default'
    case 'PENDIENTE':
      return 'secondary'
    case 'EXPIRADO':
      return 'destructive'
    case 'CANCELADO':
      return 'outline'
    case 'FALLIDO':
      return 'destructive'
    case 'REEMBOLSADO':
      return 'secondary'
    default:
      return 'outline'
  }
}

export const ventasColumns: ColumnDef<Venta>[] = [
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
    accessorKey: 'cliente.nombreCompleto',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cliente' />
    ),
    cell: ({ row }) => {
      const cliente = row.original.cliente
      return (
        <div className='flex flex-col'>
          <div className='font-medium'>{cliente.nombre} {cliente.apellido}</div>
          <div className='text-sm text-muted-foreground'>{cliente.email}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'cliente.numeroDocumento',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Documento' />
    ),
    cell: ({ row }) => {
      const documento = row.original.cliente.numeroDocumento
      return <div>{documento || '-'}</div>
    },
  },
  {
    accessorKey: 'origenNombre',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Origen' />
    ),
    cell: ({ row }) => {
      return <div className='max-w-32 truncate'>{row.getValue('origenNombre')}</div>
    },
  },
  {
    accessorKey: 'destinoNombre',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Destino' />
    ),
    cell: ({ row }) => {
      return <div className='max-w-32 truncate'>{row.getValue('destinoNombre')}</div>
    },
  },
  {
    accessorKey: 'fechaVenta',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fecha Venta' />
    ),
    cell: ({ row }) => {
      return <div className='text-sm'>{formatDate(row.getValue('fechaVenta'))}</div>
    },
  },
  {
    accessorKey: 'importeTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Monto Total' />
    ),
    cell: ({ row }) => {
      return <div className='font-medium'>{formatCurrency(row.getValue('importeTotal'))}</div>
    },
  },
  {
    accessorKey: 'serviceChargeMontoTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Service Charge' />
    ),
    cell: ({ row }) => {
      return <div className='font-medium'>{formatCurrency(row.getValue('serviceChargeMontoTotal'))}</div>
    },
  },
  {
    accessorKey: 'estadoPago',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estado' />
    ),
    cell: ({ row }) => {
      const estado = row.getValue('estadoPago') as string
      return (
        <Badge variant={getEstadoPagoBadgeVariant(estado)}>
          {estado}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },
]
