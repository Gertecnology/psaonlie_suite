import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ServicioInfo } from '../../models/sales.model'

interface ServiceInfoProps {
  servicioInfo: ServicioInfo
}

export function ServiceInfo({ servicioInfo }: ServiceInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4 text-muted-foreground" />
          Información del Servicio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Empresa</p>
            <p className="font-medium">{servicioInfo.empresa}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Parados</p>
            <p className="font-medium">{servicioInfo.parados} ({servicioInfo.paradosVendidos} vendidos)</p>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <p className="text-sm font-medium">Tarifas</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{servicioInfo.calidadDescripcionA}</span>
              <Badge variant="outline">
                {new Intl.NumberFormat('es-PY', {
                  style: 'currency',
                  currency: 'PYG',
                  minimumFractionDigits: 0,
                }).format(servicioInfo.tarifaA)}
              </Badge>
            </div>
            {servicioInfo.calidadDescripcionB && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{servicioInfo.calidadDescripcionB}</span>
                <Badge variant="outline">
                  {new Intl.NumberFormat('es-PY', {
                    style: 'currency',
                    currency: 'PYG',
                    minimumFractionDigits: 0,
                  }).format(servicioInfo.tarifaB)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
