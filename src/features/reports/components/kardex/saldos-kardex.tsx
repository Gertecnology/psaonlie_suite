import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowLeft, CheckCircle2, Printer } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/auth-context'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import {
  kardexGenerado,
  type FiltrosKardex,
  type Saldos,
} from '../../models/kardex.model'
import { obtenerSaldos } from '../../services/kardex.service'
import { EncabezadoInforme } from '../encabezado-informe'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import '../informe-imprimible.css'

/**
 * What each company is owed, straight from the ledger.
 *
 * This is the figure the reports compute from `ventas`; here it is the sum of
 * the movements themselves. The two should agree, and when they do not, one of
 * them is wrong — which is exactly what this screen is for. Until phase 3 the
 * reports remain the source of truth; the ledger is the check.
 *
 * A missing entry is a real possibility in phase 1, so `descuadre` is stated
 * before any figure: a ledger that balances gives zero, and anything else means
 * these numbers cannot be trusted yet.
 */
export function SaldosKardex() {
  const { accessToken } = useAuth()
  const { borrador, aplicados, cambiar, generar } = useFiltrosInforme()

  // Los filtros del kardex son los del informe más `acumulado`; el hook de
  // filtros ya resuelve el borrador contra la URL.
  const filtros = aplicados as FiltrosKardex
  const generado = kardexGenerado(filtros)

  const { data, isLoading, error } = useQuery<Saldos>({
    queryKey: ['kardex-saldos', filtros, accessToken],
    queryFn: () => obtenerSaldos<Saldos>(filtros),
    enabled: Boolean(accessToken) && generado,
    staleTime: 60_000,
    retry: 1,
  })

  const [emitidoEn, setEmitidoEn] = React.useState<Date | null>(null)
  React.useEffect(() => {
    if (data && !isLoading) setEmitidoEn(new Date())
  }, [data, isLoading])

  const acumulado = Boolean((borrador as FiltrosKardex).acumulado)
  const puedeGenerar = acumulado || Boolean(borrador.desde && borrador.hasta)

  return (
    <PageLayout
      title='Saldos del kardex'
      description='Lo que se le debe a cada empresa, sumando los movimientos del libro.'
      showSearch={false}
      actions={
        <div className='no-imprimir flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/reports'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Informes
            </Link>
          </Button>
          {data && (
            <Button variant='outline' size='sm' onClick={() => window.print()}>
              <Printer className='mr-2 h-4 w-4' />
              Imprimir
            </Button>
          )}
        </div>
      }
    >
      <div className='no-imprimir mb-6 rounded-md border p-4'>
        <p className='text-muted-foreground mb-4 max-w-prose text-sm'>
          El kardex todavía está en fase de verificación: escribe pero los
          informes no lo leen. Si un saldo de acá no coincide con el del informe
          por empresa, hay un asiento faltante — se recupera corriendo el
          backfill.
        </p>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='space-y-1'>
            <Label htmlFor='kardex-desde' className='text-xs'>
              Desde
            </Label>
            <Input
              id='kardex-desde'
              type='date'
              className='h-9 w-[160px]'
              disabled={acumulado}
              max={borrador.hasta}
              value={borrador.desde ?? ''}
              onChange={(evento) =>
                cambiar('desde', evento.target.value || undefined)
              }
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='kardex-hasta' className='text-xs'>
              Hasta
            </Label>
            <Input
              id='kardex-hasta'
              type='date'
              className='h-9 w-[160px]'
              disabled={acumulado}
              min={borrador.desde}
              value={borrador.hasta ?? ''}
              onChange={(evento) =>
                cambiar('hasta', evento.target.value || undefined)
              }
            />
          </div>

          <div className='flex items-center gap-2 pb-1'>
            <Switch
              id='kardex-acumulado'
              checked={acumulado}
              onCheckedChange={(valor) =>
                cambiar('acumulado' as keyof typeof borrador, valor as never)
              }
            />
            <Label htmlFor='kardex-acumulado' className='text-sm'>
              Saldo acumulado
            </Label>
          </div>

          <Button onClick={generar} disabled={!puedeGenerar || isLoading}>
            {isLoading ? 'Consultando…' : 'Consultar saldos'}
          </Button>
        </div>
        <p className='text-muted-foreground mt-2 text-xs'>
          {acumulado
            ? 'El acumulado ignora el período: es lo que se le debe a cada empresa hasta hoy.'
            : 'Sin acumulado, el saldo es sólo lo que movió el período elegido.'}
        </p>
      </div>

      <div className='informe-imprimible'>
        {!generado ? (
          <p className='text-muted-foreground rounded-md border border-dashed p-12 text-center'>
            Elegí un período —o marcá el acumulado— y consultá los saldos.
          </p>
        ) : isLoading ? (
          <div className='space-y-3'>
            <Skeleton className='h-24 w-full' />
            <Skeleton className='h-64 w-full' />
          </div>
        ) : error ? (
          <div
            role='alert'
            className='border-destructive/50 text-destructive rounded-md border p-6 text-center'
          >
            <p className='font-medium'>No se pudieron obtener los saldos</p>
            <p className='text-muted-foreground mt-1 text-sm'>
              {(error as Error).message}
            </p>
          </div>
        ) : data ? (
          <>
            <EncabezadoInforme
              titulo='Saldos del kardex'
              periodo={
                data.periodo
                  ? { ...data.periodo, dias: 0 }
                  : undefined
              }
              origen='/api/admin/kardex/saldos'
              emitidoEn={emitidoEn ?? new Date()}
              filtros={[
                {
                  etiqueta: 'Alcance',
                  valor: filtros.acumulado
                    ? 'Acumulado desde el inicio'
                    : 'Sólo el período',
                },
              ]}
            />
            <Cuerpo datos={data} />
          </>
        ) : null}
      </div>
    </PageLayout>
  )
}

