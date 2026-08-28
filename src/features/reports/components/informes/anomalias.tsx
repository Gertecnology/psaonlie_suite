import * as React from 'react'
import { formatearFechaISO, formatearGuaranies } from '@/lib/formato'
import {
  informePorRuta,
  rutaApi,
  type FiltrosInforme,
} from '../../models/informe.model'
import {
  claveAnomalia,
  etiquetaAnomalia,
  type Anomalia,
  type InformeAnomalias as DatosAnomalias,
} from '../../models/anomalias.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('anomalias')!

/**
 * Ventas cuyas propias cifras se contradicen.
 *
 * Todos los renglones son partidas observadas: no es una lista de cosas a mirar
 * algún día, es lo que los demás informes ya están contando. Una comisión mayor
 * que su pasaje está dentro del saldo que se le transfiere a una empresa, y el
 * informe de saldos no tiene manera de decirlo.
 *
 * No lleva `SON:`. No liquida nada: son partidas para revisar a mano, y la suma
 * de importes que justamente no cierran entre sí no es una cifra que alguien
 * vaya a pagar.
 */
export function InformeAnomalias() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  // Sin paginar: la lista se revisa entera. Partirla en páginas obliga a
  // recorrer el informe de a pedazos para saber cuántas partidas hay.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({ ...aplicados, pagina: 1, tamano: 200 }),
    [aplicados],
  )

  const { data, isLoading, error } = useInforme<DatosAnomalias>(
    rutaApi(DEFINICION),
    filtros,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={filtros}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onEmitir={generar}
      puedeEmitir={puedeGenerar}
      controles={
        <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

function Cuerpo({ datos }: { datos: DatosAnomalias }) {
  const columnas: ColumnaContable<Anomalia>[] = [
    {
      clave: 'fecha',
      titulo: 'Fecha',
      unidad: 'AAAA-MM-DD',
      alinear: 'izquierda',
      ancho: 112,
      celda: (fila) => formatearFechaISO(fila.fechaVenta),
    },
    {
      clave: 'observacion',
      titulo: 'Observación',
      alinear: 'izquierda',
      celda: (fila) => (
        <span className='flex flex-col gap-px'>
          {/* El color no puede ser la única señal: en papel no se imprime. El
              renglón dice con texto qué le pasa. */}
          <span className='text-destructive font-medium'>
            {etiquetaAnomalia(fila.tipo)}
          </span>
          {/* La explicación es la del backend, no una interpretación del panel:
              reescribirla acá haría que la hoja y la API dijeran cosas
              distintas sobre la misma venta. */}
          <span className='text-muted-foreground text-[10.5px]'>
            {fila.detalle}
          </span>
        </span>
      ),
    },
    {
      clave: 'transaccion',
      titulo: 'Transacción',
      alinear: 'izquierda',
      ancho: 130,
      celda: (fila) => fila.numeroTransaccion,
    },
    {
      clave: 'empresa',
      titulo: 'Empresa',
      alinear: 'izquierda',
      ancho: 170,
      celda: (fila) => fila.empresaNombre,
    },
    {
      clave: 'estado-pago',
      titulo: 'Estado de pago',
      alinear: 'izquierda',
      ancho: 130,
      celda: (fila) => fila.estadoPago,
    },
    {
      clave: 'pasaje',
      titulo: 'Pasaje',
      unidad: 'Gs.',
      ancho: 118,
      celda: (fila) => formatearGuaranies(fila.pasaje),
    },
    {
      clave: 'comision-asentada',
      titulo: 'Comisión asentada',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.comision),
    },
    {
      clave: 'comision-esperada',
      titulo: 'Comisión esperada',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.comisionEsperada),
    },
  ]

  // Sin fila de totales: la API de este informe no totaliza ninguna columna de
  // importe. Sumar acá los pasajes o las comisiones de partidas que justamente
  // no cierran daría una cifra que no existe en ninguna otra parte del sistema.
  return (
    <TablaContable
      columnas={columnas}
      filas={datos.data}
      // Una venta puede fallar varios controles y volver como varias filas: la
      // clave incluye el tipo o dos filas compartirían clave.
      claveFila={claveAnomalia}
      observada={() => true}
      descripcion='Ventas del período cuyos importes y comisiones no se sostienen entre sí, con la observación de cada una'
      mensajeVacio='El período no tiene partidas observadas. Es el resultado que se busca.'
    />
  )
}
