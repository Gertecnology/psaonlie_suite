import { PageLayout } from '@/components/layout/page-layout'
import { useSalesStatistics } from './hooks/use-sales-statistics'
import { useClientesList } from './hooks/use-clientes-list'
import { VentasList } from './components/ventas-list'
import { EarningsByCompaniesCard } from './components/earnings-by-companies-card'
import { StatisticsFilterModal } from './components/statistics-filter-modal'
import { StatisticsSearchParams } from './models/statistics.model'
import { useState } from 'react'

export default function Dashboard() {
  const [statisticsParams, setStatisticsParams] = useState<StatisticsSearchParams>({})

  const { data: statistics, isLoading: statisticsLoading, error: statisticsError } = useSalesStatistics(statisticsParams)
  const { data: clients, isLoading: clientsLoading, error: clientsError } = useClientesList()

  const isLoading = statisticsLoading || clientsLoading
  const error = statisticsError || clientsError

  const handleApplyFilters = (filters: StatisticsSearchParams) => {
    setStatisticsParams(filters)
  }

  return (
    <PageLayout
      title="Bienvenido a PasajeOnline"
      description="Panel de control principal del sistema"
      showSearch={true}
      actions={
        <StatisticsFilterModal 
          onApplyFilters={handleApplyFilters}
          currentFilters={statisticsParams}
          isLoading={statisticsLoading}
        />
      }
    >
      {/* Statistics Cards Section */}
      <div className="w-full">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Cargando estadísticas...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600 text-lg font-semibold mb-2">Error al cargar estadísticas</div>
              <p className="text-red-500">{error.message}</p>
            </div>
          </div>
        )}

        {statistics && clients && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full">
            {/* Total Ventas Card */}
            <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Ventas del Mes</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">{statistics.generales.totalVentas}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Gs. {statistics.generales.montoTotal.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Clientes Card */}
            <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Clientes</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">{clients.resumenGeneral.totalClientes}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Usuarios registrados
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Comisiones Card */}
            <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Comisiones</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">
                    Gs. {statistics.generales.totalComisiones.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Ingresos por comisión
                  </p>
                </div>
              </div>
            </div>
            
            {/* Total Service Charges Card */}
            <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-muted/50 rounded-lg">
                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">Service Charges</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-foreground">
                    Gs. {statistics.generales.totalServiceCharges.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    Cargos por servicio
                  </p>
                </div>
              </div>
            </div>
            
            {/* Earnings by Companies Card - Full width on smaller screens */}
            <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
              <EarningsByCompaniesCard 
                companies={statistics.porEmpresa} 
                isLoading={statisticsLoading} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Sales List */}
      <div className="mt-8">
        <VentasList />
      </div>
    </PageLayout>
  )
}

