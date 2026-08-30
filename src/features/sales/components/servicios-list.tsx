import { Clock, MapPin, Users, Bus } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useRoundTrip } from '../context/round-trip-context'
import {
  aEnteroGuaranies,
  calcularCargoServicio,
  describirCargoServicio,
  formatearGuaranies,
} from '../utils/money'
import type { EmpresaServicios, Servicio, ParadaHomologada, ServiceCharge } from '../models/sales.model'

interface ServiciosListProps {
  data: EmpresaServicios[]
  isLoading?: boolean
  className?: string
  origen?: ParadaHomologada | null
  destino?: ParadaHomologada | null
  onServiceSelect?: (servicio: Servicio, agenciaId: string, serviceCharge?: ServiceCharge) => void
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

/**
 * El nombre de la calidad, para quien vende.
 *
 * La lista de códigos vive acá y no en el backend, así que cualquiera que la
 * transportista agregue cae en el default. Devolver el código pelado dejaba un
 * badge que decía «CA» y nadie sabía qué era: ahora al menos se lee que no
 * está identificada, con el código al lado para poder preguntar.
 */
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
      return calidad ? `Sin especificar (${calidad})` : 'Sin especificar'
  }
}

/**
 * Lo que el cliente va a pagar por ese pasaje: la tarifa más el cargo por
 * servicio de la empresa. Mostrar la tarifa sola hacía que el vendedor
 * anunciara un precio y la caja cobrara otro.
 */
const precioAlCliente = (
  tarifa: string,
  serviceCharge?: ServiceCharge,
): number => {
  const pasaje = aEnteroGuaranies(tarifa)
  return pasaje + calcularCargoServicio(pasaje, serviceCharge)
}

function ServicioCard({ 
  servicio, 
  agenciaId: _agenciaId, 
  empresaNombre,
  empresaLogo: _empresaLogo,
  serviceCharge: _serviceCharge,
  origen, 
  destino,
  onServiceSelect
}: { 
  servicio: Servicio
  agenciaId: string
  empresaNombre: string
  empresaLogo?: string
  serviceCharge?: ServiceCharge
  origen?: ParadaHomologada | null
  destino?: ParadaHomologada | null
  onServiceSelect?: (servicio: Servicio, agenciaId: string, serviceCharge?: ServiceCharge) => void
}) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()

  const handleSeatSelection = () => {
    if (!origen || !destino) return

    if (onServiceSelect) {
      // Si hay callback personalizado, usarlo
      onServiceSelect(servicio, _agenciaId, _serviceCharge)
    } else {
      // Comportamiento por defecto para ida.
      //
      // El contexto hace merge, así que hay que limpiar explícitamente el
      // bloqueo anterior: si no, elegir otro servicio dejaba pegado el
      // `codigoReferencia` del servicio viejo y la venta se confirmaba contra
      // un bloqueo que no correspondía.
      setRoundTripData({
        ida: {
          origen: roundTripData.ida.origen,
          destino: roundTripData.ida.destino,
          fecha: roundTripData.ida.fecha,
          servicio: servicio,
          agenciaId: _agenciaId, // Guardar el UUID de la empresa
          serviceCharge: _serviceCharge, // Guardar el cargo por servicio
          asientos: undefined,
          codigoReferencia: undefined,
          bloqueoExpiraEn: undefined,
          ventaConfirmada: undefined,
        }
      })

      // Ir al paso de selección de asientos de ida
      setCurrentStep('ida-seats')
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {_empresaLogo ? (
              <img 
                src={_empresaLogo} 
                alt={`Logo ${empresaNombre}`}
                className="h-6 w-6 object-contain rounded"
                onError={(e) => {
                  // Fallback to Bus icon if image fails to load
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <Bus className={`h-4 w-4 text-muted-foreground ${_empresaLogo ? 'hidden' : ''}`} />
            <span className="font-medium text-sm">{empresaNombre}</span>
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
          
          <div
            className="flex flex-col items-end"
            title={`${formatearGuaranies(servicio.Tarifa)} de pasaje + ${formatearGuaranies(
              calcularCargoServicio(aEnteroGuaranies(servicio.Tarifa), _serviceCharge),
            )} de ${describirCargoServicio(_serviceCharge).toLowerCase()}`}
          >
            <span className="font-bold text-lg leading-tight">
              {formatearGuaranies(precioAlCliente(servicio.Tarifa, _serviceCharge))}
            </span>
            <span className="text-muted-foreground text-[11px]">
              con el cargo por servicio
            </span>
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            className="w-full" 
            size="sm"
            onClick={handleSeatSelection}
            disabled={!origen || !destino}
          >
            Seleccionar Asiento
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function EmpresaSection({
  empresa,
  origen,
  destino,
  onServiceSelect
}: {
  empresa: EmpresaServicios
  origen?: ParadaHomologada | null
  destino?: ParadaHomologada | null
  onServiceSelect?: (servicio: Servicio, agenciaId: string, serviceCharge?: ServiceCharge) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{empresa.empresa}</h3>
        <Badge variant="secondary" className="ml-auto">
          {empresa.data.length} servicios
        </Badge>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* El logo de la empresa llega en `url`; con el nombre viejo
            (`imageUrl`) nunca se mostraba ninguno. */}
        {empresa.data.map((servicio) => (
          <ServicioCard
            key={servicio.Id}
            servicio={servicio}
            agenciaId={empresa.id}
            empresaNombre={empresa.empresa}
            empresaLogo={empresa.url}
            serviceCharge={empresa.serviceCharge}
            origen={origen}
            destino={destino}
            onServiceSelect={onServiceSelect}
          />
        ))}
      </div>
    </div>
  )
}

export function ServiciosList({ data, isLoading, className, origen, destino, onServiceSelect }: ServiciosListProps) {
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
          <EmpresaSection 
            key={empresa.id} 
            empresa={empresa} 
            origen={origen}
            destino={destino}
            onServiceSelect={onServiceSelect}
          />
        ))}
      </div>
    </div>
  )
}
