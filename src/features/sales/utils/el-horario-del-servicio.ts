/**
 * Lo que se lee de un horario de servicio.
 *
 * La transportista manda `Embarque` y `Desembarque` como texto, con la fecha
 * adelante: «30/08 01:00». La pantalla los mostraba tal cual, así que el
 * vendedor tenía que restar de cabeza para saber cuánto dura el viaje, y no
 * había forma de ver de un vistazo cuál llega al día siguiente.
 */

export interface HorarioDelServicio {
  /** Sólo la hora de salida: «01:00». */
  sale: string
  /** Sólo la hora de llegada: «06:26». */
  llega: string
  /** Cuánto dura, ya calculado: «5 h 26». Vacío si no se puede saber. */
  duracion: string
  /** Cuántos días después llega. 0 el mismo día, 1 al siguiente. */
  diasDespues: number
}

/** Saca fecha y hora de «30/08 01:00», «30/08/2026 01:00» o «01:00». */
function partir(texto: string): { dia?: number; mes?: number; hora: number; minuto: number } | null {
  const limpio = (texto ?? '').trim()
  if (!limpio) return null

  const conFecha = limpio.match(
    /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s+(\d{1,2}):(\d{2})/,
  )
  if (conFecha) {
    return {
      dia: parseInt(conFecha[1], 10),
      mes: parseInt(conFecha[2], 10),
      hora: parseInt(conFecha[4], 10),
      minuto: parseInt(conFecha[5], 10),
    }
  }

  const soloHora = limpio.match(/^(\d{1,2}):(\d{2})/)
  if (soloHora) {
    return {
      hora: parseInt(soloHora[1], 10),
      minuto: parseInt(soloHora[2], 10),
    }
  }

  return null
}

const enMinutos = (hora: number, minuto: number) => hora * 60 + minuto

export function leerHorario(
  embarque: string,
  desembarque: string,
): HorarioDelServicio {
  const salida = partir(embarque)
  const llegada = partir(desembarque)

  if (!salida || !llegada) {
    // Sin poder leerlos, se muestra lo que vino: inventar una duración sería
    // peor que no mostrarla.
    return {
      sale: (embarque ?? '').trim(),
      llega: (desembarque ?? '').trim(),
      duracion: '',
      diasDespues: 0,
    }
  }

  const sale = `${String(salida.hora).padStart(2, '0')}:${String(salida.minuto).padStart(2, '0')}`
  const llega = `${String(llegada.hora).padStart(2, '0')}:${String(llegada.minuto).padStart(2, '0')}`

  let minutos = enMinutos(llegada.hora, llegada.minuto) - enMinutos(salida.hora, salida.minuto)
  let diasDespues = 0

  if (salida.dia !== undefined && llegada.dia !== undefined) {
    // Con las dos fechas se sabe con certeza cuántos días pasaron. Se comparan
    // por día del mes y mes; el año no viene y no hace falta para un viaje que
    // dura horas.
    const mismoDia = salida.dia === llegada.dia && salida.mes === llegada.mes
    if (!mismoDia) {
      diasDespues = 1
      minutos += 24 * 60
    }
  } else if (minutos < 0) {
    // Sin fechas, una llegada anterior a la salida sólo puede ser del día
    // siguiente: un viaje que sale 23:30 y llega 05:00.
    diasDespues = 1
    minutos += 24 * 60
  }

  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60

  return {
    sale,
    llega,
    duracion: minutos > 0 ? `${horas} h ${String(resto).padStart(2, '0')}` : '',
    diasDespues,
  }
}
