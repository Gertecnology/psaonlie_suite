import * as React from 'react'
import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
} from '@/lib/formato'
import {
  informePorRuta,
  rutaApi,
  type FiltrosInforme,
} from '../../models/informe.model'
import { etiquetaMetodoPago } from '../../models/por-metodo-pago.model'
import type {
  InformeVentasSinBoleto as DatosVentasSinBoleto,
  VentaPagadaSinBoleto,
} from '../../models/ventas-sin-boleto.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

const DEFINICION = informePorRuta('ventas-sin-boleto')!

/**
 * Plata cobrada sin entregar el pasaje.
 *
 * Todos los renglones son partidas observadas: no hay caso normal en esta hoja.
 * El resto de los informes cuenta estas ventas como ingreso, y ésta es la única
 * que las nombra una por una.
 *
 * Lo que no lleva es el contacto del cliente. El documento se archiva y se
 * manda, y el correo y el teléfono de una persona no tienen por qué viajar en
 * un papel que va a circular: para llamar al cliente está la venta en el panel,
 * que es donde ese dato está detrás del permiso que corresponde.
 */
export function InformeVentasSinBoleto() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  // Sin paginar: es la lista de casos a atender y se lee entera. Partirla en
  // páginas obliga a sumar a mano lo que la fila de totales ya dice.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({ ...aplicados, pagina: 1, tamano: 200 }),
    [aplicados],
  )

  const { data, isLoading, error } =
    // El endpoint se llama `ventas-pagadas-sin-boleto`; la URL del navegador,
    // `ventas-sin-boleto`. `rutaApi` resuelve cuál va a la API.
    useInforme<DatosVentasSinBoleto>(rutaApi(DEFINICION), filtros)

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

function Cuerpo({ datos }: { datos: DatosVentasSinBoleto }) {
  const columnas: ColumnaContable<VentaPagadaSinBoleto>[] = [
    {
      clave: 'fecha-venta',
      titulo: 'Fecha de venta',
      unidad: 'AAAA-MM-DD',
      alinear: 'izquierda',
      ancho: 112,
      celda: (fila) => formatearFechaISO(fila.fechaVenta),
    },
    {
      clave: 'transaccion',
      titulo: 'Transacción',
      alinear: 'izquierda',
      ancho: 150,
      celda: (fila) => (
        <span className='flex flex-col gap-px'>
          <span>{fila.numeroTransaccion}</span>
          {/* Sin el id de Bancard no se puede rastrear el cobro en la pasarela,
              que es el primer paso para decidir si se emite o se devuelve. */}
          {fila.bancardTransactionId && (
            <span className='text-muted-foreground text-[10.5px]'>
              Bancard {fila.bancardTransactionId}
            </span>
          )}
        </span>
      ),
    },
    {
      clave: 'empresa',
      titulo: 'Empresa',
      alinear: 'izquierda',
      celda: (fila) => fila.empresaNombre,
    },
    {
      clave: 'medio-cobro',
      titulo: 'Medio de cobro',
      alinear: 'izquierda',
      ancho: 120,
      celda: (fila) => etiquetaMetodoPago(fila.metodoPago),
    },
    {
      clave: 'fecha-viaje',
      titulo: 'Fecha de viaje',
      unidad: 'AAAA-MM-DD',
      alinear: 'izquierda',
      ancho: 112,
      celda: (fila) => formatearFechaISO(fila.fechaViaje),
    },
    {
      clave: 'pasaje',
      titulo: 'Pasaje',
      unidad: 'Gs.',
      ancho: 118,
      celda: (fila) => formatearGuaranies(fila.pasaje),
      // La API totaliza el cobrado al cliente y nada más. Un total de pasaje
      // sumado acá sería una cifra que no existe en ninguna otra parte.
    },
    {
      clave: 'cargo-servicio',
      titulo: 'Cargo por servicio',
      unidad: 'Gs.',
      ancho: 118,
      celda: (fila) => formatearGuaranies(fila.cargoServicio),
    },
    {
      clave: 'cobrado',
      titulo: 'Cobrado al cliente',
      unidad: 'Gs.',
      ancho: 132,
      celda: (fila) => (
        <span className='font-semibold'>
          {formatearGuaranies(fila.cobradoAlCliente)}
        </span>
      ),
      total: formatearGuaranies(datos.montoTotal),
    },
    {
      clave: 'antiguedad',
      titulo: 'Antigüedad',
      unidad: 'horas',
      ancho: 88,
      // En rojo y con las horas escritas: el color no se imprime, el número sí.
      // Es lo que ordena el trabajo — dos horas es un cobro todavía en curso,
      // treinta es una persona esperando.
      celda: (fila) => (
        <span className='text-destructive font-semibold'>
          {formatearEntero(fila.antiguedadHoras)}
          <span className='sr-only'> horas sin pasaje entregado</span>
        </span>
      ),
    },
  ]

  return (
    <TablaContable
      columnas={columnas}
      filas={datos.data}
      claveFila={(fila) => fila.ventaId}
      // Acá no hay renglón normal: cada uno es plata cobrada sin entregar nada.
      observada={() => true}
      alcanceTotales={`${formatearEntero(datos.total)} ventas del período`}
      sonImporte={datos.montoTotal}
      descripcion='Ventas del período con el pago registrado y ningún boleto emitido, con lo cobrado al cliente y la antigüedad de cada caso'
      mensajeVacio='El período no tiene ventas cobradas sin boleto. Es el resultado que se busca.'
    />
  )
}
