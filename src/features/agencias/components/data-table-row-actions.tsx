import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAgenciaDialog } from '../store/use-agencia-dialog'
import { useAgenciaDeleteDialog } from '../store/use-agencia-delete-dialog'
import { type FilaAgencia, esEmpresa } from '../models/agencia.model'

/**
 * Por qué una agencia no se borra sola.
 *
 * No es una restricción de permisos: existe porque el web service la reporta, y
 * la próxima sincronización la traería de vuelta. El borrado sería una ficción,
 * y sus ventas históricas quedarían apuntando a una fila fantasma.
 */
export const MOTIVO_HIJA_NO_BORRABLE =
  'Las agencias no se eliminan por separado: el web service las vuelve a traer en la próxima sincronización. Se eliminan junto con su empresa.'

interface DataTableRowActionsProps {
  row: Row<FilaAgencia>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const agencia = row.original
  const puedeEliminarse = esEmpresa(agencia)

  const { openDialog: openEditDialog } = useAgenciaDialog()
  const { openDialog: openDeleteDialog } = useAgenciaDeleteDialog()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[200px]'>
        <DropdownMenuItem onClick={() => openEditDialog('edit', agencia)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {puedeEliminarse ? (
          <DropdownMenuItem
            onClick={() => openDeleteDialog(agencia.id, agencia.nombre)}
          >
            Eliminar
            <DropdownMenuShortcut>
              <IconTrash size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        ) : (
          <Tooltip>
            {/* El `span` es necesario: un item deshabilitado tiene
                `pointer-events: none` y nunca dispararía el tooltip. Los
                eventos los recibe el envoltorio. */}
            <TooltipTrigger asChild>
              <span className='block'>
                <DropdownMenuItem
                  disabled
                  onSelect={(evento) => evento.preventDefault()}
                >
                  Eliminar
                  <DropdownMenuShortcut>
                    <IconTrash size={16} />
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </span>
            </TooltipTrigger>
            <TooltipContent side='left' className='max-w-64'>
              {MOTIVO_HIJA_NO_BORRABLE}
            </TooltipContent>
          </Tooltip>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
