import { Building2 } from 'lucide-react'

interface CompanyEarnings {
  empresaId: string
  empresaNombre: string
  cantidad: number
  montoPagado: number
  comisiones: number
  serviceCharges: number
  porcentaje: number
}

interface EarningsByCompaniesCardProps {
  companies: CompanyEarnings[]
  isLoading?: boolean
}

export function EarningsByCompaniesCard({ companies, isLoading }: EarningsByCompaniesCardProps) {
  if (isLoading) {
    return (
      <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-muted/50 rounded-lg">
            <Building2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground">Ganancias por Empresa</h3>
        </div>
        <div className="space-y-2 max-h-[100px] sm:max-h-[120px] lg:max-h-[140px] overflow-y-auto pr-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="h-3 bg-muted/50 rounded animate-pulse w-16 sm:w-20"></div>
                <div className="h-2 bg-muted/30 rounded animate-pulse w-12 sm:w-16"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-muted/50 rounded animate-pulse w-12 sm:w-16"></div>
                <div className="h-2 bg-muted/30 rounded animate-pulse w-8 sm:w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Sort companies by total earnings (comisiones + serviceCharges)
  const sortedCompanies = [...companies].sort((a, b) => {
    const earningsA = a.comisiones + a.serviceCharges
    const earningsB = b.comisiones + b.serviceCharges
    return earningsB - earningsA
  })


  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-muted/50 rounded-lg">
          <Building2 className="w-6 h-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-muted-foreground">Ganancias por Empresa</h3>
      </div>
      <div className="space-y-2 max-h-[80px] sm:max-h-[100px] lg:max-h-[120px] overflow-y-auto pr-2">
        {sortedCompanies.map((company) => {
         // const earnings = company.comisiones + company.serviceCharges
          const earningsPagado = company.montoPagado
          return (
            <div key={company.empresaId} className="flex justify-between items-center py-1">
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs font-medium leading-none truncate max-w-[80px] sm:max-w-[120px] text-foreground" title={company.empresaNombre}>
                  {company.empresaNombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  {company.cantidad} ventas
                </p>
              </div>
              <div className="text-right space-y-0.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-foreground">
                    Gs. {earningsPagado.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {company.porcentaje.toFixed(1)}%
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
