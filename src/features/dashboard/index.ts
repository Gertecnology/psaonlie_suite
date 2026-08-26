// Panel de control: modelos, servicios y hooks que también consume la sección
// de informes. Las dos vistas comparten el filtro de período y el modelo de
// dinero a propósito: si cada una tuviera el suyo, los números podrían
// contradecirse entre pantallas.

export { default } from './index.tsx'

// Modelos
export * from './models/estadisticas.model'
export * from './models/finanzas.model'
export * from './models/ventas.model'
export * from './models/alertas.model'
export { esquemaFiltrosPanel, type FiltrosUrl } from './models/busqueda.model'

// Servicios
export { obtenerEstadisticas } from './services/estadisticas.service'
export { obtenerVentas, exportarVentas } from './services/ventas.service'
export {
  obtenerAgencias,
  type EmpresaPanel,
} from './services/agencias-panel.service'
export {
  obtenerVentasSinBoleto,
  obtenerPagosPorVencer,
  obtenerConectividadEmpresas,
} from './services/alertas.service'

// Hooks
export { useEstadisticas, useComparativo } from './hooks/use-estadisticas'
export {
  useFiltrosPanel,
  type EstadoFiltrosPanel,
} from './hooks/use-filtros-panel'
export { useVentas, useExportarVentas } from './hooks/use-ventas'
export { useAgenciasPanel } from './hooks/use-agencias-panel'
export {
  useVentasSinBoleto,
  usePagosPorVencer,
  useConectividadEmpresas,
} from './hooks/use-alertas'

// Componentes reutilizables
export { FiltrosPanel } from './components/filtros-panel'
export { TarjetaMetrica } from './components/tarjeta-metrica'
export { TarjetaSeccion } from './components/tarjeta-seccion'
export { TablaVentas } from './components/tabla-ventas'
export {
  TiraComposicion,
  type SegmentoTira,
} from './components/tira-composicion'
export { EstadoError, EstadoVacio } from './components/estados'

// Facturas: lo consume `features/sales` desde el flujo de compra.
export { downloadInvoice, downloadBlobAsFile } from './services/invoice.service'

// Empresas (listado simple): lo consume `features/settings/service-charges`.
export { getAgenciasList } from './services/agencias.service'
export * from './models/agencias.model'
export { useAgenciasList } from './hooks/use-agencias-list'
