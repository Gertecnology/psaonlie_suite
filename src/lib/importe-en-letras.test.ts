import { describe, expect, it } from 'vitest'
import { importeEnLetras } from './importe-en-letras'

/**
 * El importe en letras es lo que firma un contador al pie de una liquidación.
 * Los casos de abajo son los que rompen las implementaciones ingenuas, y cada
 * uno responde a una pregunta que alguien se hace mirando el papel.
 */
describe('importeEnLetras', () => {
  it('escribe el saldo de una liquidación real', () => {
    // El total del informe INF-ADM-002 sobre datos de agosto.
    expect(importeEnLetras(496038500)).toBe(
      'Cuatrocientos noventa y seis millones treinta y ocho mil quinientos guaraníes.',
    )
  })

  it('distingue «cien» exacto de «ciento» con resto', () => {
    expect(importeEnLetras(100)).toBe('Cien guaraníes.')
    expect(importeEnLetras(101)).toBe('Ciento un guaraníes.')
    expect(importeEnLetras(150)).toBe('Ciento cincuenta guaraníes.')
  })

  it('escribe «un millón» en singular y el resto en plural', () => {
    expect(importeEnLetras(1000000)).toBe('Un millón de guaraníes.')
    expect(importeEnLetras(2000000)).toBe('Dos millones de guaraníes.')
  })

  it('pone «de» sólo cuando los millones no llevan resto detrás', () => {
    // «Un millón de guaraníes», pero «un millón quinientos guaraníes».
    expect(importeEnLetras(3000000)).toBe('Tres millones de guaraníes.')
    expect(importeEnLetras(3000001)).toBe('Tres millones un guaraníes.')
  })

  it('escribe «mil» sin el «un» delante', () => {
    expect(importeEnLetras(1000)).toBe('Mil guaraníes.')
    expect(importeEnLetras(21000)).toBe('Veintiún mil guaraníes.')
  })

  it('no deja huecos cuando falta un grupo intermedio', () => {
    // Un millón sin miles: el error clásico es escribir «un millón mil».
    expect(importeEnLetras(1000500)).toBe('Un millón quinientos guaraníes.')
    expect(importeEnLetras(1000000 + 1)).toBe('Un millón un guaraníes.')
  })

  it('escribe el cero, porque un total en cero es un total', () => {
    expect(importeEnLetras(0)).toBe('Cero guaraníes.')
  })

  it('escribe el signo cuando el saldo queda en contra', () => {
    // Omitir el «menos» invierte lo que dice el documento.
    expect(importeEnLetras(-1500)).toBe('Menos mil quinientos guaraníes.')
  })

  it('redondea al guaraní: la moneda no tiene centavos', () => {
    expect(importeEnLetras(1500.4)).toBe('Mil quinientos guaraníes.')
    // «un» y no «uno»: apócope delante del sustantivo.
    expect(importeEnLetras(1500.6)).toBe('Mil quinientos un guaraníes.')
  })

  it('trata un valor ausente como cero en vez de romper la hoja', () => {
    // Una hoja que no se genera es peor que una que dice cero.
    expect(importeEnLetras(null)).toBe('Cero guaraníes.')
    expect(importeEnLetras(undefined)).toBe('Cero guaraníes.')
  })

  it('escribe las decenas con «y» y las de veinti- pegadas', () => {
    expect(importeEnLetras(25)).toBe('Veinticinco guaraníes.')
    expect(importeEnLetras(31)).toBe('Treinta y un guaraníes.')
    expect(importeEnLetras(99)).toBe('Noventa y nueve guaraníes.')
  })
})
