import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { userStatusColors, verificationStatusColors, userRoles } from '../data/data'
import { User } from '../models/user'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<User>[] = [
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
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
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
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email')}</div>
    ),
    enableHiding: false,
  },
  {
    id: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nombre Completo' />
    ),
    cell: ({ row }) => {
      const { firstName, lastName } = row.original
      const fullName = `${firstName} ${lastName}`
      return <LongText className='max-w-36'>{fullName}</LongText>
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estado' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      const badgeColor = userStatusColors.get(isActive)
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'isVerified',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Verificado' />
    ),
    cell: ({ row }) => {
      const isVerified = row.getValue('isVerified') as boolean
      const badgeColor = verificationStatusColors.get(isVerified)
      return (
        <div className='flex space-x-2'>
          <Badge variant='outline' className={cn('capitalize', badgeColor)}>
            {isVerified ? 'Verificado' : 'Pendiente'}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'roles',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Roles' />
    ),
    cell: ({ row }) => {
      const roles = row.getValue('roles') as User['roles']
      
      if (!roles || roles.length === 0) {
        return <span className='text-muted-foreground'>Sin roles</span>
      }

      return (
        <div className='flex flex-wrap gap-1'>
          {roles.map((role) => {
            const roleConfig = userRoles.find(r => r.value === role.name)
            return (
              <div key={role.id} className='flex items-center gap-x-1'>
                {roleConfig?.icon && (
                  <roleConfig.icon size={14} className='text-muted-foreground' />
                )}
                <Badge variant='secondary' className='text-xs'>
                  {roleConfig?.label || role.name}
                </Badge>
              </div>
            )
          })}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const roles = row.getValue(id) as User['roles']
      return roles.some(role => value.includes(role.name))
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Fecha de Creación' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      )
    },
  },
  {
    accessorKey: 'lastLoginAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Último Acceso' />
    ),
    cell: ({ row }) => {
      const lastLoginAt = row.getValue('lastLoginAt') as string | null
      
      if (!lastLoginAt) {
        return <span className='text-muted-foreground'>Nunca</span>
      }
      
      const date = new Date(lastLoginAt)
      return (
        <div className='text-sm'>
          {date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
