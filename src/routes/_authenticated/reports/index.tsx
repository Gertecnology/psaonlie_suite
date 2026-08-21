import { createFileRoute } from '@tanstack/react-router'
import { esquemaFiltrosPanel } from '@/features/dashboard/models/busqueda.model'
import { InformesPage } from '@/features/reports'

export const Route = createFileRoute('/_authenticated/reports/')({
  // Mismo esquema que el panel principal: el período y el filtro de empresa
  // sobreviven al pasar de una vista a la otra, y un informe con sus filtros
  // se puede compartir por link.
  validateSearch: esquemaFiltrosPanel,
  component: InformesPage,
})
