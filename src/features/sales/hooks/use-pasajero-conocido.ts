import { useEffect, useRef, useState } from 'react'

import { apiFetch } from '@/utils/api-client'

/** Un documento más corto que esto todavía se está escribiendo. */
const LARGO_MINIMO = 5

/** Espera antes de buscar, para no consultar en cada tecla. */
const ESPERA_MS = 550

/** Lo que devuelve el backend cuando reconoce el documento. */
interface PasajeroConocido {
  encontrado: boolean
  nombre?: string
  apellido?: string
  email?: string
  fechaNacimiento?: string
  telefono?: string
  nacionalidad?: string
  paisResidencia?: string
  sexo?: string
  ocupacion?: string
}

/** Los campos del formulario que se pueden precargar. */
export interface CamposPrecargables {
  nombre?: string
  apellido?: string
  email?: string
  fechaNacimiento?: string
  telefono?: string
  nacionalidad?: string
  paisResidencia?: string
  sexo?: string
  ocupacion?: string
}

/**
 * Precarga el formulario cuando el documento ya compró antes.
 *
 * El mismo comportamiento que la landing, que faltaba en la caja: quien vuelve
 * a comprar tenía que dictarle al vendedor su nombre, su fecha de nacimiento y
 * su ocupación otra vez, con todo eso ya guardado.
 *
 * En el mostrador pesa más que en la web: cada dato que no hay que preguntar es
 * una persona menos en la fila.
 */
export function usePasajeroConocido({
  tipoDocumento,
  numeroDocumento,
  onEncontrado,
}: {
  tipoDocumento: string
  numeroDocumento: string
  /**
   * Recibe sólo los campos que vinieron con valor. Quien lo reciba decide si
   * pisa lo que ya está escrito — y no debería.
   */
  onEncontrado: (campos: CamposPrecargables) => void
}) {
  const [buscando, setBuscando] = useState(false)

  /** El último documento pedido: una respuesta tardía es de otra persona. */
  const ultimoPedido = useRef('')

  /** Los ya buscados, para no repetir la consulta al volver al campo. */
  const yaBuscados = useRef<Set<string>>(new Set())

  useEffect(() => {
    const numero = numeroDocumento?.trim() ?? ''
    const tipo = tipoDocumento?.trim() ?? ''

    if (!tipo || numero.length < LARGO_MINIMO) return

    const clave = `${tipo}|${numero}`
    if (yaBuscados.current.has(clave)) return

    const temporizador = setTimeout(() => {
      ultimoPedido.current = clave
      setBuscando(true)

      const query = new URLSearchParams({
        tipoDocumento: tipo,
        numeroDocumento: numero,
      })

      apiFetch<PasajeroConocido>(
        `/api/clientes/pasajero-por-documento?${query.toString()}`,
        { fallbackMessage: 'No se pudo consultar el documento.' },
      )
        .then((conocido) => {
          // El documento cambió mientras respondía: esto ya es de otro.
          if (ultimoPedido.current !== clave) return

          yaBuscados.current.add(clave)

          if (!conocido?.encontrado) return

          onEncontrado({
            nombre: conocido.nombre,
            apellido: conocido.apellido,
            email: conocido.email,
            fechaNacimiento: conocido.fechaNacimiento,
            telefono: conocido.telefono,
            nacionalidad: conocido.nacionalidad,
            paisResidencia: conocido.paisResidencia,
            sexo: conocido.sexo,
            ocupacion: conocido.ocupacion,
          })
        })
        .catch(() => {
          // Que no se pueda precargar no rompe nada: el formulario se completa
          // a mano, como siempre.
        })
        .finally(() => {
          if (ultimoPedido.current === clave) setBuscando(false)
        })
    }, ESPERA_MS)

    return () => clearTimeout(temporizador)
    // `onEncontrado` cambia en cada render del formulario: incluirlo reiniciaría
    // la búsqueda en cada tecla de cualquier campo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoDocumento, numeroDocumento])

  return { buscando }
}
