import { Link } from '@tanstack/react-router'
import { IconFileSpreadsheet } from '@tabler/icons-react'
import { aFechaISOLocal, aParametrosApi, describirPeriodo } from '@/lib/periodo'
import { Button } from '@/components/ui/button'
import { PageLayout } from '@/components/layout/page-layout'
import { ComposicionMetodosPago } from './components/composicion-metodos-pago'
import { DesgloseDinero } from './components/desglose-dinero'
import { EstadoError } from './components/estados'
import { FiltrosPanel } from './components/filtros-panel'
import { GraficoTendencia } from './components/grafico-tendencia'
import { PanelAlertas } from './components/panel-alertas'
import { RankingEmpresas } from './components/ranking-empresas'
import { RankingRutas } from './components/ranking-rutas'
import { TablaVentas } from './components/tabla-ventas'
import { TarjetaSeccion } from './components/tarjeta-seccion'
import { useComparativo } from './hooks/use-estadisticas'
import { useFiltrosPanel } from './hooks/use-filtros-panel'
import { useVentas } from './hooks/use-ventas'

/**
 * Panel de control.
 *
 * El orden de la pantalla es una decisión, no una casualidad:
 *
 * 1. **Alertas.** Lo único que exige una acción hoy. Va arriba de todo porque
 *    las 33 ventas cobradas sin boleto que hay en producción existían desde
 *    hacía meses y ninguna pantalla las mostraba.
 * 2. **El dinero, desglosado.** Pasaje, cargo por servicio, comisión y neto a
 *    las empresas, separados y nunca sumados entre sí.
 * 3. **La tendencia** contra el período anterior.
 * 4. **Los rankings** por empresa y por ruta, y la composición por método de
 *    pago.
 * 5. **Las últimas ventas**, como puerta de entrada al detalle.
 *
 * Un único selector de período arriba gobierna todo lo de abajo: si cada
 * tarjeta tuviera su propio filtro, dos números de la misma pantalla podrían
 * contradecirse.
 */
export default function Dashboard() {
  const filtros = useFiltrosPanel()
  const { actual, anterior, cargando, refrescando, error } = useComparativo({
    periodo: filtros.periodo,
    agenciaId: filtros.agenciaId,
  })

  // Sólo los campos serializables: `filtros` también trae los callbacks.
  const busqueda = {
    preset: filtros.preset,
    desde: aFechaISOLocal(filtros.periodo.desde),
    hasta: aFechaISOLocal(filtros.periodo.hasta),
    agenciaId: filtros.agenciaId,
  }

  const { fechaDesde, fechaHasta } = aParametrosApi(filtros.periodo)
  const ultimasVentas = useVentas({
    fechaVentaDesde: fechaDesde,
    fechaVentaHasta: fechaHasta,
    agenciaId: filtros.agenciaId,
    limit: 8,
    sortBy: 'fechaVenta',
    sortOrder: 'DESC',
  })

  return (
    <PageLayout
      title='Panel de control'
      description={`Ventas, comisiones y alertas operativas · ${describirPeriodo(filtros.periodo)}`}
      showSearch={false}
    >
      <FiltrosPanel filtros={filtros}>
        <Button asChild variant='outline' size='sm'>
          <Link to='/reports' search={busqueda}>
            <IconFileSpreadsheet className='size-4' aria-hidden />
            Informes
          </Link>
        </Button>
      </FiltrosPanel>

      <PanelAlertas periodo={filtros.periodo} />

      {error ? (
        <EstadoError
          titulo='No se pudieron cargar las estadísticas'
          error={error}
        />
      ) : (
        <>
          <DesgloseDinero
            generales={actual?.generales}
            generalesAnterior={anterior?.generales}
            cargando={cargando}
          />

          <div className='mb-6 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
            <TarjetaSeccion
              titulo='Tendencia de ventas'
              descripcion='Pasaje vendido por día, contra el mismo tramo del período anterior.'
              refrescando={refrescando}
            >
              <GraficoTendencia
                periodo={filtros.periodo}
                anterior={filtros.anterior}
                temporalesActual={actual?.temporales}
                temporalesAnterior={anterior?.temporales}
                cargando={cargando}
              />
            </TarjetaSeccion>

            <TarjetaSeccion
              titulo='Métodos de pago'
              descripcion='Cómo se reparte lo vendido entre las formas de cobro.'
              refrescando={refrescando}
            >
              <ComposicionMetodosPago
                metodos={actual?.porMetodoPago}
                cargando={cargando}
              />
            </TarjetaSeccion>
          </div>

          <div className='mb-6 grid gap-6'>
            <TarjetaSeccion
              titulo='Por empresa'
              descripcion='Cuánto le queda a cada empresa y cuánto es comisión nuestra.'
              refrescando={refrescando}
            >
              <RankingEmpresas
                empresas={actual?.porAgencia}
                cargando={cargando}
              />
            </TarjetaSeccion>

            <TarjetaSeccion
              titulo='Por ruta'
              descripcion='Las rutas que más facturan en el período.'
              refrescando={refrescando}
            >
              <RankingRutas rutas={actual?.porRuta} cargando={cargando} />
            </TarjetaSeccion>
          </div>

          <TarjetaSeccion
            titulo='Últimas ventas'
            descripcion='Las ocho más recientes del período.'
            acciones={
              <Button asChild variant='ghost' size='sm'>
                <Link to='/reports' search={{ ...busqueda, informe: 'ventas' }}>
                  Ver todas
                </Link>
              </Button>
            }
            refrescando={ultimasVentas.isFetching && !ultimasVentas.isPending}
          >
            {ultimasVentas.error ? (
              <EstadoError
                error={ultimasVentas.error}
                onReintentar={() => void ultimasVentas.refetch()}
              />
            ) : (
              <TablaVentas
                ventas={ultimasVentas.data?.data}
                cargando={ultimasVentas.isPending}
                compacta
                vacio={{
                  titulo: 'Sin ventas en el período',
                  descripcion:
                    'No se registraron ventas en el rango elegido. Probá con un período más amplio.',
                }}
              />
            )}
          </TarjetaSeccion>
        </>
      )}
    </PageLayout>
  )
}
