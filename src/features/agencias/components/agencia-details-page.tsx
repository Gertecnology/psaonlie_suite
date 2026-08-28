import { Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout'
import { useAgencia } from '../hooks/use-agencias'
import { AgenciaDetailsHeader } from './agencia-details-header'
import { AgenciaParadasTable } from './agencia-paradas-table'

interface AgenciaDetailsPageProps {
  agenciaId: string
}

/**
 * A company and its homologated stops.
 *
 * This was the only screen in the panel that fetched with `useEffect` and a
 * bare `.then().finally()`. Two things followed: there was no cache, so coming
 * back from editing refetched everything; and **there was no error branch** —
 * if the request failed, `loading` went false with `agencia` still null and the
 * page rendered blank, saying nothing at all.
 */
export function AgenciaDetailsPage({ agenciaId }: AgenciaDetailsPageProps) {
  const { data: agencia, isLoading, error, refetch } = useAgencia(agenciaId)

  return (
    <PageLayout
      title={agencia?.nombre ?? 'Empresa'}
      description='La comisión, la conexión al web service y las paradas homologadas de la empresa.'
      showSearch={false}
      actions={
        <div className='flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/agencias'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Empresas
            </Link>
          </Button>
          {agencia && (
            <Button size='sm' asChild>
              <Link to='/agencias/$id/editar' params={{ id: agencia.id }}>
                <Pencil className='mr-2 h-4 w-4' />
                Editar
              </Link>
            </Button>
          )}
        </div>
      }
    >
      {error ? (
        <div
          role='alert'
          className='border-destructive/50 text-destructive max-w-2xl rounded-md border p-6'
        >
          <AlertCircle className='mb-2 h-6 w-6' />
          <p className='font-medium'>No se pudo cargar la empresa</p>
          <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4'
            onClick={() => void refetch()}
          >
            Reintentar
          </Button>
        </div>
      ) : (
        <div className='flex flex-col'>
          <AgenciaDetailsHeader agencia={agencia ?? null} loading={isLoading} />
          {agencia && <AgenciaParadasTable agenciaId={agencia.id} />}
        </div>
      )}
    </PageLayout>
  )
}
