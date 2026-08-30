import type { Asiento } from '../../models/sales.model'
import { aEnteroGuaranies } from '../../utils/money'
import { estaCompleta, type DatosDelPasajero } from '../../utils/los-datos-del-pasajero'

/**
 * Lo que se lleva el cliente, antes de cobrar.
 *
 * Con dieciocho pasajes, el vendedor confirma una venta que no puede leer: el
 * resumen mostraba los totales y nada más, así que un nombre mal tipeado o una
 * cédula cambiada aparecían recién en el boleto impreso.
 *
 * Una línea por butaca, con quién viaja y su documento. Es la última pantalla
 * donde eso todavía se puede corregir sin anular nada.
 */

interface LoQueSeLlevaProps {
  /** Las butacas de la venta, en orden. */
  asientos: Asiento[]
  /** Lo cargado en la planilla, en el mismo orden que las butacas. */
  filas: DatosDelPasajero[]
  /** Cuántas líneas se muestran antes de resumir el resto. */
  maximo?: number
}

export function LoQueSeLleva({
  asientos,
  filas,
  maximo = 12,
}: LoQueSeLlevaProps) {
  const lineas = asientos.map((asiento, indice) => ({
    asiento,
    datos: filas[indice],
  }))

  const visibles = lineas.slice(0, maximo)
  const resto = lineas.length - visibles.length

  return (
    <div className='border-border flex min-h-0 flex-col rounded-xl border p-4'>
      <div className='mb-2.5 flex flex-wrap items-baseline gap-2.5'>
        <h2 className='text-sm font-semibold'>Lo que se lleva</h2>
        <span className='text-muted-foreground text-xs'>
          {lineas.length} {lineas.length === 1 ? 'pasaje' : 'pasajes'} · butacas{' '}
          {asientos.map((asiento) => asiento.numero).join(', ')}
        </span>
      </div>

      <div className='border-border text-muted-foreground flex items-center gap-2.5 border-b py-2 text-[10px] font-bold tracking-[0.07em] uppercase'>
        <span className='w-8 flex-none'>But.</span>
        <span className='flex-1'>Pasajero</span>
        <span className='flex-none'>Documento</span>
        <span className='w-[74px] flex-none text-right'>Pasaje</span>
      </div>

      <div className='min-h-0 flex-1 overflow-auto'>
        {visibles.map(({ asiento, datos }) => {
          const cargado = datos && estaCompleta(datos)

          return (
            <div
              key={asiento.numero}
              className='border-border flex items-center gap-2.5 border-b py-1.5 text-[12.5px]'
            >
              <span className='w-8 flex-none font-semibold tabular-nums'>
                {asiento.numero}
              </span>
              <span className='min-w-0 flex-1 truncate'>
                {cargado ? (
                  `${datos.nombre} ${datos.apellido}`
                ) : (
                  <span className='text-muted-foreground'>Sin cargar</span>
                )}
              </span>
              <span className='text-muted-foreground flex-none text-[11.5px] tabular-nums'>
                {cargado
                  ? `${datos.tipoDocumento} ${datos.numeroDocumento}`
                  : '—'}
              </span>
              <span className='w-[74px] flex-none text-right tabular-nums'>
                {aEnteroGuaranies(asiento.precio).toLocaleString('es-PY')}
              </span>
            </div>
          )
        })}

        {resto > 0 && (
          <p className='text-muted-foreground py-2 text-[11.5px]'>
            {resto} {resto === 1 ? 'pasajero más' : 'pasajeros más'}
          </p>
        )}
      </div>
    </div>
  )
}
