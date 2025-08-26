import { ArrowLeft, MapPin, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { DestinationParadasList } from './destination-paradas-list'

interface DestinationDetailsHeaderProps {
  destination?: {
    id: string
    nombre: string
    activo: boolean
    paradasHomologadas?: Array<{
      id: string
      nombre: string
      activo: boolean
      empresaNombre: string
    }>
    cantidadParadas?: number
    empresaNombre?: string
    descripcion?: string
    createdAt?: string
    updatedAt?: string
  } | null
  loading?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function DestinationDetailsHeader({ 
  destination, 
  loading, 
  onEdit, 
  onDelete 
}: DestinationDetailsHeaderProps) {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate({ to: '/destinations' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header con botón de volver */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-6 w-48" />
        </div>
        
        {/* Cards de información */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de volver, título y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="gap-2 hover:bg-muted/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">
              {destination?.nombre || 'Destino no encontrado'}
            </h1>
            <Badge 
              variant={destination?.activo ? "default" : "secondary"}
              className="ml-2"
            >
              {destination?.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas visuales simplificadas */}
      {destination && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total de Paradas */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Total de Paradas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {destination.paradasHomologadas?.length || 0}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                paradas homologadas
              </p>
            </CardContent>
          </Card>

          {/* Paradas Activas */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Paradas Activas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {destination.paradasHomologadas?.filter(p => p.activo).length || 0}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400">
                paradas operativas
              </p>
            </CardContent>
          </Card>

          {/* Empresas Involucradas */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Empresas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {new Set(destination.paradasHomologadas?.map(p => p.empresaNombre)).size || 0}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">
                empresas operando
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de paradas homologadas */}
      {destination?.paradasHomologadas && destination.paradasHomologadas.length > 0 && (
        <DestinationParadasList
          paradas={destination.paradasHomologadas}
          destinationName={destination.nombre}
          destinationId={destination.id}
        />
      )}
    </div>
  )
} 