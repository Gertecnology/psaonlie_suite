import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getCompanyById } from '@/features/companies/services/company.service'
import { CompanyDetailsHeader } from '@/features/companies/components/company-details-header'
import { CompanyParadasTable } from '@/features/companies/components/company-paradas-table'
import { Button } from '@/components/ui/button'
import { useRouter } from '@tanstack/react-router'

// Tipado explícito para la empresa
interface Company {
  id: string
  urlPerfil?: string | null
  nombre: string
  agencia?: string | null
  usuario?: string | null
  password?: string | null
  descripcion?: string | null
  url?: string | null
}

function CompanyDetailsPage() {
  const { id } = Route.useParams() as { id: string }
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const { history } = useRouter()

  useEffect(() => {
    setLoading(true)
    getCompanyById(id)
      .then(setCompany)
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className='min-h-screen w-full bg-background flex flex-col p-0 sm:p-4'>
      <div className='w-full max-w-6xl mx-auto flex flex-col gap-4 p-4 sm:p-8'>
        <div className='flex items-center gap-4 mb-2'>
          <Button variant="outline" onClick={() => history.go(-1)}>
            ← Volver
          </Button>
          <h2 className='text-2xl font-bold'>Detalles de empresa</h2>
        </div>
        <CompanyDetailsHeader company={company} loading={loading} />
        {company && <CompanyParadasTable empresaId={company.id} />}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/companies/$id')({
  component: CompanyDetailsPage,
}) 