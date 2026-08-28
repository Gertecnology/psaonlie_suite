import * as React from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  MARGENES,
  ORIENTACIONES,
  PREFERENCIAS_POR_DEFECTO,
  TAMANOS_PAPEL,
  aPixeles,
  hojaEnPixeles,
  hojasEstimadas,
  reglaDePagina,
  type Margen,
  type Orientacion,
  type PreferenciasImpresion,
  type TamanoPapel,
} from '../models/preferencias-impresion'

const CLAVE_GUARDADA = 'informes.preferencias-impresion'

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Cómo se llama el documento, para el título del diálogo. */
  documento: string
  /** La hoja, la misma que se ve en la pantalla y la misma que se imprime. */
  children: React.ReactNode
}

/**
 * Ver la hoja antes de mandarla a la impresora.
 *
 * El navegador ya trae un diálogo de impresión, y no alcanza: las preferencias
 * se eligen a ciegas y el resultado se ve cuando la hoja ya salió. Acá se
 * eligen mirando el papel, sobre **el mismo DOM y el mismo CSS** que después
 * imprime — no es una maqueta de cómo quedaría, es cómo queda.
 *
 * Lo que sí sigue siendo del navegador es el diálogo final: quién es la
 * impresora, cuántas copias, a doble faz. Eso es del sistema operativo y no
 * tiene sentido reimplementarlo.
 */
