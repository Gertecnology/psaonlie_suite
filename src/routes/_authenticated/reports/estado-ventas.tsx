import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformeEstadoVentas } from '@/features/reports/components/informes/estado-ventas'

export const Route = createFileRoute('/_authenticated/reports/estado-ventas')({
  validateSearch: esquemaFiltrosInforme,
  component: InformeEstadoVentas,
})
