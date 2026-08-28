import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

interface FiltroDeTextoProps {
  id: string
  /** Va como `aria-label`: el control no lleva etiqueta dibujada. */
  etiqueta: string
  placeholder?: string
  valor: string
  onCambiar: (valor: string) => void
  espera?: number
  className?: string
}

/**
 * Un filtro de texto que avisa cuando la persona dejó de escribir.
 *
 * El estado de lo tecleado vive acá adentro y se emite con retardo: sin eso se
 * consulta al servidor en cada tecla, y cada consulta trae una página y sus
 * totales.
 *
 * Lo escrito y lo emitido son dos cosas distintas, y por eso hay un `ref`. Si
 * el padre limpia los filtros, el valor de afuera cambia sin que nadie haya
 * tecleado y hay que reflejarlo en la caja. Pero mientras se escribe, el de
 * afuera va siempre un retardo atrás del local, y copiarlo de vuelta borraría
 * las últimas letras. El `ref` distingue los dos casos.
 */
export function FiltroDeTexto({
  id,
  etiqueta,
  placeholder,
  valor,
  onCambiar,
  espera = 400,
  className,
}: FiltroDeTextoProps) {
  const [escrito, setEscrito] = useState(valor)
  const ultimoEmitido = useRef(valor)
  const diferido = useDebouncedValue(escrito, espera)

  useEffect(() => {
    if (diferido === ultimoEmitido.current) return

    ultimoEmitido.current = diferido
    onCambiar(diferido)
    // `onCambiar` suele venir inline del padre y cambia de identidad en cada
    // render: incluirlo dispararía el aviso en bucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diferido])

  useEffect(() => {
    if (valor === ultimoEmitido.current) return

    ultimoEmitido.current = valor
    setEscrito(valor)
  }, [valor])

  return (
    <div className={className}>
      <div className='relative'>
        <Search className='text-muted-foreground pointer-events-none absolute left-2.5 top-2.5 h-4 w-4' />
        <Input
          id={id}
          aria-label={etiqueta}
          className='h-9 pl-8 pr-8'
          placeholder={placeholder ?? etiqueta}
          value={escrito}
          onChange={(evento) => setEscrito(evento.target.value)}
        />
        {escrito && (
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={`Limpiar ${etiqueta.toLowerCase()}`}
            className='absolute right-0.5 top-0.5 h-8 w-8'
            onClick={() => setEscrito('')}
          >
            <X className='h-3.5 w-3.5' />
          </Button>
        )}
      </div>
    </div>
  )
}
