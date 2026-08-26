import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformeVentasSinBoleto } from '@/features/reports/components/informes/ventas-sin-boleto'

export const Route = createFileRoute('/_authenticated/reports/ventas-sin-boleto')({
  validateSearch: esquemaFiltrosInforme,
  component: InformeVentasSinBoleto,
})
