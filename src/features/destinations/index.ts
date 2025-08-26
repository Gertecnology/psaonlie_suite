// Componentes principales
export { DestinationDetailsHeader } from './components/destination-details-header'
export { DestinationParadasList } from './components/destination-paradas-list'
export { RemoveParadaDialog } from './components/remove-parada-dialog'

// Componentes adicionales disponibles
export { DestinationStats } from './components/destination-stats'

// Hooks para gestión de estado y API
export { useGetDestination } from './hooks/use-get-destination'
export { useGetDestinations } from './hooks/use-get-destinations'
export { useCreateDestination } from './hooks/use-create-destination'
export { useUpdateDestination } from './hooks/use-update-destination'
export { useDeleteDestination } from './hooks/use-delete-destination'
export { useGetParadasHomologadas } from './hooks/use-get-paradas-homologadas'
export { useGetDestinationForEdit } from './hooks/use-get-destination-for-edit'
export { useRemoveParadaHomologada } from './hooks/use-remove-parada-homologada'

// Store para gestión de estado local
export { useDestinationDialog, useDestinationDeleteDialog } from './store/use-destination-dialog'

// Modelos y tipos
export type { Destination, DestinationFormValues } from './models/destination.model'
export { destinationSchema, destinationFormSchema } from './models/destination.model'
