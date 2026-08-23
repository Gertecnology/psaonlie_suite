import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosInforme } from '@/features/reports/models/informe.model'
import { InformePorMetodoPago } from '@/features/reports/components/informes/por-metodo-pago'

export const Route = createFileRoute('/_authenticated/reports/por-metodo-pago')({
  validateSearch: esquemaFiltrosInforme,
  component: InformePorMetodoPago,
})
