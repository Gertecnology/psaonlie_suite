import { IconBuilding } from '@tabler/icons-react'
import { describirPeriodo } from '@/lib/periodo'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EstadoFiltrosPanel } from '../hooks/use-filtros-panel'
import { useAgenciasPanel } from '../hooks/use-agencias-panel'
import { SelectorRangoFechas } from './selector-rango-fechas'

const TODAS = '__todas__'

interface Props {
  filtros: EstadoFiltrosPanel
  /** Acciones propias de la vista (exportar, etc.). */
  children?: React.ReactNode
}

/**
 * Fila única de filtros, arriba de todo lo que gobierna.
 *
 * Los filtros no viven adentro de cada tarjeta: uno solo alcanza a todo lo que
 * está debajo, así los números de la pantalla siempre hablan del mismo período
 * y del mismo recorte. Si un gráfico necesitara su propio rango, sería otro
 * panel.
 */
export function FiltrosPanel({ filtros, children }: Props) {
  const { data: empresas, isPending } = useAgenciasPanel()

  return (
    <div className='mb-6 flex flex-wrap items-center gap-3'>
      <SelectorRangoFechas
        preset={filtros.preset}
        periodo={filtros.periodo}
        onPreset={filtros.aplicarPreset}
        onRango={filtros.aplicarRango}
      />

      <Select
        value={filtros.agenciaId ?? TODAS}
        onValueChange={(valor) =>
          filtros.aplicarAgencia(valor === TODAS ? undefined : valor)
        }
        disabled={isPending}
      >
        <SelectTrigger className='w-[15rem]' aria-label='Filtrar por empresa'>
          <IconBuilding
            className='text-muted-foreground size-4 shrink-0'
            aria-hidden
          />
          <SelectValue placeholder='Todas las empresas' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas las empresas</SelectItem>
          {empresas?.map((empresa) => (
            <SelectItem key={empresa.id} value={empresa.id}>
              {empresa.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p
        className='text-muted-foreground hidden text-sm lg:block'
        aria-live='polite'
      >
        {describirPeriodo(filtros.periodo)}
      </p>

      {children && <div className='ms-auto flex items-center gap-2'>{children}</div>}
    </div>
  )
}
