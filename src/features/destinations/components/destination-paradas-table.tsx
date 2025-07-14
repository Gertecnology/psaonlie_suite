import { useEffect, useState } from 'react'
import { getDestinationById } from '../services/destination.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Destination } from '../models/destination.model'

interface DestinationParadasTableProps {
  destinationId: string
}

export function DestinationParadasTable({ destinationId }: DestinationParadasTableProps) {
  const [destination, setDestination] = useState<Destination | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getDestinationById(destinationId)
      .then(res => setDestination(res))
      .finally(() => setLoading(false))
  }, [destinationId])

  const paradas = destination?.paradasHomologadas || []

  return (
    <div className='mt-8'>
      <h3 className='font-bold text-lg mb-2'>Paradas homologadas</h3>
      <div className='border rounded-md overflow-x-auto'>
        <table className='min-w-full'>
          <thead>
            <tr className='bg-muted'>
              <th className='px-4 py-2 text-left'>Nombre</th>
              <th className='px-4 py-2 text-left'>Empresa</th>
              <th className='px-4 py-2 text-left'>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td className='px-4 py-2'><Skeleton className='h-5 w-40' /></td>
                  <td className='px-4 py-2'><Skeleton className='h-5 w-32' /></td>
                  <td className='px-4 py-2'><Skeleton className='h-5 w-16' /></td>
                </tr>
              ))
            ) : paradas.length > 0 ? (
              paradas.map((parada) => (
                <tr key={parada.id}>
                  <td className='px-4 py-2'>{parada.nombre}</td>
                  <td className='px-4 py-2'>{parada.empresaNombre}</td>
                  <td className='px-4 py-2'>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      parada.activo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {parada.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className='px-4 py-6 text-center text-muted-foreground'>
                  No hay paradas homologadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 