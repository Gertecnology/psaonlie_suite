import { AlertTriangle } from 'lucide-react'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import { informePorRuta } from '../../models/informe.model'
import type { ResumenFinanciero } from '../../models/resumen-financiero.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
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

function Cuerpo({ datos }: { datos: ResumenFinanciero }) {
  return (
    <div className='space-y-6'>
      {/* Lo primero, antes que cualquier cifra: si el informe no cierra
          consigo mismo, ninguno de los números de abajo sirve. */}
      {!datos.cuadre.cuadra && (
        <div
          role='alert'
          className='border-destructive/50 text-destructive flex items-start gap-3 rounded-md border p-4'
        >
          <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
          <div className='text-sm'>
            <p className='font-medium'>
              Las cifras de este informe no son coherentes entre sí
            </p>
            <p className='mt-1'>
              Hay un descuadre de{' '}
              <strong>{formatearGuaranies(datos.cuadre.descuadre)}</strong> entre
              lo cobrado menos lo devuelto y el neto del período. Cada cifra se
              calcula por separado en la base, así que esta diferencia significa
              que algo no está bien contado — no la tomes como buena hasta
              revisarla.
            </p>
          </div>
        </div>
      )}

      <section className='grid gap-4 md:grid-cols-3'>
        <Tarjeta
          titulo='Cobrado al cliente'
          total={datos.cobrado.total}
          detalle={[
            ['Pasajes', datos.cobrado.pasajes],
            ['Cargo por servicio', datos.cobrado.cargoServicio],
          ]}
        />
        <Tarjeta
          titulo='A transferir a las empresas'
          total={datos.agencias.netoATransferir}
          detalle={[
            ['Pasajes vendidos', datos.agencias.pasajes],
            ['Comisión descontada', -datos.agencias.comisionDescontada],
          ]}
          nota='La comisión se descuenta de la transferencia. Nunca se le suma al cliente ni se le cobra aparte a la empresa.'
        />
        <Tarjeta
          titulo='Ingreso propio'
          total={datos.propio.total}
          detalle={[
            ['Comisiones', datos.propio.comision],
            ['Cargo por servicio', datos.propio.cargoServicio],
          ]}
        />
      </section>

      <section>
        <h3 className='mb-2 font-semibold'>Volumen</h3>
        <table className='w-full text-sm'>
          <caption className='sr-only'>Volumen de ventas del período</caption>
          <tbody>
            <Fila etiqueta='Ventas liquidables' valor={formatearEntero(datos.volumen.ventasLiquidables)} unidad='ventas' />
            <Fila etiqueta='Boletos vigentes' valor={formatearEntero(datos.volumen.boletosVigentes)} unidad='boletos' />
            <Fila etiqueta='Ticket promedio' valor={formatearGuaranies(datos.volumen.ticketPromedio)} unidad='PYG' />
            <Fila etiqueta='Boletos por venta' valor={datos.volumen.boletosPorVenta.toFixed(2)} unidad='boletos/venta' />
          </tbody>
        </table>
      </section>

      {datos.devoluciones.totalDevueltoAlCliente > 0 && (
        <section>
          <h3 className='mb-2 font-semibold'>Devoluciones</h3>
          <table className='w-full text-sm'>
            <caption className='sr-only'>Devoluciones del período</caption>
            <tbody>
              <Fila etiqueta='Ventas reembolsadas' valor={formatearEntero(datos.devoluciones.ventasReembolsadas)} unidad='ventas' />
              <Fila etiqueta='Boletos anulados' valor={formatearEntero(datos.devoluciones.boletosAnulados)} unidad='boletos' />
              <Fila etiqueta='Devuelto al cliente' valor={formatearGuaranies(datos.devoluciones.totalDevueltoAlCliente)} unidad='PYG' />
            </tbody>
          </table>
        </section>
      )}

      {datos.excluido.length > 0 && (
        <section>
          <h3 className='mb-2 font-semibold'>Fuera de las cifras de arriba</h3>
          {/* Decir qué NO se contó es parte de decir qué se contó: sin esto,
              un total bajo parece una mala semana y no una cola de ventas
              a medio terminar. */}
          <table className='w-full text-sm'>
            <caption className='sr-only'>
              Ventas excluidas del resumen y su motivo
            </caption>
            <thead>
              <tr className='border-b text-left'>
                <th scope='col' className='py-2'>Motivo</th>
                <th scope='col' className='py-2 text-right'>Ventas</th>
                <th scope='col' className='py-2 text-right'>Pasajes (PYG)</th>
              </tr>
            </thead>
            <tbody>
              {datos.excluido.map((bucket) => (
                <tr key={bucket.clasificacion} className='border-b last:border-0'>
                  <td className='py-2'>
                    {bucket.clasificacion}
                    {bucket.critico && (
                      <span className='text-destructive ml-2 text-xs font-medium'>
                        requiere atención
                      </span>
                    )}
                  </td>
                  <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                    {formatearEntero(bucket.cantidad)}
                  </td>
                  <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                    {formatearGuaranies(bucket.pasajes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function Tarjeta({
  titulo,
  total,
  detalle,
  nota,
}: {
  titulo: string
  total: number
  detalle: Array<[string, number]>
  nota?: string
}) {
  return (
    <div className='tarjeta-informe rounded-md border p-4'>
      <h3 className='text-muted-foreground text-sm'>{titulo}</h3>
      <p className='mt-1 text-2xl font-semibold tabular-nums' data-tipo='monto'>
        {formatearGuaranies(total)}
      </p>
      <dl className='mt-3 space-y-1 text-sm'>
        {detalle.map(([etiqueta, valor]) => (
          <div key={etiqueta} className='flex justify-between gap-4'>
            <dt className='text-muted-foreground'>{etiqueta}</dt>
            <dd className='tabular-nums' data-tipo='monto'>
              {formatearGuaranies(valor)}
            </dd>
          </div>
        ))}
      </dl>
      {nota && <p className='text-muted-foreground mt-3 text-xs'>{nota}</p>}
    </div>
  )
}

function Fila({
  etiqueta,
  valor,
  unidad,
}: {
  etiqueta: string
  valor: string
  unidad: string
}) {
  return (
    <tr className='border-b last:border-0'>
      <th scope='row' className='py-2 text-left font-normal'>
        {etiqueta}
      </th>
      <td className='py-2 text-right tabular-nums' data-tipo='monto'>
        {valor}
      </td>
      {/* La unidad va explícita: "Total 12.400" no dice si son guaraníes o
          boletos, y el lector de un informe archivado no tiene cómo saberlo. */}
      <td className='text-muted-foreground w-32 py-2 pl-4 text-xs'>{unidad}</td>
    </tr>
  )
}
