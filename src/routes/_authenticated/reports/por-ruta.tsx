import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformePorRuta } from '@/features/reports/components/informes/por-ruta'

export const Route = createFileRoute('/_authenticated/reports/por-ruta')({
  validateSearch: esquemaFiltrosInforme,
  component: InformePorRuta,
})
