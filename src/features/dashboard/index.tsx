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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Statistics Cards */}
        {isLoading && (
          <div className="col-span-full text-center py-8">
            <p>Cargando estadísticas...</p>
          </div>
        )}

        {error && (
          <div className="col-span-full text-center py-8 text-red-600">
            <p>Error al cargar estadísticas: {error.message}</p>
          </div>
        )}

        {statistics && clients && (
          <>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Ventas</h3>
              <p className="text-2xl font-bold">{statistics.generales.totalVentas}</p>
              <p className="text-sm text-muted-foreground">Monto total: Gs. {statistics.generales.montoTotal.toLocaleString()}</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Clientes</h3>
              <p className="text-2xl font-bold">{clients.resumenGeneral.totalClientes}</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Comisiones</h3>
              <p className="text-2xl font-bold">Gs. {statistics.generales.totalComisiones.toLocaleString()}</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Service Charges</h3>
              <p className="text-2xl font-bold">Gs. {statistics.generales.totalServiceCharges.toLocaleString()}</p>
            </div>
            
            <EarningsByCompaniesCard 
              companies={statistics.porEmpresa} 
              isLoading={statisticsLoading} 
            />
          </>
        )}
      </div>

      {/* Sales List */}
      <div className="mt-8">
        <VentasList />
      </div>
    </PageLayout>
  )
}

