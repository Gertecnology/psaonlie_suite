import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformeSerieTemporal } from '@/features/reports/components/informes/serie-temporal'

export const Route = createFileRoute('/_authenticated/reports/serie-temporal')({
  validateSearch: esquemaFiltrosInforme,
  component: InformeSerieTemporal,
})
