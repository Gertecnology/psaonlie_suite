import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteCompanies } from '../services/company.service'

/**
 * Borrado en lote de empresas.
 *
 * El borrado masivo puede fallar parcialmente (hoy se itera `DELETE /empresas/:id`),
 * así que la mutación resuelve OK incluso con fallos y el toast reporta cuántas
 * se eliminaron y cuántas no. Nunca decimos "eliminadas correctamente" si alguna
 * falló.
 */
export function useDeleteCompanies() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => deleteCompanies(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })

      const deleted = result.eliminados.length
      const failed = result.fallidos.length

      if (failed === 0) {
        toast.success(
          deleted === 1 ? 'Empresa eliminada' : `${deleted} empresas eliminadas`,
          {
            description: 'La operación se completó correctamente.',
            duration: 3000,
          },
        )
        return
      }

      if (deleted === 0) {
        toast.error('No se eliminó ninguna empresa', {
          description: result.fallidos[0]?.motivo,
          duration: 5000,
        })
        return
      }

      toast.warning('Borrado parcial', {
        description: `Se eliminaron ${deleted} de ${result.solicitados} empresas. ${failed} fallaron: ${result.fallidos[0]?.motivo}`,
        duration: 6000,
      })
    },
    onError: (error) => {
      toast.error('Error al eliminar', {
        description:
          error.message || 'Ha ocurrido un error al eliminar las empresas.',
        duration: 5000,
      })
    },
  })
}
