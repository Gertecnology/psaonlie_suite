import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformePorAgencia } from '@/features/reports/components/informes/por-agencia'

/**
 * Filters live in the URL — including `generado`, so a link reproduces the same
 * report instead of landing on an empty screen. `pagina` and `tamano` travel
 * there too: a saldo shared with someone has to open on the same page it was
 * read on.
 */
export const Route = createFileRoute('/_authenticated/reports/por-agencia')({
  validateSearch: esquemaFiltrosInforme,
  component: InformePorAgencia,
})
