import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { informePorRuta } from '../../models/informe.model'
import {
  descripcionClasificacion,
  etiquetaClasificacion,
  type EstadoVentas,
} from '../../models/estado-ventas.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('estado-ventas')!

/**
 * What happened to the sales of the period, and what got stuck halfway.
 *
 * The distribution is the easy half. The half that matters is the three
 * crossings at the top: a sale marked paid with no ticket, a sale marked paid
 * with no approved transaction behind it, and a ticket issued with no payment
 * recorded. None of them can be read off a status count — they are
 * contradictions between tables — and each one is money that moved in one
 * direction and not the other.
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
      onGenerar={generar}
      onExportar={() => void exportarInformes(aplicados)}
      puedeGenerar={puedeGenerar}
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    >
      <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
    </MarcoInforme>
  )
}

function Cuerpo({ datos }: { datos: EstadoVentas }) {
  const { indicadoresCriticos: criticos } = datos

  const indicadores = [
    {
      clave: 'pagadas-sin-boleto',
      titulo: 'Pagadas sin boleto emitido',
      explicacion:
        'El cliente pagó y no recibió su pasaje. Es la más grave de las tres: la plata ya salió de su cuenta.',
      indicador: criticos.pagadasSinBoleto,
      contexto: `${formatearPorcentaje(criticos.pagadasSinBoleto.porcentajeSobrePagadas)} de las ventas cobradas del período`,
    },
    {
      clave: 'sin-transaccion',
      titulo: 'Pagadas sin transacción aprobada',
      explicacion:
        'La venta figura cobrada y la pasarela no tiene ninguna transacción aprobada que la respalde.',
      indicador: criticos.pagadasSinTransaccionAprobada,
    },
    {
      clave: 'boleto-sin-pago',
      titulo: 'Con boleto y sin pago registrado',
      explicacion:
        'Se emitió el pasaje y no hay cobro anotado: viajó alguien que el sistema no sabe si pagó.',
      indicador: criticos.conBoletoSinPagoRegistrado,
    },
  ].filter((fila) => fila.indicador.cantidad > 0)

  return (
    <div className='space-y-6'>
      {/* Los indicadores críticos son filas de una tabla, no tres tarjetas
          dentro de un cartel: son cifras que se comparan entre sí y con el
          reparto de abajo, y comparar se hace en columnas alineadas. */}
      {indicadores.length > 0 && (
        <table className='w-full text-sm'>
          <caption className='sr-only'>
            Indicadores que requieren atención: cruces entre lo cobrado y lo
            entregado que no cierran
          </caption>
          <thead>
            <tr className='border-b text-left'>
              <th scope='col' className='py-2'>
                Requiere atención
              </th>
              <th scope='col' className='py-2 text-right'>
                Ventas
              </th>
              <th scope='col' className='py-2 text-right'>
                Monto
                <span className='text-muted-foreground block text-xs font-normal'>
                  PYG
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {indicadores.map((fila) => (
              <tr key={fila.clave} className='border-b last:border-0'>
                <th scope='row' className='py-2 text-left font-normal'>
                  <span className='text-destructive font-medium'>
                    {fila.titulo}
                  </span>
                  <span className='text-muted-foreground block text-xs'>
                    {fila.explicacion}
                    {fila.contexto && ` · ${fila.contexto}`}
                  </span>
                </th>
                <td
                  className='py-2 text-right tabular-nums'
                  data-tipo='monto'
                >
                  {formatearEntero(fila.indicador.cantidad)}
                </td>
                <td
                  className='py-2 text-right tabular-nums'
                  data-tipo='monto'
                >
                  {formatearGuaranies(fila.indicador.monto)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <section>
        <h3 className='mb-2 font-semibold'>
          Distribución de las {formatearEntero(datos.totalVentas)} ventas del
          período
        </h3>
        <table className='w-full text-sm'>
          <caption className='sr-only'>
            Ventas del período repartidas por clasificación, con el importe
            involucrado en cada una
          </caption>
          <thead>
            <tr className='border-b text-left'>
              <th scope='col' className='py-2'>
                Clasificación
              </th>
              <th scope='col' className='py-2 text-right' data-tipo='monto'>
                Ventas
                <span className='text-muted-foreground block text-xs font-normal'>
                  ventas
                </span>
              </th>
              <th scope='col' className='py-2 text-right' data-tipo='monto'>
                Participación
                <span className='text-muted-foreground block text-xs font-normal'>
                  % del total
                </span>
              </th>
              <th scope='col' className='py-2 text-right' data-tipo='monto'>
                Pasajes
                <span className='text-muted-foreground block text-xs font-normal'>
                  PYG
                </span>
              </th>
              <th scope='col' className='py-2 text-right' data-tipo='monto'>
                Cargo por servicio
                <span className='text-muted-foreground block text-xs font-normal'>
                  PYG
                </span>
              </th>
              <th scope='col' className='py-2 text-right' data-tipo='monto'>
                Comisión
                <span className='text-muted-foreground block text-xs font-normal'>
                  PYG
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {datos.porClasificacion.map((bucket) => (
              <tr key={bucket.clasificacion} className='border-b last:border-0'>
                <th scope='row' className='py-2 text-left font-normal'>
                  <span className={bucket.critico ? 'text-destructive font-medium' : ''}>
                    {etiquetaClasificacion(bucket.clasificacion)}
                  </span>
                  {bucket.critico && (
                    <span className='text-destructive ml-2 text-xs font-medium'>
                      requiere atención
                    </span>
                  )}
                  <span className='text-muted-foreground block text-xs'>
                    {descripcionClasificacion(bucket.clasificacion)}
                  </span>
                </th>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearEntero(bucket.cantidad)}
                </td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearPorcentaje(bucket.porcentaje)}
                </td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearGuaranies(bucket.pasajes)}
                </td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearGuaranies(bucket.cargoServicio)}
                </td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearGuaranies(bucket.comision)}
                </td>
              </tr>
            ))}
            {datos.porClasificacion.length === 0 && (
              <tr>
                <td colSpan={6} className='text-muted-foreground py-6 text-center'>
                  El período no tiene ninguna venta.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}
