import * as React from 'react'
import { cn } from '@/lib/utils'
import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
} from '@/lib/formato'
import { informePorRuta, type FiltrosInforme } from '../../models/informe.model'
import {
  EXPLICACION_DESCUADRE,
  type ConciliacionBancard,
  type DescuadreBancard,
} from '../../models/conciliacion-bancard.model'
import { alcanceDeLosTotales, sumar } from '../../models/totales'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('conciliacion-bancard')!

/**
 * What the gateway says against what we recorded.
 *
 * The panel used to build this from a generic statistics endpoint plus a
 * separate payments summary, and the screen itself admitted the real
 * reconciliation was not possible yet. The backend has had the endpoint all
 * along: it counts both sides independently and lists every mismatch, which is
 * the only version of this report that is worth anything — a total that agrees
 * proves nothing if you cannot see what was compared.
 */
export function InformeConciliacionBancard() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  // Sin paginar: una conciliación se lee y se firma entera. Partirla en páginas
  // deja el cotejo de arriba hablando de un período y el detalle de abajo de
  // una página.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({ ...aplicados, pagina: 1, tamano: 200 }),
    [aplicados],
  )

  const { data, isLoading, error } = useInforme<ConciliacionBancard>(
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
      onBuscar={generar}
      puedeBuscar={puedeGenerar}
      controles={
        <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

function Cuerpo({ datos }: { datos: ConciliacionBancard }) {
  const descuadres = datos.descuadres

  // La hoja pide los 200 renglones de una, así que salvo desborde la suma es
  // la de todos los descuadres del período. Cuando no lo es, el rótulo y
  // `alcanceDeLosTotales` lo dicen en vez de callarlo.
  const listados = descuadres.length
  const completo = datos.totalDescuadres <= listados

  const totales = {
    montoEsperado: sumar(descuadres, (fila) => fila.montoEsperado),
    montoBancard: sumar(descuadres, (fila) => fila.montoBancard),
    diferencia: sumar(descuadres, (fila) => fila.diferencia),
  }

  const columnas: ColumnaContable<DescuadreBancard>[] = [
    {
      clave: 'fecha',
      titulo: 'Fecha',
      unidad: 'de la venta (AAAA-MM-DD)',
      alinear: 'izquierda',
      ancho: 118,
      celda: (fila) => formatearFechaISO(fila.fechaVenta),
    },
    {
      clave: 'tipo',
      titulo: 'Tipo',
      alinear: 'izquierda',
      celda: (fila) => {
        const explicacion = EXPLICACION_DESCUADRE[fila.tipo]
        return (
          <span className='flex flex-col gap-px'>
            {/* Todo renglón de esta tabla es un descuadre, y lo dice con texto:
                el color no puede ser la única señal porque en papel no se
                imprime. */}
            <span className='text-destructive'>{explicacion.titulo}</span>
            <span className='text-muted-foreground text-[10.5px]'>
              {explicacion.significado}
            </span>
          </span>
        )
      },
    },
    {
      clave: 'venta',
      titulo: 'Venta',
      alinear: 'izquierda',
      ancho: 116,
      celda: (fila) => fila.numeroTransaccion ?? '—',
    },
    {
      clave: 'transaccion-bancard',
      titulo: 'Transacción Bancard',
      alinear: 'izquierda',
      ancho: 148,
      celda: (fila) => fila.bancardTransactionId ?? '—',
    },
    {
      clave: 'importe-registrado',
      titulo: 'Importe registrado',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.montoEsperado),
      total: formatearGuaranies(totales.montoEsperado),
    },
    {
      clave: 'importe-bancard',
      titulo: 'Importe Bancard',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.montoBancard),
      total: formatearGuaranies(totales.montoBancard),
    },
    {
      clave: 'diferencia',
      titulo: 'Diferencia',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => (
        <span className='text-destructive font-semibold'>
          {formatearGuaranies(fila.diferencia)}
        </span>
      ),
      // Cuánto hay que explicar en total. Es la cifra que le dice a quien
      // concilia el tamaño del trabajo que tiene por delante.
      total: formatearGuaranies(totales.diferencia),
    },
  ]

  // Sin `SON:` a propósito: el informe no liquida un importe, lista partidas a
  // revisar. El cotejo de los dos lados va arriba y no como conclusión al pie.
  return (
    <TablaContable
      columnas={columnas}
      filas={descuadres}
      // Una venta puede aparecer sin id de Bancard y viceversa; el par de los
      // dos es lo único que identifica una diferencia.
      claveFila={(fila) =>
        `${fila.ventaId ?? 'sin-venta'}:${fila.bancardTransactionId ?? 'sin-tx'}`
      }
      observada={() => true}
      // El rótulo no dice «del período»: lo que cierra esta tabla son los
      // descuadres, no las ventas. `rotuloDeLosTotales` no sabe nombrarlos, así
      // que se escribe acá con el mismo criterio de completitud que el alcance.
      rotuloTotales={
        completo ? 'Totales de los descuadres' : 'Totales de los descuadres listados'
      }
      alcanceTotales={alcanceDeLosTotales(listados, datos.totalDescuadres)}
      antesDeLaTabla={<Cotejo datos={datos} />}
      descripcion='Diferencias entre lo aprobado por la pasarela Bancard y lo registrado en el sistema, con el importe de cada lado'
      mensajeVacio='El período concilia: lo aprobado por la pasarela coincide con lo registrado.'
    />
  )
}

/**
 * Los dos lados y el veredicto, antes del detalle.
 *
 * Va arriba y como renglones, no como párrafo debajo de la tabla: la
 * conclusión de un informe se lee antes de las partidas que la explican, y un
 * párrafo suelto al pie no es parte del documento.
 */
function Cotejo({ datos }: { datos: ConciliacionBancard }) {
  return (
    <dl className='border-border border-b px-7 py-2.5 text-[12.5px]'>
      <Renglon
        concepto='Según la pasarela — transacciones aprobadas'
        cantidad={`${formatearEntero(datos.bancard.transaccionesAprobadas)} tx`}
        importe={formatearGuaranies(datos.bancard.montoAprobado)}
      />
      <Renglon
        concepto='Según el sistema — ventas cobradas'
        cantidad={`${formatearEntero(datos.registrado.ventasPagadas)} ventas`}
        importe={formatearGuaranies(datos.registrado.montoEsperado)}
      />
      <Renglon
        concepto={datos.concilia ? 'DIFERENCIA' : 'DIFERENCIA — NO CONCILIA'}
        cantidad='—'
        importe={formatearGuaranies(datos.diferencia)}
        destacado
        observado={!datos.concilia}
      />
    </dl>
  )
}

function Renglon({
  concepto,
  cantidad,
  importe,
  destacado = false,
  observado = false,
}: {
  concepto: string
  cantidad: string
  importe: string
  destacado?: boolean
  observado?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-baseline gap-4 py-0.5',
        destacado && 'border-border/70 mt-1 border-t pt-1.5 font-semibold',
        observado && 'text-destructive',
      )}
    >
      <dt className='flex-1'>{concepto}</dt>
      <dd className='text-muted-foreground w-[110px] text-right tabular-nums'>
        {cantidad}
      </dd>
      <dd className='w-[132px] text-right tabular-nums' data-tipo='monto'>
        {importe}
      </dd>
    </div>
  )
}
