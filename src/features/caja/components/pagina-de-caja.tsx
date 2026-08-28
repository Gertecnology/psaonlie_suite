import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'

import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { useListadoDeCaja } from '../hooks/use-caja'
import type { FiltrosDeCaja, OrigenDeVenta } from '../models/caja.model'
import { ModalDeBoletos } from './modal-de-boletos'
import { ModalDeEnvio } from './modal-de-envio'
import { ModalDeFacturas } from './modal-de-facturas'
import { TablaDeCaja } from './tabla-de-caja'
import { TarjetasDeCaja } from './tarjetas-de-caja'

/**
 * La pantalla de la caja.
 *
 * Es la entrada del vendedor: primero ve lo que vendió —con su comisión— y
 * desde acá abre el flujo de venta. Antes la entrada era el buscador de
 * servicios, que servía para vender pero no para saber cómo venía el día.
 *
 * Tiene dos caras, y la elige el backend según el rol de quien entra. Esta
 * pantalla no decide nada de eso: pinta lo que llegó. Un dato ausente es un
 * dato que esta persona no tiene derecho a ver, y por eso no vino.
 */

const ESTADOS = ['PAGADO', 'PENDIENTE', 'EXPIRADO', 'CANCELADO', 'REEMBOLSADO']

export function PaginaDeCaja() {
  const [busqueda, setBusqueda] = useState('')
  const [estadoPago, setEstadoPago] = useState<string>('')
  const [origen, setOrigen] = useState<OrigenDeVenta>('TODAS')
  const [pagina, setPagina] = useState(1)

  // Sin esto se consulta en cada tecla, y son veinticinco filas y dos
  // agregados por consulta.
  const busquedaDiferida = useDebouncedValue(busqueda, 400)

  const filtros: FiltrosDeCaja = {
    busqueda: busquedaDiferida || undefined,
    estadoPago: estadoPago || undefined,
    origen: origen === 'TODAS' ? undefined : origen,
    pagina,
  }

  const { data, isLoading, error } = useListadoDeCaja(filtros)

  const [verBoletosDe, setVerBoletosDe] = useState<string | null>(null)
  const [verFacturasDe, setVerFacturasDe] = useState<string | null>(null)
  const [enviarDe, setEnviarDe] = useState<string | null>(null)

  const soloMisVentas = data?.soloMisVentas ?? true
  const paginas = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <PageLayout
      title={soloMisVentas ? 'Mis ventas' : 'Ventas'}
      description={
        soloMisVentas
          ? 'Lo que vendiste y lo que te corresponde por cada venta.'
          : 'Todas las ventas, las de caja y las de la web.'
      }
      actions={
        <Button asChild>
          <Link to='/sales'>
            <Plus className='mr-2 h-4 w-4' />
            Vender
          </Link>
        </Button>
      }
    >
      <div className='grid gap-4'>
        <TarjetasDeCaja resumen={data?.resumen} cargando={isLoading} />

        <div className='flex flex-wrap items-center gap-2'>
          <div className='relative min-w-[16rem] flex-1'>
            <Search className='text-muted-foreground absolute left-2.5 top-2.5 h-4 w-4' />
            <Input
              className='pl-8'
              placeholder='Documento, pasajero o transacción'
              value={busqueda}
              aria-label='Buscar ventas'
              onChange={(evento) => {
                setBusqueda(evento.target.value)
                // Volver a la primera página: buscar sobre la página 3 de un
                // resultado que ahora tiene una sola muestra vacío.
                setPagina(1)
              }}
            />
          </div>

          <Select
            value={estadoPago || 'TODOS'}
            onValueChange={(valor) => {
              setEstadoPago(valor === 'TODOS' ? '' : valor)
              setPagina(1)
            }}
          >
            <SelectTrigger className='w-[11rem]' aria-label='Estado del pago'>
              <SelectValue placeholder='Estado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='TODOS'>Todos los estados</SelectItem>
              {ESTADOS.map((estado) => (
                <SelectItem key={estado} value={estado}>
                  {estado}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sólo tiene sentido para quien ve las dos clases de venta. */}
          {!soloMisVentas && (
            <Select
              value={origen}
              onValueChange={(valor) => {
                setOrigen(valor as OrigenDeVenta)
                setPagina(1)
              }}
            >
              <SelectTrigger className='w-[10rem]' aria-label='Origen de la venta'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='TODAS'>Caja y web</SelectItem>
                <SelectItem value='CAJA'>Sólo caja</SelectItem>
                <SelectItem value='WEB'>Sólo web</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {error && (
          <p className='text-destructive text-sm'>{(error as Error).message}</p>
        )}

        <TablaDeCaja
          filas={data?.items ?? []}
          soloMisVentas={soloMisVentas}
          cargando={isLoading}
          onVerBoletos={setVerBoletosDe}
          onVerFacturas={setVerFacturasDe}
          onEnviar={setEnviarDe}
        />

        {paginas > 1 && (
          <div className='flex items-center justify-between text-sm'>
            <span className='text-muted-foreground'>
              Página {data?.page} de {paginas} · {data?.total} ventas
            </span>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                disabled={pagina <= 1}
                onClick={() => setPagina((actual) => actual - 1)}
              >
                Anterior
              </Button>
              <Button
                variant='outline'
                size='sm'
                disabled={pagina >= paginas}
                onClick={() => setPagina((actual) => actual + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      <ModalDeBoletos
        numeroTransaccion={verBoletosDe}
        onClose={() => setVerBoletosDe(null)}
      />
      <ModalDeFacturas
        numeroTransaccion={verFacturasDe}
        onClose={() => setVerFacturasDe(null)}
      />
      <ModalDeEnvio
        numeroTransaccion={enviarDe}
        onClose={() => setEnviarDe(null)}
      />
    </PageLayout>
  )
}
