import { useQuery } from '@tanstack/react-query'
import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconFileSpreadsheet,
} from '@tabler/icons-react'
import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { aParametrosApi } from '@/lib/periodo'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth-context'
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
import { TarjetaMetrica } from '@/features/dashboard/components/tarjeta-metrica'
import { TarjetaSeccion } from '@/features/dashboard/components/tarjeta-seccion'
import { useEstadisticas } from '@/features/dashboard/hooks/use-estadisticas'
import type { EstadoFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import {
  desgloseCobrado,
  verificarCuadre,
} from '@/features/dashboard/models/finanzas.model'
import { obtenerEstadisticasPagos } from '../../services/conciliacion.service'
import { exportarAExcel } from '../../utils/exportar-excel'

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * Conciliación de pagos.
 *
 * Cruza dos fuentes que tendrían que decir lo mismo:
 *
 * - **La pasarela** (`/api/pagos/estadisticas/resumen`): transacciones Bancard
 *   aprobadas y su monto, más los comprobantes de pago manual.
 * - **El libro de ventas** (`/api/admin/ventas/estadisticas`): lo que el
 *   sistema registró como cobrado.
 *
 * Si los dos números no coinciden, la diferencia se muestra tal cual. Ocultarla
 * o "ajustarla" sería exactamente lo contrario de conciliar.
 *
 * Dos límites conocidos, dichos en pantalla y no escondidos acá:
 *
 * 1. La comparación no es exacta por construcción. Bancard cobra
 *    `pasaje + cargo por servicio` en una sola transacción, pero las
 *    transacciones se cuentan por `createdAt` y las ventas por `fechaVenta`,
 *    y los pagos manuales no pasan por la pasarela. Sirve para detectar
 *    desvíos grandes, no para cerrar una caja al guaraní.
 * 2. Lo que ve el panel es lo que registró **nuestro** sistema. La conciliación
 *    completa —contra lo que ve cada empresa en su web server— necesita el
 *    kardex de movimientos, que todavía no existe.
 */
export function InformeConciliacion({ filtros }: Props) {
  const { accessToken } = useAuth()
  const { fechaDesde, fechaHasta } = aParametrosApi(filtros.periodo)

  const ventas = useEstadisticas({
    periodo: filtros.periodo,
    agenciaId: filtros.agenciaId,
  })

  const pagos = useQuery({
    queryKey: ['pagos-resumen', { fechaDesde, fechaHasta }, accessToken],
    queryFn: () => obtenerEstadisticasPagos({ fechaDesde, fechaHasta }),
    enabled: !!accessToken,
    staleTime: 60 * 1000,
  })

  if (ventas.error) {
    return (
      <EstadoError
        error={ventas.error}
        onReintentar={() => void ventas.refetch()}
      />
    )
  }

  if (ventas.isPending || pagos.isPending) return <SkeletonTabla filas={8} />

  const cobrado = desgloseCobrado(ventas.data?.generales)
  const cuadre = verificarCuadre(cobrado)
  const bancard = pagos.data?.bancard
  const manuales = pagos.data?.manuales

  const montoPasarela = bancard?.montoAprobado ?? 0
  const diferencia = cobrado.cobradoAlCliente - montoPasarela

  const filasCruce = [
    {
      concepto: 'Cobrado según el libro de ventas',
      detalle: 'Pasaje + cargo por servicio de las ventas pagadas',
      monto: cobrado.cobradoAlCliente,
    },
    {
      concepto: 'Aprobado por la pasarela',
      detalle: 'Transacciones Bancard en estado aprobada',
      monto: montoPasarela,
    },
    {
      concepto: 'Diferencia',
      detalle:
        'Incluye los cobros por transferencia y efectivo, que no pasan por la pasarela',
      monto: diferencia,
    },
  ]

  const exportar = () =>
    exportarAExcel({
      nombreArchivo: 'informe-conciliacion',
      nombreHoja: 'Conciliación',
      filas: filasCruce,
      columnas: [
        { encabezado: 'Concepto', valor: (f) => f.concepto, ancho: 34 },
        { encabezado: 'Detalle', valor: (f) => f.detalle, ancho: 52 },
        { encabezado: 'Monto', valor: (f) => f.monto, ancho: 18 },
      ],
    })

  return (
    <div className='space-y-6'>
      <BannerCuadre cuadra={cuadre.cuadra} diferencia={cuadre.diferenciaReparto} />

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <TarjetaMetrica
          destacada
          etiqueta='Cobrado (libro de ventas)'
          valor={formatearGuaranies(cobrado.cobradoAlCliente)}
          descripcion='Pasaje + cargo por servicio'
        />
        <TarjetaMetrica
          etiqueta='Aprobado por la pasarela'
          valor={formatearGuaranies(montoPasarela)}
          descripcion={`${formatearEntero(bancard?.aprobadas ?? 0)} transacciones`}
        />
        <TarjetaMetrica
          etiqueta='Tasa de éxito Bancard'
          valor={formatearPorcentaje(bancard?.tasaExito ?? 0)}
          descripcion={`sobre ${formatearEntero(bancard?.totalTransacciones ?? 0)} intentos`}
        />
        <TarjetaMetrica
          etiqueta='Comprobantes manuales'
          valor={formatearEntero(manuales?.totalComprobantes ?? 0)}
          descripcion={`${formatearEntero(manuales?.pendientes ?? 0)} sin verificar`}
          subirEsBueno={false}
        />
      </div>

      <div className='flex justify-end'>
        <Button variant='outline' size='sm' onClick={exportar}>
          <IconFileSpreadsheet className='size-4' aria-hidden />
          Exportar a Excel
        </Button>
      </div>

      <TarjetaSeccion
        nivel={3}
        titulo='Libro de ventas contra pasarela'
        descripcion='Las dos fuentes, y qué explica la diferencia.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-[16rem]'>Concepto</TableHead>
              <TableHead>Qué incluye</TableHead>
              <TableHead className='text-end'>Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filasCruce.map((fila) => (
              <TableRow key={fila.concepto}>
                <TableCell className='font-medium'>{fila.concepto}</TableCell>
                <TableCell className='text-muted-foreground text-sm'>
                  {fila.detalle}
                </TableCell>
                <TableCell className='text-end font-medium tabular-nums'>
                  {formatearGuaranies(fila.monto)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TarjetaSeccion>

      <TarjetaSeccion
        nivel={3}
        titulo='Estado de las transacciones de la pasarela'
        descripcion='Dónde se cae el cobro cuando se cae.'
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead className='text-end'>Transacciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ['Aprobadas', bancard?.aprobadas ?? 0],
              ['Rechazadas', bancard?.rechazadas ?? 0],
              ['Canceladas', bancard?.canceladas ?? 0],
              ['Expiradas', bancard?.expiradas ?? 0],
            ].map(([etiqueta, cantidad]) => (
              <TableRow key={String(etiqueta)}>
                <TableCell>{etiqueta}</TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearEntero(cantidad)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TarjetaSeccion>

      {pagos.error && (
        <EstadoError
          titulo='No se pudieron leer los datos de la pasarela'
          error={pagos.error}
          onReintentar={() => void pagos.refetch()}
        />
      )}

      <div className='text-muted-foreground max-w-prose space-y-2 text-xs leading-relaxed'>
        <p>
          La comparación no cierra al guaraní por construcción: las
          transacciones se cuentan por su fecha de creación y las ventas por su
          fecha de venta, y los cobros por transferencia o efectivo no pasan por
          la pasarela. Sirve para detectar desvíos grandes, no para cerrar caja.
        </p>
        <p>
          Esto concilia el sistema contra sí mismo. La conciliación real —contra
          lo que ve cada empresa en su propio web server— necesita el libro de
          movimientos que todavía no está implementado en el backend.
        </p>
      </div>
    </div>
  )
}

function BannerCuadre({
  cuadra,
  diferencia,
}: {
  cuadra: boolean
  diferencia: number
}) {
  const Icono = cuadra ? IconCircleCheckFilled : IconAlertTriangleFilled

  return (
    <div
      role={cuadra ? undefined : 'alert'}
      className={cn(
        'border-border flex items-start gap-3 rounded-xl border p-4',
        cuadra
          ? 'bg-[color-mix(in_oklab,var(--estado-ok)_7%,transparent)]'
          : 'bg-[color-mix(in_oklab,var(--estado-critico)_8%,transparent)]',
      )}
    >
      <Icono
        className={cn(
          'mt-0.5 size-5 shrink-0',
          cuadra ? 'text-[var(--estado-ok)]' : 'text-[var(--estado-critico)]',
        )}
        aria-hidden
      />
      <div className='min-w-0'>
        <p className='text-foreground text-sm font-medium'>
          {cuadra
            ? 'El reparto del dinero cuadra'
            : 'El reparto del dinero no cuadra'}
        </p>
        <p className='text-muted-foreground mt-0.5 text-xs leading-relaxed'>
          {cuadra
            ? 'Lo cobrado al cliente es exactamente el neto de las empresas más nuestro ingreso. Las dos lecturas del mismo total coinciden.'
            : `Hay una diferencia de ${formatearGuaranies(Math.abs(diferencia))} entre lo cobrado y la suma del reparto. Es un problema de los datos, no de la pantalla.`}
        </p>
      </div>
    </div>
  )
}
