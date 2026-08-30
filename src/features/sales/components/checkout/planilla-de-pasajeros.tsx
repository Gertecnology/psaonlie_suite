import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGetPaisesDisponibles } from '../../hooks/use-get-paises'
import { usePasajeroConocido } from '../../hooks/use-pasajero-conocido'
import { useTiposDocumentoByEmpresa } from '@/features/clients/hooks/use-tipos-documento'
import {
  COLUMNAS,
  GENEROS,
  OCUPACIONES,
  copiarHaciaAbajo,
  cuantasCompletas,
  estaCompleta,
  filaVacia,
  type ColumnaDeLaPlanilla,
  type DatosDelPasajero,
} from '../../utils/los-datos-del-pasajero'

/**
 * La planilla de pasajeros.
 *
 * Son once campos obligatorios por persona. Con dieciocho butacas eso son
 * ciento noventa y ocho: el panel pedía un formulario por pasajero, cada uno
 * en su tarjeta con su botón de guardar, y cargar una delegación era
 * desplegar dieciocho tarjetas y apretar dieciocho botones.
 *
 * Acá es una fila por butaca. Tab pasa al campo siguiente, Enter baja a la
 * misma columna de la fila de abajo, y ⌘↓ copia la celda hacia abajo — un
 * grupo comparte apellido, teléfono de contacto, nacionalidad y residencia.
 *
 * Los desplegables son `select` nativos y no comboboxes: en una planilla se
 * elige tecleando la primera letra y siguiendo con Tab, y eso el control
 * nativo lo hace y el combobox no.
 */

interface PlanillaDePasajerosProps {
  /** Los números de butaca, en orden. Una fila por cada uno. */
  butacas: string[]
  agenciaId: string
  /** Se avisa en cada cambio, con las filas tal como están. */
  onCambio?: (filas: DatosDelPasajero[]) => void
}

/** Una celda de la planilla: se ve como celda, se comporta como campo. */
const CLASES_DE_CELDA =
  'h-full w-full bg-transparent px-2 py-1.5 text-[12.5px] outline-none focus:bg-accent/60 focus:ring-primary/40 focus:ring-1 focus:ring-inset'

