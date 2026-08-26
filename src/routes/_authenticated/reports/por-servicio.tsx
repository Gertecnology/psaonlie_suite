import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformePorServicio } from '@/features/reports/components/informes/por-servicio'

export const Route = createFileRoute('/_authenticated/reports/por-servicio')({
  validateSearch: esquemaFiltrosInforme,
  component: InformePorServicio,
})
