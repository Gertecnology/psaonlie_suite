import { Skeleton } from '@/components/ui/skeleton'

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
  } | null
  loading?: boolean
}

export function DestinationDetailsHeader({ destination, loading }: DestinationDetailsHeaderProps) {
  return (
    <div className='flex items-center gap-8 mb-6 mt-4'>
      {/* Icon */}
      <div className='flex flex-col items-center'>
        {loading ? (
          <Skeleton className='w-20 h-20 rounded-full' />
        ) : (
          <div className='w-20 h-20 rounded-full border-2 border-accent bg-muted flex items-center justify-center overflow-hidden'>
            <span className='text-2xl'>📍</span>
          </div>
        )}
      </div>
      {/* Datos principales */}
      <div className='flex-1 grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-xs text-muted-foreground'>Nombre</label>
          {loading ? <Skeleton className='h-6 w-40' /> : <div className='font-bold text-lg'>{destination?.nombre}</div>}
        </div>
        <div>
          <label className='block text-xs text-muted-foreground'>Estado</label>
          {loading ? <Skeleton className='h-6 w-32' /> : (
            <div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                destination?.activo 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {destination?.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          )}
        </div>
        <div>
          <label className='block text-xs text-muted-foreground'>Cantidad de Paradas</label>
          {loading ? <Skeleton className='h-6 w-32' /> : <div>{destination?.paradasHomologadas?.length || 0}</div>}
        </div>
      </div>
    </div>
  )
} 