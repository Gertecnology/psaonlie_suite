import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  DayConfigurationService, 
  DayConfiguration, 
  CreateDayConfigurationRequest,
  UpdateDayConfigurationRequest
} from '../services/day-configuration.service'

interface UseDayConfigurationOptions {
  enabled?: boolean
}

/**
 * Hook para manejar la configuración de días únicos
 */
export function useDayConfiguration(options: UseDayConfigurationOptions = {}) {
  const { enabled = true } = options
  const queryClient = useQueryClient()

  // Estados locales
  const [isCreating, setIsCreating] = useState(false)
  const [editingConfig, setEditingConfig] = useState<DayConfiguration | null>(null)

  // Query para obtener días únicos
  const {
    data: uniqueDays = [],
    isLoading: isLoadingUniqueDays,
    error: uniqueDaysError,
    refetch: refetchUniqueDays,
  } = useQuery({
    queryKey: ['unique-days'],
    queryFn: () => DayConfigurationService.getUniqueDays(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    select: (response) => response.data || [],
  })

  // Query para obtener configuraciones existentes
  const {
    data: configurations = [],
    isLoading: isLoadingConfigurations,
    error: configurationsError,
    refetch: refetchConfigurations,
  } = useQuery({
    queryKey: ['day-configurations'],
    queryFn: () => DayConfigurationService.getDayConfigurations(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })

  // Query para obtener estadísticas
  const {
    data: statistics,
    isLoading: isLoadingStatistics,
    error: statisticsError,
    refetch: refetchStatistics,
  } = useQuery({
    queryKey: ['day-configuration-statistics'],
    queryFn: () => DayConfigurationService.getDayConfigurationStatistics(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })

  // Query para obtener días sin configurar
  const {
    data: unconfiguredDaysData,
    isLoading: isLoadingUnconfiguredDays,
    error: unconfiguredDaysError,
    refetch: refetchUnconfiguredDays,
  } = useQuery({
    queryKey: ['unconfigured-days'],
    queryFn: () => DayConfigurationService.getUnconfiguredDays(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })

  // Mutation para crear configuración
  const createMutation = useMutation({
    mutationFn: (config: CreateDayConfigurationRequest) => 
      DayConfigurationService.createDayConfiguration(config),
    onSuccess: () => {
      toast.success('Configuración creada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['day-configurations'] })
      queryClient.invalidateQueries({ queryKey: ['unique-days'] })
      queryClient.invalidateQueries({ queryKey: ['day-configuration-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['unconfigured-days'] })
      setIsCreating(false)
    },
    onError: (error: Error) => {
      toast.error(`Error al crear configuración: ${error.message}`)
    },
  })

  // Mutation para actualizar configuración
  const updateMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: UpdateDayConfigurationRequest }) =>
      DayConfigurationService.updateDayConfiguration(id, config),
    onSuccess: () => {
      toast.success('Configuración actualizada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['day-configurations'] })
      queryClient.invalidateQueries({ queryKey: ['unique-days'] })
      queryClient.invalidateQueries({ queryKey: ['day-configuration-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['unconfigured-days'] })
      setEditingConfig(null)
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar configuración: ${error.message}`)
    },
  })

  // Mutation para eliminar configuración
  const deleteMutation = useMutation({
    mutationFn: (id: string) => DayConfigurationService.deleteDayConfiguration(id),
    onSuccess: () => {
      toast.success('Configuración eliminada exitosamente')
      queryClient.invalidateQueries({ queryKey: ['day-configurations'] })
      queryClient.invalidateQueries({ queryKey: ['unique-days'] })
      queryClient.invalidateQueries({ queryKey: ['day-configuration-statistics'] })
      queryClient.invalidateQueries({ queryKey: ['unconfigured-days'] })
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar configuración: ${error.message}`)
    },
  })

  // Funciones de utilidad
  const startCreating = () => setIsCreating(true)
  const cancelCreating = () => setIsCreating(false)
  
  const startEditing = (config: DayConfiguration) => setEditingConfig(config)
  const cancelEditing = () => setEditingConfig(null)

  const createConfiguration = (config: CreateDayConfigurationRequest) => {
    createMutation.mutate(config)
  }

  const updateConfiguration = (id: string, config: UpdateDayConfigurationRequest) => {
    updateMutation.mutate({ id, config })
  }

  const deleteConfiguration = (id: string) => {
    deleteMutation.mutate(id)
  }

  // Verificar si un día único ya tiene configuración
  const getConfigurationForDay = (dayText: string): DayConfiguration | undefined => {
    return configurations.find(config => config.textoOriginal === dayText)
  }

  // Obtener días únicos sin configuración
  const getUnconfiguredDays = (): string[] => {
    return uniqueDays.filter(day => !getConfigurationForDay(day))
  }

  // Estados de carga
  const isLoading = isLoadingUniqueDays || isLoadingConfigurations || isLoadingStatistics || isLoadingUnconfiguredDays
  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  // Utilidad para obtener días sin configurar (usando el nuevo endpoint)
  const getUnconfiguredDaysFromAPI = (): string[] => {
    return unconfiguredDaysData?.diasSinConfigurar || []
  }

  return {
    // Datos
    uniqueDays,
    configurations,
    statistics,
    unconfiguredDaysData,
    
    // Estados
    isLoading,
    isMutating,
    isCreating,
    editingConfig,
    
    // Errores
    uniqueDaysError,
    configurationsError,
    statisticsError,
    unconfiguredDaysError,
    
    // Acciones
    startCreating,
    cancelCreating,
    startEditing,
    cancelEditing,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    
    // Utilidades
    getConfigurationForDay,
    getUnconfiguredDays,
    getUnconfiguredDaysFromAPI,
    
    // Refetch
    refetchUniqueDays,
    refetchConfigurations,
    refetchStatistics,
    refetchUnconfiguredDays,
  }
}
