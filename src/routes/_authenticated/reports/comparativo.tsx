import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformeComparativo } from '@/features/reports/components/informes/comparativo'

export const Route = createFileRoute('/_authenticated/reports/comparativo')({
  validateSearch: esquemaFiltrosInforme,
  component: InformeComparativo,
})
