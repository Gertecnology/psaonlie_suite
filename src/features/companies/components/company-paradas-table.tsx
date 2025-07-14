import { useEffect, useState } from 'react'
import { getParadasHomologadas } from '../services/company.service'
import { Skeleton } from '@/components/ui/skeleton'

interface Parada {
  id: string
  idExterno: number
  descripcion: string
  destinoId: string
  url: string
}

interface ParadasResponse {
  items: Parada[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface CompanyParadasTableProps {
  empresaId: string
}

export function CompanyParadasTable({ empresaId }: CompanyParadasTableProps) {
  const [data, setData] = useState<ParadasResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 10;

  useEffect(() => {
    setLoading(true)
    getParadasHomologadas(empresaId, page, limit)
      .then(res => setData(res))
      .finally(() => setLoading(false))
  }, [empresaId, page, limit])

  return (
    <div className='flex-1 flex flex-col p-6'>
      <h3 className='font-bold text-lg mb-4'>Paradas homologadas</h3>
      <div className='flex-1 border rounded-md overflow-hidden flex flex-col'>
        <div className='flex-1 overflow-auto'>
          <table className='min-w-full'>
            <thead>
              <tr className='bg-muted'>
                <th className='px-4 py-2 text-left'>IdExterno</th>
                <th className='px-4 py-2 text-left'>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(limit)].map((_, i) => (
                  <tr key={i}>
                    <td className='px-4 py-2'><Skeleton className='h-5 w-16' /></td>
                    <td className='px-4 py-2'><Skeleton className='h-5 w-40' /></td>
                  </tr>
                ))
              ) : (data?.items?.length ?? 0) > 0 ? (
                data?.items?.map((parada) => (
                  <tr key={parada.id}>
                    <td className='px-4 py-2'>{parada.idExterno}</td>
                    <td className='px-4 py-2'>{parada.descripcion}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className='px-4 py-6 text-center text-muted-foreground'>No hay paradas homologadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Paginación */}
      {data && data.totalPages > 1 && (
        <div className='flex justify-end items-center gap-2 mt-4'>
          <button
            className='px-3 py-1 rounded border text-sm disabled:opacity-50'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span className='text-sm'>Página {page} de {data.totalPages}</span>
          <button
            className='px-3 py-1 rounded border text-sm disabled:opacity-50'
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page === data.totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
} 