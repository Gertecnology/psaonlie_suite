import { Skeleton } from '@/components/ui/skeleton'

interface CompanyDetailsHeaderProps {
  company?: {
    urlPerfil?: string | null
    nombre: string
    agencia?: string | null
    usuario?: string | null
    password?: string | null
    descripcion?: string | null
    url?: string | null
  } | null
  loading?: boolean
}

export function CompanyDetailsHeader({ company, loading }: CompanyDetailsHeaderProps) {
  return (
    <div className='flex items-center gap-8 mb-6'>
      {/* Logo */}
      <div className='flex flex-col items-center'>
        {loading ? (
          <Skeleton className='w-20 h-20 rounded-full' />
        ) : (
          <div className='w-20 h-20 rounded-full border-2 border-accent bg-muted flex items-center justify-center overflow-hidden'>
            {company?.urlPerfil ? (
              <img src={company.urlPerfil} alt='Logo' className='object-cover w-full h-full rounded-full' />
            ) : (
              <span className='text-xs text-muted-foreground'>Logo</span>
            )}
          </div>
        )}
      </div>
      {/* Datos principales */}
      <div className='flex-1 grid grid-cols-2 gap-4'>
        <div>
          <label className='block text-xs text-muted-foreground'>Nombre</label>
          {loading ? <Skeleton className='h-6 w-40' /> : <div className='font-bold text-lg'>{company?.nombre}</div>}
        </div>
        <div>
          <label className='block text-xs text-muted-foreground'>Agencia</label>
          {loading ? <Skeleton className='h-6 w-32' /> : <div>{company?.agencia}</div>}
        </div>
        <div>
          <label className='block text-xs text-muted-foreground'>Usuario</label>
          {loading ? <Skeleton className='h-6 w-32' /> : <div>{company?.usuario}</div>}
        </div>
        <div>
          <label className='block text-xs text-muted-foreground'>Contraseña</label>
          {loading ? <Skeleton className='h-6 w-32' /> : <div>{company?.password ? '••••••••' : ''}</div>}
        </div>
        <div className='col-span-2'>
          <label className='block text-xs text-muted-foreground'>Descripción</label>
          {loading ? <Skeleton className='h-6 w-64' /> : <div>{company?.descripcion}</div>}
        </div>
        <div className='col-span-2'>
          <label className='block text-xs text-muted-foreground'>URL</label>
          {loading ? <Skeleton className='h-6 w-64' /> : (
            company?.url ? <a href={company.url} className='text-blue-600 underline break-all' target='_blank' rel='noopener noreferrer'>{company.url}</a> : null
          )}
        </div>
      </div>
    </div>
  )
} 