import * as React from 'react'
import {
  APIProvider,
  Map,
  Marker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps'
import { Crosshair, MapPin, Search, Trash2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/** Asunción. Punto de partida cuando el destino todavía no tiene ubicación. */
const CENTRO_PARAGUAY = { lat: -25.2637, lng: -57.5759 }
const ZOOM_PAIS = 6
const ZOOM_CIUDAD = 13

export interface Coordenada {
  lat: number
  lng: number
}

interface DestinationMapPickerProps {
  valor: Coordenada | null
  onChange: (coordenada: Coordenada | null) => void
  /** De dónde salió la coordenada guardada: `MANUAL`, `ROOFTOP`, `APPROXIMATE`… */
  precision?: string | null
  disabled?: boolean
  /** Alto del mapa. En la columna lateral ocupa lo que sobra. */
  alto?: string
}

/**
 * Qué tan confiable es la ubicación guardada, dicho en castellano.
 *
 * `geocoding_precision` es un dato del sistema, no del operador: alguien que
 * abre el formulario tiene que poder distinguir de un vistazo un punto que
 * puso una persona de uno que dedujo Google al centro de una ciudad —que es
 * justamente el que conviene corregir—.
 */
function describirPrecision(precision: string | null | undefined) {
  if (!precision) return null

  if (precision === 'MANUAL') {
    return { texto: 'Marcada a mano', variante: 'secondary' as const }
  }
  if (precision === 'ROOFTOP') {
    return { texto: 'Ubicación exacta de Google', variante: 'secondary' as const }
  }
  return {
    texto: 'Aproximada por Google — conviene revisarla',
    variante: 'outline' as const,
  }
}

/** Recentra el mapa cuando la coordenada cambia desde afuera (buscador, campos). */
function SeguirCoordenada({ coordenada }: { coordenada: Coordenada | null }) {
  const map = useMap()

  React.useEffect(() => {
    if (!map || !coordenada) return
    map.panTo(coordenada)
    if ((map.getZoom() ?? 0) < ZOOM_CIUDAD) {
      map.setZoom(ZOOM_CIUDAD)
    }
  }, [map, coordenada])

  return null
}

/**
 * Buscador de lugares.
 *
 * Places se cobra y se habilita aparte de Maps JavaScript: si no está
 * disponible, este bloque desaparece y quedan el clic en el mapa y los campos
 * de coordenadas, que alcanzan para trabajar. Un buscador roto a la vista sería
 * peor que no tenerlo.
 */
function BuscadorDeLugares({
  onElegir,
  disabled,
}: {
  onElegir: (coordenada: Coordenada) => void
  disabled?: boolean
}) {
  const places = useMapsLibrary('places')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [falloPlaces, setFalloPlaces] = React.useState(false)

  React.useEffect(() => {
    if (!places || !inputRef.current) return

    let autocomplete: google.maps.places.Autocomplete
    try {
      autocomplete = new places.Autocomplete(inputRef.current, {
        fields: ['geometry.location'],
        // El catálogo tiene destinos de los tres países, así que no se
        // restringe a Paraguay: se sesga con esos tres y listo.
        componentRestrictions: { country: ['py', 'ar', 'br'] },
      })
    } catch {
      setFalloPlaces(true)
      return
    }

    const listener = autocomplete.addListener('place_changed', () => {
      const lugar = autocomplete.getPlace()
      const punto = lugar.geometry?.location
      if (!punto) return
      onElegir({ lat: punto.lat(), lng: punto.lng() })
    })

    return () => listener.remove()
  }, [places, onElegir])

  if (falloPlaces) return null

  return (
    <div className='space-y-1.5'>
      <Label htmlFor='destino-buscador'>Buscar el lugar</Label>
      <div className='relative'>
        <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
        <Input
          id='destino-buscador'
          ref={inputRef}
          className='pl-9'
          placeholder='Escribí la ciudad o la terminal…'
          disabled={disabled || !places}
          // Places usa Enter para elegir de su lista; sin esto, Enter
          // enviaría el formulario con la búsqueda a medio hacer.
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') evento.preventDefault()
          }}
        />
      </div>
      <p className='text-muted-foreground text-xs'>
        Elegí una sugerencia y el pin se va solo. También podés hacer clic en el
        mapa o arrastrar el pin.
      </p>
    </div>
  )
}

/**
 * Dónde queda el destino.
 *
 * Sirve para proponerle este destino como origen a quien entra a comprar desde
 * cerca. Se puede dejar vacío: el destino funciona igual, sólo que no aparece
 * por cercanía.
 */
