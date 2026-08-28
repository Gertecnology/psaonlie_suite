import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
} from '@/lib/formato'
import { informePorRuta, rutaApi } from '../../models/informe.model'
import {
  etiquetaAgrupacion,
  type PuntoSerieTemporal,
  type SerieTemporal,
} from '../../models/serie-temporal.model'
import {
  alcanceDeLosTotales,
  rotuloDeLosTotales,
  sumar,
} from '../../models/totales'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('serie-temporal')!

/**
 * The period cut into buckets, so the trend is visible and not just the total.
 *
 * It is a table and not a chart on purpose. A chart answers "is it going up"
 * and nothing else: it does not print legibly, it cannot be audited figure by
 * figure, and the number a reader wants to quote is not on it. The table gives
 * every bucket its exact figures, and the trend is still readable down the
 * column. A chart could be added *on top* of this — never instead of it — and
 * it would have to carry `no-imprimir`.
 */
export function InformeSerieTemporal() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  const { data, isLoading, error } = useInforme<SerieTemporal>(
    rutaApi(DEFINICION),
    aplicados,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      // La agrupación cambia qué es una fila. Sin decirlo en la ficha técnica,
      // un informe semanal impreso es indistinguible de uno diario con pocos
      // días.
      filtrosDescritos={
        data
          ? [
              {
                etiqueta: 'Agrupado por',
                valor: etiquetaAgrupacion(data.agruparPor),
              },
            ]
          : undefined
      }
      isLoading={isLoading}
      error={error}
      onEmitir={generar}
      puedeEmitir={puedeGenerar}
      controles={
        <FiltrosInformeControles
          borrador={borrador}
          onCambiar={cambiar}
          extras={['agruparPor']}
        />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

function Cuerpo({ datos }: { datos: SerieTemporal }) {
  const agrupacion = etiquetaAgrupacion(datos.agruparPor).toLowerCase()
  const tramos = datos.data

  // Sumar la columna acá es legítimo porque el endpoint **no pagina**: `data`
  // trae todos los tramos del período, así que el total es la suma de lo que
  // está a la vista y cualquiera lo verifica con una calculadora. Por lo mismo
  // no hay un conteo del período contra el cual comparar: se pasa `undefined`.
  const listados = tramos.length
  const totalDelPeriodo = undefined

  const totales = {
    ventasTotales: sumar(tramos, (tramo) => tramo.ventasTotales),
    ventasLiquidables: sumar(tramos, (tramo) => tramo.ventasLiquidables),
    pasajes: sumar(tramos, (tramo) => tramo.pasajes),
    cargoServicio: sumar(tramos, (tramo) => tramo.cargoServicio),
    cobradoAlCliente: sumar(tramos, (tramo) => tramo.cobradoAlCliente),
    comision: sumar(tramos, (tramo) => tramo.comision),
    netoATransferirEmpresas: sumar(
      tramos,
      (tramo) => tramo.netoATransferirEmpresas,
    ),
    ingresoPropio: sumar(tramos, (tramo) => tramo.ingresoPropio),
  }

  const columnas: ColumnaContable<PuntoSerieTemporal>[] = [
    {
      clave: 'tramo',
      titulo: 'Tramo',
      // La fecha es el COMIENZO del tramo, no un rango: bajo agrupación
      // semanal, "2026-08-03" es la semana que arranca ahí. Sin decirlo, se lee
      // como si fuera un solo día.
      unidad: 'comienza (AAAA-MM-DD)',
      alinear: 'izquierda',
      celda: (fila) => formatearFechaISO(fila.periodo),
    },
    {
      clave: 'ventas-registradas',
      titulo: 'Ventas registradas',
      unidad: 'ventas',
      ancho: 96,
      celda: (fila) => formatearEntero(fila.ventasTotales),
      total: formatearEntero(totales.ventasTotales),
    },
    {
      clave: 'ventas-liquidables',
      titulo: 'Ventas liquidables',
      unidad: 'ventas',
      ancho: 96,
      celda: (fila) => formatearEntero(fila.ventasLiquidables),
      total: formatearEntero(totales.ventasLiquidables),
    },
    {
      clave: 'pasajes',
      titulo: 'Pasajes',
      unidad: 'Gs.',
      ancho: 112,
      celda: (fila) => formatearGuaranies(fila.pasajes),
      total: formatearGuaranies(totales.pasajes),
    },
    {
      clave: 'cargo-servicio',
      titulo: 'Cargo por servicio',
      unidad: 'Gs.',
      ancho: 112,
      celda: (fila) => formatearGuaranies(fila.cargoServicio),
      total: formatearGuaranies(totales.cargoServicio),
    },
    {
      clave: 'cobrado-al-cliente',
      titulo: 'Cobrado al cliente',
      unidad: 'Gs.',
      ancho: 118,
      celda: (fila) => (
        <span className='font-semibold'>
          {formatearGuaranies(fila.cobradoAlCliente)}
        </span>
      ),
      total: formatearGuaranies(totales.cobradoAlCliente),
    },
    {
      clave: 'comision',
      titulo: 'Comisión',
      unidad: 'Gs.',
      ancho: 112,
      celda: (fila) => formatearGuaranies(fila.comision),
      total: formatearGuaranies(totales.comision),
    },
    // Cobrado al cliente es lo que entró; estas dos son cómo se repartió. Sin
    // ellas la evolución dice cuánto se movió y no de quién es.
    {
      clave: 'neto-empresas',
      titulo: 'Neto a las empresas',
      unidad: 'Gs.',
      ancho: 118,
      celda: (fila) => formatearGuaranies(fila.netoATransferirEmpresas),
      total: formatearGuaranies(totales.netoATransferirEmpresas),
    },
    {
      clave: 'ingreso-propio',
      titulo: 'Ingreso propio',
      unidad: 'Gs.',
      ancho: 112,
      celda: (fila) => formatearGuaranies(fila.ingresoPropio),
      total: formatearGuaranies(totales.ingresoPropio),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={tramos}
      claveFila={(fila) => fila.periodo}
      rotuloTotales={rotuloDeLosTotales(listados, totalDelPeriodo)}
      alcanceTotales={alcanceDeLosTotales(listados, totalDelPeriodo)}
      // Lo que se le cobró al cliente en todo el período: es la única de las
      // columnas que es un importe cobrado y no un reparto de ese importe.
      sonImporte={totales.cobradoAlCliente}
      descripcion={`Evolución del período agrupada por ${agrupacion}: ventas registradas y liquidables, pasajes, cargo por servicio, cobrado al cliente, comisión, neto a las empresas e ingreso propio de cada tramo`}
      mensajeVacio='El período no tiene movimientos en ningún tramo.'
    />
  )
}
