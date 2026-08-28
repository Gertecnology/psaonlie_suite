import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderEnRuta } from '@/test/router'
import { contieneDinero, respuestaJson } from '@/test/utils'
import { esquemaFiltrosInforme } from './models/informe.model'
import { InformePorAgencia } from './components/informes/por-agencia'

/**
 * La liquidación a empresas, que es el informe del que sale el formato de los
 * demás.
 *
 * Se prueba la pantalla y no el hook: lo que rompe en producción no es que el
 * hook devuelva mal un número, es que la hoja imprima una columna que no
 * corresponde, se coma un renglón o pierda el rótulo que dice qué documento es.
 * Cada caso de acá es una pregunta que alguien se hace mirando el papel.
 */
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    accessToken: 'token-de-prueba',
    user: { firstName: 'Sebastián', lastName: 'Castro', email: 'scastro@pasajeonline.com.py' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))
vi.mock('@/components/notifications/header-notifications', () => ({
  HeaderNotifications: () => null,
}))
vi.mock('@/components/profile-dropdown', () => ({ ProfileDropdown: () => null }))
vi.mock('@/components/search', () => ({ Search: () => null }))

const PERIODO = { desde: '2026-08-01', hasta: '2026-08-28', dias: 28 }

/** Espeja `InformePorAgenciaDto`, campo por campo. */
const POR_AGENCIA = {
  periodo: PERIODO,
  data: [
    {
      agenciaId: 'agencia-1',
      empresaNombre: 'Expreso Paraguay',
      porcentajeComisionVigente: 12,
      pasajes: 168420000,
      comisionDescontada: 20210400,
      devolucionesPasajes: 2100000,
      saldoAPagar: 146109600,
      pagadasSinBoletoCantidad: 0,
      pagadasSinBoletoMonto: 0,
      participacion: 40.8,
    },
    {
      agenciaId: 'agencia-2',
      empresaNombre: 'Delta S.A.',
      porcentajeComisionVigente: 10,
      pasajes: 121300000,
      comisionDescontada: 12130000,
      devolucionesPasajes: 0,
      saldoAPagar: 109170000,
      pagadasSinBoletoCantidad: 6,
      pagadasSinBoletoMonto: 2280000,
      participacion: 29.4,
    },
    {
      // La venta cuya agencia no quedó asentada. Es un renglón real.
      agenciaId: null,
      empresaNombre: 'Sin empresa registrada',
      porcentajeComisionVigente: null,
      pasajes: 6400000,
      comisionDescontada: 0,
      devolucionesPasajes: 0,
      saldoAPagar: 6400000,
      pagadasSinBoletoCantidad: 3,
      pagadasSinBoletoMonto: 1140000,
      participacion: 1.5,
    },
  ],
  totales: {
    pasajes: 296120000,
    comisionDescontada: 32340400,
    saldoAPagar: 261679600,
    pagadasSinBoletoCantidad: 9,
    pagadasSinBoletoMonto: 3420000,
  },
  total: 3,
  page: 1,
  limit: 200,
  totalPages: 1,
}

/** Lo que lleva un enlace compartido: el período más la marca de emitido. */
const EMITIDO = '?generado=true&desde=2026-08-01&hasta=2026-08-28'

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  // Un `Response` nuevo por llamada: el cuerpo se lee una sola vez, así que
  // devolver siempre la misma instancia deja sin datos a la segunda petición.
  fetchMock = vi.fn().mockImplementation(() =>
    Promise.resolve(
      respuestaJson({
        success: true,
        statusCode: 200,
        message: 'ok',
        data: POR_AGENCIA,
      }),
    ),
  )
  vi.stubGlobal('fetch', fetchMock)
})

function montar(busqueda = '') {
  return renderEnRuta(InformePorAgencia, {
    ruta: '/reports',
    busqueda,
    // Con el esquema del panel, Zod descartaría `generado` y la pantalla nunca
    // saldría del estado «todavía no se emitió».
    esquema: esquemaFiltrosInforme,
  })
}

