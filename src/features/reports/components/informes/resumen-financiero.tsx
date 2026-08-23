import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { informePorRuta } from '../../models/informe.model'
import type { ResumenFinanciero } from '../../models/resumen-financiero.model'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('resumen-financiero')!

/**
 * Where the money of a period went.
 *
 * It reads the backend's `resumen-financiero`, which the panel never called: it
 * used to assemble this from a generic statistics endpoint and add up the parts
 * itself. Two consequences followed — the figures could disagree with the ones
 * the backend produced elsewhere, and `cuadre` was invisible, so a period whose
 * own numbers did not add up looked exactly like one that did.
 */
export function InformeResumenFinanciero() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  const { data, isLoading, error } = useInforme<ResumenFinanciero>(
    DEFINICION.ruta,
    aplicados
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onGenerar={generar}
      onExportar={() => void exportarInformes(aplicados)}
      puedeGenerar={puedeGenerar}
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    >
      <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
    </MarcoInforme>
  )
}

/**
 * One table, read top to bottom.
 *
 * It was three cards, a warning banner and four separate tables — so the same
 * figure appeared as a headline and again as a row, and the eye had no path
 * through it. A financial summary is read as a statement: what came in, what
 * goes out, what is left, and what was left out of the count.
 *
 * The mismatch is the last row rather than a banner on top. It belongs next to
 * the numbers it invalidates: a warning above the fold is read before there is
 * anything to distrust.
 */
function Cuerpo({ datos }: { datos: ResumenFinanciero }) {
  return (
    <table className='w-full text-sm'>
      <caption className='sr-only'>
        Resumen financiero del período: cobrado al cliente, neto a transferir a
        las empresas, ingreso propio, volumen y ventas excluidas
      </caption>
      <tbody>
        <Grupo titulo='Cobrado al cliente' />
        <Fila
          etiqueta='Pasajes'
          valor={formatearGuaranies(datos.cobrado.pasajes)}
        />
        <Fila
          etiqueta='Cargo por servicio'
          valor={formatearGuaranies(datos.cobrado.cargoServicio)}
        />
        <Fila
          etiqueta='Total'
          valor={formatearGuaranies(datos.cobrado.total)}
          destacada
        />

        <Grupo titulo='A transferir a las empresas' />
        <Fila
          etiqueta='Pasajes vendidos'
          valor={formatearGuaranies(datos.agencias.pasajes)}
        />
        {/* La comisión resta acá y no se le cobra aparte a la empresa: por eso
            va con signo negativo en esta columna y no como una fila propia. */}
        <Fila
          etiqueta='Comisión descontada'
          valor={`−${formatearGuaranies(datos.agencias.comisionDescontada)}`}
        />
        <Fila
          etiqueta='Neto a transferir'
          valor={formatearGuaranies(datos.agencias.netoATransferir)}
          destacada
        />

        <Grupo titulo='Ingreso propio' />
        <Fila
          etiqueta='Comisiones'
          valor={formatearGuaranies(datos.propio.comision)}
        />
        <Fila
          etiqueta='Cargo por servicio'
          valor={formatearGuaranies(datos.propio.cargoServicio)}
        />
        <Fila
          etiqueta='Total'
          valor={formatearGuaranies(datos.propio.total)}
          destacada
        />

        {datos.devoluciones.totalDevueltoAlCliente > 0 && (
          <>
            <Grupo titulo='Devoluciones' />
            <Fila
              etiqueta='Ventas reembolsadas'
              valor={formatearEntero(datos.devoluciones.ventasReembolsadas)}
              unidad='ventas'
            />
            <Fila
              etiqueta='Boletos anulados'
              valor={formatearEntero(datos.devoluciones.boletosAnulados)}
              unidad='boletos'
            />
            <Fila
              etiqueta='Devuelto al cliente'
              valor={formatearGuaranies(
                datos.devoluciones.totalDevueltoAlCliente
              )}
              destacada
            />
          </>
        )}

        <Grupo titulo='Volumen' />
        <Fila
          etiqueta='Ventas liquidables'
          valor={formatearEntero(datos.volumen.ventasLiquidables)}
          unidad='ventas'
        />
        <Fila
          etiqueta='Boletos vigentes'
          valor={formatearEntero(datos.volumen.boletosVigentes)}
          unidad='boletos'
        />
        <Fila
          etiqueta='Ticket promedio'
          valor={formatearGuaranies(datos.volumen.ticketPromedio)}
        />
        <Fila
          etiqueta='Boletos por venta'
          valor={datos.volumen.boletosPorVenta.toFixed(2)}
          unidad='boletos/venta'
        />

        {datos.excluido.length > 0 && (
          <>
            {/* Decir qué NO se contó es parte de decir qué se contó: sin esto,
                un total bajo parece una mala semana y no una cola de ventas a
                medio terminar. */}
            <Grupo titulo='Fuera de las cifras de arriba' />
            {datos.excluido.map((bucket) => (
              <Fila
                key={bucket.clasificacion}
                etiqueta={bucket.clasificacion}
                valor={formatearGuaranies(bucket.pasajes)}
                unidad={`${formatearEntero(bucket.cantidad)} ventas`}
                critica={bucket.critico}
              />
            ))}
          </>
        )}
      </tbody>

      {!datos.cuadre.cuadra && (
        <tfoot>
          <tr className='text-destructive border-t-2'>
            <th scope='row' className='py-2 text-left font-medium'>
              Descuadre del período
              <span className='block text-xs font-normal'>
                Cobrado menos devuelto no coincide con el neto: las cifras de
                arriba no son confiables hasta explicarlo.
              </span>
            </th>
            <td
              className='py-2 text-right font-semibold tabular-nums'
              data-tipo='monto'
            >
              {formatearGuaranies(datos.cuadre.descuadre)}
            </td>
            <td />
          </tr>
        </tfoot>
      )}
    </table>
  )
}

/** Section heading inside the table, so the whole report stays one table. */
function Grupo({ titulo }: { titulo: string }) {
  return (
    <tr>
      <th
        scope='colgroup'
        colSpan={3}
        className='text-muted-foreground pt-5 pb-1 text-left text-xs font-medium tracking-wide uppercase'
      >
        {titulo}
      </th>
    </tr>
  )
}

/**
 * A line of the statement.
 *
 * The unit column carries counts — "ventas", "boletos" — and stays empty for
 * money: `formatearGuaranies` already emits `Gs.`, and repeating `PYG` beside
 * it says the currency twice.
 */
function Fila({
  etiqueta,
  valor,
  unidad,
  destacada = false,
  critica = false,
}: {
  etiqueta: string
  valor: string
  unidad?: string
  /** Subtotal of its group: the figure the reader is looking for. */
  destacada?: boolean
  /** Needs attention, as opposed to a normal exclusion. */
  critica?: boolean
}) {
  return (
    <tr className='border-b last:border-0'>
      <th
        scope='row'
        className={
          destacada
            ? 'py-2 text-left font-medium'
            : 'text-muted-foreground py-2 pl-4 text-left font-normal'
        }
      >
        {etiqueta}
        {critica && (
          <span className='text-destructive ml-2 text-xs'>
            requiere atención
          </span>
        )}
      </th>
      <td
        className={
          destacada
            ? 'py-2 text-right font-semibold tabular-nums'
            : 'py-2 text-right tabular-nums'
        }
        data-tipo='monto'
      >
        {valor}
      </td>
      <td className='text-muted-foreground w-32 py-2 pl-4 text-xs'>
        {unidad ?? ''}
      </td>
    </tr>
  )
}
