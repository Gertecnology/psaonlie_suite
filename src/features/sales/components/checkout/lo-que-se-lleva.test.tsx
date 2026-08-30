import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Asiento } from '../../models/sales.model'
import { filaVacia, type DatosDelPasajero } from '../../utils/los-datos-del-pasajero'
import { LoQueSeLleva } from './lo-que-se-lleva'

/**
 * Lo que se lleva el cliente.
 *
 * Con dieciocho pasajes el vendedor confirmaba una venta que no podía leer:
 * el resumen mostraba los totales y nada más, así que un nombre mal tipeado
 * aparecía recién en el boleto impreso.
 */

const butaca = (numero: string, precio = 80000): Asiento =>
  ({ numero, precio, disponible: false, piso: 1, calidad: 'Común' }) as Asiento

const pasajero = (
  nombre: string,
  apellido: string,
  documento: string
): DatosDelPasajero => ({
  ...filaVacia(),
  numeroDocumento: documento,
  nombre,
  apellido,
  tipoDocumento: 'CI',
  nacionalidad: 'PY',
  paisResidencia: 'Paraguay',
  fechaNacimiento: '1988-03-12',
  sexo: 'F',
  ocupacion: 'Docente',
  telefono: '0981224118',
  email: 'ana@example.com',
})

describe('lo que se lleva el cliente', () => {
  it('una línea por butaca, con quién viaja y su documento', () => {
    render(
      <LoQueSeLleva
        asientos={[butaca('01'), butaca('02')]}
        filas={[
          pasajero('Ana', 'Duarte', '3481220'),
          pasajero('Luis', 'Duarte', '4112876'),
        ]}
      />
    )

    expect(screen.getByText('Ana Duarte')).toBeInTheDocument()
    expect(screen.getByText('CI 3481220')).toBeInTheDocument()
    expect(screen.getByText('Luis Duarte')).toBeInTheDocument()
    expect(screen.getByText('2 pasajes · butacas 01, 02')).toBeInTheDocument()
  })

  it('marca la butaca cuyo pasajero falta, en vez de dejar el renglón mudo', () => {
    render(
      <LoQueSeLleva
        asientos={[butaca('01'), butaca('02')]}
        filas={[pasajero('Ana', 'Duarte', '3481220')]}
      />
    )

    expect(screen.getByText('Sin cargar')).toBeInTheDocument()
  })

  it('con muchas, resume el resto en vez de hacer scrollear la pantalla', () => {
    const dieciocho = Array.from({ length: 18 }, (_, i) =>
      butaca(String(i + 1).padStart(2, '0'))
    )

    render(
      <LoQueSeLleva
        asientos={dieciocho}
        filas={dieciocho.map((_, i) => pasajero(`Ana${i}`, 'Duarte', `${i}`))}
      />
    )

    expect(screen.getByText('6 pasajeros más')).toBeInTheDocument()
  })

  it('el precio es el de cada butaca, no un promedio', () => {
    // Un bus mezcla calidades: la 41 de arriba sale más que la 01 de abajo.
    render(
      <LoQueSeLleva
        asientos={[butaca('01', 80000), butaca('41', 96000)]}
        filas={[
          pasajero('Ana', 'Duarte', '3481220'),
          pasajero('Luis', 'Duarte', '4112876'),
        ]}
      />
    )

    expect(screen.getByText('80.000')).toBeInTheDocument()
    expect(screen.getByText('96.000')).toBeInTheDocument()
  })
})