describe('Liquidación a empresas transportistas', () => {
  it('al entrar no consulta nada y lo dice', async () => {
    montar()

    expect(await screen.findByText(/todavía no hay nada que ver/i)).toBeInTheDocument()
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).includes('/api/admin/informes/'),
      ),
    ).toHaveLength(0)
  })

  it('sin buscar no ofrece exportar: no hay nada que exportar todavía', async () => {
    montar()

    await screen.findByText(/todavía no hay nada que ver/i)
    expect(screen.queryByRole('button', { name: /exportar a pdf/i })).toBeNull()
  })

  it('la hoja se identifica: qué documento es y con qué código', async () => {
    montar(EMITIDO)

    expect(
      await screen.findByRole('heading', {
        name: /liquidación a empresas transportistas/i,
      }),
    ).toBeInTheDocument()
    // El código va en la hoja —membrete y pie— y NO en el título de la
    // pantalla: identifica al documento que se archiva, no a la pantalla que
    // se mira.
    expect(screen.getAllByText(/INF-ADM-002/).length).toBeGreaterThan(0)
    const titulo = screen.getByRole('heading', { name: /saldo por empresa/i })
    expect(titulo.textContent).not.toContain('INF-ADM-002')
  })

  it('la hoja dice con qué filtros se emitió, no muestra los filtros', async () => {
    montar(EMITIDO)

    // Se espera un dato de la respuesta, no el encabezado: el encabezado del
    // documento se dibuja desde el primer render, así que esperar por él no
    // garantiza que la ficha técnica ya tenga el período.
    await screen.findByText('Expreso Paraguay')
    // El período que se escribe es el que devolvió la API, no el que se pidió.
    // El texto se arma con varios nodos, así que se busca por el contenido del
    // elemento entero y no por un nodo suelto.
    expect(
      screen.getByText((_, elemento) => {
        const texto = elemento?.textContent ?? ''
        return (
          elemento?.tagName === 'DD' &&
          texto.includes('01/08/2026') &&
          texto.includes('28/08/2026') &&
          texto.includes('28 días')
        )
      }),
    ).toBeInTheDocument()
    expect(screen.getByText(/guaraníes, sin decimales/i)).toBeInTheDocument()
    expect(screen.getByText(/fecha de cobro/i)).toBeInTheDocument()
    expect(screen.getByText('DEFINITIVO')).toBeInTheDocument()
  })

  it('el saldo total es el de la API, no una suma del panel', async () => {
    montar(EMITIDO)

    // 261.679.600 es `totales.saldoAPagar`. La suma de los tres renglones da
    // lo mismo, y por eso el caso vale: si algún día difieren, manda la API.
    expect(await screen.findByText(contieneDinero('261.679.600'))).toBeInTheDocument()
  })

  it('escribe el saldo en letras al pie', async () => {
    montar(EMITIDO)

    expect(
      await screen.findByText(
        /doscientos sesenta y un millones seiscientos setenta y nueve mil seiscientos guaraníes/i,
      ),
    ).toBeInTheDocument()
  })

  it('una empresa con ventas cobradas sin boleto lo dice con texto, no sólo con color', async () => {
    montar(EMITIDO)

    // En papel el color no se imprime, y a quien no distingue el rojo no le
    // llega. El renglón tiene que decirlo.
    expect(
      await screen.findByText(/6 ventas cobradas sin boleto/i),
    ).toBeInTheDocument()
  })

  it('la venta sin agencia asentada es un renglón más, no se esconde', async () => {
    montar(EMITIDO)

    expect(await screen.findByText('Sin empresa registrada')).toBeInTheDocument()
    // Y entra en el total: 6.400.000 de los 261.679.600. Aparece dos veces en
    // el mismo renglón —pasajes y saldo— porque sin comisión son iguales.
    expect(screen.getAllByText(contieneDinero('6.400.000'))).toHaveLength(2)
  })

  it('una comisión vigente ausente se escribe con guion, no con cero', async () => {
    montar(EMITIDO)

    await screen.findByText('Sin empresa registrada')
    // Un cero diría que la empresa cobra 0 % de comisión; el guion dice que no
    // hay porcentaje configurado. No es lo mismo.
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('no lleva notas, ni firmas, ni exportación a Excel', async () => {
    montar(EMITIDO)

    await screen.findByText('Expreso Paraguay')
    expect(screen.queryByText(/^notas$/i)).toBeNull()
    expect(screen.queryByText(/preparado por/i)).toBeNull()
    expect(screen.queryByText(/recibido conforme/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /excel/i })).toBeNull()
  })

  it('con datos a la vista, ofrece exportar a PDF y nada más', async () => {
    montar(EMITIDO)

    expect(
      await screen.findByRole('button', { name: /exportar a pdf/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /imprimir/i })).toBeNull()
  })

  it('la tabla repite su encabezado al imprimir: es una tabla, no una grilla de divs', async () => {
    const { container } = montar(EMITIDO)

    await screen.findByText('Expreso Paraguay')
    // `thead { display: table-header-group }` sólo funciona sobre una <table>
    // de verdad. Sin ella, la segunda hoja sale sin nombres de columna.
    const tabla = container.querySelector('table.informe-tabla')
    expect(tabla).not.toBeNull()
    expect(tabla?.querySelector('thead')).not.toBeNull()
    expect(tabla?.querySelector('tfoot')).not.toBeNull()
  })
})
