import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { eliminarAgencias } from '../services/agencia.service'

/**
 * Borrado en lote de empresas.
 *
 * `POST /agencias/bulk-delete` puede fallar parcialmente: devuelve `eliminados`
 * y `fallidos` con su motivo. La mutación resuelve OK aun con fallos y el toast
 * reporta cuántas se eliminaron y cuántas no. Nunca decimos "eliminadas
 * correctamente" si alguna falló.
 */
export function useEliminarAgencias() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => eliminarAgencias(ids),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })

      const eliminadas = result.eliminados.length
      const fallidas = result.fallidos.length

      if (fallidas === 0) {
        toast.success(
          eliminadas === 1
            ? 'Empresa eliminada'
            : `${eliminadas} empresas eliminadas`,
          {
            description: 'La operación se completó correctamente.',
            duration: 3000,
          },
        )
        return
      }

      if (eliminadas === 0) {
        toast.error('No se eliminó ninguna empresa', {
          description: result.fallidos[0]?.motivo,
          duration: 5000,
        })
        return
      }

      toast.warning('Borrado parcial', {
        description: `Se eliminaron ${eliminadas} de ${result.solicitados} empresas. ${fallidas} fallaron: ${result.fallidos[0]?.motivo}`,
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
