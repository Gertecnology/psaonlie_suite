import { Building2, Users, TrendingUp, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Agencia {
  id: string
  nombre: string
  codigo: string
  boletosDisponibles: number
  ultimaSincronizacionSoap: string
  activo: boolean
}

interface CompanyStatsProps {
  company: {
    nombre: string
    agenciaPrincipal?: string | null
    activo?: boolean
    createdAt?: string
    updatedAt?: string
    porcentajeVentas?: string
    ventaHabilitada?: string
    ultimaSincronizacionSoap?: string
    agencias?: Agencia[]
  }
}

export function CompanyStats({ company }: CompanyStatsProps) {
  const getStatusColor = (activo?: boolean) => {
    return activo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  const getVentaHabilitadaColor = (ventaHabilitada?: string) => {
    return ventaHabilitada === "S" ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  const totalBoletosDisponibles = company.agencias?.reduce((total, agencia) => total + agencia.boletosDisponibles, 0) || 0
  const agenciasActivas = company.agencias?.filter(agencia => agencia.activo).length || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Estado de la empresa */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estado</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(company.activo)} border-0`}
            >
              {company.activo ? 'Activa' : 'Inactiva'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Venta Habilitada */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Venta</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <Badge 
              variant="secondary" 
              className={`${getVentaHabilitadaColor(company.ventaHabilitada)} border-0`}
            >
              {company.ventaHabilitada === "S" ? 'Habilitada' : 'Deshabilitada'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Agencias Activas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Agencias</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {agenciasActivas}
          </div>
          <p className="text-xs text-muted-foreground">
            {company.agencias ? `${agenciasActivas} de ${company.agencias.length} activas` : 'No hay agencias'}
          </p>
        </CardContent>
      </Card>

      {/* Total de Boletos Disponibles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Boletos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalBoletosDisponibles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Total disponibles
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
