import { Badge } from '@/components/ui/badge'
import { TrendingUp, Building2 } from 'lucide-react'

interface CompanyEarnings {
  empresaId: string
  empresaNombre: string
  cantidad: number
  monto: number
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
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 lg:p-6">
        <h3 className="font-semibold flex items-center gap-2 mb-2 text-sm">
          <Building2 className="h-3.5 w-3.5" />
          Ganancias por Empresa
        </h3>
        <div className="space-y-1 max-h-[100px] sm:max-h-[120px] lg:max-h-[140px] overflow-y-auto pr-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="space-y-1">
                <div className="h-3 bg-muted rounded animate-pulse w-16 sm:w-20"></div>
                <div className="h-2 bg-muted rounded animate-pulse w-12 sm:w-16"></div>
              </div>
              <div className="space-y-1">
                <div className="h-3 bg-muted rounded animate-pulse w-12 sm:w-16"></div>
                <div className="h-2 bg-muted rounded animate-pulse w-8 sm:w-12"></div>
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
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 lg:p-6">
      <h3 className="font-semibold flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5" />
        Ganancias por Empresa
      </h3>
      <div className="space-y-1 max-h-[80px] sm:max-h-[100px] lg:max-h-[120px] overflow-y-auto pr-2">
        {sortedCompanies.map((company) => {
          const earnings = company.comisiones + company.serviceCharges
          return (
            <div key={company.empresaId} className="flex justify-between items-center py-0.5">
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs font-medium leading-none truncate max-w-[80px] sm:max-w-[120px]" title={company.empresaNombre}>
                  {company.empresaNombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  {company.cantidad} ventas
                </p>
              </div>
              <div className="text-right space-y-0.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs font-semibold">
                    Gs. {earnings.toLocaleString()}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs px-1 py-0">
                  {company.porcentaje.toFixed(1)}%
                </Badge>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
