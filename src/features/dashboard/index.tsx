import { PageLayout } from '@/components/layout/page-layout'
import { useSalesStatistics } from './hooks/use-sales-statistics'
import { useClientesList } from './hooks/use-clientes-list'
import { VentasList } from './components/ventas-list'
import { StatisticsSearchParams } from './models/statistics.model'

export default function Dashboard() {
  // Example usage of the statistics hook
  const statisticsParams: StatisticsSearchParams = {
    // You can add date filters here
    // fechaDesde: '2025-01-01',
    // fechaHasta: '2025-12-31',
    // empresaId: 'specific-company-id',
    // agruparPor: 'dia' // or 'semana', 'mes'
  }

  const { data: statistics, isLoading: statisticsLoading, error: statisticsError } = useSalesStatistics(statisticsParams)
  const { data: clients, isLoading: clientsLoading, error: clientsError } = useClientesList()

  const isLoading = statisticsLoading || clientsLoading
  const error = statisticsError || clientsError

  return (
    <PageLayout
      title="Bienvenido a PasajeOnline"
      description="Panel de control principal del sistema"
      showSearch={false}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          </>
        )}

        {/* Fallback cards when no data is available */}
        {(!statistics || !clients) && !isLoading && !error && (
          <>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Empresas Activas</h3>
              <p className="text-2xl font-bold">12</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Destinos</h3>
              <p className="text-2xl font-bold">45</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Clientes registrados</h3>
              <p className="text-2xl font-bold">89</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Ganancias del mes</h3>
              <p className="text-2xl font-bold">Gs. 1.500.000</p>
            </div>
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

