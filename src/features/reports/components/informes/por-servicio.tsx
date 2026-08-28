import * as React from 'react'
import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import {
  informePorRuta,
  rutaApi,
  type FiltrosInforme,
} from '../../models/informe.model'
import type {
  FilaServicio,
  InformePorServicio as DatosPorServicio,
} from '../../models/por-servicio.model'
import {
  alcanceDeLosTotales,
  rotuloDeLosTotales,
  sumar,
} from '../../models/totales'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('por-servicio')!

/**
 * Qué se vende, servicio por servicio.
 *
 * Las dos fechas son la razón para leerlo: `primerViaje` y `ultimoViaje` son
 * los viajes vendidos, no las ventas. Un servicio cuyo último viaje vendido ya
 * pasó tiene el calendario vacío por delante, y ninguna columna de importe
 * muestra eso — muestran lo contrario, un total sano de viajes que ya salieron.
 */
export function InformePorServicio() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  // Sin paginar: el informe se lee y se archiva entero. Partirlo en páginas
  // obliga a sumar a mano lo que la fila de cierre ya dice.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({ ...aplicados, pagina: 1, tamano: 200 }),
    [aplicados]
  )

  const { data, isLoading, error } = useInforme<DatosPorServicio>(
    rutaApi(DEFINICION),
    filtros
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

function Cuerpo({ datos }: { datos: DatosPorServicio }) {
  const filas = datos.data

  // La API no devuelve un objeto de totales, así que la hoja los suma. Se le
  // pasa `datos.total` —los servicios que tiene el período— para que el cierre
  // deje de decir «del período» si alguna vez la respuesta viene recortada:
  // sumar lo listado y llamarlo total del período sería una cifra falsa.
  const rotuloTotales = rotuloDeLosTotales(filas.length, datos.total)
  const alcanceTotales = alcanceDeLosTotales(filas.length, datos.total)

  const ventasLiquidables = sumar(filas, (fila) => fila.ventasLiquidables)
  const boletosVigentes = sumar(filas, (fila) => fila.boletosVigentes)
  const pasajes = sumar(filas, (fila) => fila.pasajes)
  const cargoServicio = sumar(filas, (fila) => fila.cargoServicio)

  const columnas: ColumnaContable<FilaServicio>[] = [
    {
      clave: 'empresa',
      titulo: 'Empresa',
      alinear: 'izquierda',
      celda: (fila) => (
        <span className='flex flex-col gap-px'>
          <span>{fila.empresaNombre}</span>
          {/* La API no manda nombre de servicio: sin el código, dos servicios
              de la misma empresa y calidad son el mismo renglón dos veces. Va
              acá abajo y no en una columna propia porque identifica la fila,
              no es un dato más que comparar. */}
          <span className='text-muted-foreground text-[10.5px]'>
            {fila.servicioId}
          </span>
        </span>
      ),
    },
    {
      clave: 'calidad',
      titulo: 'Calidad',
      alinear: 'izquierda',
      ancho: 110,
      // Una calidad nula es un servicio que no la declara, no un renglón a
      // esconder: se escribe `—` y el renglón se muestra igual.
      celda: (fila) =>
        fila.calidad ?? <span className='text-muted-foreground'>—</span>,
    },
    {
      clave: 'viajes',
      titulo: 'Primer — último viaje',
      // ISO 8601 y no dd/mm/aaaa: una hoja archivada pierde el contexto que
      // haría falta para desambiguar 08/09.
      unidad: 'AAAA-MM-DD, vendidos',
      alinear: 'izquierda',
      ancho: 190,
      celda: (fila) => (
        <span className='tabular-nums'>
          {formatearFechaISO(fila.primerViaje)}
          <span aria-hidden='true'> — </span>
          <span className='sr-only'> al </span>
          {formatearFechaISO(fila.ultimoViaje)}
        </span>
      ),
    },
    {
      clave: 'ventas',
      titulo: 'Ventas',
      unidad: 'ventas',
      ancho: 84,
      celda: (fila) => formatearEntero(fila.ventasLiquidables),
      total: formatearEntero(ventasLiquidables),
    },
    {
      clave: 'boletos',
      titulo: 'Boletos',
      unidad: 'boletos',
      ancho: 84,
      celda: (fila) => formatearEntero(fila.boletosVigentes),
      total: formatearEntero(boletosVigentes),
    },
    {
      clave: 'pasajes',
      titulo: 'Pasajes',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.pasajes),
      total: formatearGuaranies(pasajes),
    },
    {
      clave: 'cargo-servicio',
      titulo: 'Cargo por servicio',
      unidad: 'Gs.',
      ancho: 122,
      celda: (fila) => formatearGuaranies(fila.cargoServicio),
      total: formatearGuaranies(cargoServicio),
    },
    {
      clave: 'participacion',
      titulo: 'Participación',
      // La API no manda participación en este informe. Se calcula contra el
      // total de pasajes que la propia hoja muestra —por eso la unidad lo dice
      // y no habla del período—: es un cociente verificable con la fila de
      // cierre a la vista, no una cifra traída de otro lado.
      unidad: '% del total',
      ancho: 92,
      celda: (fila) =>
        formatearPorcentaje(pasajes === 0 ? 0 : (fila.pasajes / pasajes) * 100),
      total: formatearPorcentaje(pasajes === 0 ? 0 : 100),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={filas}
      // El id del servicio es la única identidad estable que trae el renglón.
      claveFila={(fila) => fila.servicioId}
      rotuloTotales={rotuloTotales}
      alcanceTotales={alcanceTotales}
      sonImporte={pasajes}
      descripcion='Ventas, boletos e importes de cada servicio del período, con el primer y el último viaje vendidos'
      mensajeVacio='El período no tiene ventas liquidables en ningún servicio.'
    />
  )
}
