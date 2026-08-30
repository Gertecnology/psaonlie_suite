import { describe, expect, it } from 'vitest'
import { leerHorario } from './el-horario-del-servicio'

/**
 * El horario que se le muestra a quien vende.
 *
 * La transportista manda «30/08 01:00» y la pantalla lo mostraba tal cual: el
 * vendedor tenía que restar de cabeza para saber cuánto dura el viaje, y nada
 * decía cuál llega al día siguiente.
 */

describe('leer el horario de un servicio', () => {
  it('separa la hora de la fecha', () => {
    const horario = leerHorario('30/08 01:00', '30/08 06:26')

    expect(horario.sale).toBe('01:00')
    expect(horario.llega).toBe('06:26')
  })

  it('calcula cuánto dura el viaje', () => {
    expect(leerHorario('30/08 01:00', '30/08 06:26').duracion).toBe('5 h 26')
  })

  it('marca el que llega al día siguiente', () => {
    const horario = leerHorario('30/08 19:20', '31/08 00:46')

    expect(horario.diasDespues).toBe(1)
    expect(horario.duracion).toBe('5 h 26')
  })

  it('sin fechas, una llegada anterior a la salida es del día siguiente', () => {
    // Un servicio que sale 23:30 y llega 05:00 no dura menos dieciocho horas.
    const horario = leerHorario('23:30', '05:00')

    expect(horario.diasDespues).toBe(1)
    expect(horario.duracion).toBe('5 h 30')
  })

  it('acepta la fecha con año', () => {
    const horario = leerHorario('30/08/2026 06:15', '30/08/2026 11:40')

    expect(horario.sale).toBe('06:15')
    expect(horario.duracion).toBe('5 h 25')
  })

  it('completa el cero de las horas de un dígito', () => {
    expect(leerHorario('30/08 6:15', '30/08 9:05').sale).toBe('06:15')
  })

  it('con un formato que no reconoce, muestra lo que vino', () => {
    // Inventar una duración sería peor que no mostrarla.
    const horario = leerHorario('a confirmar', 'a confirmar')

    expect(horario.sale).toBe('a confirmar')
    expect(horario.duracion).toBe('')
    expect(horario.diasDespues).toBe(0)
  })

  it('no inventa duración cuando sale y llega a la misma hora', () => {
    expect(leerHorario('30/08 08:00', '30/08 08:00').duracion).toBe('')
  })
})
