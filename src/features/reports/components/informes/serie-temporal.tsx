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
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

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
      // La agrupación cambia qué es una fila. Sin decirlo en el encabezado, un
      // informe semanal impreso es indistinguible de uno diario con pocos días.
      filtrosDescritos={
        data
          ? [{ etiqueta: 'Agrupado por', valor: etiquetaAgrupacion(data.agruparPor) }]
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
        extras={['agruparPor']}
      />
    </MarcoInforme>
  )
}

function Cuerpo({ datos }: { datos: SerieTemporal }) {
  if (datos.data.length === 0) {
    return (
      <p className='text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm'>
        El período no registra ventas en ningún tramo.
      </p>
    )
  }

  const totales = calcularTotales(datos.data)
  const agrupacion = etiquetaAgrupacion(datos.agruparPor).toLowerCase()

  return (
    <section>
      <table className='w-full text-sm'>
        <caption className='sr-only'>
          Evolución del período agrupada por {agrupacion}: ventas, cobrado al
          cliente, neto a las empresas e ingreso propio de cada tramo
        </caption>
        <thead>
          <tr className='border-b text-left'>
            <th scope='col' className='py-2'>
              Tramo
              {/* La fecha es el COMIENZO del tramo, no un rango: bajo
                  agrupación semanal, "2026-08-03" es la semana que arranca
                  ahí. Sin decirlo, se lee como si fuera un solo día. */}
              <span className='text-muted-foreground block text-xs font-normal'>
                comienza (AAAA-MM-DD)
              </span>
            </th>
            <Encabezado titulo='Iniciadas' unidad='ventas' />
            <Encabezado titulo='Concretadas' unidad='ventas' />
            <Encabezado titulo='Cobradas sin boleto' unidad='ventas' />
            <Encabezado titulo='Pasajes' unidad='PYG' />
            <Encabezado titulo='Cargo por servicio' unidad='PYG' />
            <Encabezado titulo='Comisión' unidad='PYG' />
            <Encabezado titulo='Cobrado al cliente' unidad='PYG' />
            <Encabezado titulo='Neto a las empresas' unidad='PYG' />
            <Encabezado titulo='Ingreso propio' unidad='PYG' />
          </tr>
        </thead>
        <tbody>
          {datos.data.map((punto) => (
            <tr key={punto.periodo} className='border-b last:border-0'>
              <th
                scope='row'
                className='py-2 text-left font-medium tabular-nums'
              >
                {formatearFechaISO(punto.periodo)}
              </th>
              <Celda>{formatearEntero(punto.ventasTotales)}</Celda>
              <Celda>{formatearEntero(punto.ventasLiquidables)}</Celda>
              <Celda>
                {punto.pagadasSinBoleto === 0 ? (
                  <span className='text-muted-foreground'>—</span>
                ) : (
                  <span className='text-destructive font-semibold'>
                    {formatearEntero(punto.pagadasSinBoleto)}
                    <span className='sr-only'>
                      {' '}
                      ventas cobradas al cliente sin pasaje entregado
                    </span>
                  </span>
                )}
              </Celda>
              <Celda>{formatearGuaranies(punto.pasajes)}</Celda>
              <Celda>{formatearGuaranies(punto.cargoServicio)}</Celda>
              <Celda>{formatearGuaranies(punto.comision)}</Celda>
              <Celda>{formatearGuaranies(punto.cobradoAlCliente)}</Celda>
              <Celda>{formatearGuaranies(punto.netoATransferirEmpresas)}</Celda>
              <Celda>{formatearGuaranies(punto.ingresoPropio)}</Celda>
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
            <Celda>{formatearEntero(totales.ventasTotales)}</Celda>
            <Celda>{formatearEntero(totales.ventasLiquidables)}</Celda>
            <Celda>{formatearEntero(totales.pagadasSinBoleto)}</Celda>
            <Celda>{formatearGuaranies(totales.pasajes)}</Celda>
            <Celda>{formatearGuaranies(totales.cargoServicio)}</Celda>
            <Celda>{formatearGuaranies(totales.comision)}</Celda>
            <Celda>{formatearGuaranies(totales.cobradoAlCliente)}</Celda>
            <Celda>{formatearGuaranies(totales.netoATransferirEmpresas)}</Celda>
            <Celda>{formatearGuaranies(totales.ingresoPropio)}</Celda>
          </tr>
        </tfoot>
      </table>

      <p className='text-muted-foreground mt-3 max-w-prose text-xs'>
        Cada fila es un tramo de {agrupacion} y la fecha es el día en que
        empieza. Las ventas iniciadas incluyen las que nunca llegaron a
        cobrarse; las concretadas son las que terminaron pagadas y con boletos
        emitidos. El ingreso propio es la comisión más el cargo por servicio: no
        es lo que se le transfiere a la empresa.
      </p>
    </section>
  )
}

/**
 * Totals for the footer.
 *
 * Summed here because the endpoint returns no totals object — and it can be
 * done honestly only because this report is **not paginated**: `data` carries
 * every bucket of the period, so the sum of the rows on screen is the sum of
 * the period. The same shortcut on a paginated report would state a page as if
 * it were the whole.
 */
function calcularTotales(puntos: PuntoSerieTemporal[]) {
  return puntos.reduce(
    (acumulado, punto) => ({
      ventasTotales: acumulado.ventasTotales + punto.ventasTotales,
      ventasLiquidables: acumulado.ventasLiquidables + punto.ventasLiquidables,
      pagadasSinBoleto: acumulado.pagadasSinBoleto + punto.pagadasSinBoleto,
      pasajes: acumulado.pasajes + punto.pasajes,
      cargoServicio: acumulado.cargoServicio + punto.cargoServicio,
      comision: acumulado.comision + punto.comision,
      cobradoAlCliente: acumulado.cobradoAlCliente + punto.cobradoAlCliente,
      netoATransferirEmpresas:
        acumulado.netoATransferirEmpresas + punto.netoATransferirEmpresas,
      ingresoPropio: acumulado.ingresoPropio + punto.ingresoPropio,
    }),
    {
      ventasTotales: 0,
      ventasLiquidables: 0,
      pagadasSinBoleto: 0,
      pasajes: 0,
      cargoServicio: 0,
      comision: 0,
      cobradoAlCliente: 0,
      netoATransferirEmpresas: 0,
      ingresoPropio: 0,
    },
  )
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
