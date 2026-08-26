import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { METODOS_PAGO, ETIQUETAS_METODO_PAGO } from '@/lib/metodo-pago'
import { useAgenciasPanel } from '@/features/dashboard/hooks/use-agencias-panel'
import type { FiltrosInforme } from '../models/informe.model'

/** Select value meaning "no filter". */
const TODAS = 'all'

interface FiltrosInformeProps {
  borrador: FiltrosInforme
  onCambiar: <K extends keyof FiltrosInforme>(
    clave: K,
    valor: FiltrosInforme[K],
  ) => void
  /** Extra filters this particular report offers. */
  extras?: Array<'metodoPago' | 'agruparPor' | 'comparativo'>
}

/**
 * Period and agency, plus whatever else the report accepts.
 *
 * Native date inputs on purpose: they take `YYYY-MM-DD` — exactly the format
 * the API demands, which rejects ISO timestamps with a zone — and they carry
 * their own keyboard handling and locale-aware display. A custom picker here
 * would only add a conversion step that can get the format wrong.
 */
export function FiltrosInformeControles({
  borrador,
  onCambiar,
  extras = [],
}: FiltrosInformeProps) {
  const { data: agencias } = useAgenciasPanel()

  return (
    <>
      <Campo etiqueta='Desde' htmlFor='filtro-desde'>
        <Input
          id='filtro-desde'
          type='date'
          className='h-9 w-[160px]'
          value={borrador.desde ?? ''}
          // `max` evita el rango invertido en el propio control, en vez de
          // dejar que el servidor lo rechace después de un viaje de ida y vuelta.
          max={borrador.hasta}
          onChange={(evento) =>
            onCambiar('desde', evento.target.value || undefined)
          }
        />
      </Campo>

      <Campo etiqueta='Hasta' htmlFor='filtro-hasta'>
        <Input
          id='filtro-hasta'
          type='date'
          className='h-9 w-[160px]'
          value={borrador.hasta ?? ''}
          min={borrador.desde}
          onChange={(evento) =>
            onCambiar('hasta', evento.target.value || undefined)
          }
        />
      </Campo>

      <Campo etiqueta='Empresa' htmlFor='filtro-agencia'>
        <Select
          value={borrador.agenciaId ?? TODAS}
          onValueChange={(valor) =>
            onCambiar('agenciaId', valor === TODAS ? undefined : valor)
          }
        >
          <SelectTrigger id='filtro-agencia' className='h-9 w-[200px]'>
            <SelectValue placeholder='Todas' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas las empresas</SelectItem>
            {(agencias ?? []).map((agencia) => (
              <SelectItem key={agencia.id} value={agencia.id}>
                {agencia.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      {extras.includes('metodoPago') && (
        <Campo etiqueta='Método de pago' htmlFor='filtro-metodo'>
          <Select
            value={borrador.metodoPago ?? TODAS}
            onValueChange={(valor) =>
              onCambiar(
                'metodoPago',
                valor === TODAS
                  ? undefined
                  : (valor as FiltrosInforme['metodoPago']),
              )
            }
          >
            <SelectTrigger id='filtro-metodo' className='h-9 w-[180px]'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todos los métodos</SelectItem>
              {METODOS_PAGO.map((metodo) => (
                <SelectItem key={metodo} value={metodo}>
                  {ETIQUETAS_METODO_PAGO[metodo]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      )}

      {extras.includes('agruparPor') && (
        <Campo etiqueta='Agrupar por' htmlFor='filtro-agrupar'>
          <Select
            value={borrador.agruparPor ?? 'dia'}
            onValueChange={(valor) =>
              onCambiar('agruparPor', valor as FiltrosInforme['agruparPor'])
            }
          >
            <SelectTrigger id='filtro-agrupar' className='h-9 w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='dia'>Día</SelectItem>
              <SelectItem value='semana'>Semana</SelectItem>
              <SelectItem value='mes'>Mes</SelectItem>
            </SelectContent>
          </Select>
        </Campo>
      )}

      {extras.includes('comparativo') && (
        <>
          <Campo etiqueta='Comparar desde' htmlFor='filtro-comp-desde'>
            <Input
              id='filtro-comp-desde'
              type='date'
              className='h-9 w-[160px]'
              value={borrador.comparativoDesde ?? ''}
              max={borrador.comparativoHasta}
              onChange={(evento) =>
                onCambiar('comparativoDesde', evento.target.value || undefined)
              }
            />
          </Campo>
          <Campo etiqueta='Comparar hasta' htmlFor='filtro-comp-hasta'>
            <Input
              id='filtro-comp-hasta'
              type='date'
              className='h-9 w-[160px]'
              value={borrador.comparativoHasta ?? ''}
              min={borrador.comparativoDesde}
              onChange={(evento) =>
                onCambiar('comparativoHasta', evento.target.value || undefined)
              }
            />
          </Campo>
        </>
      )}
    </>
  )
}

function Campo({
  etiqueta,
  htmlFor,
  children,
}: {
  etiqueta: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1'>
      <Label htmlFor={htmlFor} className='text-xs'>
        {etiqueta}
      </Label>
      {children}
    </div>
  )
}
