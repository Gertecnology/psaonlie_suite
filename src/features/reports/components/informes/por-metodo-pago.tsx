import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { ETIQUETAS_METODO_PAGO } from '@/lib/metodo-pago'
import { informePorRuta } from '../../models/informe.model'
import {
  etiquetaMetodoPago,
  type FilaMetodoPago,
  type InformePorMetodoPago,
} from '../../models/por-metodo-pago.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('por-metodo-pago')!

/**
 * Which way of collecting works best.
 *
 * Two figures per method, and they are not the same question: `cobradoAlCliente`
 * is the volume that moved through it, `ingresoPropio` is what stayed with us.
 * A method can carry most of the volume and leave the least income, which is
 * exactly what a report ordered by volume alone hides.
 *
 * `tasaConcrecion` is the third: sales started against sales that ended up
 * collected. A method that starts a hundred and finishes twelve is not a small
 * method, it is a broken one.
 */
export function InformePorMetodoPago() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  const { data, isLoading, error } = useInforme<InformePorMetodoPago>(
    DEFINICION.ruta,
    aplicados,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      // El filtro por método cambia el universo del informe: sin decirlo en el
      // encabezado, un informe de un solo método impreso es indistinguible de
      // uno de todos con un solo método activo.
      filtrosDescritos={
        aplicados.metodoPago
          ? [
              {
                etiqueta: 'Método de pago',
                valor: ETIQUETAS_METODO_PAGO[aplicados.metodoPago],
              },
            ]
          : undefined
      }
      isLoading={isLoading}
      error={error}
      onGenerar={generar}
      onExportar={() => void exportarInformes(aplicados)}
      puedeGenerar={puedeGenerar}
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    >
      <FiltrosInformeControles
        borrador={borrador}
        onCambiar={cambiar}
        extras={['metodoPago']}
      />
    </MarcoInforme>
  )
}

function Cuerpo({ datos }: { datos: InformePorMetodoPago }) {
  if (datos.data.length === 0) {
    return (
      <p className='text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm'>
        El período no registra ventas cobradas por ningún método de pago.
      </p>
    )
  }

  const totales = calcularTotales(datos.data)

  return (
    <section>
      <table className='w-full text-sm'>
        <caption className='sr-only'>
          Cobrado al cliente, ingreso propio y tasa de concreción de cada método
          de pago del período
        </caption>
        <thead>
          <tr className='border-b text-left'>
            <th scope='col' className='py-2'>
              Método
            </th>
            <Encabezado titulo='Concretadas' unidad='ventas' />
            <Encabezado titulo='Iniciadas' unidad='ventas' />
            <Encabezado titulo='Tasa de concreción' unidad='%' />
            <Encabezado titulo='Cobrado al cliente' unidad='PYG' />
            <Encabezado titulo='Ingreso propio' unidad='PYG' />
            <Encabezado titulo='Participación' unidad='% del cobrado' />
            <Encabezado titulo='Cobradas sin boleto' unidad='ventas' />
          </tr>
        </thead>
        <tbody>
          {datos.data.map((fila) => (
            <tr key={fila.metodoPago} className='border-b last:border-0'>
              <th scope='row' className='py-2 text-left font-medium'>
                {etiquetaMetodoPago(fila.metodoPago)}
              </th>
              <Celda>{formatearEntero(fila.ventasLiquidables)}</Celda>
              <Celda>{formatearEntero(fila.ventasTotales)}</Celda>
              <Celda>{formatearPorcentaje(fila.tasaConcrecion)}</Celda>
              <Celda>{formatearGuaranies(fila.cobradoAlCliente)}</Celda>
              <Celda>{formatearGuaranies(fila.ingresoPropio)}</Celda>
              <Celda>{formatearPorcentaje(fila.participacion)}</Celda>
              <Celda>
                {fila.pagadasSinBoletoCantidad === 0 ? (
                  <span className='text-muted-foreground'>—</span>
                ) : (
                  <span className='text-destructive font-semibold'>
                    {formatearEntero(fila.pagadasSinBoletoCantidad)}
                    <span className='sr-only'>
                      {' '}
                      ventas cobradas al cliente sin pasaje entregado
                    </span>
                  </span>
                )}
              </Celda>
            </tr>
          ))}
        </tbody>
        {/* El pie va en `tfoot` y no en una fila más del cuerpo: la hoja de
            impresión lo repite al final de cada página. */}
        <tfoot>
          <tr className='border-t-2 font-medium'>
            <th scope='row' className='py-2 text-left'>
              Total del período
            </th>
            <Celda>{formatearEntero(totales.ventasLiquidables)}</Celda>
            <Celda>{formatearEntero(totales.ventasTotales)}</Celda>
            <Celda>{formatearPorcentaje(totales.tasaConcrecion)}</Celda>
            <Celda>{formatearGuaranies(totales.cobradoAlCliente)}</Celda>
            <Celda>{formatearGuaranies(totales.ingresoPropio)}</Celda>
            <Celda>{formatearPorcentaje(totales.participacion)}</Celda>
            <Celda>{formatearEntero(totales.pagadasSinBoletoCantidad)}</Celda>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}

/**
 * Totals for the footer.
 *
 * They are summed here and not read off the response because this endpoint
 * returns no totals object — and it can be done honestly only because the
 * report is **not paginated**: `data` is every method of the period, so the sum
 * of the rows on screen is the sum of the period. The same shortcut on a
 * paginated report would state a page as if it were the whole.
 *
 * The two rates are recomputed, never averaged: the mean of per-method rates
 * weighs a method with three sales the same as one with three hundred.
 */
function calcularTotales(filas: FilaMetodoPago[]) {
  const totales = filas.reduce(
    (acumulado, fila) => ({
      ventasLiquidables: acumulado.ventasLiquidables + fila.ventasLiquidables,
      ventasTotales: acumulado.ventasTotales + fila.ventasTotales,
      cobradoAlCliente: acumulado.cobradoAlCliente + fila.cobradoAlCliente,
      ingresoPropio: acumulado.ingresoPropio + fila.ingresoPropio,
      participacion: acumulado.participacion + fila.participacion,
      pagadasSinBoletoCantidad:
        acumulado.pagadasSinBoletoCantidad + fila.pagadasSinBoletoCantidad,
    }),
    {
      ventasLiquidables: 0,
      ventasTotales: 0,
      cobradoAlCliente: 0,
      ingresoPropio: 0,
      participacion: 0,
      pagadasSinBoletoCantidad: 0,
    },
  )

  return {
    ...totales,
    tasaConcrecion:
      totales.ventasTotales === 0
        ? 0
        : (totales.ventasLiquidables / totales.ventasTotales) * 100,
  }
}

function Encabezado({ titulo, unidad }: { titulo: string; unidad: string }) {
  return (
    <th scope='col' className='py-2 text-right' data-tipo='monto'>
      {titulo}
      {/* La unidad va declarada en el encabezado: "Cobrado 1.240" no dice si
          son guaraníes o ventas, y un informe archivado no tiene contexto. */}
      <span className='text-muted-foreground block text-xs font-normal'>
        {unidad}
      </span>
    </th>
  )
}

function Celda({ children }: { children: React.ReactNode }) {
  return (
    <td className='py-2 text-right tabular-nums' data-tipo='monto'>
      {children}
    </td>
  )
}
