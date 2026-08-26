import { useUsers } from '../context/users-context'
import { UsersDeleteDialog } from './users-delete-dialog'

/**
 * What is left of the list's overlays once the form moved to its own page:
 * the delete confirmation, which is a decision and not data to fill in.
 */
export function UsersDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useUsers()

  if (!currentRow) return null

  return (
    <UsersDeleteDialog
      key={`user-delete-${currentRow.id}`}
      open={open === 'delete'}
      onOpenChange={(isOpen) => {
        if (isOpen) return

        setOpen(null)
        // Se espera a que termine la animación de cierre: si la fila se borra
        // antes, el diálogo se queda un instante sin email que mostrar.
        setTimeout(() => setCurrentRow(null), 500)
      }}
      currentRow={currentRow}
    />
  )
}
