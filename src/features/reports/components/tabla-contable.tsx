import * as React from 'react'
import { cn } from '@/lib/utils'
import { importeEnLetras } from '@/lib/importe-en-letras'

/**
 * Una columna de la planilla.
 *
 * `total` es lo que va en la fila de cierre. Que sea opcional importa: en una
 * liquidación hay columnas que no se totalizan —un porcentaje vigente, una
 * fecha— y poner ahí una suma sería inventar una cifra que no existe en
 * ninguna otra parte del sistema.
 */
export interface ColumnaContable<T> {
  clave: string
  titulo: string
  /** Va debajo del nombre, en chico: `Gs.`, `ventas`, `%`. */
  unidad?: string
  /** Ancho fijo en px. Sin ancho, la columna absorbe el sobrante. */
  ancho?: number
  alinear?: 'izquierda' | 'derecha'
  celda: (fila: T, indice: number) => React.ReactNode
  total?: React.ReactNode
}

interface TablaContableProps<T> {
  columnas: ColumnaContable<T>[]
  filas: T[]
  /** Clave estable por fila. Una fila sin clave estable se remonta al repintar. */
  claveFila: (fila: T, indice: number) => string
  /** Marca el renglón como observado: se tiñe y lo dice con texto, no sólo con color. */
  observada?: (fila: T) => boolean
  /** Rótulo de la fila de cierre. */
  rotuloTotales?: string
  /** Aclaración bajo el rótulo: «todas las empresas, no sólo esta página». */
  alcanceTotales?: string
  /**
   * Importe que se escribe en letras al pie.
   *
   * Se omite en los informes que no liquidan nada: sumar variaciones o listar
   * partidas a revisar no da un importe que alguien vaya a pagar.
   */
  sonImporte?: number
  /** Lo que va entre la ficha técnica y el encabezado de columnas. */
  antesDeLaTabla?: React.ReactNode
  descripcion: string
  mensajeVacio?: string
}

/**
 * La planilla: renglones numerados, encabezado de columnas y cierre con
 * totales.
 *
 * Es una `<table>` de verdad y no una grilla de `div`s a propósito: al imprimir,
 * `thead` se repite arriba de cada hoja y `tfoot` abajo, y ese comportamiento
 * no lo tiene ningún otro elemento. Una segunda hoja sin encabezado de columnas
 * es una grilla de números sin saber a qué corresponde cada uno.
 */
export function TablaContable<T>({
  columnas,
  filas,
  claveFila,
  observada,
  rotuloTotales = 'Totales del período',
  alcanceTotales,
  sonImporte,
  antesDeLaTabla,
  descripcion,
  mensajeVacio = 'El período no tiene movimientos.',
}: TablaContableProps<T>) {
  const hayTotales = columnas.some((columna) => columna.total !== undefined)

  return (
    <>
      {antesDeLaTabla}

      <table className='informe-tabla w-full border-collapse text-[12.5px]'>
        <caption className='sr-only'>{descripcion}</caption>
        <thead>
          <tr className='bg-muted/60 border-y border-y-[#1e2a5a]'>
            <th
              scope='col'
              className='text-muted-foreground w-[42px] py-1.5 pr-2.5 pl-7 text-right text-[10px] font-semibold tracking-wide uppercase'
            >
              N°
            </th>
            {columnas.map((columna, indice) => (
              <th
                key={columna.clave}
                scope='col'
                style={columna.ancho ? { width: columna.ancho } : undefined}
                className={cn(
                  'text-muted-foreground py-1.5 text-[10px] font-semibold tracking-wide uppercase',
                  columna.alinear === 'izquierda' ? 'text-left' : 'text-right',
                  indice === 0 ? 'pr-2.5' : 'px-2.5',
                  indice === columnas.length - 1 && 'pr-7',
                )}
              >
                {columna.titulo}
                {columna.unidad && (
                  <span className='text-muted-foreground/70 block text-[9px] font-normal normal-case'>
                    {columna.unidad}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {filas.length === 0 ? (
            <tr>
              <td
                colSpan={columnas.length + 1}
                className='text-muted-foreground px-7 py-16 text-center text-[12.5px]'
              >
                {mensajeVacio}
              </td>
            </tr>
          ) : (
            filas.map((fila, indice) => (
              <tr
                key={claveFila(fila, indice)}
                className={cn(
                  'border-border/50 border-b',
                  indice % 2 === 1 && 'bg-muted/25',
                  observada?.(fila) && 'bg-destructive/5',
                )}
              >
                <td className='text-muted-foreground/70 py-1 pr-2.5 pl-7 text-right text-[11px] tabular-nums'>
                  {indice + 1}
                </td>
                {columnas.map((columna, columnaIndice) => (
                  <td
                    key={columna.clave}
                    data-tipo={columna.alinear === 'izquierda' ? undefined : 'monto'}
                    className={cn(
                      'py-1 tabular-nums',
                      columna.alinear === 'izquierda' ? 'text-left' : 'text-right',
                      columnaIndice === 0 ? 'pr-2.5' : 'px-2.5',
                      columnaIndice === columnas.length - 1 && 'pr-7',
                    )}
                  >
                    {columna.celda(fila, indice)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {hayTotales && filas.length > 0 && (
          <tfoot>
            <tr className='bg-muted/60 border-y-2 border-y-[#1e2a5a] font-bold text-[#1e2a5a]'>
              <td className='py-1.5 pr-2.5 pl-7' />
              {columnas.map((columna, indice) => (
                <td
                  key={columna.clave}
                  data-tipo={columna.alinear === 'izquierda' ? undefined : 'monto'}
                  className={cn(
                    'py-1.5 tabular-nums',
                    columna.alinear === 'izquierda' ? 'text-left' : 'text-right',
                    indice === 0 ? 'pr-2.5' : 'px-2.5',
                    indice === columnas.length - 1 && 'pr-7',
                  )}
                >
                  {indice === 0 ? (
                    <span className='text-[12px] tracking-wide uppercase'>
                      {rotuloTotales}
                      {alcanceTotales && (
                        <span className='text-muted-foreground block text-[10px] font-normal normal-case'>
                          {alcanceTotales}
                        </span>
                      )}
                    </span>
                  ) : (
                    (columna.total ?? <span className='font-normal'>—</span>)
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>

      {sonImporte !== undefined && filas.length > 0 && (
        <p className='border-border flex items-baseline gap-2.5 border-b px-7 py-2'>
          <span className='text-muted-foreground text-[10px] font-bold tracking-wider'>
            SON:
          </span>
          <span className='text-[11.5px]'>{importeEnLetras(sonImporte)}</span>
        </p>
      )}
    </>
  )
}
