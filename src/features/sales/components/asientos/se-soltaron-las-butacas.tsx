import { AlertTriangle, Download, RotateCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Asiento } from '../../models/sales.model'
import type { DatosDelPasajero } from '../../utils/los-datos-del-pasajero'
import { estaCompleta } from '../../utils/los-datos-del-pasajero'

/**
 * Se soltaron las butacas.
 *
 * Es lo único que interrumpe al vendedor, y aparece **al final de la cadena**:
 * mientras queden renovaciones por delante no tiene que enterarse de nada, que
 * es toda la premisa de la renovación silenciosa. Recién cuando se agotaron y
 * la transportista soltó los asientos hay algo que decir.
 *
 * Con dieciocho filas cargadas, lo primero que hay que decir es que **ese
 * trabajo no se perdió**. Va antes que los botones, porque es la pregunta que
 * quien vende se hace en ese segundo.
 *
 * Antes no pasaba nada: el contador llegaba a cero en silencio y el error
 * aparecía cuando el backend rechazaba la venta, con todo ya cargado.
 */

interface SeSoltaronLasButacasProps {
  abierto: boolean
  /** Las butacas que se perdieron, para nombrarlas. */
  asientos: Asiento[]
  /** Lo cargado en la planilla, que es lo que NO se pierde. */
  pasajeros?: DatosDelPasajero[]
  onElegirDeNuevo: () => void
  onBuscarOtro: () => void
  onDescargar: () => void
}

/** «01 a 18» cuando son seguidas, y la lista cuando no. */
export function nombrarButacas(asientos: Asiento[]): string {
  const numeros = asientos.map((asiento) => asiento.numero)
  if (numeros.length === 0) return ''
  if (numeros.length === 1) return numeros[0]

  const comoNumero = numeros.map((numero) => parseInt(numero, 10))
  const seguidas =
    comoNumero.every(Number.isFinite) &&
    comoNumero.every(
      (valor, indice) => indice === 0 || valor === comoNumero[indice - 1] + 1
    )

  return seguidas
    ? `${numeros[0]} a ${numeros[numeros.length - 1]}`
    : numeros.join(', ')
}

export function SeSoltaronLasButacas({
  abierto,
  asientos,
  pasajeros = [],
  onElegirDeNuevo,
  onBuscarOtro,
  onDescargar,
}: SeSoltaronLasButacasProps) {
  const cargados = pasajeros.filter(estaCompleta).length

  return (
    // `AlertDialog` y no `Dialog`: esto no es un aviso que se descarta con la
    // cruz o con Escape, es una bifurcación. Las tres salidas están abajo, y
    // cerrar sin elegir dejaría al vendedor con una pantalla que ya no
    // corresponde a ninguna reserva.
    <AlertDialog open={abierto}>
      <AlertDialogContent className='sm:max-w-lg'>
        <div className='flex gap-3'>
          <AlertTriangle className='text-estado-critico mt-0.5 h-5 w-5 flex-none' />
          <div className='min-w-0'>
            <AlertDialogTitle className='text-estado-critico text-[15px] font-semibold'>
              Se soltaron las butacas {nombrarButacas(asientos)}
            </AlertDialogTitle>
            <AlertDialogDescription className='mt-1 text-[13px]'>
              No pudimos seguir reservándolas. Otra agencia puede haberlas
              tomado.
            </AlertDialogDescription>

            {cargados > 0 && (
              <p className='mt-2.5 text-[13px] font-semibold'>
                Los {cargados}{' '}
                {cargados === 1 ? 'pasajero que cargaste queda' : 'pasajeros que cargaste quedan'}{' '}
                guardados. Al elegir butacas de nuevo vuelven solos.
              </p>
            )}
          </div>
        </div>

        <div className='mt-3 flex flex-wrap gap-2'>
          <Button onClick={onElegirDeNuevo}>
            <RotateCcw className='mr-2 h-4 w-4' />
            Elegir butacas de nuevo
          </Button>
          <Button variant='outline' onClick={onBuscarOtro}>
            <Search className='mr-2 h-4 w-4' />
            Buscar otro servicio
          </Button>
          {cargados > 0 && (
            <Button variant='ghost' onClick={onDescargar}>
              <Download className='mr-2 h-4 w-4' />
              Descargar la lista
            </Button>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
