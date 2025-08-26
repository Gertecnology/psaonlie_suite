import { MapPin, Users, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DestinationStatsProps {
  destination: {
    paradasHomologadas?: Array<{
      id: string
      nombre: string
      activo: boolean
      empresaNombre: string
    }>
    cantidadParadas?: number
    empresaNombre?: string
    createdAt?: string
    updatedAt?: string
  }
}

export function DestinationStats({ destination }: DestinationStatsProps) {
  const paradasActivas = destination.paradasHomologadas?.filter(p => p.activo).length || 0
  const paradasInactivas = (destination.paradasHomologadas?.length || 0) - paradasActivas
  const diasDesdeCreacion = destination.createdAt 
    ? Math.floor((Date.now() - new Date(destination.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Paradas Totales */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Total Paradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {destination.paradasHomologadas?.length || 0}
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            paradas registradas
          </p>
        </CardContent>
      </Card>

      {/* Paradas Activas */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Paradas Activas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {paradasActivas}
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            {paradasActivas > 0 ? `${Math.round((paradasActivas / (destination.paradasHomologadas?.length || 1)) * 100)}% del total` : '0% del total'}
          </p>
        </CardContent>
      </Card>

      {/* Paradas Inactivas */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Paradas Inactivas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {paradasInactivas}
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            {paradasInactivas > 0 ? `${Math.round((paradasInactivas / (destination.paradasHomologadas?.length || 1)) * 100)}% del total` : '0% del total'}
          </p>
        </CardContent>
      </Card>

      {/* Antigüedad */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Antigüedad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {diasDesdeCreacion}
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            {diasDesdeCreacion === 0 ? 'Creado hoy' : 
             diasDesdeCreacion === 1 ? 'Creado ayer' : 
             `Creado hace ${diasDesdeCreacion} días`}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
