import { describe, expect, it, vi } from 'vitest'
import {
  VentaConfirmacionError,
  confirmarVenta,
  mensajeParaOperador,
  type ConfirmarVentaRequest,
} from './confirmar-venta'

function mockearRespuesta(body: unknown, status = 201) {
  const fetchMock = vi.fn(
    async () =>
      ({
        ok: status < 400,
        status,
        text: async () => JSON.stringify(body),
      }) as unknown as Response,
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const PEDIDO: ConfirmarVentaRequest = {
  ventas: [
    {
      bloqueoCodigoReferencia: 'REF-1',
      servicioId: 'SRV-1',
      agenciaId: 'EMP-1',
      EmpresaBoleto: 'SOL',
      calidad: 'CA',
      origenId: 'ORI-1',
      destinoId: 'DES-1',
      metodoPago: 'EFECTIVO',
      estadoPago: 'PENDIENTE',
      importeTotal: 150000,
      asiento: [{ Nroasiento: '5', Precio: 150000, clienteId: 'CLI-1' }],
    },
  ],
}

const VENTA_OK = {
  ventaId: 'V-1',
  numeroTransaccion: 'TXN-1',
  numeroBoleto: 'B-1',
  estado: 'RESERVADO',
  mensaje: 'ok',
  fechaCreacion: '2026-08-21T10:00:00.000Z',
  boletos: [],
  comisionTotal: 15000,
}

describe('confirmarVenta', () => {
  it('devuelve la respuesta cuando todas las ventas salieron bien', async () => {
    mockearRespuesta({
      esVentaIndividual: false,
      totalProcesadas: 1,
      exitosas: 1,
      fallidas: 0,
      tiempoProcesamiento: 120,
      resultados: [{ indice: 0, exitoso: true, venta: VENTA_OK }],
    })

    const respuesta = await confirmarVenta(PEDIDO)
    expect(respuesta.exitosas).toBe(1)
  })

  it('LANZA cuando el backend responde 201 con todas las ventas fallidas', async () => {
    mockearRespuesta({
      esVentaIndividual: false,
      totalProcesadas: 1,
      exitosas: 0,
      fallidas: 1,
      tiempoProcesamiento: 90,
      resultados: [
        {
          indice: 0,
          exitoso: false,
          error: {
            codigo: 'VALIDATION_ERROR',
            mensaje: 'El precio no coincide con la tarifa vigente',
            detalles: {},
          },
        },
      ],
    })

    await expect(confirmarVenta(PEDIDO)).rejects.toThrow(VentaConfirmacionError)
  })

  it('LANZA en el fallo parcial y expone qué venta falló', async () => {
    mockearRespuesta({
      esVentaIndividual: false,
      totalProcesadas: 2,
      exitosas: 1,
      fallidas: 1,
      tiempoProcesamiento: 200,
      resultados: [
        { indice: 0, exitoso: true, venta: VENTA_OK },
        {
          indice: 1,
          exitoso: false,
          error: {
            codigo: 'DISPONIBILIDAD_ERROR',
            mensaje: 'El asiento ya no está disponible',
            detalles: {},
          },
        },
      ],
    })

    const error = await confirmarVenta(PEDIDO).catch((e) => e)

    expect(error).toBeInstanceOf(VentaConfirmacionError)
    expect(error.indicesFallidos).toEqual([1])
    expect(error.ventasExitosas).toHaveLength(1)
    expect(error.codigos).toEqual(['DISPONIBILIDAD_ERROR'])
  })

  it('LANZA cuando la respuesta no trae resultados', async () => {
    mockearRespuesta({ mensaje: 'algo raro' })

    await expect(confirmarVenta(PEDIDO)).rejects.toThrow(
      /no devolvió el resultado de la venta/,
    )
  })

  it('propaga el error del backend cuando responde 400', async () => {
    mockearRespuesta(
      { statusCode: 400, message: 'importeTotal inválido', success: false },
      400,
    )

    await expect(confirmarVenta(PEDIDO)).rejects.toThrow(/importeTotal inválido/)
  })
})

describe('mensajeParaOperador', () => {
  function errorConCodigo(codigo: string, mensaje: string) {
    return new VentaConfirmacionError(mensaje, {
      esVentaIndividual: false,
      totalProcesadas: 1,
      exitosas: 0,
      fallidas: 1,
      tiempoProcesamiento: 10,
      resultados: [
        { indice: 0, exitoso: false, error: { codigo, mensaje, detalles: {} as never } },
      ],
    })
  }

  it('explica el rechazo por precio inválido y qué hacer', () => {
    const mensaje = mensajeParaOperador(
      errorConCodigo('VALIDATION_ERROR', 'El precio no coincide con la tarifa'),
    )

    expect(mensaje).toMatch(/rechazó el precio/)
    expect(mensaje).toMatch(/volvé a buscar el servicio/i)
  })

  it('explica el bloqueo vencido', () => {
    const mensaje = mensajeParaOperador(
      errorConCodigo('BLOQUEO_ERROR', 'bloqueo no encontrado'),
    )
    expect(mensaje).toMatch(/bloqueo de asientos ya no es válido/i)
  })

  it('devuelve el mensaje tal cual para errores comunes', () => {
    expect(mensajeParaOperador(new Error('sin conexión'))).toBe('sin conexión')
  })
})
