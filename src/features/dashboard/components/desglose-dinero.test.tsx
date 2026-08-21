import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { contieneDinero, textoDinero } from '@/test/utils'
import type { EstadisticasGenerales } from '../models/estadisticas.model'
import { DesgloseDinero } from './desglose-dinero'

/**
 * El componente que muestra el dinero.
 *
 * Defiende lo mismo que el modelo, pero en la capa donde el usuario lo lee: que
 * los tres montos aparezcan **separados** y que la cifra principal sea lo que
 * efectivamente se le cobró al cliente — nunca una suma que meta la comisión
 * adentro dos veces.
 */

function generales(
  parcial: Partial<EstadisticasGenerales> = {},
): EstadisticasGenerales {
  return {
    totalVentas: 10,
    ventasCompletadas: 8,
    ventasPendientes: 2,
    ventasCanceladas: 0,
    ventasExpiradas: 0,
    montoTotal: 1_000_000,
    montoCompletado: 800_000,
    montoPendiente: 200_000,
    totalComisiones: 100_000,
    comisionesPagadas: 80_000,
    comisionesPendientes: 20_000,
    totalServiceCharges: 50_000,
    serviceChargesPagados: 40_000,
    serviceChargesPendientes: 10_000,
    serviceChargePromedioPorVenta: 5_000,
    totalBoletos: 12,
    boletosPagados: 10,
    boletosPendientes: 2,
    tasaConversion: 80,
    montoPromedioPorVenta: 100_000,
    boletosPromedioPorVenta: 1.2,
    ...parcial,
  }
}

function renderizar(
  actual: EstadisticasGenerales = generales(),
  anterior?: EstadisticasGenerales,
) {
  return render(
    <DesgloseDinero
      generales={actual}
      generalesAnterior={anterior}
      cargando={false}
    />,
  )
}

function renderizarCargando() {
  return render(
    <DesgloseDinero
      generales={undefined}
      generalesAnterior={undefined}
      cargando
    />,
  )
}

describe('DesgloseDinero', () => {
  it('la cifra principal es lo cobrado: pasaje + cargo por servicio', () => {
    renderizar()

    // 800.000 de pasaje + 40.000 de cargo = 840.000.
    expect(screen.getAllByText(textoDinero('Gs. 840.000')).length).toBeGreaterThan(0)
  })

  it('NO suma la comisión a lo que paga el cliente', () => {
    // El error más caro posible en esta pantalla: mostrar 920.000 cobrados
    // cuando por la tarjeta pasaron 840.000. La comisión ya está adentro del
    // pasaje; sumarla otra vez la cuenta dos veces.
    renderizar()

    expect(screen.queryAllByText(contieneDinero('Gs. 920.000'))).toHaveLength(0)
  })

  it('muestra los tres montos por separado', () => {
    renderizar()

    expect(screen.getAllByText(contieneDinero('Gs. 800.000')).length).toBeGreaterThan(0) // pasaje
    expect(screen.getAllByText(contieneDinero('Gs. 40.000')).length).toBeGreaterThan(0) // cargo
    expect(screen.getAllByText(contieneDinero('Gs. 80.000')).length).toBeGreaterThan(0) // comisión

    expect(screen.getAllByText('Pasaje').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cargo por servicio').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Comisión').length).toBeGreaterThan(0)
  })

  it('el neto a las empresas descuenta la comisión del pasaje', () => {
    renderizar()

    // 800.000 − 80.000 = 720.000
    expect(screen.getAllByText(contieneDinero('Gs. 720.000')).length).toBeGreaterThan(0)
    expect(screen.getByText('Neto a las empresas')).toBeInTheDocument()
  })

  it('nuestro ingreso es cargo por servicio + comisión', () => {
    renderizar()

    // 40.000 + 80.000 = 120.000
    expect(screen.getAllByText(contieneDinero('Gs. 120.000')).length).toBeGreaterThan(0)
    expect(screen.getByText('Nuestro ingreso')).toBeInTheDocument()
  })

  it('separa lo pendiente de cobro de lo cobrado', () => {
    renderizar()

    // 200.000 de pasaje + 10.000 de cargo pendientes = 210.000
    expect(screen.getByText('Pendiente de cobro')).toBeInTheDocument()
    expect(screen.getAllByText(contieneDinero('Gs. 210.000')).length).toBeGreaterThan(0)
  })

  it('las dos composiciones describen el mismo total', () => {
    // Es la razón de ser de la pantalla: las dos tiras tienen el mismo ancho
    // porque representan la misma plata leída de dos maneras.
    renderizar()

    const cobro = screen.getByRole('group', { name: /Lo que paga el cliente/i })
    const reparto = screen.getByRole('group', { name: /Cómo se reparte/i })

    expect(cobro.getAttribute('aria-label')).toContain('840.000')
    expect(reparto.getAttribute('aria-label')).toContain('840.000')
  })

  it('cada segmento de la tira se puede leer sin ver el color', () => {
    // El color nunca es el único canal: quien usa un lector de pantalla tiene
    // que poder leer el mismo desglose.
    renderizar()

    const nombres = screen.getAllByRole('button').map((s) => s.textContent ?? '')

    expect(nombres.some((n) => n.includes('Pasaje'))).toBe(true)
    expect(nombres.some((n) => n.includes('Comisión'))).toBe(true)
    expect(nombres.some((n) => n.includes('Neto a empresas'))).toBe(true)
    expect(nombres.every((n) => n.includes('Gs.'))).toBe(true)
  })

  it('compara contra el período anterior cuando hay base', () => {
    renderizar(
      generales(),
      generales({
        montoCompletado: 400_000,
        comisionesPagadas: 40_000,
        serviceChargesPagados: 20_000,
      }),
    )

    // El pasaje pasó de 400.000 a 800.000: +100%.
    expect(screen.getAllByText('+100,0%').length).toBeGreaterThan(0)
  })

  it('dice "sin comparación" en vez de inventar un 0%', () => {
    renderizar(
      generales(),
      generales({
        montoCompletado: 0,
        comisionesPagadas: 0,
        serviceChargesPagados: 0,
        montoPendiente: 0,
        serviceChargesPendientes: 0,
      }),
    )

    expect(screen.getAllByText('Sin comparación').length).toBeGreaterThan(0)
  })

  it('explica qué hacer cuando el período no tuvo cobros', () => {
    // Un estado vacío que sólo dice "no hay datos" deja al operador sin saber
    // si la pantalla está rota o el filtro es demasiado angosto.
    renderizar(
      generales({
        montoCompletado: 0,
        comisionesPagadas: 0,
        serviceChargesPagados: 0,
      }),
    )

    expect(screen.getByText(/No hubo cobros en este período/i)).toBeInTheDocument()
    expect(screen.getByText(/rango más amplio/i)).toBeInTheDocument()
  })

  it('no muestra números mientras carga por primera vez', () => {
    // Mostrar ceros mientras se carga sería peor que no mostrar nada: alguien
    // podría leer "Gs. 0 cobrados" como un dato.
    renderizarCargando()
    expect(screen.queryByText(/Cobrado al cliente/i)).not.toBeInTheDocument()
    expect(screen.queryAllByText(contieneDinero('Gs.'))).toHaveLength(0)
  })
})
