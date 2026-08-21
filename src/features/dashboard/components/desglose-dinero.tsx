import { calcularVariacion, formatearGuaranies } from '@/lib/formato'
import type { EstadisticasGenerales } from '../models/estadisticas.model'
import {
  desgloseCobrado,
  desglosePendiente,
  partidasCobro,
  partidasReparto,
  type PartidaDinero,
} from '../models/finanzas.model'
import { SkeletonMetrica } from './estados'
import { TarjetaMetrica } from './tarjeta-metrica'
import { TiraComposicion, type SegmentoTira } from './tira-composicion'

/**
 * Cada partida tiene su color y lo conserva siempre.
 *
 * El color sigue a la entidad, no al ranking ni a la posición: la comisión es
 * el mismo tono en la tira de arriba, en la de abajo y en el ranking por
 * empresa. Si cambiara según el orden, nadie podría aprenderlo.
 *
 * `netoAEmpresas` comparte tono con `pasaje` a propósito: el neto **es** el
 * pasaje, con la comisión ya descontada. Que sean el mismo color es lo que
 * hace ver que la segunda tira desarma la primera.
 */
const COLOR_PARTIDA: Record<PartidaDinero['clave'], string> = {
  pasaje: 'var(--chart-1)',
  cargoServicio: 'var(--chart-2)',
  comision: 'var(--chart-3)',
  netoAEmpresas: 'var(--chart-1)',
}

function aSegmentos(partidas: PartidaDinero[]): SegmentoTira[] {
  return partidas.map((partida) => ({
    clave: partida.clave,
    etiqueta: partida.etiqueta,
    descripcion: partida.descripcion,
    monto: partida.monto,
    color: COLOR_PARTIDA[partida.clave],
  }))
}

interface Props {
  generales: EstadisticasGenerales | undefined
  generalesAnterior: EstadisticasGenerales | undefined
  cargando: boolean
}

/**
 * El desglose del dinero del período.
 *
 * Es el corazón del panel y la razón por la que existe: **la misma plata se lee
 * de dos maneras, y ninguna de las dos es la suma de la otra**.
 *
 *     Lo que paga el cliente  =  pasaje + cargo por servicio
 *     Cómo se reparte         =  neto a la empresa + comisión + cargo por servicio
 *
 * Las dos tiras tienen exactamente el mismo ancho porque representan el mismo
 * total. Verlas una debajo de la otra es lo que hace evidente que la comisión
 * no es un ingreso adicional: sale de adentro del pasaje.
 *
 * Sumar pasaje + comisión + cargo por servicio en un solo "total" —que es lo
 * que hacía el panel anterior— cuenta la comisión dos veces.
 *
 * La cifra principal es lo **cobrado**, no lo vendido: plata que entró, no
 * plata prometida. Lo pendiente aparece aparte, para que nadie lo lea como
 * ingreso.
 */
export function DesgloseDinero({
  generales,
  generalesAnterior,
  cargando,
}: Props) {
  if (cargando && !generales) {
    return (
      <section className='mb-8 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <div className='border-border h-72 rounded-xl border' />
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1'>
          <SkeletonMetrica />
          <SkeletonMetrica />
        </div>
      </section>
    )
  }

  const cobrado = desgloseCobrado(generales)
  const anterior = desgloseCobrado(generalesAnterior)
  const pendiente = desglosePendiente(generales)
  const pendienteAnterior = desglosePendiente(generalesAnterior)

  const sinMovimiento = cobrado.cobradoAlCliente === 0

  return (
    <section aria-label='Desglose del dinero' className='mb-8'>
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <div className='border-border bg-card rounded-xl border p-5'>
          <h3 className='text-muted-foreground text-xs font-medium'>
            Cobrado al cliente
          </h3>

          {/* La única cifra grande de la pantalla. */}
          <p className='text-foreground mt-1 text-4xl leading-none font-semibold sm:text-5xl'>
            {formatearGuaranies(cobrado.cobradoAlCliente)}
          </p>

          <p className='text-muted-foreground mt-2 text-sm'>
            Pasaje más cargo por servicio, en un solo cobro con tarjeta.
          </p>

          {sinMovimiento ? (
            <p className='text-muted-foreground mt-8 text-sm leading-relaxed'>
              No hubo cobros en este período. Probá con un rango más amplio, o
              sacá el filtro de empresa si lo tenés puesto.
            </p>
          ) : (
            <div className='mt-6 space-y-6'>
              <TiraComposicion
                titulo='Lo que paga el cliente'
                total={cobrado.cobradoAlCliente}
                segmentos={aSegmentos(partidasCobro(cobrado))}
              />
              <TiraComposicion
                titulo='Cómo se reparte'
                total={cobrado.cobradoAlCliente}
                segmentos={aSegmentos(partidasReparto(cobrado))}
              />
            </div>
          )}
        </div>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-1'>
          <TarjetaMetrica
            destacada
            etiqueta='Nuestro ingreso'
            valor={formatearGuaranies(cobrado.ingresoPasajeOnline)}
            descripcion='Cargo por servicio + comisión'
            variacion={calcularVariacion(
              cobrado.ingresoPasajeOnline,
              anterior.ingresoPasajeOnline,
            )}
          />
          <TarjetaMetrica
            destacada
            etiqueta='Neto a las empresas'
            valor={formatearGuaranies(cobrado.netoAEmpresas)}
            descripcion='Pasaje menos comisión'
            variacion={calcularVariacion(
              cobrado.netoAEmpresas,
              anterior.netoAEmpresas,
            )}
          />
        </div>
      </div>

      <div className='mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <TarjetaMetrica
          etiqueta='Pasaje'
          valor={formatearGuaranies(cobrado.pasaje)}
          descripcion='Lo factura la empresa'
          variacion={calcularVariacion(cobrado.pasaje, anterior.pasaje)}
        />
        <TarjetaMetrica
          etiqueta='Cargo por servicio'
          valor={formatearGuaranies(cobrado.cargoServicio)}
          descripcion='Lo facturamos nosotros'
          variacion={calcularVariacion(
            cobrado.cargoServicio,
            anterior.cargoServicio,
          )}
        />
        <TarjetaMetrica
          etiqueta='Comisión'
          valor={formatearGuaranies(cobrado.comision)}
          descripcion='Se descuenta del pasaje'
          variacion={calcularVariacion(cobrado.comision, anterior.comision)}
        />
        <TarjetaMetrica
          etiqueta='Pendiente de cobro'
          valor={formatearGuaranies(pendiente.cobradoAlCliente)}
          descripcion='Reservas sin pagar'
          subirEsBueno={false}
          variacion={calcularVariacion(
            pendiente.cobradoAlCliente,
            pendienteAnterior.cobradoAlCliente,
          )}
        />
      </div>
    </section>
  )
}
