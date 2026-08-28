import * as React from 'react'
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

/** Valor del select que significa «sin filtrar». */
const TODAS = 'all'

interface FiltrosInformeProps {
  borrador: FiltrosInforme
  onCambiar: <K extends keyof FiltrosInforme>(
    clave: K,
    valor: FiltrosInforme[K],
  ) => void
  /** Los que este informe acepta además del período y la empresa. */
  extras?: Array<'metodoPago' | 'agruparPor' | 'comparativo'>
}

/**
 * Los controles de la barra de arriba.
 *
 * Van fuera de la hoja: el informe emitido lleva los filtros **aplicados** en
 * su ficha técnica, no los controles. Por eso son compactos y de una sola
 * línea — comparten fila con el título y con el botón de exportar.
 *
 * Los campos de fecha son nativos a propósito: toman `YYYY-MM-DD`, que es
 * exactamente el formato que la API exige y que rechaza si viene con zona
 * horaria. Un date picker propio sólo agregaría un paso de conversión que
 * puede equivocar el formato.
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
          className='h-[30px] w-[130px] rounded-none px-2 text-xs tabular-nums'
          value={borrador.desde ?? ''}
          // `max` evita el rango invertido en el propio control, en vez de
          // dejar que el servidor lo rechace tras un viaje de ida y vuelta.
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
          className='h-[30px] w-[130px] rounded-none px-2 text-xs tabular-nums'
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
          <SelectTrigger
            id='filtro-agencia'
            className='h-[30px] w-[170px] rounded-none px-2 text-xs'
          >
            <SelectValue placeholder='Todas' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas</SelectItem>
            {(agencias ?? []).map((agencia) => (
              <SelectItem key={agencia.id} value={agencia.id}>
                {agencia.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      {extras.includes('metodoPago') && (
        <Campo etiqueta='Medio de cobro' htmlFor='filtro-metodo'>
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
            <SelectTrigger
              id='filtro-metodo'
              className='h-[30px] w-[150px] rounded-none px-2 text-xs'
            >
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todos</SelectItem>
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
            <SelectTrigger
              id='filtro-agrupar'
              className='h-[30px] w-[110px] rounded-none px-2 text-xs'
            >
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
              className='h-[30px] w-[130px] rounded-none px-2 text-xs tabular-nums'
              value={borrador.comparativoDesde ?? ''}
              max={borrador.comparativoHasta}
              onChange={(evento) =>
                onCambiar('comparativoDesde', evento.target.value || undefined)
              }
            />
          </Campo>
          <Campo etiqueta='hasta' htmlFor='filtro-comp-hasta'>
            <Input
              id='filtro-comp-hasta'
              type='date'
              className='h-[30px] w-[130px] rounded-none px-2 text-xs tabular-nums'
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

/**
 * Etiqueta y control en una línea.
 *
 * `<label>` y no un `<span>`: el nombre del campo tiene que llegarle a un
 * lector de pantalla, y en una barra tan compacta no hay lugar para repetirlo
 * como texto de ayuda.
 */
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
    <div className='flex items-center gap-1.5'>
      <label htmlFor={htmlFor} className='text-muted-foreground text-[11px]'>
        {etiqueta}
      </label>
      {children}
    </div>
  )
}
