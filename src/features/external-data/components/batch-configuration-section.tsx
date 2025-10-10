import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Zap,
  List,
  CheckSquare,
  Square
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  DayConfigurationService, 
  CreateDayConfigurationRequest,
  BatchConfigurationResponse
} from '../services/day-configuration.service'

interface BatchConfigurationItem {
  id: string
  textoOriginal: string
  diaSemana: string
  descripcion: string
  selected: boolean
}

interface BatchConfigurationSectionProps {
  unconfiguredDays?: string[]
  onBatchComplete?: () => void
}

export function BatchConfigurationSection({ unconfiguredDays, onBatchComplete }: BatchConfigurationSectionProps) {
  const queryClient = useQueryClient()
  const [items, setItems] = useState<BatchConfigurationItem[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Query para obtener días únicos disponibles
  const {
    data: availableWeekDays = [],
    isLoading: isLoadingWeekDays,
    error: weekDaysError,
  } = useQuery({
    queryKey: ['available-week-days'],
    queryFn: () => DayConfigurationService.getAvailableWeekDays(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
  })

  // Query para obtener días sin configurar desde el API
  const {
    data: unconfiguredDaysData,
    isLoading: isLoadingUnconfiguredDays,
    error: unconfiguredDaysError,
  } = useQuery({
    queryKey: ['unconfigured-days'],
    queryFn: () => DayConfigurationService.getUnconfiguredDays(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })

  // Mutation para crear configuraciones en lote
  const batchMutation = useMutation({
    mutationFn: (configuraciones: CreateDayConfigurationRequest[]) => 
      DayConfigurationService.createBatchDayConfigurations(configuraciones),
    onSuccess: (response: BatchConfigurationResponse) => {
      // Verificar si la respuesta tiene la estructura esperada
      if (response && response.data) {
        const { configuracionesCreadas, configuracionesFallidas } = response.data
        
        if (configuracionesFallidas && configuracionesFallidas.length > 0) {
          toast.warning(`Se crearon ${configuracionesCreadas || 0} configuraciones. ${configuracionesFallidas.length} fallaron.`)
        } else {
          toast.success(`Se crearon exitosamente ${configuracionesCreadas || 0} configuraciones`)
        }
      } else {
        // Si la respuesta no tiene la estructura esperada, asumir éxito
        toast.success('Configuraciones creadas exitosamente')
      }
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['day-configurations'] })
      queryClient.invalidateQueries({ queryKey: ['unique-days'] })
      queryClient.invalidateQueries({ queryKey: ['day-configuration-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['unconfigured-days'] })
      
      setIsProcessing(false)
      setShowConfirmDialog(false)
      
      if (onBatchComplete) {
        onBatchComplete()
      }
    },
    onError: (error: Error) => {
      toast.error(`Error al crear configuraciones en lote: ${error.message}`)
      setIsProcessing(false)
    },
  })

  // Inicializar items cuando cambian los días sin configurar
  useEffect(() => {
    const daysToUse = unconfiguredDaysData?.diasSinConfigurar || unconfiguredDays || []
    
    if (daysToUse.length > 0 && availableWeekDays.length > 0) {
      const newItems: BatchConfigurationItem[] = daysToUse.map((day, index) => ({
        id: `item-${index}`,
        textoOriginal: day,
        diaSemana: '', // Se seleccionará después
        descripcion: `Configuración para ${day}`,
        selected: false,
      }))
      setItems(newItems)
    }
  }, [unconfiguredDaysData, unconfiguredDays, availableWeekDays])

  const handleDiaSemanaChange = (itemId: string, diaSemana: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, diaSemana } : item
    ))
  }

  const handleDescripcionChange = (itemId: string, descripcion: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, descripcion } : item
    ))
  }

  const toggleItemSelection = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    ))
  }

  const selectAll = () => {
    setItems(prev => prev.map(item => ({ ...item, selected: true })))
  }

  const deselectAll = () => {
    setItems(prev => prev.map(item => ({ ...item, selected: false })))
  }

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId))
  }

  const handleBatchCreate = () => {
    const selectedItems = items.filter(item => item.selected && item.diaSemana && item.descripcion)
    
    if (selectedItems.length === 0) {
      toast.error('Selecciona al menos una configuración válida')
      return
    }

    const configuraciones: CreateDayConfigurationRequest[] = selectedItems.map(item => ({
      textoOriginal: item.textoOriginal,
      diaSemana: item.diaSemana,
      descripcion: item.descripcion,
    }))

    setIsProcessing(true)
    batchMutation.mutate(configuraciones)
  }

  const selectedCount = items.filter(item => item.selected).length
  const validSelectedCount = items.filter(item => item.selected && item.diaSemana && item.descripcion).length
  const totalUnconfiguredDays = unconfiguredDaysData?.total || unconfiguredDays?.length || 0

  if (isLoadingWeekDays || isLoadingUnconfiguredDays) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Configuración en Lote</span>
          </CardTitle>
          <CardDescription>
            Configura múltiples días sin configurar de una vez
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

  if (weekDaysError || unconfiguredDaysError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span>Error al cargar datos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            {weekDaysError ? 'No se pudieron cargar los días de semana disponibles' : ''}
            {unconfiguredDaysError ? 'No se pudieron cargar los días sin configurar' : ''}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (totalUnconfiguredDays === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Configuración en Lote</span>
          </CardTitle>
          <CardDescription>
            Configura múltiples días sin configurar de una vez
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">¡Todos los días están configurados!</p>
            <p className="text-muted-foreground">No hay días sin configurar para procesar en lote</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="batch-configuration" className="border rounded-lg">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center space-x-3">
                <Zap className="h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Configuración en Lote</h3>
                  <p className="text-sm text-muted-foreground">
                    Configura múltiples días sin configurar de una vez ({totalUnconfiguredDays} disponibles)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{validSelectedCount} seleccionados</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-6 pb-6">
            <div className="space-y-4">
              {/* Controles de acción */}
              <div className="space-y-4 p-3 sm:p-4 bg-muted rounded-lg">
                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2 p-2 bg-background rounded border">
                    <List className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <p className="text-sm font-semibold">{items.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-background rounded border">
                    <CheckSquare className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground">Seleccionados</span>
                      <p className="text-sm font-semibold">{selectedCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-background rounded border">
                    <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground">Válidos</span>
                      <p className="text-sm font-semibold">{validSelectedCount}</p>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll} className="flex-1 sm:flex-none">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Seleccionar Todo</span>
                      <span className="sm:hidden">Todo</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll} className="flex-1 sm:flex-none">
                      <Square className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Deseleccionar</span>
                      <span className="sm:hidden">Ninguno</span>
                    </Button>
                  </div>
                  <Button 
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={validSelectedCount === 0 || isProcessing}
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Crear {validSelectedCount} Configuraciones</span>
                    <span className="sm:hidden">Crear {validSelectedCount}</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Lista de configuraciones */}
              <div className="border rounded-lg">
                <ScrollArea className="h-80 sm:h-96">
                  <div className="space-y-3 p-4">
                  {items.map((item) => (
                    <div key={item.id} className={`p-3 border rounded-lg ${item.selected ? 'border-primary bg-primary/5' : 'border-border'}`}>
                      {/* Header con checkbox y badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <button
                            onClick={() => toggleItemSelection(item.id)}
                            className={`mt-0.5 p-1 rounded flex-shrink-0 ${item.selected ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                          >
                            {item.selected ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 min-w-0 flex-1">
                            <Badge variant="outline" className="text-xs w-fit">{item.textoOriginal}</Badge>
                            {item.selected && (
                              <Badge variant="default" className="text-xs w-fit">Seleccionado</Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 h-8 w-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {/* Formulario */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`diaSemana-${item.id}`} className="text-xs font-medium">Día de Semana</Label>
                          <select
                            id={`diaSemana-${item.id}`}
                            value={item.diaSemana}
                            onChange={(e) => handleDiaSemanaChange(item.id, e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-xs"
                          >
                            <option value="">Selecciona un día...</option>
                            {availableWeekDays.map((dia) => (
                              <option key={dia} value={dia}>{dia}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`descripcion-${item.id}`} className="text-xs font-medium">Descripción</Label>
                          <Textarea
                            id={`descripcion-${item.id}`}
                            value={item.descripcion}
                            onChange={(e) => handleDescripcionChange(item.id, e.target.value)}
                            placeholder="Descripción de la configuración"
                            rows={2}
                            className="text-xs resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Diálogo de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Crear configuraciones en lote?</AlertDialogTitle>
            <AlertDialogDescription>
              Se crearán {validSelectedCount} configuraciones de días. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchCreate}
              disabled={isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing ? 'Creando...' : `Crear ${validSelectedCount} Configuraciones`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
