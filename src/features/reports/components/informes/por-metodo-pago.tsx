import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { ETIQUETAS_METODO_PAGO } from '@/lib/metodo-pago'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { informePorRuta } from '../../models/informe.model'
import {
  etiquetaMetodoPago,
  type FilaMetodoPago,
  type InformePorMetodoPago,
} from '../../models/por-metodo-pago.model'
import {
  alcanceDeLosTotales,
  rotuloDeLosTotales,
  sumar,
} from '../../models/totales'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('por-metodo-pago')!

/**
 * Qué medio de cobro funciona mejor.
 *
 * Cada renglón contesta tres preguntas distintas y por eso no se puede ordenar
 * por una sola: `cobradoAlCliente` es el volumen que pasó por el medio,
 * `ingresoPropio` es lo que quedó acá, y `tasaConcrecion` es cuántas de las
 * ventas que se iniciaron con ese medio terminaron cobradas. Un medio que
 * arranca cien y cierra doce no es un medio chico, es uno roto.
 *
 * No se pagina: la API devuelve todos los medios del período en una respuesta.
 */
export function InformePorMetodoPago() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  const { data, isLoading, error } = useInforme<InformePorMetodoPago>(
    DEFINICION.ruta,
    aplicados
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      // El filtro por medio cambia el universo del informe: sin declararlo en la
      // ficha técnica, una hoja de un solo medio impresa es indistinguible de
      // una de todos donde sólo hubo movimiento en uno.
      filtrosDescritos={
        aplicados.metodoPago
          ? [
              {
                etiqueta: 'Medio de cobro',
                valor: ETIQUETAS_METODO_PAGO[aplicados.metodoPago],
              },
            ]
          : undefined
      }
      isLoading={isLoading}
      error={error}
      onBuscar={generar}
      puedeBuscar={puedeGenerar}
      controles={
        <FiltrosInformeControles
          borrador={borrador}
          onCambiar={cambiar}
          extras={['metodoPago']}
        />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

function Cuerpo({ datos }: { datos: InformePorMetodoPago }) {
  const filas = datos.data

  // La API no devuelve un objeto de totales, así que la hoja los suma. Es
  // legítimo acá porque este endpoint no pagina: `data` son todos los medios
  // del período, y la suma de la columna es lo que cualquiera verifica a ojo.
  //
  // Por eso el total del período va `undefined`: no hay un conteo aparte contra
  // el cual la hoja pueda quedar corta, y el rótulo puede decir «del período».
  const rotuloTotales = rotuloDeLosTotales(filas.length, undefined)
  const alcanceTotales = alcanceDeLosTotales(filas.length, undefined)

  const ventasLiquidables = sumar(filas, (fila) => fila.ventasLiquidables)
  const ventasTotales = sumar(filas, (fila) => fila.ventasTotales)
  const pasajes = sumar(filas, (fila) => fila.pasajes)
  const cargoServicio = sumar(filas, (fila) => fila.cargoServicio)
  const cobradoAlCliente = sumar(filas, (fila) => fila.cobradoAlCliente)
  const ingresoPropio = sumar(filas, (fila) => fila.ingresoPropio)

  // La concreción del total se recalcula, nunca se promedia: el promedio de las
  // tasas le daría a un medio con tres ventas el mismo peso que a uno con
  // trescientas.
  const concrecionTotal =
    ventasTotales === 0 ? 0 : (ventasLiquidables / ventasTotales) * 100

  const columnas: ColumnaContable<FilaMetodoPago>[] = [
    {
      clave: 'medio',
      titulo: 'Medio de cobro',
      alinear: 'izquierda',
      celda: (fila) => (
        <span className='flex flex-col gap-px'>
          <span>{etiquetaMetodoPago(fila.metodoPago)}</span>
          {/* El color no puede ser la única señal: en papel no se imprime. El
              renglón observado lo dice con texto. */}
          {fila.pagadasSinBoletoCantidad > 0 && (
            <span className='text-destructive text-[10.5px]'>
              {formatearEntero(fila.pagadasSinBoletoCantidad)} ventas cobradas
              sin boleto
            </span>
          )}
        </span>
      ),
    },
    {
      clave: 'ventas-liquidables',
      titulo: 'Ventas liquidables',
      unidad: 'ventas',
      ancho: 96,
      celda: (fila) => formatearEntero(fila.ventasLiquidables),
      total: formatearEntero(ventasLiquidables),
    },
    {
      clave: 'ventas-totales',
      titulo: 'Ventas totales',
      unidad: 'ventas',
      ancho: 90,
      celda: (fila) => formatearEntero(fila.ventasTotales),
      total: formatearEntero(ventasTotales),
    },
    {
      clave: 'concrecion',
      titulo: 'Concreción',
      unidad: '%',
      ancho: 78,
      celda: (fila) => formatearPorcentaje(fila.tasaConcrecion),
      total: formatearPorcentaje(concrecionTotal),
    },
    {
      clave: 'pasajes',
      titulo: 'Pasajes',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.pasajes),
      total: formatearGuaranies(pasajes),
    },
    {
      clave: 'cargo-servicio',
      titulo: 'Cargo por servicio',
      unidad: 'Gs.',
      ancho: 122,
      celda: (fila) => formatearGuaranies(fila.cargoServicio),
      total: formatearGuaranies(cargoServicio),
    },
    {
      clave: 'cobrado-al-cliente',
      titulo: 'Cobrado al cliente',
      unidad: 'Gs.',
      ancho: 132,
      celda: (fila) => formatearGuaranies(fila.cobradoAlCliente),
      total: formatearGuaranies(cobradoAlCliente),
    },
    {
      clave: 'ingreso-propio',
      titulo: 'Ingreso propio',
      unidad: 'Gs.',
      ancho: 124,
      celda: (fila) => formatearGuaranies(fila.ingresoPropio),
      total: formatearGuaranies(ingresoPropio),
    },
    {
      clave: 'participacion',
      titulo: 'Participación',
      unidad: '%',
      ancho: 84,
      celda: (fila) => formatearPorcentaje(fila.participacion),
      // Las participaciones no se suman como importes: reparten el mismo cobro
      // del período, así que el cierre es 100 % por definición.
      total: formatearPorcentaje(100),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={filas}
      // `SIN_METODO` es un renglón real —ventas que nunca registraron medio— y
      // necesita clave estable igual que los demás.
      claveFila={(fila) => fila.metodoPago}
      observada={(fila) => fila.pagadasSinBoletoCantidad > 0}
      rotuloTotales={rotuloTotales}
      alcanceTotales={alcanceTotales}
      // Lo que el período le debitó al cliente por todos los medios juntos: es
      // el importe que esta hoja liquida.
      sonImporte={cobradoAlCliente}
      descripcion='Cobrado al cliente, ingreso propio y tasa de concreción de cada medio de cobro del período'
      mensajeVacio='El período no registra ventas cobradas por ningún medio.'
    />
  )
}
