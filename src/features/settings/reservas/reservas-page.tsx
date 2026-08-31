import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGuardarTiemposDeReserva,
  useTiemposDeReserva,
} from './use-tiempos-de-reserva'
import type { TiemposDeReserva } from './tiempos-de-reserva.service'

/**
 * Configuración · Reservas.
 *
 * Cuánto tiempo se le guardan las butacas a quien está vendiendo. Los tres
 * valores editables son decisiones nuestras y valen para toda la operación: no
 * tienen por qué variar entre transportistas, y tenerlos desparejos sólo
 * produce vendedores con ventanas distintas sin ninguna razón.
 *
 * El bloqueo de cada empresa va como tabla de consulta. Ponerlo editable invita
 * a subirlo pensando que se gana tiempo, y lo único que se gana es que nuestro
 * reloj mienta: la butaca ya se soltó del otro lado.
 *
 * Hasta ahora esta pantalla no existía. Los valores estaban en la base y
 * ajustarlos requería entrar a mano.
 */

const VACIOS: TiemposDeReserva = {
  margenEmisionMinutos: 3,
  renovacionesMaximas: 2,
  inactividadMinutos: 10,
}

function CampoDeMinutos({
  etiqueta,
  unidad,
  valor,
  onChange,
  explicacion,
  min,
  max,
}: {
  etiqueta: string
  unidad: string
  valor: number
  onChange: (valor: number) => void
  explicacion: string
  min: number
  max: number
}) {
  return (
    <div className='border-border border-t py-4 first:border-t-0 first:pt-0'>
      <div className='flex flex-wrap items-center gap-3'>
        <label className='min-w-[15rem] flex-1 text-[13px] font-medium'>
          {etiqueta}
        </label>
        <Input
          type='number'
          min={min}
          max={max}
          value={valor}
          onChange={(evento) => onChange(Number(evento.target.value))}
          className='h-9 w-20 tabular-nums'
          aria-label={etiqueta}
        />
        <span className='text-muted-foreground w-[11rem] text-[13px]'>
          {unidad}
        </span>
      </div>
      <p className='text-muted-foreground mt-1.5 max-w-[62ch] text-[12px] leading-relaxed'>
        {explicacion}
      </p>
    </div>
  )
}