function Celda({
  columna,
  valor,
  onChange,
  onTeclado,
  registrarFoco,
  paises,
  tiposDeDocumento,
}: {
  columna: ColumnaDeLaPlanilla
  valor: string
  onChange: (valor: string) => void
  onTeclado: (evento: React.KeyboardEvent) => void
  registrarFoco: (elemento: HTMLElement | null) => void
  paises: { valor: string; etiqueta: string }[]
  tiposDeDocumento: { valor: string; etiqueta: string }[]
}) {
  const comun = {
    value: valor,
    onKeyDown: onTeclado,
    ref: registrarFoco as never,
    className: cn(CLASES_DE_CELDA, !valor && 'text-muted-foreground'),
    'aria-label': columna.etiqueta,
  }

  if (columna.opciones) {
    const opciones =
      columna.opciones === 'paises'
        ? paises
        : columna.opciones === 'tiposDeDocumento'
          ? tiposDeDocumento
          : columna.opciones === 'sexo'
            ? GENEROS.map((genero) => ({
                valor: genero.valor,
                etiqueta: genero.etiqueta,
              }))
            : OCUPACIONES.map((ocupacion) => ({
                valor: ocupacion,
                etiqueta: ocupacion,
              }))

    return (
      <select
        {...comun}
        onChange={(evento) => onChange(evento.target.value)}
      >
        <option value=''>{columna.ejemplo}</option>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      {...comun}
      type={columna.campo === 'fechaNacimiento' ? 'date' : 'text'}
      inputMode={
        columna.campo === 'telefono' || columna.campo === 'numeroDocumento'
          ? 'numeric'
          : undefined
      }
      placeholder={columna.ejemplo}
      onChange={(evento) => onChange(evento.target.value)}
    />
  )
}

function FilaDePasajero({
  indice,
  butaca,
  datos,
  onCambiarCampo,
  onVinoDeLaLibreta,
  onTeclado,
  registrarFoco,
  paises,
  tiposDeDocumento,
}: {
  indice: number
  butaca: string
  datos: DatosDelPasajero
  onCambiarCampo: (campo: keyof DatosDelPasajero, valor: string) => void
  onVinoDeLaLibreta: () => void
  onTeclado: (
    evento: React.KeyboardEvent,
    indice: number,
    columna: number
  ) => void
  registrarFoco: (
    indice: number,
    columna: number
  ) => (elemento: HTMLElement | null) => void
  paises: { valor: string; etiqueta: string }[]
  tiposDeDocumento: { valor: string; etiqueta: string }[]
}) {
  const [vinoDeLaLibreta, setVinoDeLaLibreta] = useState(false)

  // Al tipear la cédula se busca en la libreta y el resto se completa solo.
  // Sólo los campos vacíos: pisar lo escrito haría imposible corregir un dato
  // viejo, porque la respuesta devolvería el anterior.
  const { buscando } = usePasajeroConocido({
    tipoDocumento: datos.tipoDocumento,
    numeroDocumento: datos.numeroDocumento,
    onEncontrado: (campos) => {
      let algunoEntro = false
      for (const [campo, valor] of Object.entries(campos)) {
        if (!valor) continue
        if (datos[campo as keyof DatosDelPasajero]) continue
        onCambiarCampo(campo as keyof DatosDelPasajero, valor as string)
        algunoEntro = true
      }
      if (algunoEntro) {
        setVinoDeLaLibreta(true)
        onVinoDeLaLibreta()
      }
    },
  })

  const lista = estaCompleta(datos)

  return (
    <tr className={cn('border-border border-b', lista && 'bg-estado-ok/[0.04]')}>
      <td className='border-border bg-card sticky left-0 z-10 border-r'>
        <div className='text-muted-foreground flex items-center gap-1.5 px-2 py-1.5 text-[11px] tabular-nums'>
          {lista ? (
            <Check className='text-estado-ok h-3 w-3' aria-label='completo' />
          ) : (
            <span className='opacity-40' aria-hidden='true'>
              ○
            </span>
          )}
          {indice + 1}
        </div>
      </td>
      <td className='border-border bg-card sticky left-[52px] z-10 border-r'>
        <div className='px-2 py-1.5 text-[12.5px] font-semibold tabular-nums'>
          {butaca}
        </div>
      </td>

      {COLUMNAS.map((columna, numeroDeColumna) => (
        <td
          key={columna.campo}
          className={cn(
            'border-border border-r',
            columna.campo === 'numeroDocumento' &&
              'bg-card sticky left-[100px] z-10'
          )}
        >
          <div className='flex items-center'>
            <Celda
              columna={columna}
              valor={datos[columna.campo]}
              onChange={(valor) => onCambiarCampo(columna.campo, valor)}
              onTeclado={(evento) =>
                onTeclado(evento, indice, numeroDeColumna)
              }
              registrarFoco={registrarFoco(indice, numeroDeColumna)}
              paises={paises}
              tiposDeDocumento={tiposDeDocumento}
            />
            {columna.campo === 'numeroDocumento' && buscando && (
              <Loader2
                className='text-muted-foreground mr-1.5 h-3 w-3 flex-none animate-spin'
                aria-label='Buscándolo en tu libreta'
              />
            )}
            {columna.campo === 'numeroDocumento' &&
              !buscando &&
              vinoDeLaLibreta && (
                <Check
                  className='text-estado-ok mr-1.5 h-3 w-3 flex-none'
                  aria-label='vino de tu libreta'
                />
              )}
          </div>
        </td>
      ))}
    </tr>
  )
}

export function PlanillaDePasajeros({
  butacas,
  agenciaId,
  onCambio,
}: PlanillaDePasajerosProps) {
  const [filas, setFilas] = useState<DatosDelPasajero[]>(() =>
    butacas.map(() => filaVacia())
  )

  /** Cuáles se completaron solas desde la libreta, para poder contarlas. */
  const [deLaLibreta, setDeLaLibreta] = useState<Set<number>>(new Set())

  const { data: tiposDocumento } = useTiposDocumentoByEmpresa(agenciaId)
  const { data: paisesDisponibles } = useGetPaisesDisponibles(agenciaId)

  const paises = (paisesDisponibles ?? []).map((pais) => ({
    valor: pais.Codigo,
    etiqueta: pais.Descripcion ?? pais.Codigo,
  }))
  const tiposDeDocumento = (tiposDocumento ?? []).map((tipo) => ({
    valor: tipo.codigo,
    etiqueta: tipo.descripcion ?? tipo.codigo,
  }))

  // Las celdas, por (fila, columna), para poder mover el foco con el teclado.
  const celdas = useRef(new Map<string, HTMLElement>())
  const registrarFoco = useCallback(
    (indice: number, columna: number) => (elemento: HTMLElement | null) => {
      const clave = `${indice}-${columna}`
      if (elemento) celdas.current.set(clave, elemento)
      else celdas.current.delete(clave)
    },
    []
  )

  useEffect(() => {
    onCambio?.(filas)
  }, [filas, onCambio])

  const cambiarCampo = (
    indice: number,
    campo: keyof DatosDelPasajero,
    valor: string
  ) => {
    setFilas((antes) =>
      antes.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila))
    )
  }

  const manejarTeclado = (
    evento: React.KeyboardEvent,
    indice: number,
    columna: number
  ) => {
    // ⌘↓ copia la celda hacia abajo. Un grupo comparte apellido, teléfono de
    // contacto, nacionalidad y residencia: tipearlos dieciocho veces es la
    // parte que hace que quien vende prefiera el papel.
    if (evento.key === 'ArrowDown' && (evento.metaKey || evento.ctrlKey)) {
      evento.preventDefault()
      setFilas((antes) => copiarHaciaAbajo(antes, indice, COLUMNAS[columna].campo))
      return
    }

    // Enter baja una fila en la misma columna, que es como se carga una
    // planilla: una columna entera de un tirón.
    if (evento.key === 'Enter') {
      evento.preventDefault()
      celdas.current.get(`${indice + 1}-${columna}`)?.focus()
    }
  }

  const completas = cuantasCompletas(filas)

  return (
    <div className='border-border flex min-h-0 flex-col overflow-hidden rounded-xl border'>
      <div className='border-border flex flex-wrap items-center gap-2.5 border-b px-3.5 py-2.5'>
        <h2 className='text-[13.5px] font-semibold'>Datos de los pasajeros</h2>
        <span className='text-muted-foreground text-xs tabular-nums'>
          {completas} de {filas.length} completos
        </span>
        {deLaLibreta.size > 0 && (
          <span className='text-muted-foreground text-[11.5px]'>
            · {deLaLibreta.size} se{' '}
            {deLaLibreta.size === 1 ? 'completó solo' : 'completaron solos'}
          </span>
        )}
      </div>

      <div className='bg-muted h-[3px] flex-none' aria-hidden='true'>
        <i
          className='bg-estado-ok block h-full transition-[width]'
          style={{
            width: `${filas.length ? (completas / filas.length) * 100 : 0}%`,
          }}
        />
      </div>

      {/* La planilla scrollea sola: el encabezado de columnas y el pie con los
          atajos nunca se van de la pantalla. */}
      <div className='min-h-0 flex-1 overflow-auto'>
        <table className='w-max border-collapse text-left'>
          <thead className='bg-card sticky top-0 z-20'>
            <tr className='border-border border-b'>
              <th className='border-border text-muted-foreground bg-card sticky left-0 z-30 w-[52px] border-r px-2 py-2 text-[11px] font-medium'>
                Estado
              </th>
              <th className='border-border text-muted-foreground bg-card sticky left-[52px] z-30 w-12 border-r px-2 py-2 text-[11px] font-medium'>
                Butaca
              </th>
              {COLUMNAS.map((columna) => (
                <th
                  key={columna.campo}
                  style={{ width: columna.ancho, minWidth: columna.ancho }}
                  className={cn(
                    'border-border text-muted-foreground border-r px-2 py-2 text-[11px] font-medium',
                    columna.campo === 'numeroDocumento' &&
                      'bg-card sticky left-[100px] z-30'
                  )}
                >
                  {columna.etiqueta}
                  {columna.obligatorio && (
                    <span className='text-muted-foreground/60'> *</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {butacas.map((butaca, indice) => (
              <FilaDePasajero
                key={butaca}
                indice={indice}
                butaca={butaca}
                datos={filas[indice] ?? filaVacia()}
                onCambiarCampo={(campo, valor) =>
                  cambiarCampo(indice, campo, valor)
                }
                onVinoDeLaLibreta={() =>
                  setDeLaLibreta((antes) => new Set(antes).add(indice))
                }
                onTeclado={manejarTeclado}
                registrarFoco={registrarFoco}
                paises={paises}
                tiposDeDocumento={tiposDeDocumento}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className='border-border text-muted-foreground flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t px-3.5 py-2 text-[11.5px]'>
        <span>
          <kbd className='border-border rounded-[3px] border px-1 font-mono'>
            Tab
          </kbd>{' '}
          siguiente campo
        </span>
        <span>
          <kbd className='border-border rounded-[3px] border px-1 font-mono'>
            Enter
          </kbd>{' '}
          baja una fila
        </span>
        <span>
          <kbd className='border-border rounded-[3px] border px-1 font-mono'>
            ⌘↓
          </kbd>{' '}
          copia hacia abajo
        </span>
        <span className='flex items-center gap-1.5'>
          <Check className='text-estado-ok h-3 w-3' aria-hidden='true' />
          vino de tu libreta al tipear la cédula
        </span>
      </div>
    </div>
  )
}
