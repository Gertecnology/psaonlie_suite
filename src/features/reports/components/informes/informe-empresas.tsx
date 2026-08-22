import { useMemo } from 'react'
import { IconFileSpreadsheet } from '@tabler/icons-react'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import { describirPeriodo } from '@/lib/periodo'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  EstadoError,
  EstadoVacio,
  SkeletonTabla,
} from '@/features/dashboard/components/estados'
import { TarjetaMetrica } from '@/features/dashboard/components/tarjeta-metrica'
import { useEstadisticas } from '@/features/dashboard/hooks/use-estadisticas'
import type { EstadoFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import type { EstadisticasPorAgencia } from '@/features/dashboard/models/estadisticas.model'
import {
  desgloseEmpresaCobrado,
  sumarDesgloses,
  type DesgloseDinero,
} from '@/features/dashboard/models/finanzas.model'
import { exportarAExcel } from '../../utils/exportar-excel'

interface FilaEmpresa {
  id: string
  nombre: string
  ventas: number
  cobrado: DesgloseDinero
  /** Pasaje vendido todavía sin cobrar. No se le debe a nadie aún. */
  pendiente: number
}

function armarFilas(empresas: EstadisticasPorAgencia[]): FilaEmpresa[] {
  return empresas
    .map<FilaEmpresa>((empresa) => ({
      id: empresa.agenciaId,
      nombre: empresa.empresaNombre,
      ventas: empresa.cantidad,
      cobrado: desgloseEmpresaCobrado(empresa),
      pendiente: empresa.montoPendiente,
    }))
    .filter((f) => f.cobrado.pasaje > 0 || f.pendiente > 0)
    .sort((a, b) => b.cobrado.netoAEmpresas - a.cobrado.netoAEmpresas)
}

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * Saldo por empresa: cuánto hay que transferirle a cada una.
 *
 * El "neto a transferir" es el pasaje **cobrado** menos nuestra comisión. Tres
 * precisiones que hacen que el número signifique algo:
 *
 * - Se cuenta sólo lo cobrado. Una reserva impaga no le debe plata a nadie.
 * - El cargo por servicio **no** entra en el saldo de la empresa: ese cobro es
 *   nuestro y lo facturamos nosotros.
 * - La comisión no se le factura aparte a la empresa: se descuenta de lo que se
 *   le transfiere. Por eso resta acá y no aparece como cuenta por cobrar.
 *
 * PENDIENTE (backend): esto es un cálculo, no un saldo persistido. No existe
 * registro de liquidaciones ni de pagos efectuados a las empresas, así que la
 * columna dice "cuánto se generó en el período", no "cuánto queda debiendo".
 * El diseño del kardex de movimientos es lo que convierte esto en un saldo real.
 */
export function InformeEmpresas({ filtros }: Props) {
  const consulta = useEstadisticas({
    periodo: filtros.periodo,
    agenciaId: filtros.agenciaId,
  })

  const filas = useMemo(
    () => armarFilas(consulta.data?.porAgencia ?? []),
    [consulta.data],
  )

  if (consulta.error) {
    return (
      <EstadoError
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  if (consulta.isPending) return <SkeletonTabla filas={8} />

  if (filas.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin movimiento por empresa'
        descripcion='Ninguna empresa registró ventas en este período. Probá ampliando el rango de fechas.'
      />
    )
  }

  const totales = sumarDesgloses(filas.map((f) => f.cobrado))
  const totalPendiente = filas.reduce((acc, f) => acc + f.pendiente, 0)
  const totalVentas = filas.reduce((acc, f) => acc + f.ventas, 0)

  const exportar = () =>
    exportarAExcel({
      nombreArchivo: 'informe-empresas',
      nombreHoja: 'Por empresa',
      filas,
      columnas: [
        { encabezado: 'Empresa', valor: (f) => f.nombre, ancho: 28 },
        { encabezado: 'Ventas', valor: (f) => f.ventas },
        { encabezado: 'Pasaje cobrado', valor: (f) => f.cobrado.pasaje, ancho: 16 },
        { encabezado: 'Comisión', valor: (f) => f.cobrado.comision, ancho: 16 },
        {
          encabezado: 'Neto a transferir',
          valor: (f) => f.cobrado.netoAEmpresas,
          ancho: 18,
        },
        {
          encabezado: 'Cargo por servicio (nuestro)',
          valor: (f) => f.cobrado.cargoServicio,
          ancho: 26,
        },
        {
          encabezado: 'Pasaje pendiente de cobro',
          valor: (f) => f.pendiente,
          ancho: 24,
        },
      ],
      totales: [
        `Total · ${describirPeriodo(filtros.periodo)}`,
        totalVentas,
        totales.pasaje,
        totales.comision,
        totales.netoAEmpresas,
        totales.cargoServicio,
        totalPendiente,
      ],
    })

  return (
    <div className='space-y-6'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <TarjetaMetrica
          destacada
          etiqueta='Neto a transferir'
          valor={formatearGuaranies(totales.netoAEmpresas)}
          descripcion='Suma de todas las empresas'
        />
        <TarjetaMetrica
          etiqueta='Pasaje cobrado'
          valor={formatearGuaranies(totales.pasaje)}
        />
        <TarjetaMetrica
          etiqueta='Comisión retenida'
          valor={formatearGuaranies(totales.comision)}
        />
        <TarjetaMetrica
          etiqueta='Pendiente de cobro'
          valor={formatearGuaranies(totalPendiente)}
          descripcion='Todavía no se le debe a nadie'
          subirEsBueno={false}
        />
      </div>

      <div className='flex justify-end'>
        <Button variant='outline' size='sm' onClick={exportar}>
          <IconFileSpreadsheet className='size-4' aria-hidden />
          Exportar a Excel
        </Button>
      </div>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-[12rem]'>Empresa</TableHead>
              <TableHead className='text-end'>Ventas</TableHead>
              <TableHead className='text-end'>Pasaje cobrado</TableHead>
              <TableHead className='text-end'>Comisión</TableHead>
              <TableHead className='text-end'>Neto a transferir</TableHead>
              <TableHead className='text-end'>Cargo servicio</TableHead>
              <TableHead className='text-end'>Pendiente</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filas.map((fila) => (
              <TableRow key={fila.id}>
                <TableCell className='font-medium'>{fila.nombre}</TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearEntero(fila.ventas)}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearGuaranies(fila.cobrado.pasaje)}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  −{formatearGuaranies(fila.cobrado.comision)}
                </TableCell>
                <TableCell className='text-end font-medium tabular-nums'>
                  {formatearGuaranies(fila.cobrado.netoAEmpresas)}
                </TableCell>
                <TableCell className='text-muted-foreground text-end tabular-nums'>
                  {formatearGuaranies(fila.cobrado.cargoServicio)}
                </TableCell>
                <TableCell className='text-muted-foreground text-end tabular-nums'>
                  {formatearGuaranies(fila.pendiente)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell className='font-medium'>Total</TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearEntero(totalVentas)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(totales.pasaje)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                −{formatearGuaranies(totales.comision)}
              </TableCell>
              <TableCell className='text-end font-medium tabular-nums'>
                {formatearGuaranies(totales.netoAEmpresas)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(totales.cargoServicio)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(totalPendiente)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <p className='text-muted-foreground max-w-prose text-xs leading-relaxed'>
        El cargo por servicio no forma parte del saldo de la empresa: ese cobro
        es nuestro y lo facturamos nosotros. La comisión no se le factura
        aparte, se descuenta de la transferencia. El pendiente es pasaje vendido
        y todavía no cobrado, así que no genera deuda.
      </p>
    </div>
  )
}
