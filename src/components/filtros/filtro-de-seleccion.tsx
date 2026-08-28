import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** El valor interno de «sin filtrar». Radix no acepta un `SelectItem` vacío. */
const TODOS = '__todos__'

export interface OpcionDeFiltro {
  valor: string
  etiqueta: string
}

interface FiltroDeSeleccionProps {
  id: string
  /** Va como `aria-label`: el control no lleva etiqueta dibujada. */
  etiqueta: string
  /** Qué dice la opción que no filtra, dentro del menú. */
  etiquetaDeTodos: string
  /**
   * Qué se lee en el control sin filtrar. Por omisión, el nombre del campo.
   *
   * No se usa `etiquetaDeTodos` para esto: «Todas las empresas» no entra en un
   * control angosto y se corta en «Todas las empresa…», que no dice nada. El
   * nombre del campo sí cabe, y es la convención — un desplegable en gris que
   * dice «Empresa» se lee como «elegí una empresa», no como un filtro puesto.
   */
  placeholder?: string
  opciones: OpcionDeFiltro[]
  valor?: string
  onCambiar: (valor: string | undefined) => void
  className?: string
}

/**
 * Un desplegable de una sola opción.
 *
 * «Sin filtrar» viaja como `undefined` hacia afuera y **el control queda sin
 * valor**, para que Radix dibuje el placeholder con el nombre del campo. El
 * centinela existe sólo del lado del menú: Radix no acepta un `SelectItem` con
 * `value=''`, así que la opción «Todos los pagos» necesita un valor propio que
 * se traduce a `undefined` al elegirla.
 *
 * Sin esto el control mostraría siempre el texto del item seleccionado —
 * «Todas las empresas»— que no entra en un desplegable angosto y se corta en
 * «Todas las empresa…», sin decir nada.
 *
 * Sin opciones —todavía cargando, o quien mira no tiene ninguna— se
 * deshabilita en vez de ofrecer una lista vacía que no explica nada.
 */
export function FiltroDeSeleccion({
  id,
  etiqueta,
  etiquetaDeTodos,
  placeholder,
  opciones,
  valor,
  onCambiar,
  className,
}: FiltroDeSeleccionProps) {
  return (
    <Select
      value={valor ?? ''}
      disabled={opciones.length === 0}
      onValueChange={(elegido) =>
        onCambiar(elegido === TODOS ? undefined : elegido)
      }
    >
      <SelectTrigger id={id} aria-label={etiqueta} className={cn('h-9', className)}>
        <SelectValue placeholder={placeholder ?? etiqueta} />
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
  )
}
