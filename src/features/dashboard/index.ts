// Export statistics functionality
export * from './models/statistics.model'
export * from './services/statistics.service'
export * from './hooks/use-sales-statistics'

// Export clients functionality
export * from './models/clients.model'
export * from './services/clients.service'
export * from './hooks/use-clientes-list'

// Export sales functionality
export * from './models/sales.model'
export * from './services/sales.service'
export * from './hooks/use-ventas-list'
export * from './components/ventas-list'
export * from './components/ventas-data-table'
export * from './components/ventas-table-toolbar'
export * from './components/ventas-columns'

// Export Dashboard component as default
export { default } from './index.tsx'
