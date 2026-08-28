import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { cn } from '@/lib/utils'
import { informePorRuta } from '../../models/informe.model'
import {
  descripcionClasificacion,
  etiquetaClasificacion,
  type BucketClasificacion,
  type EstadoVentas,
  type IndicadorCritico,
} from '../../models/estado-ventas.model'
import { sumar } from '../../models/totales'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('estado-ventas')!

/**
 * Cómo se compone el período: qué se liquidó y qué quedó a medio camino.
 *
 * La clasificación existe porque `estado_pago` solo no alcanza para decir si
 * una venta salió bien: una venta `PAGADO` sin boleto emitido es un cliente que
 * pagó y no recibió nada, y todos los informes la contaban como concretada.
 *
 * Esa clasificación —`Cobrada sin boleto`— es un renglón más de la composición
 * y se marca como partida observada. No va arriba como bloque de indicadores:
 * un cartel antes del detalle se lee antes de que haya algo de qué desconfiar.
 */
export function InformeEstadoVentas() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  const { data, isLoading, error } = useInforme<EstadoVentas>(
    DEFINICION.ruta,
    aplicados,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onBuscar={generar}
      puedeBuscar={puedeGenerar}
      controles={
        <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

/**
 * Un renglón de la composición.
 *
 * Son dos cosas distintas en la misma planilla, y por eso el tipo las separa:
 * las **clasificaciones** reparten las ventas del período y suman en la fila de
 * cierre; los **cruces** son contradicciones entre tablas —una venta cobrada
 * que la pasarela no respalda, un boleto emitido sin cobro anotado— que no
 * salen de ese reparto y por lo tanto quedan fuera del total.
 */
type RenglonEstado =
  | { tipo: 'clasificacion'; clave: string; bucket: BucketClasificacion }
  | {
      tipo: 'cruce'
      clave: string
      rotulo: string
      significado: string
      indicador: IndicadorCritico
    }

function Cuerpo({ datos }: { datos: EstadoVentas }) {
  const clasificaciones = datos.porClasificacion

  /*
   * Los dos cruces que no se pueden leer del reparto.
   *
   * `pagadasSinBoleto` no está acá porque ya es una clasificación —`Cobrada sin
   * boleto`— y repetirla sería contar la misma venta dos veces en la misma
   * hoja. Los otros dos no tienen renglón propio en ningún lado: son las
   * contradicciones más graves que detecta el sistema y desaparecerían si no
   * fueran una partida de esta planilla.
   */
  const cruces: RenglonEstado[] = (
    [
      {
        clave: 'cruce-sin-transaccion',
        rotulo: 'Cobrada sin transacción aprobada',
        significado:
          'La venta figura cobrada y la pasarela no tiene ninguna transacción aprobada que la respalde.',
        indicador: datos.indicadoresCriticos.pagadasSinTransaccionAprobada,
      },
      {
        clave: 'cruce-boleto-sin-pago',
        rotulo: 'Con boleto y sin pago registrado',
        significado:
          'Se emitió el pasaje y no hay cobro anotado: viajó alguien que el sistema no sabe si pagó.',
        indicador: datos.indicadoresCriticos.conBoletoSinPagoRegistrado,
      },
    ] as const
  )
    .filter((cruce) => cruce.indicador.cantidad > 0)
    .map<RenglonEstado>((cruce) => ({ tipo: 'cruce', ...cruce }))

  const filas: RenglonEstado[] = [
    ...clasificaciones.map<RenglonEstado>((bucket) => ({
      tipo: 'clasificacion',
      clave: bucket.clasificacion,
      bucket,
    })),
    ...cruces,
  ]

  // Los totales suman las clasificaciones, que es el reparto completo del
  // período. Los cruces no entran: se cuentan aparte, y sumarlos contaría dos
  // veces ventas que ya están repartidas en alguna clasificación de arriba.
  const totalPasajes = sumar(clasificaciones, (fila) => fila.pasajes)
  const totalCargoServicio = sumar(clasificaciones, (fila) => fila.cargoServicio)
  const totalComision = sumar(clasificaciones, (fila) => fila.comision)
  const totalImporte = totalPasajes + totalCargoServicio

  const columnas: ColumnaContable<RenglonEstado>[] = [
    {
      clave: 'clasificacion',
      titulo: 'Clasificación',
      alinear: 'izquierda',
      celda: (fila) =>
        fila.tipo === 'clasificacion' ? (
          <CeldaClasificacion bucket={fila.bucket} />
        ) : (
          <CeldaCruce
            rotulo={fila.rotulo}
            significado={fila.significado}
            indicador={fila.indicador}
          />
        ),
    },
    {
      clave: 'ventas',
      titulo: 'Ventas',
      unidad: 'ventas',
      ancho: 84,
      celda: (fila) =>
        formatearEntero(
          fila.tipo === 'clasificacion'
            ? fila.bucket.cantidad
            : fila.indicador.cantidad,
        ),
      total: formatearEntero(datos.totalVentas),
    },
    {
      clave: 'participacion',
      titulo: 'Participación',
      unidad: '%',
      ancho: 84,
      celda: (fila) =>
        fila.tipo === 'clasificacion' ? (
          formatearPorcentaje(fila.bucket.porcentaje)
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
      // El reparto cierra en 100 % por definición. Sumar las participaciones
      // redondeadas daría 99,9 o 100,1 y sugeriría que falta o sobra una venta.
      total: clasificaciones.length > 0 ? formatearPorcentaje(100) : undefined,
    },
    {
      clave: 'pasajes',
      titulo: 'Pasajes',
      unidad: 'Gs.',
      ancho: 126,
      celda: (fila) =>
        fila.tipo === 'clasificacion' ? (
          formatearGuaranies(fila.bucket.pasajes)
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
      total: formatearGuaranies(totalPasajes),
    },
    {
      clave: 'cargo-servicio',
      titulo: 'Cargo por servicio',
      unidad: 'Gs.',
      ancho: 126,
      celda: (fila) =>
        fila.tipo === 'clasificacion' ? (
          formatearGuaranies(fila.bucket.cargoServicio)
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
      total: formatearGuaranies(totalCargoServicio),
    },
    {
      clave: 'comision',
      titulo: 'Comisión',
      unidad: 'Gs.',
      ancho: 118,
      celda: (fila) =>
        fila.tipo === 'clasificacion' ? (
          formatearGuaranies(fila.bucket.comision)
        ) : (
          <span className='text-muted-foreground'>—</span>
        ),
      total: formatearGuaranies(totalComision),
    },
    {
      clave: 'importe-total',
      titulo: 'Importe total',
      unidad: 'Gs.',
      ancho: 132,
      // Lo que se le debita al cliente: la tarifa más el cargo por servicio. La
      // comisión no se suma acá — sale de la tarifa, no se le cobra aparte.
      celda: (fila) => (
        <span className='font-semibold'>
          {formatearGuaranies(
            fila.tipo === 'clasificacion'
              ? fila.bucket.pasajes + fila.bucket.cargoServicio
              : fila.indicador.monto,
          )}
        </span>
      ),
      total: formatearGuaranies(totalImporte),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={filas}
      claveFila={(fila) => fila.clave}
      observada={(fila) =>
        fila.tipo === 'cruce' ? true : fila.bucket.critico
      }
      alcanceTotales={
        cruces.length > 0
          ? 'suma de las clasificaciones; los cruces del final se cuentan aparte y no están sumados'
          : undefined
      }
      descripcion='Composición de las ventas del período por clasificación, con el importe involucrado en cada una y los cruces que no cierran'
      mensajeVacio='El período no tiene ninguna venta.'
    />
  )
}

function CeldaClasificacion({ bucket }: { bucket: BucketClasificacion }) {
  const significado = descripcionClasificacion(bucket.clasificacion)

  return (
    <span className='flex flex-col gap-px'>
      <span className={bucket.critico ? 'text-destructive font-medium' : undefined}>
        {etiquetaClasificacion(bucket.clasificacion)}
      </span>
      {/* El color no puede ser la única señal: en papel no se imprime y a quien
          no distingue el rojo no le llega. El renglón lo dice. */}
      {(significado || bucket.critico) && (
        <span
          className={cn(
            'text-[10.5px]',
            bucket.critico ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {bucket.critico && 'Partida observada · '}
          {significado}
        </span>
      )}
    </span>
  )
}

/**
 * Un cruce, con lo que lo separa del reparto escrito en el propio renglón.
 *
 * «Fuera del reparto» va en el rótulo y no sólo en el alcance de los totales:
 * quien firma lee el renglón donde están las cifras, y el papel no puede
 * sugerir que estas dos están sumadas arriba cuando no lo están.
 */
function CeldaCruce({
  rotulo,
  significado,
  indicador,
}: {
  rotulo: string
  significado: string
  indicador: IndicadorCritico
}) {
  return (
    <span className='flex flex-col gap-px'>
      <span className='text-destructive font-medium'>
        {rotulo}
        <span className='text-muted-foreground ml-1.5 text-[10.5px] font-normal'>
          fuera del reparto
        </span>
      </span>
      <span className='text-destructive text-[10.5px]'>
        Partida observada · {significado}
        {indicador.desde &&
          ` La más antigua es del ${formatearFechaISO(indicador.desde)}.`}
      </span>
    </span>
  )
}
