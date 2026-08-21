import { IconFileSpreadsheet } from '@tabler/icons-react'
import {
  calcularVariacion,
  formatearEntero,
  formatearGuaranies,
  formatearVariacion,
} from '@/lib/formato'
import { describirPeriodo } from '@/lib/periodo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  EstadoError,
  SkeletonTabla,
} from '@/features/dashboard/components/estados'
import { GraficoTendencia } from '@/features/dashboard/components/grafico-tendencia'
import { TarjetaSeccion } from '@/features/dashboard/components/tarjeta-seccion'
import { useComparativo } from '@/features/dashboard/hooks/use-estadisticas'
import type { EstadoFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import type { EstadisticasGenerales } from '@/features/dashboard/models/estadisticas.model'
import {
  desgloseCobrado,
  desglosePendiente,
} from '@/features/dashboard/models/finanzas.model'
import { exportarAExcel } from '../../utils/exportar-excel'

interface FilaComparativo {
  metrica: string
  actual: number
  anterior: number
  /** Cómo se muestra el valor. */
  formato: 'dinero' | 'entero'
  /** `false` cuando subir es malo (pendientes, cancelaciones). */
  subirEsBueno: boolean
}

function armarFilas(
  actual: EstadisticasGenerales | undefined,
  anterior: EstadisticasGenerales | undefined,
): FilaComparativo[] {
  const a = desgloseCobrado(actual)
  const b = desgloseCobrado(anterior)
  const pa = desglosePendiente(actual)
  const pb = desglosePendiente(anterior)

  return [
    {
      metrica: 'Cobrado al cliente',
      actual: a.cobradoAlCliente,
      anterior: b.cobradoAlCliente,
      formato: 'dinero',
      subirEsBueno: true,
    },
    {
      metrica: 'Pasaje',
      actual: a.pasaje,
      anterior: b.pasaje,
      formato: 'dinero',
      subirEsBueno: true,
    },
    {
      metrica: 'Cargo por servicio',
      actual: a.cargoServicio,
      anterior: b.cargoServicio,
      formato: 'dinero',
      subirEsBueno: true,
    },
    {
      metrica: 'Comisión',
      actual: a.comision,
      anterior: b.comision,
      formato: 'dinero',
      subirEsBueno: true,
    },
    {
      metrica: 'Nuestro ingreso',
      actual: a.ingresoPasajeOnline,
      anterior: b.ingresoPasajeOnline,
      formato: 'dinero',
      subirEsBueno: true,
    },
    {
      metrica: 'Neto a las empresas',
      actual: a.netoAEmpresas,
      anterior: b.netoAEmpresas,
      formato: 'dinero',
      subirEsBueno: true,
    },
    {
      metrica: 'Pendiente de cobro',
      actual: pa.cobradoAlCliente,
      anterior: pb.cobradoAlCliente,
      formato: 'dinero',
      subirEsBueno: false,
    },
    {
      metrica: 'Ventas totales',
      actual: actual?.totalVentas ?? 0,
      anterior: anterior?.totalVentas ?? 0,
      formato: 'entero',
      subirEsBueno: true,
    },
    {
      metrica: 'Ventas completadas',
      actual: actual?.ventasCompletadas ?? 0,
      anterior: anterior?.ventasCompletadas ?? 0,
      formato: 'entero',
      subirEsBueno: true,
    },
    {
      metrica: 'Ventas canceladas',
      actual: actual?.ventasCanceladas ?? 0,
      anterior: anterior?.ventasCanceladas ?? 0,
      formato: 'entero',
      subirEsBueno: false,
    },
    {
      metrica: 'Ventas expiradas',
      actual: actual?.ventasExpiradas ?? 0,
      anterior: anterior?.ventasExpiradas ?? 0,
      formato: 'entero',
      subirEsBueno: false,
    },
    {
      metrica: 'Boletos emitidos',
      actual: actual?.totalBoletos ?? 0,
      anterior: anterior?.totalBoletos ?? 0,
      formato: 'entero',
      subirEsBueno: true,
    },
  ]
}

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * El período elegido contra el inmediatamente anterior, métrica por métrica.
 *
 * Las dos columnas salen de dos consultas completas al endpoint de
 * estadísticas, no del campo `comparacion` que devuelve el backend. Ese campo
 * sólo cubre cantidad de ventas y monto total, y —lo que importa— informa `0`
 * cuando el período anterior no tuvo ventas, que es indistinguible de "no
 * varió". Acá, sin base de comparación, la celda dice justamente eso.
 */
export function InformeComparativo({ filtros }: Props) {
  const { actual, anterior, cargando, error } = useComparativo({
    periodo: filtros.periodo,
    empresaId: filtros.empresaId,
  })

  if (error) return <EstadoError error={error} />
  if (cargando) return <SkeletonTabla filas={10} />

  const filas = armarFilas(actual?.generales, anterior?.generales)
  const formatear = (fila: FilaComparativo, valor: number) =>
    fila.formato === 'dinero'
      ? formatearGuaranies(valor)
      : formatearEntero(valor)

  const exportar = () =>
    exportarAExcel({
      nombreArchivo: 'informe-comparativo',
      nombreHoja: 'Comparativo',
      filas,
      columnas: [
        { encabezado: 'Métrica', valor: (f) => f.metrica, ancho: 24 },
        {
          encabezado: `Actual (${describirPeriodo(filtros.periodo)})`,
          valor: (f) => f.actual,
          ancho: 26,
        },
        {
          encabezado: `Anterior (${describirPeriodo(filtros.anterior)})`,
          valor: (f) => f.anterior,
          ancho: 26,
        },
        {
          encabezado: 'Variación %',
          valor: (f) => {
            const v = calcularVariacion(f.actual, f.anterior)
            return v === null ? 'sin base' : Math.round(v * 10) / 10
          },
          ancho: 14,
        },
      ],
    })

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <p className='text-muted-foreground text-sm'>
          <strong className='text-foreground font-medium'>
            {describirPeriodo(filtros.periodo)}
          </strong>{' '}
          contra{' '}
          <strong className='text-foreground font-medium'>
            {describirPeriodo(filtros.anterior)}
          </strong>
        </p>
        <Button variant='outline' size='sm' onClick={exportar}>
          <IconFileSpreadsheet className='size-4' aria-hidden />
          Exportar a Excel
        </Button>
      </div>

      <TarjetaSeccion
        nivel={3}
        titulo='Evolución diaria'
        descripcion='Los dos períodos alineados por día, sobre un mismo eje de valores.'
      >
        <GraficoTendencia
          periodo={filtros.periodo}
          anterior={filtros.anterior}
          temporalesActual={actual?.temporales}
          temporalesAnterior={anterior?.temporales}
          cargando={false}
        />
      </TarjetaSeccion>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-[12rem]'>Métrica</TableHead>
              <TableHead className='text-end'>Período actual</TableHead>
              <TableHead className='text-end'>Período anterior</TableHead>
              <TableHead className='text-end'>Variación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila) => {
              const variacion = calcularVariacion(fila.actual, fila.anterior)
              const plano = variacion !== null && Math.abs(variacion) < 0.05
              const bueno =
                variacion !== null && variacion > 0 === fila.subirEsBueno

              return (
                <TableRow key={fila.metrica}>
                  <TableCell className='font-medium'>{fila.metrica}</TableCell>
                  <TableCell className='text-end tabular-nums'>
                    {formatear(fila, fila.actual)}
                  </TableCell>
                  <TableCell className='text-muted-foreground text-end tabular-nums'>
                    {formatear(fila, fila.anterior)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-end font-medium tabular-nums',
                      variacion === null || plano
                        ? 'text-muted-foreground'
                        : bueno
                          ? 'text-[var(--estado-ok)]'
                          : 'text-[var(--estado-critico)]',
                    )}
                  >
                    {variacion === null
                      ? 'Sin base'
                      : formatearVariacion(variacion)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <p className='text-muted-foreground max-w-prose text-xs leading-relaxed'>
        &quot;Sin base&quot; significa que el período anterior no tuvo
        movimiento en esa métrica: no hay contra qué comparar, y poner 0% o 100%
        sería inventar un dato.
      </p>
    </div>
  )
}
