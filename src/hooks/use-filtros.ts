import { useCallback, useRef, useState } from 'react'

/** Cuántas filas se piden si no se dice otra cosa. */
const TAMANO_POR_DEFECTO = 25

/**
 * Los filtros de un listado paginado por el servidor.
 *
 * Existe por una sola razón, y es la que más se olvida: **cambiar un filtro
 * vuelve a la primera página**. Sin eso, alguien parado en la página 4 que
 * agrega un filtro con dos resultados ve una tabla vacía y concluye que no hay
 * nada. Hay algo; está mirando la página 4 de una lista de una.
 *
 * `limpiar` vuelve a los valores iniciales, no a un objeto vacío. Un listado
 * que arranca acotado —los últimos treinta días, por ejemplo— tiene que volver
 * a ese estado y no a «todo desde siempre», que es una consulta distinta y
 * mucho más cara.
 */
export function useFiltros<T extends object>(
  iniciales: T,
  tamanoInicial: number = TAMANO_POR_DEFECTO,
) {
  // Los iniciales se congelan: si vinieran de un objeto literal del padre,
  // `limpiar` restauraría el de la última renderización en vez del de origen.
  const deOrigen = useRef(iniciales)

  const [filtros, setFiltros] = useState<T>(iniciales)
  const [pagina, setPagina] = useState(1)
  const [tamano, setTamano] = useState(tamanoInicial)

  const poner = useCallback((parche: Partial<T>) => {
    setFiltros((actuales) => ({ ...actuales, ...parche }))
    setPagina(1)
  }, [])

  const quitar = useCallback((clave: keyof T) => {
    setFiltros((actuales) => ({ ...actuales, [clave]: undefined }))
    setPagina(1)
  }, [])

  const limpiar = useCallback(() => {
    setFiltros(deOrigen.current)
    setPagina(1)
  }, [])

  const cambiarTamano = useCallback((nuevo: number) => {
    setTamano(nuevo)
    // La página 3 de 25 en filas no es la página 3 de 100: al cambiar el
    // tamaño, el número de página deja de señalar las mismas filas.
    setPagina(1)
  }, [])

  return {
    filtros,
    pagina,
    tamano,
    poner,
    quitar,
    limpiar,
    irAPagina: setPagina,
    cambiarTamano,
  }
}
