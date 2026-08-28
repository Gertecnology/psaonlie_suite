import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CampoDeFiltro } from './campo-de-filtro'

/** El valor interno de «sin filtrar». Radix no acepta un `SelectItem` vacío. */
const TODOS = '__todos__'

export interface OpcionDeFiltro {
  valor: string
  etiqueta: string
}

interface FiltroDeSeleccionProps {
  id: string
  etiqueta: string
  /** Qué dice la opción que no filtra: «Todos los estados», «Todas». */
  etiquetaDeTodos: string
  opciones: OpcionDeFiltro[]
  /** `undefined` es «sin filtrar». */
  valor?: string
  onCambiar: (valor: string | undefined) => void
  className?: string
}

/**
 * Un desplegable de una sola opción.
 *
 * «Sin filtrar» viaja como `undefined` hacia afuera y como un centinela hacia
 * adentro: Radix trata la cadena vacía como «no hay valor» y dibujaría el
 * placeholder en vez de la opción elegida, con lo que «Todos los estados»
 * nunca se vería seleccionado.
 *
 * Si no hay opciones —porque todavía están cargando, o porque quien mira no
 * tiene ninguna— el control se deshabilita en vez de ofrecer una lista vacía
 * que no explica nada.
 */
export function FiltroDeSeleccion({
  id,
  etiqueta,
  etiquetaDeTodos,
  opciones,
  valor,
  onCambiar,
  className,
}: FiltroDeSeleccionProps) {
  return (
    <CampoDeFiltro etiqueta={etiqueta} htmlFor={id} className={className}>
      <Select
        value={valor ?? TODOS}
        disabled={opciones.length === 0}
        onValueChange={(elegido) =>
          onCambiar(elegido === TODOS ? undefined : elegido)
        }
      >
        <SelectTrigger id={id} aria-label={etiqueta}>
          <SelectValue placeholder={etiquetaDeTodos} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{etiquetaDeTodos}</SelectItem>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CampoDeFiltro>
  )
}
