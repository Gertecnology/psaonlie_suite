import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Settings, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  Filter,
} from 'lucide-react'
import { useDayConfiguration } from '../hooks/use-day-configuration'
import { CreateDayConfigurationRequest, DayConfiguration } from '../services/day-configuration.service'
import { BatchConfigurationSection } from './batch-configuration-section'

interface DayConfigurationFormProps {
  onSubmit: (data: CreateDayConfigurationRequest) => void
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<CreateDayConfigurationRequest>
  isEdit?: boolean
}


function DayConfigurationForm({ 
  onSubmit, 
  onCancel, 
  isLoading = false, 
  initialData = {},
}: DayConfigurationFormProps) {
  const [formData, setFormData] = useState<CreateDayConfigurationRequest>({
    textoOriginal: initialData.textoOriginal || '',
    diaSemana: initialData.diaSemana || '',
    descripcion: initialData.descripcion || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.textoOriginal && formData.diaSemana && formData.descripcion) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="textoOriginal">Texto Original</Label>
        <Input
          id="textoOriginal"
          value={formData.textoOriginal}
          onChange={(e) => setFormData(prev => ({ ...prev, textoOriginal: e.target.value }))}
          placeholder="Ej: Lunes a Viernes"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="diaSemana">Día de Semana (Código)</Label>
        <Input
          id="diaSemana"
          value={formData.diaSemana}
          onChange={(e) => setFormData(prev => ({ ...prev, diaSemana: e.target.value }))}
          placeholder="Ej: LUNES_A_VIERNES"
          required
        />
        <p className="text-sm text-muted-foreground">
          Código único para identificar esta configuración (en mayúsculas, sin espacios)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          value={formData.descripcion}
          onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
          placeholder="Descripción detallada de esta configuración"
          rows={3}
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}


interface DayConfigurationItemProps {
  config: DayConfiguration
}

function DayConfigurationItem({ config }: DayConfigurationItemProps) {
  return (
    <div className="p-4 border rounded-lg">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          {config.activo ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Clock className="h-4 w-4 text-gray-400" />
          )}
          <span className="font-medium">{config.textoOriginal}</span>
          <Badge variant="secondary">{config.diaSemana}</Badge>
          <Badge variant={config.activo ? "default" : "secondary"}>
            {config.activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{config.descripcion}</p>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span>Creado: {new Date(config.fechaCreacion).toLocaleDateString()}</span>
          <span>Actualizado: {new Date(config.fechaActualizacion).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
}

export function DayConfigurationSection() {
  const queryClient = useQueryClient()
  const {
    uniqueDays,
    configurations,
    statistics,
    unconfiguredDaysData,
    isLoading,
    isMutating,
    startCreating,
    cancelCreating,
    createConfiguration,
    getUnconfiguredDays,
  } = useDayConfiguration()

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleStartCreating = () => {
    startCreating()
    setShowCreateDialog(true)
  }

  const handleCancelCreating = () => {
    cancelCreating()
    setShowCreateDialog(false)
  }


  const handleCreate = (data: CreateDayConfigurationRequest) => {
    createConfiguration(data)
    setShowCreateDialog(false)
  }


  const unconfiguredDays = getUnconfiguredDays()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuración de Filtros por Día</span>
          </CardTitle>
          <CardDescription>
            Gestiona las configuraciones de filtros por día para los datos externos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <div>
                <CardTitle>Configuración de Filtros por Día</CardTitle>
                <CardDescription>
                  Gestiona las configuraciones de filtros por día para los datos externos
                </CardDescription>
              </div>
            </div>
            <Button onClick={handleStartCreating} disabled={isMutating}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Configuración
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-center space-x-3 p-3 sm:p-4 bg-muted rounded-lg">
              <Calendar className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Días Únicos</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{statistics ? statistics.totalConfiguradas + statistics.totalSinConfigurar : uniqueDays.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 sm:p-4 bg-muted rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Configurados</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{statistics?.totalConfiguradas ?? configurations.length}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 sm:p-4 bg-muted rounded-lg sm:col-span-2 lg:col-span-1">
              <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sin Configurar</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{statistics?.totalSinConfigurar ?? unconfiguredDays.length}</p>
              </div>
            </div>
          </div>

          {/* Estadísticas por día de semana */}
          {statistics?.porDiaSemana && Object.keys(statistics.porDiaSemana).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium text-sm sm:text-base">Configuraciones por Día de Semana</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3">
                {Object.entries(statistics.porDiaSemana).map(([dia, count]) => (
                  <div key={dia} className="flex flex-col items-center p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-xs font-medium text-blue-600 text-center break-words">{dia}</span>
                    <span className="text-base sm:text-lg font-bold text-blue-800">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Configuración en Lote */}
          {(unconfiguredDaysData?.total ?? 0) > 0 && (
            <BatchConfigurationSection 
              onBatchComplete={() => {
                // Refrescar datos después de la configuración en lote
                queryClient.invalidateQueries({ queryKey: ['day-configurations'] })
                queryClient.invalidateQueries({ queryKey: ['unique-days'] })
                queryClient.invalidateQueries({ queryKey: ['day-configuration-statistics'] })
                queryClient.invalidateQueries({ queryKey: ['unconfigured-days'] })
              }}
            />
          )}

          <Separator />

          {/* Configuraciones existentes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-green-500" />
              <h3 className="font-medium">Configuraciones Existentes ({configurations.length})</h3>
            </div>
            
            {configurations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay configuraciones creadas</p>
                <p className="text-sm">Crea tu primera configuración para comenzar</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {configurations.map((config) => (
                    <DayConfigurationItem
                      key={config.id}
                      config={config}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo para crear configuración */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Configuración de Día</DialogTitle>
            <DialogDescription>
              Crea una nueva configuración para un filtro de día específico
            </DialogDescription>
          </DialogHeader>
          <DayConfigurationForm
            onSubmit={handleCreate}
            onCancel={handleCancelCreating}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

    </>
  )
}
