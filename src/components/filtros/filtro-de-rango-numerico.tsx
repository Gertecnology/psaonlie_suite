import { Input } from '@/components/ui/input'
import { CampoDeFiltro } from './campo-de-filtro'

interface FiltroDeRangoNumericoProps {
  id: string
  etiqueta: string
  minimo?: number
  maximo?: number
  onCambiar: (rango: { minimo?: number; maximo?: number }) => void
  placeholderMinimo?: string
  placeholderMaximo?: string
  className?: string
}

/**
 * Un rango de números: mínimo y máximo, los dos inclusive.
 *
 * El campo vacío se emite como `undefined` y el cero como `0`. Son cosas
 * distintas: «sin mínimo» trae todo, «desde 0» también incluye las ventas en
 * cero pero es una decisión tomada, y quien la tomó tiene que ver su filtro
 * aplicado. Por eso se compara contra la cadena vacía y no por verdad — con
 * `Number(texto) || undefined` el cero se convertiría en «sin filtro».
 */
export function FiltroDeRangoNumerico({
  id,
  etiqueta,
  minimo,
  maximo,
  onCambiar,
  placeholderMinimo = 'Mín.',
  placeholderMaximo = 'Máx.',
  className,
}: FiltroDeRangoNumericoProps) {
  const leer = (texto: string): number | undefined =>
    texto.trim() === '' ? undefined : Number(texto)

  return (
    <div className={className}>
      <CampoDeFiltro etiqueta={etiqueta} htmlFor={`${id}-min`}>
        <div className='flex items-center gap-1.5'>
          <Input
            id={`${id}-min`}
            type='number'
            inputMode='numeric'
            min={0}
            aria-label={`${etiqueta} mínimo`}
            className='tabular-nums'
            placeholder={placeholderMinimo}
            value={minimo ?? ''}
            onChange={(evento) =>
              onCambiar({ minimo: leer(evento.target.value), maximo })
            }
          />
          <span className='text-muted-foreground shrink-0 text-xs'>a</span>
          <Input
            id={`${id}-max`}
            type='number'
            inputMode='numeric'
            min={0}
            aria-label={`${etiqueta} máximo`}
            className='tabular-nums'
            placeholder={placeholderMaximo}
            value={maximo ?? ''}
            onChange={(evento) =>
              onCambiar({ minimo, maximo: leer(evento.target.value) })
            }
          />
        </div>
      </CampoDeFiltro>
    </div>
  )
}
