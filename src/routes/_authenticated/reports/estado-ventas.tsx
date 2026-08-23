import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformeEstadoVentas } from '@/features/reports/components/informes/estado-ventas'

/**
 * Filters live in the URL — including `generado`, so a link reproduces the same
 * report instead of landing on an empty screen.
 */
export const Route = createFileRoute('/_authenticated/reports/estado-ventas')({
  validateSearch: esquemaFiltrosInforme,
  component: InformeEstadoVentas,
})
