import { createFileRoute } from '@tanstack/react-router'
import Dashboard from '@/features/dashboard'
import { esquemaFiltrosPanel } from '@/features/dashboard/models/busqueda.model'

export const Route = createFileRoute('/_authenticated/')({
  // El período y el filtro de empresa viven en la URL: así el panel se puede
  // recargar, compartir por link y navegar con el botón "atrás".
  validateSearch: esquemaFiltrosPanel,
  component: Dashboard,
})
