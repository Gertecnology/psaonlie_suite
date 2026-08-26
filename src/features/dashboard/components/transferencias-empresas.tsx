import { useMemo } from 'react'
import { formatearGuaranies } from '@/lib/formato'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EstadisticasPorAgencia } from '../models/estadisticas.model'
import { armarFilasEmpresas } from '../models/series.model'
import { SkeletonTabla } from './estados'

interface Props {
  empresas: EstadisticasPorAgencia[] | undefined
  cargando: boolean
}

/**
 * La respuesta a "cuánto hay que transferirle a cada empresa", en el panel.
 *
 * El dato ya estaba en el ranking por empresa, enterrado al fondo de la
 * pantalla con el rótulo "Neto a la empresa". Acá se lo presenta como la
 * pregunta que es: el neto cobrado del período, por empresa y con su total.
 *
 * Sin agrupamiento en "Otras": para el ranking ocho filas alcanzan, pero una
 * transferencia por empresa necesita verlas todas. El kardex sigue siendo el
 * libro oficial de saldos; esto es lo que deja el período, no la deuda
 * acumulada.
 */
export function TransferenciasEmpresas({ empresas, cargando }: Props) {
  const filas = useMemo(
    () => armarFilasEmpresas(empresas ?? [], Number.MAX_SAFE_INTEGER),
    [empresas]
  )

  if (cargando && !empresas) return <SkeletonTabla filas={4} />

  const totalNeto = filas.reduce(
    (acc, fila) => acc + fila.desglose.netoAEmpresas,
    0
  )
  const totalCobrado = filas.reduce(
    (acc, fila) => acc + fila.desglose.cobradoAlCliente,
    0
  )

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='min-w-[10rem]'>Empresa</TableHead>
            <TableHead className='text-end'>Cobrado en el período</TableHead>
            <TableHead className='text-end'>A transferir</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.id}>
              <TableCell className='font-medium'>{fila.nombre}</TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(fila.desglose.cobradoAlCliente)}
              </TableCell>
              <TableCell className='text-end font-medium tabular-nums'>
                {formatearGuaranies(fila.desglose.netoAEmpresas)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className='font-medium'>Total del período</TableCell>
            <TableCell className='text-end tabular-nums'>
              {formatearGuaranies(totalCobrado)}
            </TableCell>
            <TableCell className='text-end font-medium tabular-nums'>
              {formatearGuaranies(totalNeto)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
