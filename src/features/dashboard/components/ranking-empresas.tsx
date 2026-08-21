import { useMemo } from 'react'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChartLegend, type ChartConfig } from '@/components/ui/chart'
import type { EstadisticasPorEmpresa } from '../models/estadisticas.model'
import { armarFilasEmpresas } from '../models/series.model'
import { sumarDesgloses, type DesgloseDinero } from '../models/finanzas.model'
import { EstadoVacio, SkeletonTabla } from './estados'

const CONFIG: ChartConfig = {
  netoAEmpresas: { label: 'Neto a la empresa', color: 'var(--chart-1)' },
  comision: { label: 'Comisión', color: 'var(--chart-3)' },
}

interface Props {
  empresas: EstadisticasPorEmpresa[] | undefined
  cargando: boolean
}

/**
 * Ranking por empresa, con el reparto adentro de cada barra.
 *
 * La barra no muestra "cuánto vendió" sino **cómo se parte lo que vendió**:
 * qué le queda a la empresa y qué es comisión nuestra. Es la misma pregunta
 * que responde el desglose general, bajada a cada empresa — que es la forma en
 * que después se liquida.
 *
 * Las barras se comparan entre sí sobre la misma escala (la empresa que más
 * vendió llena el ancho), así la longitud significa algo y no sólo la
 * proporción interna.
 */
export function RankingEmpresas({ empresas, cargando }: Props) {
  const filas = useMemo(() => armarFilasEmpresas(empresas ?? []), [empresas])

  if (cargando && !empresas) return <SkeletonTabla filas={6} />

  if (filas.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin ventas por empresa'
        descripcion='Ninguna empresa registró ventas cobradas en este período.'
      />
    )
  }

  const maximo = Math.max(...filas.map((f) => f.desglose.pasaje))
  const totales = sumarDesgloses(filas.map((f) => f.desglose))
  const totalVentas = filas.reduce((acc, f) => acc + f.ventas, 0)

  return (
    <div>
      <ChartLegend config={CONFIG} className='mb-3' />

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-[10rem]'>Empresa</TableHead>
              <TableHead className='w-[30%] min-w-[8rem]'>Reparto del pasaje</TableHead>
              <TableHead className='text-end'>Ventas</TableHead>
              <TableHead className='text-end'>Neto a la empresa</TableHead>
              <TableHead className='text-end'>Comisión</TableHead>
              <TableHead className='text-end'>Cargo servicio</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filas.map((fila) => (
              <TableRow key={fila.id}>
                <TableCell className='font-medium'>{fila.nombre}</TableCell>
                <TableCell>
                  <BarraReparto desglose={fila.desglose} maximo={maximo} />
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearEntero(fila.ventas)}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearGuaranies(fila.desglose.netoAEmpresas)}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearGuaranies(fila.desglose.comision)}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearGuaranies(fila.desglose.cargoServicio)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TableCell className='font-medium'>Total</TableCell>
              <TableCell />
              <TableCell className='text-end tabular-nums'>
                {formatearEntero(totalVentas)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(totales.netoAEmpresas)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(totales.comision)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(totales.cargoServicio)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  )
}

/**
 * Barra apilada de una fila: neto + comisión = pasaje.
 *
 * Alto acotado (10px), extremo redondeado y un hueco de 2px del color de la
 * superficie entre los dos segmentos. Sin borde alrededor: el hueco ya separa.
 */
function BarraReparto({
  desglose,
  maximo,
}: {
  desglose: DesgloseDinero
  maximo: number
}) {
  if (maximo <= 0 || desglose.pasaje <= 0) return null

  const anchoTotal = (desglose.pasaje / maximo) * 100
  const proporcionNeto =
    desglose.pasaje > 0 ? (desglose.netoAEmpresas / desglose.pasaje) * 100 : 100

  return (
    <div
      className='flex h-2.5 w-full gap-[2px]'
      role='img'
      aria-label={`Pasaje ${formatearGuaranies(desglose.pasaje)}: neto ${formatearGuaranies(desglose.netoAEmpresas)}, comisión ${formatearGuaranies(desglose.comision)}`}
    >
      <div className='flex h-full gap-[2px]' style={{ width: `${anchoTotal}%` }}>
        <div
          className='h-full rounded-s-full'
          style={{
            width: `${proporcionNeto}%`,
            backgroundColor: CONFIG.netoAEmpresas.color,
          }}
        />
        <div
          className='h-full rounded-e-full'
          style={{
            width: `${100 - proporcionNeto}%`,
            backgroundColor: CONFIG.comision.color,
          }}
        />
      </div>
    </div>
  )
}
