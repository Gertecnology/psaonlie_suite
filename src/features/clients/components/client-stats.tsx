import { ShoppingCart, CheckCircle, DollarSign, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClienteConEstadisticas } from '../models/clients.model'

interface ClientStatsProps {
  client: ClienteConEstadisticas
}

export function ClientStats({ client }: ClientStatsProps) {
  const stats = client.estadisticasVentas

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Compras */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Compras</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalVentas}</div>
          <p className="text-xs text-muted-foreground">
            Compras realizadas
          </p>
        </CardContent>
      </Card>

      {/* Compras Pagadas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.ventasPagadas}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalVentas > 0 ? `${Math.round((stats.ventasPagadas / stats.totalVentas) * 100)}% del total` : 'Sin compras'}
          </p>
        </CardContent>
      </Card>

      {/* Monto Total Pagado */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.montoTotalPagado)}</div>
          <p className="text-xs text-muted-foreground">
            Total pagado
          </p>
        </CardContent>
      </Card>

      {/* Última Compra */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Última Compra</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.ultimaVenta ? formatDate(stats.ultimaVenta) : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Fecha más reciente
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
