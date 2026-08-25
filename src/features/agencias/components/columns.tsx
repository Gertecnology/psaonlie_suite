import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  type FilaAgencia,
  esEmpresa,
  resolverComision,
} from '../models/agencia.model'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { formatearEntero } from '@/lib/formato'

/**
 * Dibuja un cargo por servicio, propio o heredado.
 *
 * Es el mismo bloque para las dos columnas de comisión, así que vive en una
 * función y no duplicado en cada `cell`. Va en minúscula y se invoca como
 * función, no como componente: este archivo exporta `crearColumnasAgencias`,
 * que no es un componente, y mezclar las dos cosas rompe el fast refresh.
 */
function cargoPorServicio({
  serviceCharge,
}: {
  serviceCharge: FilaAgencia['serviceCharge']
}) {
  if (!serviceCharge) {
    return (
      <div className='text-muted-foreground text-sm'>Sin cargo asignado</div>
    )
  }

  return (
    <div className='flex items-center space-x-2'>
      <Badge
        variant={serviceCharge.activo ? 'default' : 'secondary'}
        className='text-xs'
      >
        {serviceCharge.tipoAplicacion === 'PORCENTUAL' ? 'Porcentual' : 'Fijo'}
      </Badge>
      {serviceCharge.tipoAplicacion === 'PORCENTUAL' &&
      serviceCharge.porcentaje ? (
        <span className='font-mono text-sm font-medium text-blue-600'>
          {parseFloat(serviceCharge.porcentaje).toFixed(2)}%
        </span>
      ) : serviceCharge.tipoAplicacion === 'FIJO' && serviceCharge.montoFijo ? (
        <span className='font-mono text-sm font-medium text-green-600'>
          ${formatearEntero(serviceCharge.montoFijo)}
        </span>
      ) : null}
    </div>
  )
}

interface OpcionesColumnas {
  /** Ids de las empresas con sus agencias desplegadas. */
  expandidas: ReadonlySet<string>
  onToggleExpandir: (id: string) => void
}

/**
 * Columnas del listado, con la jerarquía de dos niveles dibujada en la primera.
 *
 * Se arman con una función y no como constante porque el botón que despliega
 * las agencias necesita el estado de expansión, que vive en la página.
 */
export function crearColumnasAgencias({
  expandidas,
  onToggleExpandir,
}: OpcionesColumnas): ColumnDef<FilaAgencia>[] {
  return [
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
      cell: ({ row }) =>
        // Una agencia hija no se selecciona: no se puede borrar sola, y una
        // casilla que no lleva a ninguna acción es una promesa falsa.
        row.getCanSelect() ? (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label='Seleccionar fila'
            className='translate-y-[2px]'
          />
        ) : null,
      enableSorting: false,
      enableHiding: false,
    },

    {
      accessorKey: 'nombre',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nombre' />
      ),
      cell: ({ row }) => {
        const agencia = row.original
        const id = String(agencia.id)
        const esHija = !esEmpresa(agencia)
        const expandida = expandidas.has(id)

        return (
          <div
            className={cn('flex items-center gap-1', esHija && 'pl-6')}
            data-nivel={agencia.nivel}
          >
            {agencia.cantidadHijas > 0 ? (
              <Button
                variant='ghost'
                size='sm'
                className='h-6 w-6 p-0'
                onClick={() => onToggleExpandir(id)}
                aria-expanded={expandida}
                aria-label={
                  expandida
                    ? `Ocultar las agencias de ${agencia.nombre}`
                    : `Ver las agencias de ${agencia.nombre}`
                }
              >
                {expandida ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
              </Button>
            ) : (
              <span className='inline-block w-6' aria-hidden='true' />
            )}

            {esHija ? (
              // Una agencia hija no tiene página propia: no hay paradas
              // homologadas ni conexión que mostrar, todo eso es del padre.
              <span className='flex items-center gap-2'>
                {agencia.nombre ? (
                  <span className='max-w-32 truncate sm:max-w-72 md:max-w-[24rem]'>
                    {agencia.nombre}
                  </span>
                ) : (
                  // Sin nombre todavía: el servidor de la transportista no lo
                  // dio o la sincronización no corrió desde que se arregló.
                  // Decirlo es mejor que mostrar el código como si fuera un
                  // nombre — que es exactamente el defecto que se corrigió.
                  <span className='text-muted-foreground italic'>
                    Sin nombre
                  </span>
                )}
                {agencia.codigo && (
                  <Badge variant='outline' className='font-mono text-xs'>
                    {agencia.codigo}
                  </Badge>
                )}
              </span>
            ) : (
              <Link
                to='/agencias/$id'
                params={{ id }}
                className='max-w-32 cursor-pointer truncate font-medium hover:text-blue-800 sm:max-w-72 md:max-w-[24rem]'
              >
                {agencia.nombre}
              </Link>
            )}
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
      // Sin filterFn: el filtro de estado lo resuelve el backend (`?activo=`).
    },
    {
      id: 'boletosDisponibles',
      accessorKey: 'boletosDisponibles',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Boletos' />
      ),
      cell: ({ row }) => {
        const agencia = row.original
        // El stock es de las agencias: una empresa no vende con código propio.
        if (esEmpresa(agencia)) {
          return <span className='text-muted-foreground text-sm'>—</span>
        }
        return (
          <span className='font-mono text-sm'>
            {formatearEntero(agencia.boletosDisponibles ?? 0)}
          </span>
        )
      },
    },
    {
      accessorKey: 'usuario',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Usuario' />
      ),
      cell: ({ row }) => {
        // Las credenciales viven sólo en la empresa: una agencia no tiene
        // conexión propia, y esa ausencia es lo que sostiene el modelo.
        if (!esEmpresa(row.original)) {
          return <span className='text-muted-foreground text-sm'>—</span>
        }
        return <div>{row.getValue('usuario') ?? 'Sin usuario'}</div>
      },
    },
    {
      accessorKey: 'agenciaPrincipal',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Agencia Principal' />
      ),
      cell: ({ row }) => {
        if (!esEmpresa(row.original)) {
          return <span className='text-muted-foreground text-sm'>—</span>
        }
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
        if (!esEmpresa(row.original)) {
          return <span className='text-muted-foreground text-sm'>—</span>
        }
        return <div>{row.getValue('url') ?? 'Sin URL'}</div>
      },
    },
    {
      accessorKey: 'porcentajeVentas',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Porcentaje de ventas' />
      ),
      cell: ({ row }) => {
        const comision = resolverComision(row.original)

        if (comision.estado === 'desconocida') {
          return <span className='text-muted-foreground text-sm'>—</span>
        }

        return (
          <div className='flex items-center gap-2'>
            <span>
              {comision.porcentajeVentas ?? 'Sin porcentaje de ventas'}
            </span>
            {comision.estado === 'heredada' && (
              <Badge variant='secondary' className='text-xs'>
                Heredada
              </Badge>
            )}
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
        const comision = resolverComision(row.original)

        if (comision.estado === 'desconocida') {
          return <span className='text-muted-foreground text-sm'>—</span>
        }

        return cargoPorServicio({ serviceCharge: comision.serviceCharge })
      },
      // Sin filterFn: filtrar en el cliente sólo alcanzaba a las filas de la
      // página actual. El backend todavía no expone un filtro por cargo de
      // servicio en `GET /agencias`.
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ]
}
