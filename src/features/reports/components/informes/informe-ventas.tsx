import { useEffect, useMemo, useState } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconFileSpreadsheet,
  IconSearch,
} from '@tabler/icons-react'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import { aParametrosApi } from '@/lib/periodo'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EstadoError } from '@/features/dashboard/components/estados'
import { TablaVentas } from '@/features/dashboard/components/tabla-ventas'
import { TarjetaMetrica } from '@/features/dashboard/components/tarjeta-metrica'
import type { EstadoFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import { useExportarVentas, useVentas } from '@/features/dashboard/hooks/use-ventas'
import { calcularDesglose } from '@/features/dashboard/models/finanzas.model'
import {
  ESTADOS_PAGO,
  ESTADOS_VENTA,
  ETIQUETAS_ESTADO_PAGO,
  ETIQUETAS_ESTADO_VENTA,
  ETIQUETAS_METODO_PAGO,
  METODOS_PAGO,
  type EstadoPago,
  type EstadoVenta,
  type FiltrosVentas,
  type MetodoPago,
} from '@/features/dashboard/models/ventas.model'

const TODOS = '__todos__'
const FILAS_POR_PAGINA = 25

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * Detalle de ventas del período.
 *
 * Los filtros —búsqueda por número de transacción, estado de pago, estado de
 * venta y método— los aplica **el servidor**, y forman parte de la clave de
 * caché. Filtrar del lado del cliente sólo alcanzaba a las filas de la página
 * visible: buscar una transacción estando en la página 1 no la encontraba si
 * vivía en la 4, y para el usuario eso se lee, con razón, como "el buscador no
 * funciona".
 *
 * Los totales del encabezado vienen de `resumenFiltros`, que el backend calcula
 * sobre **todo** el conjunto filtrado. Por eso son correctos aunque en pantalla
 * haya 25 filas.
 */
export function InformeVentas({ filtros }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [estadoPago, setEstadoPago] = useState<string>(TODOS)
  const [estadoVenta, setEstadoVenta] = useState<string>(TODOS)
  const [metodoPago, setMetodoPago] = useState<string>(TODOS)
  const [pagina, setPagina] = useState(1)

  const busquedaDiferida = useDebouncedValue(busqueda, 400)
  const { fechaDesde, fechaHasta } = aParametrosApi(filtros.periodo)

  const filtrosServidor = useMemo<FiltrosVentas>(
    () => ({
      fechaVentaDesde: fechaDesde,
      fechaVentaHasta: fechaHasta,
      agenciaId: filtros.agenciaId,
      numeroTransaccion: busquedaDiferida || undefined,
      estadoPago:
        estadoPago === TODOS ? undefined : (estadoPago as EstadoPago),
      estadoVenta:
        estadoVenta === TODOS ? undefined : (estadoVenta as EstadoVenta),
      metodoPago:
        metodoPago === TODOS ? undefined : (metodoPago as MetodoPago),
    }),
    [
      fechaDesde,
      fechaHasta,
      filtros.agenciaId,
      busquedaDiferida,
      estadoPago,
      estadoVenta,
      metodoPago,
    ],
  )

  // Cambiar un filtro tiene que devolver a la primera página: si no, la tabla
  // aparece vacía porque la página 4 del resultado nuevo no existe.
  useEffect(() => setPagina(1), [filtrosServidor])

  const consulta = useVentas({
    ...filtrosServidor,
    page: pagina,
    limit: FILAS_POR_PAGINA,
    sortBy: 'fechaVenta',
    sortOrder: 'DESC',
  })

  const { exportar, exportando } = useExportarVentas()

  const resumen = consulta.data?.resumenFiltros
  const desglose = calcularDesglose({
    pasaje: resumen?.totalImporte ?? 0,
    cargoServicio: resumen?.totalServiceCharge ?? 0,
    comision: resumen?.totalComision ?? 0,
  })

  const totalPaginas = consulta.data?.totalPages ?? 0

  if (consulta.error) {
    return (
      <EstadoError
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='relative min-w-[14rem] flex-1'>
          <IconSearch
            className='text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2'
            aria-hidden
          />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder='Buscar por número de transacción'
            aria-label='Buscar por número de transacción'
            className='ps-9'
          />
        </div>

        <SelectorFiltro
          etiqueta='Estado de pago'
          valor={estadoPago}
          onCambio={setEstadoPago}
          opciones={ESTADOS_PAGO.map((e) => ({
            valor: e,
            texto: ETIQUETAS_ESTADO_PAGO[e],
          }))}
        />
        <SelectorFiltro
          etiqueta='Estado de venta'
          valor={estadoVenta}
          onCambio={setEstadoVenta}
          opciones={ESTADOS_VENTA.map((e) => ({
            valor: e,
            texto: ETIQUETAS_ESTADO_VENTA[e],
          }))}
        />
        <SelectorFiltro
          etiqueta='Método de pago'
          valor={metodoPago}
          onCambio={setMetodoPago}
          opciones={METODOS_PAGO.map((m) => ({
            valor: m,
            texto: ETIQUETAS_METODO_PAGO[m],
          }))}
        />

        <Button
          variant='outline'
          size='sm'
          disabled={exportando}
          onClick={() => void exportar(filtrosServidor, 'xlsx')}
        >
          <IconFileSpreadsheet className='size-4' aria-hidden />
          {exportando ? 'Generando…' : 'Exportar a Excel'}
        </Button>
      </div>

      {/* Los totales son de todo el conjunto filtrado, no de la página. */}
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <TarjetaMetrica
          etiqueta='Ventas'
          valor={formatearEntero(consulta.data?.total ?? 0)}
          descripcion='Con los filtros aplicados'
        />
        <TarjetaMetrica
          etiqueta='Pasaje'
          valor={formatearGuaranies(desglose.pasaje)}
          descripcion='Lo factura la empresa'
        />
        <TarjetaMetrica
          etiqueta='Cargo por servicio'
          valor={formatearGuaranies(desglose.cargoServicio)}
          descripcion='Lo facturamos nosotros'
        />
        <TarjetaMetrica
          etiqueta='Comisión'
          valor={formatearGuaranies(desglose.comision)}
          descripcion='Se descuenta del pasaje'
        />
      </div>

      <div
        className={
          consulta.isFetching && !consulta.isPending
            ? 'opacity-60 transition-opacity'
            : 'transition-opacity'
        }
        aria-busy={consulta.isFetching}
      >
        <TablaVentas
          ventas={consulta.data?.data}
          cargando={consulta.isPending}
          vacio={{
            titulo: 'Ninguna venta coincide con los filtros',
            descripcion:
              'Probá ampliando el rango de fechas, quitando el filtro de estado, o revisá el número de transacción que buscaste.',
          }}
        />
      </div>

      {totalPaginas > 1 && (
        <nav
          className='flex items-center justify-between gap-4'
          aria-label='Paginación de ventas'
        >
          <p className='text-muted-foreground text-sm'>
            Página {pagina} de {totalPaginas} ·{' '}
            {formatearEntero(consulta.data?.total ?? 0)} ventas
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              <IconChevronLeft className='size-4' aria-hidden />
              Anterior
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              Siguiente
              <IconChevronRight className='size-4' aria-hidden />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}

function SelectorFiltro({
  etiqueta,
  valor,
  onCambio,
  opciones,
}: {
  etiqueta: string
  valor: string
  onCambio: (valor: string) => void
  opciones: { valor: string; texto: string }[]
}) {
  return (
    <Select value={valor} onValueChange={onCambio}>
      <SelectTrigger className='w-[12rem]' aria-label={etiqueta}>
        <SelectValue placeholder={etiqueta} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{etiqueta}: todos</SelectItem>
        {opciones.map((opcion) => (
          <SelectItem key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
