import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { useAuth } from '@/context/auth-context'
import { obtenerInforme } from '@/features/reports/services/informes.service'
import type { FiltrosInforme } from '@/features/reports/models/informe.model'
import type { VendedorDelPeriodo } from '../components/ranking-vendedores'

interface InformePorVendedor {
  data: VendedorDelPeriodo[]
  total: number
  comisionNetaTotal: number
}

/**
 * Lo vendido y lo ganado por cada vendedor de caja en el período.
 *
 * Sale del mismo endpoint que el informe, no de un cálculo propio del panel:
 * el saldo que se le debe a alguien no puede depender de qué pantalla lo mire.
 *
 * Sólo trae a quienes vendieron. Las ventas de la web no tienen vendedor y
 * quedan fuera — agruparlas bajo un "sin asignar" sugeriría que hay alguien a
 * quien liquidarle.
 */
export function useVendedoresDelPeriodo(filtros: FiltrosInforme) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['informe-por-vendedor', filtros, accessToken],
    queryFn: () =>
      obtenerInforme<InformePorVendedor>('por-vendedor', filtros),
    enabled: !!accessToken,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
