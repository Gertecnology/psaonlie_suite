import { createFileRoute } from '@tanstack/react-router'

import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformePorVendedor } from '@/features/reports/components/informes/por-vendedor'

export const Route = createFileRoute('/_authenticated/reports/por-vendedor')({
  validateSearch: esquemaFiltrosInforme,
  component: InformePorVendedor,
})
