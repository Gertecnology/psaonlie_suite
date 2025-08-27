import { Clock, MapPin, Users, DollarSign, Star, Bus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { EmpresaServicios, Servicio } from '../models/sales.model'
import { Button } from '@/components/ui/button'

interface ServiciosListProps {
  data: EmpresaServicios[]
  isLoading?: boolean
  className?: string
}

const getCalidadColor = (calidad: string) => {
  switch (calidad) {
    case 'CO':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'SC':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'CN':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'SE':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const getCalidadLabel = (calidad: string) => {
  switch (calidad) {
    case 'CO':
      return 'Común'
    case 'SC':
      return 'Semi Cama'
    case 'CN':
      return 'Cama Nido'
    case 'SE':
      return 'Semi Ejecutivo'
    default:
      return calidad
  }
}

const formatPrice = (price: string) => {
  const numPrice = parseFloat(price)
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numPrice)
}

function ServicioCard({ servicio }: { servicio: Servicio }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{servicio.Cod}</span>
          </div>
          <Badge className={getCalidadColor(servicio.Calidad)}>
            {getCalidadLabel(servicio.Calidad)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Salida</p>
              <p className="text-muted-foreground">{servicio.Embarque}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">Llegada</p>
              <p className="text-muted-foreground">{servicio.Desembarque}</p>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {servicio.Libres} asientos libres
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-bold text-lg">
              {formatPrice(servicio.Tarifa)}
            </span>
          </div>
        </div>
        
        <div className="pt-2">
          <Button className="w-full" size="sm">
            Seleccionar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmpresaSection({ empresa }: { empresa: EmpresaServicios }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">{empresa.empresa}</h3>
        <Badge variant="secondary" className="ml-auto">
          {empresa.data.length} servicios
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {empresa.data.map((servicio) => (
          <ServicioCard key={servicio.Id} servicio={servicio} />
        ))}
      </div>
    </div>
  )
}

export function ServiciosList({ data, isLoading, className }: ServiciosListProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                <div className="h-5 w-16 bg-muted animate-pulse rounded ml-auto" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <Card key={j}>
                    <CardHeader>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-3 w-full bg-muted animate-pulse rounded" />
                      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                      <div className="h-8 w-full bg-muted animate-pulse rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron servicios</h3>
            <p className="text-muted-foreground text-center">
              No hay servicios disponibles para la ruta y fecha seleccionadas.
              <br />
              Intenta con otros destinos o fechas.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-8">
        {data.map((empresa) => (
          <EmpresaSection key={empresa.id} empresa={empresa} />
        ))}
      </div>
    </div>
  )
}
