import { Skeleton } from '@/components/ui/skeleton'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'

/** Una fila de `/api/admin/informes/por-vendedor`. */
export interface VendedorDelPeriodo {
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

interface Props {
  vendedores: VendedorDelPeriodo[] | undefined
  cargando: boolean
}

/**
 * Lo vendido y lo ganado por cada persona en la caja.
 *
 * Ordenado por lo que se le debe y no por lo que vendió: quien administra abre
 * esto para saber a quién tiene que pagarle, y ese número es el que decide.
 *
 * La comisión revertida se muestra sólo cuando existe. En cero es ruido; con
 * valor explica por qué lo neto no coincide con lo reconocido, que si no
 * parece un error de cuenta.
 */
export function RankingVendedores({ vendedores, cargando }: Props) {
  if (cargando) {
    return <Skeleton className='h-48 w-full' />
  }

  if (!vendedores?.length) {
    return (
      <p className='text-muted-foreground py-10 text-center text-sm'>
        Nadie vendió por caja en este período.
      </p>
    )
  }

  const mayor = Math.max(...vendedores.map((v) => v.montoVendido), 1)

  return (
    <ul className='grid gap-3'>
      {vendedores.map((vendedor) => (
        <li key={vendedor.vendedorId} className='grid gap-1'>
          <div className='flex flex-wrap items-baseline justify-between gap-2'>
            <span className='truncate font-medium'>
              {vendedor.vendedor ?? vendedor.email ?? 'Sin nombre'}
            </span>

            <span className='text-muted-foreground text-xs tabular-nums'>
              {formatearEntero(vendedor.ventas)} ventas ·{' '}
              {formatearGuaranies(vendedor.montoVendido)}
            </span>
          </div>

          {/* La barra compara contra quien más vendió, no contra un total. */}
          <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
            <div
              className='bg-primary h-full rounded-full'
              style={{ width: `${(vendedor.montoVendido / mayor) * 100}%` }}
            />
          </div>

          <div className='flex flex-wrap items-baseline justify-between gap-2 text-xs'>
            <span className='text-muted-foreground'>Se le debe</span>
            <span className='font-medium tabular-nums'>
              {formatearGuaranies(vendedor.comisionNeta)}
              {vendedor.comisionRevertida > 0 && (
                <span className='text-muted-foreground ml-1 font-normal'>
                  (−{formatearGuaranies(vendedor.comisionRevertida)} por
                  devoluciones)
                </span>
              )}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
