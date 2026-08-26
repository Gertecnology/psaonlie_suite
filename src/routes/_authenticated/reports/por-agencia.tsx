import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformePorAgencia } from '@/features/reports/components/informes/por-agencia'

export const Route = createFileRoute('/_authenticated/reports/por-agencia')({
  validateSearch: esquemaFiltrosInforme,
  component: InformePorAgencia,
})
