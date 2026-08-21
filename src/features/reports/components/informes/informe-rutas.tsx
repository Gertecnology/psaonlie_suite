import { IconFileSpreadsheet } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  EstadoError,
  SkeletonTabla,
} from '@/features/dashboard/components/estados'
import { RankingRutas } from '@/features/dashboard/components/ranking-rutas'
import { useEstadisticas } from '@/features/dashboard/hooks/use-estadisticas'
import type { EstadoFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import { exportarAExcel } from '../../utils/exportar-excel'

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * Ranking de rutas.
 *
 * A diferencia del panel principal —que recorta a las diez primeras para no
 * tapar el resto de la pantalla— acá se exporta el listado completo: el
 * informe existe para eso.
 */
export function InformeRutas({ filtros }: Props) {
  const consulta = useEstadisticas({
    periodo: filtros.periodo,
    empresaId: filtros.empresaId,
  })

  if (consulta.error) {
    return (
      <EstadoError
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  if (consulta.isPending) return <SkeletonTabla filas={8} />

  const rutas = consulta.data?.porRuta ?? []

  const exportar = () =>
    exportarAExcel({
      nombreArchivo: 'informe-rutas',
      nombreHoja: 'Por ruta',
      filas: rutas,
      columnas: [
        { encabezado: 'Origen', valor: (r) => r.origenNombre, ancho: 22 },
        { encabezado: 'Destino', valor: (r) => r.destinoNombre, ancho: 22 },
        { encabezado: 'Ventas', valor: (r) => r.cantidad },
        { encabezado: 'Pasaje vendido', valor: (r) => r.monto, ancho: 18 },
        {
          encabezado: 'Ticket promedio',
          valor: (r) => (r.cantidad > 0 ? r.monto / r.cantidad : 0),
          ancho: 18,
        },
      ],
      totales: [
        'Total',
        '',
        rutas.reduce((acc, r) => acc + r.cantidad, 0),
        rutas.reduce((acc, r) => acc + r.monto, 0),
        '',
      ],
    })

  return (
    <div className='space-y-6'>
      {rutas.length > 0 && (
        <div className='flex justify-end'>
          <Button variant='outline' size='sm' onClick={exportar}>
            <IconFileSpreadsheet className='size-4' aria-hidden />
            Exportar {rutas.length} rutas a Excel
          </Button>
        </div>
      )}

      <RankingRutas rutas={rutas} cargando={false} />
    </div>
  )
}