export function DestinationMapPicker({
  valor,
  onChange,
  precision,
  disabled,
  alto = '340px',
}: DestinationMapPickerProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  // Los campos de texto tienen su propio estado: mientras se escribe "-25.2"
  // el valor todavía no es una coordenada, y reflejar el número redondeado en
  // cada tecla haría imposible tipear.
  const [latTexto, setLatTexto] = React.useState(valor ? String(valor.lat) : '')
  const [lngTexto, setLngTexto] = React.useState(valor ? String(valor.lng) : '')

  React.useEffect(() => {
    setLatTexto(valor ? String(valor.lat) : '')
    setLngTexto(valor ? String(valor.lng) : '')
  }, [valor])

  const elegirEnMapa = React.useCallback(
    (coordenada: Coordenada) => onChange(coordenada),
    [onChange],
  )

  const aplicarTexto = (lat: string, lng: string) => {
    const latitud = Number.parseFloat(lat)
    const longitud = Number.parseFloat(lng)

    if (Number.isNaN(latitud) || Number.isNaN(longitud)) return
    if (latitud < -90 || latitud > 90) return
    if (longitud < -180 || longitud > 180) return

    onChange({ lat: latitud, lng: longitud })
  }

  const etiqueta = describirPrecision(precision)

  if (!apiKey) {
    return (
      <div className='flex items-start gap-3 rounded-md border border-dashed p-4'>
        <TriangleAlert className='text-muted-foreground mt-0.5 h-4 w-4 shrink-0' />
        <div className='space-y-1'>
          <p className='text-sm font-medium'>El mapa no está configurado</p>
          <p className='text-muted-foreground text-sm'>
            Falta <code>VITE_GOOGLE_MAPS_API_KEY</code>. Las coordenadas se
            pueden cargar igual a mano.
          </p>
          <CamposDeCoordenadas
            latTexto={latTexto}
            lngTexto={lngTexto}
            setLatTexto={setLatTexto}
            setLngTexto={setLngTexto}
            aplicarTexto={aplicarTexto}
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <div className='space-y-4'>
        <BuscadorDeLugares onElegir={elegirEnMapa} disabled={disabled} />

        <div className='relative overflow-hidden rounded-md border'>
          <Map
            style={{ width: '100%', height: alto }}
            defaultCenter={valor ?? CENTRO_PARAGUAY}
            defaultZoom={valor ? ZOOM_CIUDAD : ZOOM_PAIS}
            gestureHandling='cooperative'
            disableDefaultUI={false}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            onClick={(evento) => {
              if (disabled) return
              const punto = evento.detail.latLng
              if (punto) onChange({ lat: punto.lat, lng: punto.lng })
            }}
          >
            {valor && (
              // `Marker` clásico y no `AdvancedMarker`: el avanzado exige un
              // `mapId` creado en la consola de Google, y sin él no dibuja nada.
              <Marker
                position={valor}
                draggable={!disabled}
                onDragEnd={(evento) => {
                  const punto = evento.latLng
                  if (punto) onChange({ lat: punto.lat(), lng: punto.lng() })
                }}
              />
            )}
            <SeguirCoordenada coordenada={valor} />
          </Map>

          {!valor && (
            <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
              <div className='bg-background/95 flex items-center gap-2 rounded-md border px-3 py-2 shadow-sm'>
                <Crosshair className='text-muted-foreground h-4 w-4' />
                <span className='text-sm font-medium'>
                  Hacé clic en el mapa para ubicar el destino
                </span>
              </div>
            </div>
          )}
        </div>

        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div className='flex items-center gap-2'>
            {valor ? (
              <>
                <MapPin className='h-4 w-4 text-emerald-600' />
                <span className='text-sm'>Ubicación cargada</span>
                {etiqueta && (
                  <Badge variant={etiqueta.variante}>{etiqueta.texto}</Badge>
                )}
              </>
            ) : (
              <span className='text-muted-foreground text-sm'>
                Sin ubicación. El destino funciona igual, pero no se puede
                proponer por cercanía.
              </span>
            )}
          </div>

          {valor && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              <Trash2 className='mr-2 h-4 w-4' />
              Quitar ubicación
            </Button>
          )}
        </div>

        <CamposDeCoordenadas
          latTexto={latTexto}
          lngTexto={lngTexto}
          setLatTexto={setLatTexto}
          setLngTexto={setLngTexto}
          aplicarTexto={aplicarTexto}
          disabled={disabled}
        />
      </div>
    </APIProvider>
  )
}

/** Las coordenadas a mano, para pegar un valor que ya se tiene. */
function CamposDeCoordenadas({
  latTexto,
  lngTexto,
  setLatTexto,
  setLngTexto,
  aplicarTexto,
  disabled,
}: {
  latTexto: string
  lngTexto: string
  setLatTexto: (valor: string) => void
  setLngTexto: (valor: string) => void
  aplicarTexto: (lat: string, lng: string) => void
  disabled?: boolean
}) {
  return (
    <div className='grid grid-cols-2 gap-3'>
      <div className='space-y-1.5'>
        <Label htmlFor='destino-latitud'>Latitud</Label>
        <Input
          id='destino-latitud'
          value={latTexto}
          onChange={(evento) => setLatTexto(evento.target.value)}
          onBlur={() => aplicarTexto(latTexto, lngTexto)}
          placeholder='-25.2637'
          inputMode='decimal'
          disabled={disabled}
        />
      </div>
      <div className='space-y-1.5'>
        <Label htmlFor='destino-longitud'>Longitud</Label>
        <Input
          id='destino-longitud'
          value={lngTexto}
          onChange={(evento) => setLngTexto(evento.target.value)}
          onBlur={() => aplicarTexto(latTexto, lngTexto)}
          placeholder='-57.5759'
          inputMode='decimal'
          disabled={disabled}
        />
      </div>
    </div>
  )
}