function Cuerpo({ datos }: { datos: Saldos }) {
  return (
    <div className='space-y-6'>
      {/* Antes que cualquier cifra: si el libro no cierra, ninguna sirve. */}
      {datos.descuadre !== 0 ? (
        <div
          role='alert'
          className='border-destructive/50 text-destructive flex items-start gap-3 rounded-md border p-4'
        >
          <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
          <div className='text-sm'>
            <p className='font-medium'>El libro no cierra</p>
            <p className='mt-1'>
              La suma de todos los movimientos da{' '}
              <strong>{formatearGuaranies(datos.descuadre)}</strong> y tiene que
              dar cero. Hay un asiento roto: los saldos de abajo no son
              confiables hasta explicarlo.
            </p>
          </div>
        </div>
      ) : (
        <div className='flex items-center gap-3 rounded-md border border-green-600/40 p-4 text-green-700 dark:text-green-500'>
          <CheckCircle2 className='h-5 w-5 shrink-0' />
          <p className='text-sm font-medium'>
            El libro cierra: todos los movimientos suman cero.
          </p>
        </div>
      )}

      <section>
        <h3 className='mb-2 font-semibold'>
          A transferir a las empresas
          <span className='ml-2 tabular-nums' data-tipo='monto'>
            {formatearGuaranies(datos.totalAPagarAgencias)}
          </span>
        </h3>
        <table className='w-full text-sm'>
          <caption className='sr-only'>
            Saldo del kardex por empresa, con el detalle de pasajes y comisión
          </caption>
          <thead>
            <tr className='border-b text-left'>
              <th scope='col' className='py-2'>Empresa</th>
              <th scope='col' className='py-2 text-right'>Pasajes<span className='text-muted-foreground block text-xs font-normal'>PYG</span></th>
              <th scope='col' className='py-2 text-right'>Comisión<span className='text-muted-foreground block text-xs font-normal'>PYG</span></th>
              <th scope='col' className='py-2 text-right'>Liquidado<span className='text-muted-foreground block text-xs font-normal'>PYG</span></th>
              <th scope='col' className='py-2 text-right'>A transferir<span className='text-muted-foreground block text-xs font-normal'>PYG</span></th>
              <th scope='col' className='py-2 text-right'>Movimientos</th>
            </tr>
          </thead>
          <tbody>
            {datos.agencias.map((agencia) => (
              <tr key={agencia.agenciaId} className='border-b last:border-0'>
                <th scope='row' className='py-2 text-left font-normal'>
                  {agencia.nombre}
                  {agencia.codigo && (
                    <span className='text-muted-foreground ml-2 font-mono text-xs'>
                      {agencia.codigo}
                    </span>
                  )}
                </th>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearGuaranies(agencia.pasajes)}
                </td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  −{formatearGuaranies(agencia.comision)}
                </td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearGuaranies(agencia.liquidado)}
                </td>
                <td className='py-2 text-right font-medium tabular-nums' data-tipo='monto'>
                  {formatearGuaranies(agencia.netoAPagar)}
                </td>
                <td className='text-muted-foreground py-2 text-right tabular-nums'>
                  {formatearEntero(agencia.movimientos)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='border-t-2 font-medium'>
              <th scope='row' className='py-2 text-left'>Total</th>
              <td colSpan={3} />
              <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                {formatearGuaranies(datos.totalAPagarAgencias)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </section>

      <section>
        <h3 className='mb-2 font-semibold'>Cuentas propias</h3>
        <table className='w-full text-sm'>
          <caption className='sr-only'>
            Saldo de las cuentas propias: comisiones, cargo por servicio y cajas
          </caption>
          <thead>
            <tr className='border-b text-left'>
              <th scope='col' className='py-2'>Cuenta</th>
              <th scope='col' className='py-2'>Tipo</th>
              <th scope='col' className='py-2 text-right'>
                Saldo
                <span className='text-muted-foreground block text-xs font-normal'>PYG</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {datos.propias.map((cuenta) => (
              <tr key={cuenta.codigo} className='border-b last:border-0'>
                <th scope='row' className='py-2 text-left font-normal'>
                  {cuenta.nombre}
                  <span className='text-muted-foreground ml-2 font-mono text-xs'>
                    {cuenta.codigo}
                  </span>
                </th>
                <td className='text-muted-foreground py-2'>{cuenta.tipo}</td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatearGuaranies(cuenta.saldo)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
