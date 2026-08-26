import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { aParametrosApi, type Periodo } from '@/lib/periodo'
import { useAuth } from '@/context/auth-context'
import {
  obtenerConectividadEmpresas,
  obtenerPagosPorVencer,
  obtenerVentasSinBoleto,
} from '../services/alertas.service'

/**
 * Cada alerta se pide por separado, a propósito.
 *
 * Consultan endpoints distintos y fallan por motivos distintos: si el listado
 * de empresas devuelve 500, las ventas sin boleto tienen que seguir viéndose.
 * Una sola query combinada convertiría cualquier fallo parcial en una pantalla
 * de error completa — que es exactamente lo que hace hoy el panel viejo, donde
 * un error en cualquier consulta tapa todas las tarjetas.
 */

/**
 * Ventas cobradas sin boleto emitido.
 *
 * Se refresca sola cada 5 minutos: es la alerta que justifica que alguien tenga
 * esta pantalla abierta.
 */
export function useVentasSinBoleto(periodo?: Periodo) {
  const { accessToken } = useAuth()
  const filtros = periodo
    ? {
        fechaVentaDesde: aParametrosApi(periodo).fechaDesde,
        fechaVentaHasta: aParametrosApi(periodo).fechaHasta,
      }
    : {}

  return useQuery({
    queryKey: ['alertas', 'ventas-sin-boleto', filtros, accessToken],
    queryFn: () => obtenerVentasSinBoleto(filtros),
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}

/** Pagos pendientes que vencen dentro de las próximas horas o ya vencieron. */
export function usePagosPorVencer() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['alertas', 'pagos-por-vencer', accessToken],
    queryFn: () => obtenerPagosPorVencer(),
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
  })
}

/** Empresas sin web server configurado o sin sincronizar hace rato. */
export function useConectividadEmpresas() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['alertas', 'conectividad-empresas', accessToken],
    queryFn: () => obtenerConectividadEmpresas(),
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
    // El cron del backend corre cada 3 minutos; pedirlo más seguido no aporta.
    staleTime: 3 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  })
}
