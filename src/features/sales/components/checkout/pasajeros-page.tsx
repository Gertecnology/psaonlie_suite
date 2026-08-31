import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRoundTrip } from '../../context/round-trip-context'
import { useLaReservaSigueViva } from '../../hooks/use-la-reserva-sigue-viva'
import { descargarLaLista } from '../../utils/la-lista-de-pasajeros-en-csv'
import { leerHorario } from '../../utils/el-horario-del-servicio'
import {
  cuantasCompletas,
  filaVacia,
  type DatosDelPasajero,
} from '../../utils/los-datos-del-pasajero'
import {
  calcularCargoServicio,
  formatearGuaranies,
  sumarPreciosAsientos,
} from '../../utils/money'
import { SeSoltaronLasButacas } from '../asientos/se-soltaron-las-butacas'
import { TiempoBloqueo } from '../asientos/tiempo-bloqueo'
import { PlanillaDePasajeros } from './planilla-de-pasajeros'

/**
 * Paso 4: quiénes viajan.
 *
 * Era la mitad de una pantalla que también mostraba el resumen del viaje, los
 * totales y el botón de confirmar. Con dieciocho pasajeros esa pantalla no
 * entraba en una notebook, y el vendedor confirmaba la venta desde arriba sin
 * haber visto lo que cargó abajo.
 *
 * Acá se carga y nada más. Revisar y cobrar es el paso siguiente.
 */
export function PasajerosPage() {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()

  const asientos = roundTripData.ida.asientos ?? []

  const [filas, setFilas] = useState<DatosDelPasajero[]>(
    roundTripData.pasajeros ?? asientos.map(() => filaVacia())
  )

  /**
   * Se soltaron las butacas mientras se cargaba.
   *
   * Es el paso donde más duele: con dieciocho filas encima, enterarse recién
   * al confirmar significa haber tipeado ciento noventa y ocho campos sobre
   * una reserva que ya no existía.
   */
  const [seSoltaron, setSeSoltaron] = useState(false)

  useLaReservaSigueViva({
    codigoReferencia: roundTripData.ida.codigoReferencia,
    expiraEn: roundTripData.ida.bloqueoExpiraEn,
    activa: !roundTripData.ida.ventaConfirmada,
    onSeSoltaron: () => setSeSoltaron(true),
  })

  const completas = cuantasCompletas(filas)
  const faltan = asientos.length - completas

  const importePasajes = sumarPreciosAsientos(asientos)
  const totalTramo =
    importePasajes +
    calcularCargoServicio(importePasajes, roundTripData.ida.serviceCharge)

  const horario = roundTripData.ida.servicio
    ? leerHorario(
        roundTripData.ida.servicio.Embarque,
        roundTripData.ida.servicio.Desembarque
      )
    : null

  const continuar = () => {
    if (faltan > 0 || seSoltaron) return
    setRoundTripData({ pasajeros: filas })
    setCurrentStep('resumen')
  }

  /**
   * Volver a elegir butacas conservando lo cargado.
   *
   * Los pasajeros se guardan en el contexto antes de salir: al volver acá, la
   * planilla arranca con todo puesto y sólo falta la butaca de cada uno.
   */
  const elegirButacasDeNuevo = () => {
    setRoundTripData({
      pasajeros: filas,
      ida: {
        ...roundTripData.ida,
        asientos: undefined,
        codigoReferencia: undefined,
        bloqueoExpiraEn: undefined,
      },
    })
    setCurrentStep('ida-seats')
  }

  const volver = () => {
    // Lo cargado se guarda antes de salir: volver a elegir butacas no puede
    // costar dieciocho filas de tipeo.
    setRoundTripData({ pasajeros: filas })
    setCurrentStep(roundTripData.vuelta?.fecha ? 'vuelta-seats' : 'ida-seats')
  }

  return (
    <div className='flex flex-col gap-3.5'>
      <div className='flex items-start gap-3'>
        <Button
          variant='outline'
          size='sm'
          className='h-7 px-3 text-xs'
          onClick={volver}
        >
          <ArrowLeft className='mr-1.5 h-3.5 w-3.5' />
          Volver
        </Button>

        <div className='min-w-0'>
          <h1 className='text-xl font-bold tracking-tight'>Pasajeros</h1>
          <p className='text-muted-foreground mt-0.5 truncate text-[12.5px]'>
            {[
              roundTripData.ida.servicio?.Emp,
              horario && `sale ${horario.sale}`,
              asientos.length > 0 &&
                `butacas ${asientos.map((asiento) => asiento.numero).join(', ')}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className='ml-auto flex flex-none items-center gap-3'>
          <TiempoBloqueo expiraEn={roundTripData.ida.bloqueoExpiraEn} />
        </div>
      </div>

      <SeSoltaronLasButacas
        abierto={seSoltaron}
        asientos={asientos}
        pasajeros={filas}
        onElegirDeNuevo={elegirButacasDeNuevo}
        onBuscarOtro={() => {
          setRoundTripData({ pasajeros: filas })
          setCurrentStep('search')
        }}
        onDescargar={() => descargarLaLista(filas, 'pasajeros')}
      />

      <PlanillaDePasajeros
        butacas={asientos.map((asiento) => asiento.numero)}
        agenciaId={roundTripData.ida.agenciaId ?? ''}
        valorInicial={roundTripData.pasajeros}
        onCambio={setFilas}
      />

      {/* En una notebook de 768 el total y el botón no pueden quedar debajo
          del pliegue. */}
      <div className='flex flex-wrap items-center gap-4'>
        <div className='ml-auto flex items-center gap-4'>
          <div className='text-right'>
            <p className='text-muted-foreground text-[11px]'>Total a cobrar</p>
            <p className='text-xl leading-tight font-bold tracking-tight tabular-nums'>
              {formatearGuaranies(totalTramo)}
            </p>
          </div>
          <Button
            className='h-10 px-5'
            onClick={continuar}
            disabled={faltan > 0}
          >
            {faltan > 0 ? (
              `Faltan ${faltan} ${faltan === 1 ? 'pasajero' : 'pasajeros'}`
            ) : (
              <>
                Revisar y cobrar
                <ArrowRight className='ml-2 h-4 w-4' />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
