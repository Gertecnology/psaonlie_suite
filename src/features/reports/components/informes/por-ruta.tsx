import * as React from 'react'
import {
  formatearEntero,
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
import {
  claveRuta,
  type FilaRuta,
  type InformePorRuta as DatosPorRuta,
} from '../../models/por-ruta.model'
import {
  alcanceDeLosTotales,
  rotuloDeLosTotales,
  sumar,
} from '../../models/totales'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('por-ruta')!

/**
 * Qué trayectos mueven el dinero.
 *
 * `tarifaPromedio` es lo que hace que este informe valga más que un ranking por
 * volumen: dos rutas pueden vender lo mismo, una con el triple de boletos a un
 * tercio del precio, y sólo la tarifa promedio las distingue. Es pasajes sobre
 * boletos, no sobre ventas: una venta puede llevar varios boletos.
 *
 * La API acepta `origenId` y `destinoId`, pero los controles compartidos no
 * tienen selector de paradas —sus extras son `metodoPago`, `agruparPor` y
 * `comparativo`—, así que esta pantalla expone período y empresa nada más.
 * Agregarlos es un cambio al control compartido, no a este informe.
 */
export function InformePorRuta() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  // Sin paginar: el informe se lee y se archiva entero. Partirlo en páginas
  // obliga a sumar a mano lo que la fila de cierre ya dice.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({ ...aplicados, pagina: 1, tamano: 200 }),
    [aplicados]
  )

  const { data, isLoading, error } = useInforme<DatosPorRuta>(
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

function Cuerpo({ datos }: { datos: DatosPorRuta }) {
  const filas = datos.data

  // La API no devuelve un objeto de totales, así que la hoja los suma. Se le
  // pasa `datos.total` —las rutas que tiene el período— para que el cierre
  // deje de decir «del período» si alguna vez la respuesta viene recortada:
  // sumar lo listado y llamarlo total del período sería una cifra falsa.
  const rotuloTotales = rotuloDeLosTotales(filas.length, datos.total)
  const alcanceTotales = alcanceDeLosTotales(filas.length, datos.total)
  const hojaCompleta = alcanceTotales === undefined

  const ventasLiquidables = sumar(filas, (fila) => fila.ventasLiquidables)
  const boletosVigentes = sumar(filas, (fila) => fila.boletosVigentes)
  const pasajes = sumar(filas, (fila) => fila.pasajes)
  const cargoServicio = sumar(filas, (fila) => fila.cargoServicio)

  // La tarifa del cierre no es la suma de las tarifas ni el promedio de los
  // promedios: es pasajes totales sobre boletos totales. Promediar promedios le
  // daría a una ruta de dos boletos el mismo peso que a una de doscientos.
  const tarifaPromedio = boletosVigentes === 0 ? 0 : pasajes / boletosVigentes

  const columnas: ColumnaContable<FilaRuta>[] = [
    {
      clave: 'origen',
      titulo: 'Origen',
      alinear: 'izquierda',
      celda: (fila) => fila.origenNombre,
    },
    {
      clave: 'destino',
      titulo: 'Destino',
      alinear: 'izquierda',
      celda: (fila) => fila.destinoNombre,
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
      clave: 'tarifa-promedio',
      titulo: 'Tarifa promedio',
      unidad: 'Gs. por boleto',
      ancho: 130,
      celda: (fila) => formatearGuaranies(fila.tarifaPromedio),
      total: formatearGuaranies(tarifaPromedio),
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
      unidad: '% del período',
      ancho: 92,
      celda: (fila) => formatearPorcentaje(fila.participacion),
      // Las participaciones reparten el mismo período: con todas las rutas a la
      // vista el cierre es 100 % por definición. Si la hoja quedó corta no lo
      // es, y ahí se escribe cuánto del período cubre lo listado.
      total: formatearPorcentaje(
        hojaCompleta ? 100 : sumar(filas, (fila) => fila.participacion)
      ),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={filas}
      // El par de paradas es por lo que agrupa el backend: es la identidad real
      // del renglón, y la API no manda un id para él.
      claveFila={claveRuta}
      rotuloTotales={rotuloTotales}
      alcanceTotales={alcanceTotales}
      sonImporte={pasajes}
      descripcion='Ventas, boletos, importe y tarifa promedio de cada par origen-destino del período'
      mensajeVacio='El período no tiene ventas liquidables en ninguna ruta.'
    />
  )
}
