import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { obtenerAgenciaPorId } from '@/features/agencias/services/agencia.service'
import { type Agencia } from '@/features/agencias/models/agencia.model'
import { AgenciaDetailsHeader } from '@/features/agencias/components/agencia-details-header'
import { AgenciaParadasTable } from '@/features/agencias/components/agencia-paradas-table'
import { PageLayout } from '@/components/layout'

function AgenciaDetailsPage() {
  const { id } = Route.useParams() as { id: string }
  const [agencia, setAgencia] = useState<Agencia | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    obtenerAgenciaPorId(id)
      .then(setAgencia)
      .finally(() => setLoading(false))
  }, [id])

  return (
    <PageLayout
      title="Empresas y agencias"
      description="Gestiona las empresas de transporte y sus agencias."
      showSearch={false}
    >
    <div className='min-h-screen w-full bg-background flex flex-col'>
      <div className='flex-1 w-full flex flex-col'>
        <div className='flex-1 flex flex-col'>
          <AgenciaDetailsHeader agencia={agencia} loading={loading} />
          {agencia && <AgenciaParadasTable agenciaId={agencia.id} />}
        </div>
      </div>
    </div>
    </PageLayout>
  )
}

export const Route = createFileRoute('/_authenticated/agencias/$id/')({
  component: AgenciaDetailsPage,
})
