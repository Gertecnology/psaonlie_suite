import { ConfirmDialog } from '@/components/confirm-dialog'
import { useCompanyDeleteDialog } from '../store/use-company-delete-dialog'
import { useDeleteCompany } from '../hooks/use-delete-company'

export function CompanyDialogs() {
  const { isOpen, companyId, closeDialog } = useCompanyDeleteDialog()
  const deleteCompany = useDeleteCompany()

  const handleConfirm = () => {
    if (companyId) {
      deleteCompany.mutate(companyId)
    }
    closeDialog()
  }

  return (
    <ConfirmDialog
      destructive
      open={isOpen}
      onOpenChange={closeDialog}
      handleConfirm={handleConfirm}
      className='max-w-md'
      title={`¿Eliminar esta empresa: ${companyId}?`}
      desc={
        <>
          Estás a punto de eliminar una empresa con el ID{' '}
          <strong>{companyId}</strong>. <br />
          Esta acción no se puede deshacer.
        </>
      }
      confirmText='Eliminar'
      cancelBtnText='Cancelar'
    />
  )
}
