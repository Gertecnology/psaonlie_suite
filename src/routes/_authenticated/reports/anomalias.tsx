import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformeAnomalias } from '@/features/reports/components/informes/anomalias'

export const Route = createFileRoute('/_authenticated/reports/anomalias')({
  validateSearch: esquemaFiltrosInforme,
  component: InformeAnomalias,
})
