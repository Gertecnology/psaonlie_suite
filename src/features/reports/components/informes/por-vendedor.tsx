import * as React from 'react'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import { informePorRuta, type FiltrosInforme } from '../../models/informe.model'
import {
  alcanceDeLosTotales,
  rotuloDeLosTotales,
  sumar,
} from '../../models/totales'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('por-vendedor')!

/** Un renglón de la liquidación: una persona y lo que se le debe. */
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

/**
 * `GET /api/admin/informes/por-vendedor`.
 *
 * `page`, `limit` y `total` son el eco de la paginación de la API. El informe
 * pide una sola página grande, así que están para trazabilidad y no para
 * navegar: `total` es la cantidad de vendedores, no la suma de ninguna columna.
 */
interface InformePorVendedorDatos {
  periodo: { desde: string; hasta: string; dias: number }
  data: FilaPorVendedor[]
  page: number
  limit: number
  /** Cuántos vendedores tiene el período: sirve para el alcance, no como suma. */
  total: number
  /** El importe que liquida la API, y el que manda si la columna no le cuadra. */
  comisionNetaTotal: number
}

/**
 * Cuánto le tengo que pagar a cada vendedor.
 *
 * Es el informe sobre el que se mueve plata: cada renglón es un pago a hacer.
 * Por eso separa lo **reconocido** de lo **revertido** — la diferencia son las
 * devoluciones, y sin verla explícita el importe final parece un error de
 * cuenta.
 *
 * Sólo aparecen quienes vendieron por caja. Las ventas de la web no tienen
 * vendedor: agruparlas bajo un «sin asignar» sugeriría que hay alguien a quien
 * liquidarle.
 */
export function InformePorVendedor() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  // Sin paginar: una liquidación se lee y se firma entera. Partirla en páginas
  // obliga a sumar a mano lo que la fila de totales ya dice.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({ ...aplicados, pagina: 1, tamano: 200 }),
    [aplicados],
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
      onBuscar={generar}
      puedeBuscar={puedeGenerar}
      controles={
        <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

function Cuerpo({ datos }: { datos: InformePorVendedorDatos }) {
  // La hoja trae todos los vendedores del período, así que sumar la columna es
  // el total y quien firma lo verifica con una calculadora. Si alguna vez
  // llegara recortada, el rótulo y su alcance lo dicen en vez de callarlo.
  const filas = datos.data

  const columnas: ColumnaContable<FilaPorVendedor>[] = [
    {
      clave: 'vendedor',
      titulo: 'Vendedor',
      alinear: 'izquierda',
      celda: (fila) => (
        <span className='flex flex-col gap-px'>
          <span>{fila.vendedor ?? fila.email ?? 'Sin nombre'}</span>
          {fila.vendedor && fila.email && (
            <span className='text-muted-foreground text-[10.5px]'>
              {fila.email}
            </span>
          )}
          {/* El color no puede ser la única señal: en papel no se imprime y a
              quien no distingue el rojo no le llega. El renglón lo dice. */}
          {fila.comisionNeta < 0 && (
            <span className='text-destructive text-[10.5px]'>
              Saldo en contra: lo revertido supera lo reconocido
            </span>
          )}
        </span>
      ),
    },
    {
      clave: 'ventas',
      titulo: 'Ventas',
      unidad: 'ventas',
      ancho: 78,
      celda: (fila) => formatearEntero(fila.ventas),
      total: formatearEntero(sumar(filas, (fila) => fila.ventas)),
    },
    {
      clave: 'ventas-liquidables',
      titulo: 'Ventas liquidables',
      unidad: 'ventas',
      ancho: 96,
      celda: (fila) => formatearEntero(fila.ventasLiquidables),
      total: formatearEntero(sumar(filas, (fila) => fila.ventasLiquidables)),
    },
    {
      clave: 'monto-vendido',
      titulo: 'Monto vendido',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.montoVendido),
      total: formatearGuaranies(sumar(filas, (fila) => fila.montoVendido)),
    },
    {
      clave: 'comision-reconocida',
      titulo: 'Comisión reconocida',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.comisionReconocida),
      total: formatearGuaranies(sumar(filas, (fila) => fila.comisionReconocida)),
    },
    {
      clave: 'revertido',
      titulo: 'Revertido',
      unidad: 'Gs.',
      ancho: 118,
      // En cero va un guion: un «Gs. 0» en la columna de reversiones se lee
      // como si hubiera habido una devolución que se descontó.
      celda: (fila) =>
        fila.comisionRevertida === 0 ? (
          <span className='text-muted-foreground'>—</span>
        ) : (
          formatearGuaranies(fila.comisionRevertida)
        ),
      total: formatearGuaranies(sumar(filas, (fila) => fila.comisionRevertida)),
    },
    {
      clave: 'a-pagar',
      titulo: 'A pagar',
      unidad: 'Gs.',
      ancho: 132,
      celda: (fila) => (
        <span className='font-semibold'>
          {formatearGuaranies(fila.comisionNeta)}
        </span>
      ),
      // El único que no se suma acá: es el importe que liquida el backend. Si
      // la suma de la columna difiere, manda el backend — es la cifra con la
      // que se paga, y dos números distintos en el mismo papel no se explican.
      total: formatearGuaranies(datos.comisionNetaTotal),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={filas}
      claveFila={(fila) => fila.vendedorId}
      observada={(fila) => fila.comisionNeta < 0}
      rotuloTotales={rotuloDeLosTotales(filas.length, datos.total)}
      alcanceTotales={alcanceDeLosTotales(filas.length, datos.total)}
      sonImporte={datos.comisionNetaTotal}
      descripcion='Comisión a pagar a cada vendedor de caja en el período, con lo vendido, lo reconocido y lo revertido por devoluciones'
      mensajeVacio='Nadie vendió por caja en este período.'
    />
  )
}
