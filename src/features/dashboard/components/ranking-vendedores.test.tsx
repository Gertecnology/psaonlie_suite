import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  RankingVendedores,
  type VendedorDelPeriodo,
} from './ranking-vendedores'

/**
 * Lo vendido y lo ganado por cada persona en la caja.
 *
 * Quien administra abre esto para saber a quién tiene que pagarle, así que lo
 * que se prueba es que ese número se lea bien y que se explique cuando no
 * coincide con lo reconocido.
 */
describe('el ranking de vendedores', () => {
  const ANA: VendedorDelPeriodo = {
    vendedorId: 'u-ana',
    vendedor: 'Ana Gómez',
    email: 'ana@pasajeonline.com.py',
    ventas: 12,
    ventasLiquidables: 12,
    montoVendido: 1008000,
    comisionReconocida: 4800,
    comisionRevertida: 0,
    comisionNeta: 4800,
  }

  it('muestra el nombre, las ventas y lo vendido', () => {
    render(<RankingVendedores vendedores={[ANA]} cargando={false} />)

    expect(screen.getByText('Ana Gómez')).toBeInTheDocument()
    expect(screen.getByText(/12 ventas/)).toBeInTheDocument()
  })

  it('lo que se le debe es la comisión NETA', () => {
    // No la reconocida: la neta ya descontó las devoluciones, y es la cifra con
    // la que se le paga.
    render(
      <RankingVendedores
        vendedores={[
          { ...ANA, comisionReconocida: 5200, comisionRevertida: 400, comisionNeta: 4800 },
        ]}
        cargando={false}
      />,
    )

    expect(screen.getByText(/Gs\. 4\.800/)).toBeInTheDocument()
  })

  it('explica por qué lo neto no coincide con lo reconocido', () => {
    // Sin la explicación, la diferencia parece un error de cuenta.
    render(
      <RankingVendedores
        vendedores={[{ ...ANA, comisionRevertida: 400 }]}
        cargando={false}
      />,
    )

    expect(screen.getByText(/por.*devoluciones/i)).toBeInTheDocument()
  })

  it('no menciona devoluciones cuando no hubo', () => {
    // En cero es ruido.
    render(<RankingVendedores vendedores={[ANA]} cargando={false} />)

    expect(screen.queryByText(/devoluciones/i)).not.toBeInTheDocument()
  })

  it('cae al correo cuando la persona no tiene nombre cargado', () => {
    render(
      <RankingVendedores
        vendedores={[{ ...ANA, vendedor: undefined }]}
        cargando={false}
      />,
    )

    expect(screen.getByText('ana@pasajeonline.com.py')).toBeInTheDocument()
  })

  it('dice que nadie vendió, en vez de una lista vacía', () => {
    render(<RankingVendedores vendedores={[]} cargando={false} />)

    expect(
      screen.getByText(/Nadie vendió por caja en este período/),
    ).toBeInTheDocument()
  })

  it('no divide por cero cuando todos vendieron nada', () => {
    // La barra compara contra quien más vendió: sin el piso en 1, un período
    // en el que nadie facturó rompía el cálculo del ancho.
    render(
      <RankingVendedores
        vendedores={[{ ...ANA, montoVendido: 0 }]}
        cargando={false}
      />,
    )

    expect(screen.getByText('Ana Gómez')).toBeInTheDocument()
  })
})
