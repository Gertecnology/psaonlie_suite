import { useEffect, useRef, useState } from 'react'

import { apiFetch } from '@/utils/api-client'

/** Un documento más corto que esto todavía se está escribiendo. */
const LARGO_MINIMO = 5

/** Espera antes de buscar, para no consultar en cada tecla. */
const ESPERA_MS = 550

/** Lo que devuelve el backend cuando reconoce el documento. */
interface PasajeroConocido {
  encontrado: boolean
  tipoDocumento?: string
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
  tipoDocumento?: string
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
  /**
   * Opcional. Sólo viaja para desempatar si dos personas comparten el número:
   * a alguien lo identifica su número, y el tipo es un dato de esa persona.
   */
  tipoDocumento?: string
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

    // Alcanza con el número. Antes se exigía el tipo, y quien escribía su
    // cédula sin elegirlo primero no obtenía nada: el vendedor terminaba
    // preguntando todo igual.
    if (numero.length < LARGO_MINIMO) return

    const clave = `${tipo}|${numero}`
    if (yaBuscados.current.has(clave)) return

    const temporizador = setTimeout(() => {
      ultimoPedido.current = clave
      setBuscando(true)

      const query = new URLSearchParams({ numeroDocumento: numero })
      if (tipo) {
        query.set('tipoDocumento', tipo)
      }

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
            // El tipo también se precarga: es un dato de la persona, no algo
            // que el vendedor tenga que averiguar.
            tipoDocumento: conocido.tipoDocumento,
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
