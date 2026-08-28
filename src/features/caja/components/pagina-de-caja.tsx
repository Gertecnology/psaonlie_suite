import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import { PageLayout } from '@/components/layout/page-layout'
import { Paginacion } from '@/components/filtros'
import { Button } from '@/components/ui/button'
import { useFiltros } from '@/hooks/use-filtros'
import { useListadoDeCaja, useOpcionesDeCaja } from '../hooks/use-caja'
import { formatearGuaranies } from '@/lib/formato'
import { aFechaISOLocal, periodoDesdePreset } from '@/lib/periodo'
import type { FilaDeCaja, FiltrosDeCaja } from '../models/caja.model'
import { FiltrosDeCajaControles } from './filtros-de-caja'
import { ModalDeAnulacion } from './modal-de-anulacion'
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

/**
 * El período con el que abre la pantalla.
 *
 * Se pone explícito y no se deja al valor por omisión del backend —que también
 * son treinta días— porque un listado acotado en silencio se lee como si fuera
 * todo. Al verlo escrito en el filtro, quien mira sabe qué está contando antes
 * de sacar una conclusión de los totales.
 */
function periodoInicial(): { desde: string; hasta: string } {
  const { desde, hasta } = periodoDesdePreset('30d')

  return { desde: aFechaISOLocal(desde), hasta: aFechaISOLocal(hasta) }
}

export function PaginaDeCaja() {
  const {
    filtros,
    pagina,
    tamano,
    poner,
    quitar,
    limpiar,
    irAPagina,
    cambiarTamano,
  } = useFiltros<FiltrosDeCaja>(periodoInicial())

  const { data, isLoading, isFetching, error } = useListadoDeCaja({
    ...filtros,
    pagina,
    tamano,
  })
  const { data: opciones } = useOpcionesDeCaja()

  const [verBoletosDe, setVerBoletosDe] = useState<string | null>(null)
  const [verFacturasDe, setVerFacturasDe] = useState<string | null>(null)
  const [enviarDe, setEnviarDe] = useState<string | null>(null)
  const [anularA, setAnularA] = useState<FilaDeCaja | null>(null)

  const soloMisVentas = data?.soloMisVentas ?? true

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

        <FiltrosDeCajaControles
          filtros={filtros}
          opciones={opciones}
          soloMisVentas={soloMisVentas}
          // `isFetching` sin `isLoading`: hay una consulta en vuelo pero
          // todavía se muestran los datos anteriores. Es exactamente el rato
          // en que la pantalla parece no haber registrado el cambio.
          actualizando={isFetching && !isLoading}
          total={data?.total}
          onPoner={poner}
          onQuitar={quitar}
          onLimpiar={limpiar}
        />

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
          onAnular={setAnularA}
        />

        {/*
          La página y el tamaño salen del estado local, no de la respuesta: son
          la intención de quien hizo clic. Tomarlos de `data` los ata a lo que
          ya llegó, y mientras la página nueva viaja el control muestra la
          anterior — con lo que «Siguiente» avanza desde el número viejo.
        */}
        <Paginacion
          pagina={pagina}
          tamano={tamano}
          total={data?.total ?? 0}
          onPagina={irAPagina}
          onTamano={cambiarTamano}
          cargando={isFetching}
        />
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
      <ModalDeAnulacion
        venta={
          anularA && {
            ventaId: anularA.ventaId,
            numeroTransaccion: anularA.numeroTransaccion,
            monto: formatearGuaranies(anularA.monto),
          }
        }
        onClose={() => setAnularA(null)}
      />
    </PageLayout>
  )
}