export function ReservasPage() {
  const { data, isLoading } = useTiemposDeReserva()
  const guardar = useGuardarTiemposDeReserva()

  const [tiempos, setTiempos] = useState<TiemposDeReserva>(VACIOS)

  useEffect(() => {
    if (data?.tiempos) setTiempos(data.tiempos)
  }, [data?.tiempos])

  const cambio =
    !!data?.tiempos &&
    (Object.keys(tiempos) as (keyof TiemposDeReserva)[]).some(
      (campo) => tiempos[campo] !== data.tiempos[campo]
    )

  // El cálculo en vivo evita que alguien ponga margen 9 sobre bloqueo 10 y
  // deje a los vendedores con un minuto para cobrar.
  const referencia = data?.empresas[0]
  const bloqueo = referencia?.bloqueoButacasMinutos ?? 10
  const ventana = Math.max(bloqueo - tiempos.margenEmisionMinutos, 1)
  const total = bloqueo * (1 + tiempos.renovacionesMaximas)

  if (isLoading) {
    return (
      <div className='max-w-3xl space-y-4'>
        <Skeleton className='h-48 w-full rounded-xl' />
        <Skeleton className='h-40 w-full rounded-xl' />
      </div>
    )
  }

  return (
    <div className='max-w-3xl space-y-4'>
      <div className='flex flex-wrap items-start gap-3'>
        <div className='min-w-0 flex-1'>
          <h2 className='text-lg font-semibold tracking-tight'>Reservas</h2>
          <p className='text-muted-foreground mt-0.5 text-[13px]'>
            Cuánto tiempo se le guardan las butacas a quien está vendiendo.
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={!cambio || guardar.isPending}
            onClick={() => data?.tiempos && setTiempos(data.tiempos)}
          >
            Cancelar
          </Button>
          <Button
            size='sm'
            disabled={!cambio || guardar.isPending}
            onClick={() => guardar.mutate(tiempos)}
          >
            {guardar.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </div>

      <div className='border-border rounded-xl border p-4'>
        <h3 className='text-[13px] font-semibold'>Los tiempos</h3>
        <p className='text-muted-foreground mt-0.5 mb-3 text-[12px]'>
          Valen para todas las empresas.
        </p>

        <CampoDeMinutos
          etiqueta='Margen para emitir el boleto'
          unidad='minutos'
          min={1}
          max={30}
          valor={tiempos.margenEmisionMinutos}
          onChange={(valor) =>
            setTiempos((antes) => ({ ...antes, margenEmisionMinutos: valor }))
          }
          explicacion='Lo que nos guardamos dentro de la ventana de la transportista para el callback de la pasarela, el procesamiento y la emisión.'
        />

        <CampoDeMinutos
          etiqueta='Volver a pedir la butaca'
          unidad='veces antes de soltarla'
          min={0}
          max={10}
          valor={tiempos.renovacionesMaximas}
          onChange={(valor) =>
            setTiempos((antes) => ({ ...antes, renovacionesMaximas: valor }))
          }
          explicacion='El tiempo de bloqueo lo decide la transportista y no se puede estirar. Lo que sí podemos es volver a pedir la butaca antes de que la ventana se venza: esto es lo que da tiempo de verdad.'
        />

        <CampoDeMinutos
          etiqueta='Dejar de renovar tras'
          unidad='minutos sin actividad'
          min={1}
          max={120}
          valor={tiempos.inactividadMinutos}
          onChange={(valor) =>
            setTiempos((antes) => ({ ...antes, inactividadMinutos: valor }))
          }
          explicacion='Mientras el vendedor trabaja, la reserva se renueva sola. Si deja la pantalla abierta y se va, dejamos de pedir más tiempo. La ventana en curso igual sigue.'
        />

        <p className='border-border text-muted-foreground mt-3 border-t pt-3 text-[12.5px] leading-relaxed'>
          Con una empresa que bloquea {bloqueo} minutos, el vendedor tendrá{' '}
          <b className='text-foreground font-semibold'>
            {ventana} {ventana === 1 ? 'minuto' : 'minutos'}
          </b>{' '}
          por ventana, renovada sola mientras esté trabajando, y hasta{' '}
          <b className='text-foreground font-semibold'>{total} minutos</b> en
          total.
        </p>
      </div>

      <div className='border-border rounded-xl border p-4'>
        <h3 className='text-[13px] font-semibold'>
          Lo que define cada transportista
        </h3>
        <p className='text-muted-foreground mt-0.5 mb-3 text-[12px]'>
          Sólo para consultar. Es el dato de ellos, no una palanca nuestra.
        </p>

        <table className='w-full text-left text-[12.5px]'>
          <thead>
            <tr className='border-border text-muted-foreground border-b text-[10px] font-semibold tracking-[0.08em] uppercase'>
              <th className='py-1.5 pr-3 font-semibold'>Empresa</th>
              <th className='py-1.5 pr-3 text-right font-semibold'>Bloqueo</th>
              <th className='py-1.5 pr-3 text-right font-semibold'>
                Ventana de pago
              </th>
              <th className='py-1.5 text-right font-semibold'>Total</th>
            </tr>
          </thead>
          <tbody>
            {(data?.empresas ?? []).map((empresa) => (
              <tr key={empresa.id} className='border-border border-b'>
                <td className='py-2 pr-3'>{empresa.nombre}</td>
                <td className='py-2 pr-3 text-right tabular-nums'>
                  {empresa.bloqueoButacasMinutos} min
                </td>
                <td className='py-2 pr-3 text-right tabular-nums'>
                  {empresa.ventanaPagoMinutos} min
                </td>
                <td className='py-2 text-right tabular-nums'>
                  {empresa.ventanaTotalMinutos} min
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className='border-estado-atencion/50 bg-estado-atencion/10 mt-3 flex gap-2.5 rounded-lg border px-3 py-2.5'>
          <AlertTriangle className='text-estado-atencion mt-px h-4 w-4 flex-none' />
          <div className='text-[12.5px]'>
            <p className='font-semibold'>Esto no lo decidimos nosotros</p>
            <p className='text-muted-foreground mt-0.5 leading-relaxed'>
              Cada transportista lo define en su instalación y puede cambiarlo
              sin avisar. Si acá dice {bloqueo} y ellos bajaron a la mitad,
              vendemos butacas que ya se soltaron.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
