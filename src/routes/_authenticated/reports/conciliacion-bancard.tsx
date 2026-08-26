import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformeConciliacionBancard } from '@/features/reports/components/informes/conciliacion-bancard'

export const Route = createFileRoute('/_authenticated/reports/conciliacion-bancard')({
  validateSearch: esquemaFiltrosInforme,
  component: InformeConciliacionBancard,
})
