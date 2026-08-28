import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosKardex } from '@/features/reports/models/kardex.model'
import { SaldosKardex } from '@/features/reports/components/kardex/saldos-kardex'

export const Route = createFileRoute('/_authenticated/reports/movimientos')({
  validateSearch: esquemaFiltrosKardex,
  component: SaldosKardex,
})
