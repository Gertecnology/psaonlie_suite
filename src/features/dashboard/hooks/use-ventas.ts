import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { obtenerMensajeDeError } from '@/utils/handle-server-error'
import { useAuth } from '@/context/auth-context'
import type { FiltrosVentas, FormatoExportacion } from '../models/ventas.model'
import { exportarVentas, obtenerVentas } from '../services/ventas.service'

/**
 * Listado de ventas con filtros, paginación y orden resueltos por el servidor.
 *
 * Todos los filtros forman parte del `queryKey`: si no, React Query devolvería
 * la página cacheada sin filtrar y el buscador parecería no funcionar.
 */
export function useVentas(
  filtros: FiltrosVentas = {},
  opciones: { enabled?: boolean } = {}
) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['ventas-lista', filtros, accessToken],
    queryFn: () => obtenerVentas(filtros),
    enabled: !!accessToken && opciones.enabled !== false,
    // Evita que la tabla parpadee al paginar o mientras se escribe un filtro.
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}

/**
 * Exportación a Excel/CSV del conjunto filtrado completo.
 *
 * Lo genera el backend sin paginar, así que el archivo contiene exactamente lo
 * mismo que muestran los filtros de pantalla — no sólo la página visible.
 */
export function useExportarVentas() {
  const [exportando, setExportando] = useState(false)

  const exportar = async (
    filtros: FiltrosVentas,
    formato: FormatoExportacion = 'xlsx'
  ) => {
    setExportando(true)
    try {
      await exportarVentas(filtros, formato)
      toast.success(`Exportación generada en formato ${formato.toUpperCase()}.`)
    } catch (error) {
      // El mensaje real del backend, no un "algo salió mal".
      toast.error(obtenerMensajeDeError(error))
    } finally {
      setExportando(false)
    }
  }

  return { exportar, exportando }
}
