import * as React from 'react'
import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { informePorRuta, type FiltrosInforme } from '../../models/informe.model'
import type {
  InformePorAgencia,
  SaldoAgencia,
} from '../../models/por-agencia.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('por-agencia')!

/**
 * Cuánto hay que transferirle a cada empresa.
 *
 * Es el informe sobre el que se mueve la plata: cada renglón es una
 * transferencia a hacer, y por eso es el que fijó el formato de los demás. El
 * saldo es el que calcula el backend a partir de los mismos datos con los que
 * liquida; el panel no vuelve a restar comisiones por su cuenta, que era lo que
 * hacía antes y producía una cifra que ningún otro lugar del sistema conocía.
 */
export function InformePorAgencia() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  // Sin paginar: una liquidación se lee y se firma entera. Partirla en páginas
  // obliga a sumar a mano lo que la fila de totales ya dice.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({ ...aplicados, pagina: 1, tamano: 200 }),
    [aplicados],
  )

  const { data, isLoading, error } = useInforme<InformePorAgencia>(
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

function Cuerpo({ datos }: { datos: InformePorAgencia }) {
  const { totales } = datos

  const columnas: ColumnaContable<SaldoAgencia>[] = [
    {
      clave: 'empresa',
      titulo: 'Empresa transportista',
      alinear: 'izquierda',
      celda: (fila) => (
        <span className='flex flex-col gap-px'>
          <span className={fila.agenciaId ? undefined : 'text-muted-foreground italic'}>
            {fila.empresaNombre}
          </span>
          {/* El color no puede ser la única señal: en papel no se imprime y a
              quien no distingue el rojo no le llega. El renglón lo dice. */}
          {fila.pagadasSinBoletoCantidad > 0 && (
            <span className='text-destructive text-[10.5px]'>
              {formatearEntero(fila.pagadasSinBoletoCantidad)} ventas cobradas
              sin boleto · {formatearGuaranies(fila.pagadasSinBoletoMonto)}
            </span>
          )}
        </span>
      ),
      total: (
        <span className='text-[12px] tracking-wide uppercase'>
          Totales del período
        </span>
      ),
    },
    {
      clave: 'comision-vigente',
      titulo: 'Com.',
      unidad: '%',
      ancho: 64,
      // Es la comisión configurada HOY, no la que se aplicó a cada venta. Si
      // cambió a mitad del período no tiene por qué cuadrar con la columna de
      // al lado, y eso no es un error.
      celda: (fila) =>
        fila.porcentajeComisionVigente === null ? (
          <span className='text-muted-foreground'>—</span>
        ) : (
          formatearPorcentaje(fila.porcentajeComisionVigente)
        ),
    },
    {
      clave: 'pasajes',
      titulo: 'Pasajes',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.pasajes),
      total: formatearGuaranies(totales.pasajes),
    },
    {
      clave: 'comision-descontada',
      titulo: 'Comisión retenida',
      unidad: 'Gs.',
      ancho: 128,
      celda: (fila) => formatearGuaranies(fila.comisionDescontada),
      total: formatearGuaranies(totales.comisionDescontada),
    },
    {
      clave: 'devoluciones',
      titulo: 'Devoluciones',
      unidad: 'Gs.',
      ancho: 118,
      celda: (fila) =>
        fila.devolucionesPasajes === 0 ? (
          <span className='text-muted-foreground'>—</span>
        ) : (
          formatearGuaranies(fila.devolucionesPasajes)
        ),
      // La API totaliza cinco líneas y las devoluciones no son una de ellas. Un
      // total inventado acá sería un número que no existe en ninguna otra parte.
    },
    {
      clave: 'saldo',
      titulo: 'Saldo a pagar',
      unidad: 'Gs.',
      ancho: 132,
      celda: (fila) => (
        <span className='font-semibold'>
          {formatearGuaranies(fila.saldoAPagar)}
        </span>
      ),
      total: formatearGuaranies(totales.saldoAPagar),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={datos.data}
      // La empresa sin registrar viene con `agenciaId` nulo y es un renglón
      // real de la liquidación: necesita clave estable igual que las demás.
      claveFila={(fila) => fila.agenciaId ?? 'sin-agencia'}
      observada={(fila) => fila.pagadasSinBoletoCantidad > 0}
      sonImporte={totales.saldoAPagar}
      descripcion='Saldo a transferir a cada empresa en el período, con la comisión vigente, la comisión retenida y las devoluciones'
      mensajeVacio='El período no tiene ventas liquidables de ninguna empresa.'
    />
  )
}
