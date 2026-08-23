import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { informePorRuta } from '../../models/informe.model'
import {
  descripcionClasificacion,
  etiquetaClasificacion,
  type EstadoVentas,
  type IndicadorCritico,
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
      {/* Antes que la distribución, igual que el descuadre en el resumen
          financiero: si algo de esto tiene filas, es lo único que hay que
          mirar hoy — el reparto por estado puede esperar. */}
      {indicadores.length > 0 ? (
        <section className='border-destructive/50 space-y-4 rounded-md border p-4'>
          {/* La alerta es el enunciado, no la grilla: `role='alert'` sobre la
              sección entera haría que un lector de pantalla recitara las tres
              tarjetas completas de un tirón. */}
          <div role='alert' className='text-destructive flex items-start gap-3'>
            <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
            <div className='text-sm'>
              <p className='font-medium'>
                {indicadores.length === 1
                  ? 'Hay un indicador que requiere atención'
                  : `Hay ${formatearEntero(indicadores.length)} indicadores que requieren atención`}
              </p>
              <p className='mt-1'>
                Son cruces entre lo cobrado y lo entregado que no cierran. No
                salen del estado de la venta: hay que ir a mirarlos a mano.
              </p>
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            {indicadores.map((fila) => (
              <TarjetaCritica
                key={fila.clave}
                titulo={fila.titulo}
                explicacion={fila.explicacion}
                indicador={fila.indicador}
                contexto={fila.contexto}
              />
            ))}
          </div>
        </section>
      ) : (
        // Que no haya ninguno también es un resultado del informe, y hay que
        // decirlo: el silencio se confunde con "todavía no se calculó".
        <p className='text-muted-foreground flex items-center gap-2 rounded-md border p-4 text-sm'>
          <CheckCircle2 className='h-4 w-4 shrink-0' />
          Sin indicadores críticos en el período: no hay ventas cobradas sin
          boleto, sin transacción aprobada ni boletos sin pago registrado.
        </p>
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

function TarjetaCritica({
  titulo,
  explicacion,
  indicador,
  contexto,
}: {
  titulo: string
  explicacion: string
  indicador: IndicadorCritico
  contexto?: string
}) {
  return (
    <div className='tarjeta-informe border-destructive/30 rounded-md border p-4'>
      <h4 className='text-sm font-medium'>{titulo}</h4>
      <p className='text-destructive mt-1 text-2xl font-semibold tabular-nums' data-tipo='monto'>
        {formatearEntero(indicador.cantidad)}
      </p>
      <p className='text-muted-foreground text-xs'>ventas</p>
      <dl className='mt-3 space-y-1 text-sm'>
        <div className='flex justify-between gap-4'>
          <dt className='text-muted-foreground'>Monto</dt>
          <dd className='tabular-nums' data-tipo='monto'>
            {formatearGuaranies(indicador.monto)}
          </dd>
        </div>
        <div className='flex justify-between gap-4'>
          {/* La antigüedad convierte "hay 33 casos" en "el más viejo lleva dos
              semanas", que es lo que decide si esto se mira hoy o el lunes. */}
          <dt className='text-muted-foreground'>Más antigua</dt>
          <dd>
            {indicador.desde ? (
              <time dateTime={indicador.desde}>
                {formatearFechaISO(indicador.desde)}
              </time>
            ) : (
              '—'
            )}
          </dd>
        </div>
      </dl>
      {contexto && (
        <p className='text-muted-foreground mt-2 text-xs'>{contexto}</p>
      )}
      <p className='text-muted-foreground mt-3 text-xs'>{explicacion}</p>
    </div>
  )
}
