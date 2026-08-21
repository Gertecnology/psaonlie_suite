import { useEffect, useState } from 'react'

/**
 * Devuelve el valor recibido con un retraso, reiniciando el temporizador en
 * cada cambio.
 *
 * Se usa para no disparar una petición por cada tecla en los buscadores que
 * consultan al servidor.
 */
export function useDebouncedValue<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}
