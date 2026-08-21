import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCompanyDeleteDialog } from '../store/use-company-delete-dialog'
import { useDeleteCompany } from '../hooks/use-delete-company'

export function CompanyDialogs() {
  const { isOpen, companyId, companyName, closeDialog } =
    useCompanyDeleteDialog()
  const deleteCompany = useDeleteCompany()

  const handleConfirm = () => {
    if (!companyId) return
    // El diálogo se cierra recién cuando la petición termina, para que el
    // usuario vea el estado de carga y no dispare el borrado dos veces.
    deleteCompany.mutate(companyId, { onSettled: () => closeDialog() })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !deleteCompany.isPending) closeDialog()
  }

  return (
    <ConfirmDialog
      destructive
      open={isOpen}
      onOpenChange={handleOpenChange}
      handleConfirm={handleConfirm}
      isLoading={deleteCompany.isPending}
      className='max-w-md'
      title='¿Eliminar empresa?'
      desc={
        <>
          Estás a punto de eliminar la empresa{' '}
          <span className='font-semibold'>
            {companyName ?? 'seleccionada'}
          </span>
          . Esta acción no se puede deshacer.
        </>
      }
      confirmText={deleteCompany.isPending ? 'Eliminando...' : 'Eliminar'}
      cancelBtnText='Cancelar'
    />
  )
}
