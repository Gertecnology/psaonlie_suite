import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import type { ResumenDeCaja } from '../models/caja.model'

/**
 * Las tarjetas de arriba del listado.
 *
 * Cuáles aparecen depende de quién mira, y eso lo decide el backend: un
 * vendedor recibe su comisión y nada más; quien administra recibe el cargo por
 * servicio, la comisión de las empresas y lo que se les debe a los vendedores.
 *
 * Acá no se oculta nada — se pinta lo que llegó. Un campo ausente es un campo
 * que esta persona no tiene derecho a ver, y por eso no vino.
 */

interface TarjetaProps {
  etiqueta: string
  valor: string
  detalle?: string
  destacada?: boolean
}

function Tarjeta({ etiqueta, valor, detalle, destacada }: TarjetaProps) {
  return (
    // El detalle va en `title` y no debajo del importe: es una aclaración que
    // se lee una vez y después ocupa una línea para siempre. Sacarlo del flujo
    // es lo que permite que las cinco entren en una fila y que la tabla —que
    // es a lo que se entra— quede a la vista sin desplazar la página.
    <Card
      className={destacada ? 'border-primary/40' : undefined}
      title={detalle}
    >
      <CardContent className='px-3 py-2'>
        <p className='text-muted-foreground truncate text-[11px] font-medium uppercase tracking-wide'>
          {etiqueta}
        </p>
        <p className='truncate text-lg font-bold tabular-nums'>{valor}</p>
      </CardContent>
    </Card>
  )
}

export function TarjetasDeCaja({
  resumen,
  cargando,
}: {
  resumen?: ResumenDeCaja
  cargando: boolean
}) {
  if (cargando || !resumen) {
    return (
      <div className='grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
        {[0, 1, 2].map((indice) => (
          <Skeleton key={indice} className='h-[58px]' />
        ))}
      </div>
    )
  }

  return (
    <div className='grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-5'>
      <Tarjeta
        etiqueta='Ventas'
        valor={formatearEntero(resumen.cantidadVentas)}
      />

      <Tarjeta
        etiqueta='Monto vendido'
        valor={formatearGuaranies(resumen.montoVendido)}
        detalle='Pasajes más cargo por servicio'
      />

      {/* Del vendedor: lo suyo, destacado, que es lo que viene a mirar. */}
      {resumen.miComision !== undefined && (
        <Tarjeta
          etiqueta='Mi comisión'
          valor={formatearGuaranies(resumen.miComision)}
          detalle='Sobre el cargo por servicio'
          destacada
        />
      )}

      {/* De quien administra: los números del negocio. */}
      {resumen.cargoServicio !== undefined && (
        <Tarjeta
          etiqueta='Cargo por servicio'
          valor={formatearGuaranies(resumen.cargoServicio)}
        />
      )}

      {resumen.comisionEmpresa !== undefined && (
        <Tarjeta
          etiqueta='Comisión de empresas'
          valor={formatearGuaranies(resumen.comisionEmpresa)}
        />
      )}

      {resumen.comisionVendedores !== undefined && (
        <Tarjeta
          etiqueta='A los vendedores'
          valor={formatearGuaranies(resumen.comisionVendedores)}
          detalle='Sale del cargo por servicio'
        />
      )}
    </div>
  )
}
