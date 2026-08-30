import { Bus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRoundTrip } from '../context/round-trip-context'
import type {
  EmpresaServicios,
  ParadaHomologada,
  ServiceCharge,
  Servicio,
} from '../models/sales.model'
import { leerHorario } from '../utils/el-horario-del-servicio'
import {
  aEnteroGuaranies,
  calcularCargoServicio,
  describirCargoServicio,
  formatearGuaranies,
} from '../utils/money'

interface ServiciosListProps {
  data: EmpresaServicios[]
  isLoading?: boolean
  className?: string
  origen?: ParadaHomologada | null
  destino?: ParadaHomologada | null
  onServiceSelect?: (
    servicio: Servicio,
    agenciaId: string,
    serviceCharge?: ServiceCharge
  ) => void
}

/**
 * El nombre de la calidad, para quien vende.
 *
 * La lista de códigos vive acá y no en el backend, así que cualquiera que la
 * transportista agregue cae en el default. Devolver el código pelado dejaba un
 * badge que decía «CA» y nadie sabía qué era.
 */
const nombreDeLaCalidad = (calidad: string) => {
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
 * Lo que el cliente va a pagar: la tarifa más el cargo por servicio.
 *
 * Mostrar la tarifa sola hacía que el vendedor anunciara un precio y la caja
 * cobrara otro, porque el cargo se sumaba dos pantallas después.
 */
const precioAlCliente = (tarifa: string, serviceCharge?: ServiceCharge) => {
  const pasaje = aEnteroGuaranies(tarifa)
  return pasaje + calcularCargoServicio(pasaje, serviceCharge)
}

/** Una salida: la empresa a la izquierda, el viaje al medio, el precio al final. */
function TarjetaDeServicio({
  servicio,
  agenciaId,
  empresaNombre,
  empresaLogo,
  serviceCharge,
  origen,
  destino,
  onServiceSelect,
}: {
  servicio: Servicio
  agenciaId: string
  empresaNombre: string
  empresaLogo?: string
  serviceCharge?: ServiceCharge
  origen?: ParadaHomologada | null
  destino?: ParadaHomologada | null
  onServiceSelect?: (
    servicio: Servicio,
    agenciaId: string,
    serviceCharge?: ServiceCharge
  ) => void
}) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const horario = leerHorario(servicio.Embarque, servicio.Desembarque)
  const libres = parseInt(servicio.Libres, 10) || 0
  const total = precioAlCliente(servicio.Tarifa, serviceCharge)
  const cargo = calcularCargoServicio(
    aEnteroGuaranies(servicio.Tarifa),
    serviceCharge
  )

  const elegir = () => {
    if (!origen || !destino) return

    if (onServiceSelect) {
      onServiceSelect(servicio, agenciaId, serviceCharge)
      return
    }

    // El contexto hace merge, así que hay que limpiar explícitamente el
    // bloqueo anterior: si no, elegir otro servicio dejaba pegado el
    // `codigoReferencia` del viejo y la venta se confirmaba contra un bloqueo
    // que no correspondía.
    setRoundTripData({
      ida: {
        origen: roundTripData.ida.origen,
        destino: roundTripData.ida.destino,
        fecha: roundTripData.ida.fecha,
        servicio,
        agenciaId,
        serviceCharge,
        asientos: undefined,
        codigoReferencia: undefined,
        bloqueoExpiraEn: undefined,
        ventaConfirmada: undefined,
      },
    })
    setCurrentStep('ida-seats')
  }

  return (
    <Card className='hover:border-foreground/25 transition-colors'>
      <CardContent className='flex items-center gap-3 p-3'>
        {/* La empresa, en columna: el logo arriba y el nombre debajo. Ocupa
            poco ancho, que es lo que hace falta para que entren dos tarjetas
            por fila. */}
        <div className='flex w-[4.5rem] flex-none flex-col items-center gap-1'>
          <div className='border-border flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border'>
            {empresaLogo ? (
              <img
                src={empresaLogo}
                alt=''
                className='h-full w-full object-contain'
                onError={(evento) => {
                  evento.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <Bus className='text-muted-foreground h-4 w-4' />
            )}
          </div>
          <p className='w-full truncate text-center text-[11px] font-semibold'>
            {empresaNombre}
          </p>
        </div>

        <div className='border-border min-w-0 flex-1 border-l pl-3'>
          <div className='mb-1.5 flex items-baseline gap-2'>
            <span className='truncate text-[13px] font-semibold'>
              {origen?.nombre} → {destino?.nombre}
            </span>
            <span className='bg-muted text-muted-foreground flex-none rounded px-1.5 py-0.5 text-[10px] font-semibold'>
              {nombreDeLaCalidad(servicio.Calidad)}
            </span>
          </div>

          <div className='flex items-center gap-2'>
            <span className='text-[13px] font-semibold tabular-nums'>
              {horario.sale}
            </span>

            <div className='bg-border relative h-px min-w-[2rem] flex-1'>
              {horario.duracion && (
                <span className='bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-1.5 text-[10px] whitespace-nowrap'>
                  {horario.duracion}
                </span>
              )}
            </div>

            <span className='text-[13px] font-semibold tabular-nums'>
              {horario.llega}
              {horario.diasDespues > 0 && (
                <span className='text-muted-foreground ml-0.5 align-super text-[9px]'>
                  +{horario.diasDespues}
                </span>
              )}
            </span>

            <span className='text-muted-foreground ml-1 flex flex-none items-center gap-1 text-[11px]'>
              <Users className='h-3 w-3' />
              {libres}
            </span>
          </div>
        </div>

        <div
          className='border-border flex-none border-l pl-3 text-right'
          title={`${formatearGuaranies(servicio.Tarifa)} de pasaje + ${formatearGuaranies(cargo)} de ${describirCargoServicio(serviceCharge).toLowerCase()}`}
        >
          <p className='text-[15px] leading-tight font-bold tabular-nums'>
            {formatearGuaranies(total)}
          </p>
          <p className='text-muted-foreground mb-1.5 text-[10px]'>
            con el cargo
          </p>
          <Button
            size='sm'
            className='h-7 w-full px-3 text-xs'
            onClick={elegir}
            disabled={!origen || !destino}
          >
            Vender
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function TarjetaFantasma() {
  return (
    <Card>
      <CardContent className='flex items-center gap-3 p-3'>
        <div className='flex w-[4.5rem] flex-none flex-col items-center gap-1'>
          <div className='bg-muted h-10 w-10 animate-pulse rounded-lg' />
          <div className='bg-muted h-2.5 w-12 animate-pulse rounded' />
        </div>
        <div className='border-border flex-1 space-y-2 border-l pl-3'>
          <div className='bg-muted h-3 w-3/5 animate-pulse rounded' />
          <div className='bg-muted h-3 w-4/5 animate-pulse rounded' />
        </div>
        <div className='border-border flex-none space-y-1.5 border-l pl-3'>
          <div className='bg-muted h-3.5 w-20 animate-pulse rounded' />
          <div className='bg-muted h-7 w-20 animate-pulse rounded-md' />
        </div>
      </CardContent>
    </Card>
  )
}

export function ServiciosList({
  data,
  isLoading,
  className,
  origen,
  destino,
  onServiceSelect,
}: ServiciosListProps) {
  if (isLoading) {
    return (
      <div className={className}>
        <div className='grid gap-2.5 xl:grid-cols-2'>
          <TarjetaFantasma />
          <TarjetaFantasma />
          <TarjetaFantasma />
          <TarjetaFantasma />
        </div>
      </div>
    )
  }

  // Una sola lista, ordenada por hora de salida.
  //
  // Antes venían agrupados por empresa, en una grilla de tres columnas: para
  // comparar el de las 06:15 de una con el de las 06:30 de otra había que
  // scrollear y recordar. La pregunta del mostrador es «¿cuál sale primero?»,
  // y esa se contesta con una lista en orden.
  const salidas = data
    .flatMap((empresa) =>
      empresa.data.map((servicio) => ({
        servicio,
        agenciaId: empresa.id,
        empresaNombre: empresa.empresa,
        empresaLogo: empresa.url,
        serviceCharge: empresa.serviceCharge,
      }))
    )
    .sort((a, b) => {
      const horaA = leerHorario(
        a.servicio.Embarque,
        a.servicio.Desembarque
      ).sale
      const horaB = leerHorario(
        b.servicio.Embarque,
        b.servicio.Desembarque
      ).sale
      return horaA.localeCompare(horaB)
    })

  if (salidas.length === 0) {
    return (
      <div className={className}>
        <div className='border-border rounded-lg border border-dashed px-6 py-10 text-center'>
          <p className='mb-1 font-medium'>No hay salidas para esa fecha</p>
          <p className='text-muted-foreground text-sm'>
            Probá con otra fecha, o revisá que «Pasajeros» no esté pidiendo más
            butacas de las que quedan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Dos por fila: una tarjeta a todo el ancho deja un desierto entre el
          horario y el precio, y obliga a recorrer 1300 px para leer una sola
          salida. */}
      <div className='grid gap-2.5 xl:grid-cols-2'>
        {salidas.map((salida) => (
          <TarjetaDeServicio
            key={`${salida.agenciaId}-${salida.servicio.Id}`}
            servicio={salida.servicio}
            agenciaId={salida.agenciaId}
            empresaNombre={salida.empresaNombre}
            empresaLogo={salida.empresaLogo}
            serviceCharge={salida.serviceCharge}
            origen={origen}
            destino={destino}
            onServiceSelect={onServiceSelect}
          />
        ))}
      </div>
    </div>
  )
}