export function VistaPreviaImpresion({
  abierto,
  onCerrar,
  documento,
  children,
}: Props) {
  const [preferencias, setPreferencias] = React.useState<PreferenciasImpresion>(
    () => leerGuardadas(),
  )
  const hoja = hojaEnPixeles(preferencias)
  const margenLateral = aPixeles(MARGENES[preferencias.margen].lateral)
  const margenVertical = aPixeles(MARGENES[preferencias.margen].vertical)

  // El ancho del papel manda sobre el del modal: la hoja se dibuja a tamaño
  // real y se achica entera, en vez de reacomodarse. Si se reacomodara, el
  // preview mostraría un reparto de columnas que la impresora no va a hacer.
  const [escala, setEscala] = React.useState(1)
  const [altoContenido, setAltoContenido] = React.useState(0)
  const marco = React.useRef<HTMLDivElement>(null)
  const contenido = React.useRef<HTMLDivElement>(null)

  React.useLayoutEffect(() => {
    if (!abierto) return
    const medir = () => {
      const disponible = marco.current?.clientWidth ?? hoja.ancho
      setEscala(Math.min(1, disponible / hoja.ancho))
      setAltoContenido(contenido.current?.scrollHeight ?? 0)
    }
    medir()
    const observer = new ResizeObserver(medir)
    if (marco.current) observer.observe(marco.current)
    if (contenido.current) observer.observe(contenido.current)
    return () => observer.disconnect()
  }, [abierto, hoja.ancho, preferencias])

  // `@page` no acepta variables CSS, así que el tamaño y los márgenes van
  // escritos literales en una regla que se reemplaza al cambiarlos.
  React.useEffect(() => {
    if (!abierto) return
    const estilo = document.createElement('style')
    estilo.dataset.informePagina = ''
    estilo.textContent = reglaDePagina(preferencias)
    document.head.append(estilo)
    return () => estilo.remove()
  }, [abierto, preferencias])

  const cambiar = <K extends keyof PreferenciasImpresion>(
    clave: K,
    valor: PreferenciasImpresion[K],
  ) => {
    const nuevas = { ...preferencias, [clave]: valor }
    setPreferencias(nuevas)
    guardar(nuevas)
  }

  const hojas = hojasEstimadas(altoContenido, preferencias)

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent
        className='flex max-h-[92vh] max-w-6xl flex-col gap-4'
        // El diálogo es andamiaje: no se imprime, se imprime lo de adentro.
        aria-describedby={undefined}
      >
        <DialogHeader className='no-imprimir'>
          <DialogTitle>Vista previa de impresión</DialogTitle>
          <DialogDescription>{documento}</DialogDescription>
        </DialogHeader>

        <div className='flex min-h-0 flex-1 gap-5'>
          {/* El papel */}
          <div
            ref={marco}
            className='bg-muted/40 min-h-0 flex-1 overflow-auto rounded-md border p-5'
          >
            <div
              style={{
                width: hoja.ancho * escala,
                height: Math.max(hoja.alto, altoContenido + margenVertical * 2) * escala,
                margin: '0 auto',
              }}
            >
              <div
                className={cn(
                  'informe-imprimible bg-white shadow-sm',
                  !preferencias.cebra && 'informe-sin-cebra',
                )}
                style={{
                  width: hoja.ancho,
                  minHeight: hoja.alto,
                  padding: `${margenVertical}px ${margenLateral}px`,
                  transform: `scale(${escala})`,
                  transformOrigin: 'top left',
                }}
              >
                <div ref={contenido}>{children}</div>
              </div>
            </div>
          </div>

          {/* Las preferencias */}
          <div className='no-imprimir flex w-60 shrink-0 flex-col gap-4 overflow-y-auto'>
            <Campo etiqueta='Tamaño del papel' htmlFor='pref-tamano'>
              <Select
                value={preferencias.tamano}
                onValueChange={(v) => cambiar('tamano', v as TamanoPapel)}
              >
                <SelectTrigger id='pref-tamano' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TAMANOS_PAPEL).map(([clave, papel]) => (
                    <SelectItem key={clave} value={clave}>
                      {papel.etiqueta} — {papel.ancho} × {papel.alto} mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>

            <Campo etiqueta='Orientación' htmlFor='pref-orientacion'>
              <Select
                value={preferencias.orientacion}
                onValueChange={(v) => cambiar('orientacion', v as Orientacion)}
              >
                <SelectTrigger id='pref-orientacion' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORIENTACIONES).map(([clave, etiqueta]) => (
                    <SelectItem key={clave} value={clave}>
                      {etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>

            <Campo etiqueta='Márgenes' htmlFor='pref-margen'>
              <Select
                value={preferencias.margen}
                onValueChange={(v) => cambiar('margen', v as Margen)}
              >
                <SelectTrigger id='pref-margen' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MARGENES).map(([clave, margen]) => (
                    <SelectItem key={clave} value={clave}>
                      {margen.etiqueta} — {margen.vertical} / {margen.lateral} mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>

            <div className='flex items-start gap-2.5'>
              <Checkbox
                id='pref-cebra'
                checked={preferencias.cebra}
                onCheckedChange={(v) => cambiar('cebra', v === true)}
              />
              <div className='grid gap-1'>
                <Label htmlFor='pref-cebra' className='text-sm font-normal'>
                  Fondo alternado
                </Label>
                <p className='text-muted-foreground text-xs'>
                  Apagalo para gastar menos tóner. No cambia lo que dice el
                  informe.
                </p>
              </div>
            </div>

            <div className='bg-muted/50 mt-auto rounded-md border p-3'>
              <p className='text-sm font-medium tabular-nums'>
                {hojas} {hojas === 1 ? 'hoja' : 'hojas'}
              </p>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                Estimado. Puede salir una más si un renglón no entra y pasa a la
                hoja siguiente.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className='no-imprimir'>
          <Button variant='outline' onClick={onCerrar}>
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer />
            Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Campo({
  etiqueta,
  htmlFor,
  children,
}: {
  etiqueta: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className='grid gap-1.5'>
      <Label htmlFor={htmlFor} className='text-xs'>
        {etiqueta}
      </Label>
      {children}
    </div>
  )
}

/**
 * Las preferencias del usuario, si ya eligió alguna vez.
 *
 * Un almacenamiento roto o un valor de otra versión no puede dejar sin vista
 * previa a nadie: ante cualquier duda, los valores por defecto.
 */
function leerGuardadas(): PreferenciasImpresion {
  try {
    const crudo = localStorage.getItem(CLAVE_GUARDADA)
    if (!crudo) return PREFERENCIAS_POR_DEFECTO
    const guardadas = JSON.parse(crudo) as Partial<PreferenciasImpresion>
    return {
      tamano:
        guardadas.tamano && guardadas.tamano in TAMANOS_PAPEL
          ? guardadas.tamano
          : PREFERENCIAS_POR_DEFECTO.tamano,
      orientacion:
        guardadas.orientacion && guardadas.orientacion in ORIENTACIONES
          ? guardadas.orientacion
          : PREFERENCIAS_POR_DEFECTO.orientacion,
      margen:
        guardadas.margen && guardadas.margen in MARGENES
          ? guardadas.margen
          : PREFERENCIAS_POR_DEFECTO.margen,
      cebra:
        typeof guardadas.cebra === 'boolean'
          ? guardadas.cebra
          : PREFERENCIAS_POR_DEFECTO.cebra,
    }
  } catch {
    return PREFERENCIAS_POR_DEFECTO
  }
}

function guardar(preferencias: PreferenciasImpresion) {
  try {
    localStorage.setItem(CLAVE_GUARDADA, JSON.stringify(preferencias))
  } catch {
    // Sin almacenamiento se sigue: las preferencias valen para esta vez.
  }
}
