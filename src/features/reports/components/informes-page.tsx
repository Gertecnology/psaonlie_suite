import { describirPeriodo } from '@/lib/periodo'
import { cn } from '@/lib/utils'
import { PageLayout } from '@/components/layout/page-layout'
import { FiltrosPanel } from '@/features/dashboard/components/filtros-panel'
import { useFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import {
  DEFINICIONES,
  INFORME_POR_DEFECTO,
  esIdInforme,
  type IdInforme,
} from '../models/informes.model'
import { InformeComparativo } from './informes/informe-comparativo'
import { InformeConciliacion } from './informes/informe-conciliacion'
import { InformeEmpresas } from './informes/informe-empresas'
import { InformeEstados } from './informes/informe-estados'
import { InformeMetodosPago } from './informes/informe-metodos-pago'
import { InformeRutas } from './informes/informe-rutas'
import { InformeVentas } from './informes/informe-ventas'

/**
 * Sección de informes.
 *
 * Comparte el selector de período con el panel principal —el mismo componente,
 * el mismo estado en la URL— para que pasar de uno a otro no obligue a
 * reconstruir el filtro. El informe activo también vive en la URL, así que un
 * informe concreto con su rango se pasa por link.
 *
 * Todos los filtros se resuelven en el servidor. Ninguno de estos informes
 * recorta ni suma del lado del cliente lo que el backend ya calculó sobre el
 * conjunto completo: era eso lo que hacía que el buscador de la versión
 * anterior sólo encontrara lo que estaba en la página visible.
 */
export function InformesPage() {
  const filtros = useFiltrosPanel()
  const activo: IdInforme = esIdInforme(filtros.informe)
    ? filtros.informe
    : INFORME_POR_DEFECTO

  const definicion =
    DEFINICIONES.find((d) => d.id === activo) ?? DEFINICIONES[0]

  return (
    <PageLayout
      title='Informes'
      description={`Ventas, comisiones y conciliación · ${describirPeriodo(filtros.periodo)}`}
      showSearch={false}
    >
      <FiltrosPanel filtros={filtros} />

      {/* Lista de informes: navegación real con teclado (flechas del navegador
          sobre botones en una fila), no un menú desplegable escondido. */}
      <nav
        aria-label='Informes disponibles'
        className='border-border mb-6 flex flex-wrap gap-1 border-b pb-3'
      >
        {DEFINICIONES.map((informe) => {
          const seleccionado = informe.id === activo
          return (
            <button
              key={informe.id}
              type='button'
              aria-current={seleccionado ? 'page' : undefined}
              onClick={() => filtros.aplicarInforme(informe.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm transition-colors',
                'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                seleccionado
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {informe.titulo}
            </button>
          )
        })}
      </nav>

      <div className='mb-6'>
        <h2 className='text-foreground text-lg font-semibold'>
          {definicion.titulo}
        </h2>
        <p className='text-muted-foreground max-w-prose text-sm leading-relaxed'>
          {definicion.descripcion}
        </p>
      </div>

      {activo === 'ventas' && <InformeVentas filtros={filtros} />}
      {activo === 'empresas' && <InformeEmpresas filtros={filtros} />}
      {activo === 'estados' && <InformeEstados filtros={filtros} />}
      {activo === 'metodos-pago' && <InformeMetodosPago filtros={filtros} />}
      {activo === 'rutas' && <InformeRutas filtros={filtros} />}
      {activo === 'comparativo' && <InformeComparativo filtros={filtros} />}
      {activo === 'conciliacion' && <InformeConciliacion filtros={filtros} />}
    </PageLayout>
  )
}
