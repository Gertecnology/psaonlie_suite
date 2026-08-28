import * as React from 'react'

import { useTablaServidor } from '@/components/data-table'
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
import { informePorRuta, type FiltrosInforme } from '../../models/informe.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('por-vendedor')!

interface FilaPorVendedor {
  vendedorId: string
  vendedor?: string
  email?: string
  ventas: number
  ventasLiquidables: number
  montoVendido: number
  comisionReconocida: number
  comisionRevertida: number
  comisionNeta: number
}

interface InformePorVendedorDatos {
  periodo: { desde: string; hasta: string; dias: number }
  data: FilaPorVendedor[]
  page: number
  limit: number
  total: number
  comisionNetaTotal: number
}

/**
 * Cuánto le tengo que pagar a cada vendedor.
 *
 * Es el informe sobre el que se mueve plata: cada fila es un pago a hacer. Por
 * eso separa lo **reconocido** de lo **neto** — la diferencia son las
 * devoluciones, y sin verla explícita el número final parece un error de
 * cuenta.
 *
 * Sólo aparecen quienes vendieron por caja. Las ventas de la web no tienen
 * vendedor: agruparlas bajo un «sin asignar» sugeriría que hay alguien a quien
 * liquidarle.
 */
export function InformePorVendedor() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()
  const { pagination } = useTablaServidor()

  const filtros = React.useMemo<FiltrosInforme>(
    () => ({
      ...aplicados,
      pagina: pagination.pageIndex + 1,
      tamano: pagination.pageSize,
    }),
    [aplicados, pagination],
  )

  const { data, isLoading, error } = useInforme<InformePorVendedorDatos>(
    DEFINICION.ruta,
    filtros,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={filtros}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onGenerar={generar}
      puedeGenerar={puedeGenerar}
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    >
      <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
    </MarcoInforme>
  )
}

function Cuerpo({ datos }: { datos: InformePorVendedorDatos }) {
  if (datos.data.length === 0) {
    return (
      <p className='text-muted-foreground py-10 text-center text-sm'>
        Nadie vendió por caja en este período.
      </p>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <caption className='sr-only'>
          Lo vendido y la comisión de cada vendedor en el período
        </caption>
        <TableHeader>
          <TableRow>
            <TableHead>Vendedor</TableHead>
            <TableHead className='text-right'>Ventas</TableHead>
            <TableHead className='text-right'>Vendido</TableHead>
            <TableHead className='text-right'>Reconocida</TableHead>
            <TableHead className='text-right'>Devuelta</TableHead>
            <TableHead className='text-right'>Se le debe</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {datos.data.map((fila) => (
            <TableRow key={fila.vendedorId}>
              <TableCell>
                <span className='font-medium'>
                  {fila.vendedor ?? fila.email ?? 'Sin nombre'}
                </span>
                {fila.vendedor && fila.email && (
                  <span className='text-muted-foreground block text-xs'>
                    {fila.email}
                  </span>
                )}
              </TableCell>

              <TableCell className='text-right tabular-nums'>
                {formatearEntero(fila.ventas)}
              </TableCell>

              <TableCell className='text-right tabular-nums'>
                {formatearGuaranies(fila.montoVendido)}
              </TableCell>

              <TableCell className='text-right tabular-nums'>
                {formatearGuaranies(fila.comisionReconocida)}
              </TableCell>

              {/* En cero se escribe un guion: un «Gs. 0» en una columna de
                  devoluciones se lee como si hubiera habido una. */}
              <TableCell className='text-right tabular-nums'>
                {fila.comisionRevertida > 0
                  ? `−${formatearGuaranies(fila.comisionRevertida)}`
                  : '—'}
              </TableCell>

              <TableCell className='text-right font-medium tabular-nums'>
                {formatearGuaranies(fila.comisionNeta)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow>
            <TableCell colSpan={5}>Total a pagar</TableCell>
            <TableCell className='text-right font-bold tabular-nums'>
              {formatearGuaranies(datos.comisionNetaTotal)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
