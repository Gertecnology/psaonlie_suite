"use client"

import { useState, useRef, useEffect } from "react"
import {
  Calendar,
  MapPin,
  ArrowUpDown,
  Clock,
  Users,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building,
  Globe,
  Code,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useDebounce } from "@/hooks/use-debounce"
import { searchParadas, checkApiHealth, type Parada } from "@/lib/api"

interface SearchFormProps {
  onSearchResults?: (results: any[]) => void
  onSearchStart?: () => void
  onSearchError?: (error: string) => void
}

export function SearchForm({ onSearchResults, onSearchStart, onSearchError }: SearchFormProps) {
  const [departureDate, setDepartureDate] = useState<Date | undefined>(new Date())
  const [returnDate, setReturnDate] = useState<Date | undefined>()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [selectedOrigin, setSelectedOrigin] = useState<Parada | null>(null)
  const [selectedDestination, setSelectedDestination] = useState<Parada | null>(null)

  // Estados para las sugerencias
  const [originSuggestions, setOriginSuggestions] = useState<Parada[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<Parada[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)

  // Estados de carga y errores
  const [isLoadingOrigin, setIsLoadingOrigin] = useState(false)
  const [isLoadingDestination, setIsLoadingDestination] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null)

  // Estado para mostrar datos de depuración
  const [debugData, setDebugData] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  const originRef = useRef<HTMLDivElement>(null)
  const destinationRef = useRef<HTMLDivElement>(null)

  // Debounce para optimizar las búsquedas
  const debouncedOrigin = useDebounce(origin, 400)
  const debouncedDestination = useDebounce(destination, 400)

  // Verificar salud de la API al cargar
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkApiHealth()
      setIsApiHealthy(healthy)
      if (!healthy) {
        setApiError("Conectando con el servidor...")
      } else {
        setApiError(null)
      }
    }
    checkHealth()
  }, [])

  // Buscar paradas de origen
  useEffect(() => {
    const searchOriginParadas = async () => {
      if (debouncedOrigin.length >= 2 && !selectedOrigin) {
        setIsLoadingOrigin(true)
        setApiError(null)
        try {
          const results = await searchParadas(debouncedOrigin)

          // Guardar datos para depuración
          setDebugData({
            searchTerm: debouncedOrigin,
            results: results,
            isArray: Array.isArray(results),
            count: Array.isArray(results) ? results.length : 0,
            timestamp: new Date().toISOString(),
          })

          setOriginSuggestions(results)
          setShowOriginSuggestions(results.length > 0)
          if (!isApiHealthy) setIsApiHealthy(true)
        } catch (error) {
          setOriginSuggestions([])
          setShowOriginSuggestions(false)
          setApiError("Error al buscar paradas")
          setIsApiHealthy(false)

          // Guardar error para depuración
          setDebugData({
            searchTerm: debouncedOrigin,
            error: error instanceof Error ? error.message : "Error desconocido",
            timestamp: new Date().toISOString(),
          })
        } finally {
          setIsLoadingOrigin(false)
        }
      } else {
        setOriginSuggestions([])
        setShowOriginSuggestions(false)
      }
    }
    searchOriginParadas()
  }, [debouncedOrigin, selectedOrigin, isApiHealthy])

  // Buscar paradas de destino
  useEffect(() => {
    const searchDestinationParadas = async () => {
      if (debouncedDestination.length >= 2 && !selectedDestination) {
        setIsLoadingDestination(true)
        setApiError(null)
        try {
          const results = await searchParadas(debouncedDestination)
          setDestinationSuggestions(results)
          setShowDestinationSuggestions(results.length > 0)
          if (!isApiHealthy) setIsApiHealthy(true)
        } catch (error) {
          setDestinationSuggestions([])
          setShowDestinationSuggestions(false)
          setApiError("Error al buscar paradas")
          setIsApiHealthy(false)
        } finally {
          setIsLoadingDestination(false)
        }
      } else {
        setDestinationSuggestions([])
        setShowDestinationSuggestions(false)
      }
    }
    searchDestinationParadas()
  }, [debouncedDestination, selectedDestination, isApiHealthy])

  // Manejar clics fuera de los componentes para cerrar las sugerencias
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setShowOriginSuggestions(false)
      }
      if (destinationRef.current && !destinationRef.current.contains(event.target as Node)) {
        setShowDestinationSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = () => {
    if (!selectedOrigin || !selectedDestination || !departureDate) {
      // Mostrar validación visual
      if (!selectedOrigin) {
        setOrigin(""); // Limpiar para activar validación
        setTimeout(() => (document.querySelector('input[placeholder="Elegir Localidad o Terminal"]') as HTMLInputElement)?.focus(), 100);
        return;
      }
      if (!selectedDestination) {
        setDestination(""); // Limpiar para activar validación
        return;
      }
      if (!departureDate) {
        return;
      }
      return;
    }

    // Llamar a los callbacks de búsqueda
    if (onSearchStart) {
      onSearchStart();
    }

    // Simular búsqueda (en un caso real, aquí se llamaría a la API)
    setTimeout(() => {
      // Datos de ejemplo para demostración
      const resultados = [
        {
          id: "1",
          origen: selectedOrigin.descripcion,
          destino: selectedDestination.descripcion,
          fechaSalida: format(departureDate, "yyyy-MM-dd"),
          fechaLlegada: format(departureDate, "yyyy-MM-dd"),
          horaSalida: "08:00",
          horaLlegada: "12:00",
          duracion: "4h",
          empresa: selectedOrigin.empresaNombre,
          tipoServicio: "Convencional",
          precio: 250000,
          moneda: "Gs",
          asientosDisponibles: 25
        },
        {
          id: "2",
          origen: selectedOrigin.descripcion,
          destino: selectedDestination.descripcion,
          fechaSalida: format(departureDate, "yyyy-MM-dd"),
          fechaLlegada: format(departureDate, "yyyy-MM-dd"),
          horaSalida: "14:00",
          horaLlegada: "18:00",
          duracion: "4h",
          empresa: "NSA",
          tipoServicio: "Semi Cama",
          precio: 350000,
          moneda: "Gs",
          asientosDisponibles: 15
        }
      ];

      if (onSearchResults) {
        onSearchResults(resultados);
      }
    }, 1500);
  }

  const swapCities = () => {
    const tempOrigin = origin
    const tempSelectedOrigin = selectedOrigin

    setOrigin(destination)
    setSelectedOrigin(selectedDestination)
    setDestination(tempOrigin)
    setSelectedDestination(tempSelectedOrigin)
  }

  const selectOrigin = (parada: Parada) => {
    setOrigin(parada.descripcion)
    setSelectedOrigin(parada)
    setShowOriginSuggestions(false)
  }

  const selectDestination = (parada: Parada) => {
    setDestination(parada.descripcion)
    setSelectedDestination(parada)
    setShowDestinationSuggestions(false)
  }

  const handleOriginChange = (value: string) => {
    setOrigin(value)
    if (selectedOrigin && value !== selectedOrigin.descripcion) {
      setSelectedOrigin(null)
    }
  }

  const handleDestinationChange = (value: string) => {
    setDestination(value)
    if (selectedDestination && value !== selectedDestination.descripcion) {
      setSelectedDestination(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Card className="shadow-2xl border-0 rounded-2xl bg-white/95">
        <CardContent className="p-8">
          {/* Botón para mostrar/ocultar datos de depuración */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              {showDebug ? "Ocultar debug" : "Mostrar debug"}
            </Button>
          </div>

          {/* Panel de depuración */}
          {showDebug && debugData && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg overflow-auto max-h-60">
              <h3 className="font-mono text-sm font-bold mb-2">Datos de depuración:</h3>
              <pre className="text-xs font-mono whitespace-pre-wrap">{JSON.stringify(debugData, null, 2)}</pre>
            </div>
          )}

          {/* Alerta de estado de API */}
          {apiError && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">{apiError}</AlertDescription>
            </Alert>
          )}

          {isApiHealthy === true && !apiError && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Conectado al servidor. Búsqueda en tiempo real activa.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Indicadores de beneficios */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <Zap className="w-3 h-3 mr-1" />
              Confirmación instantánea
            </Badge>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <Clock className="w-3 h-3 mr-1" />
              Disponible 24/7
            </Badge>
            <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
              <Users className="w-3 h-3 mr-1" />
              +50 empresas asociadas
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Lugar de salida */}
            <div className="space-y-2 relative">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span>Lugar de salida</span>
              </div>
              <div className="relative" ref={originRef}>
                <div className="relative">
                  <Input
                    value={origin}
                    onChange={(e) => handleOriginChange(e.target.value)}
                    onFocus={() => {
                      if (originSuggestions.length > 0) {
                        setShowOriginSuggestions(true)
                      }
                    }}
                    placeholder="Elegir Localidad o Terminal"
                    className="h-12 text-base border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg pl-10 transition-all"
                    autoComplete="off"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                {/* Indicador de carga para origen */}
                {isLoadingOrigin && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}

                {/* Sugerencias de origen */}
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="fixed md:absolute top-auto md:top-full left-0 bg-white border-2 border-blue-200 rounded-lg shadow-xl z-50 mt-1 max-h-[40vh] md:max-h-64 overflow-y-auto w-full md:w-auto">
                    <div className="sticky top-0 bg-blue-50 px-4 py-2 border-b border-blue-100">
                      <p className="text-xs font-semibold text-blue-700">
                        {originSuggestions.length} resultados encontrados
                      </p>
                    </div>
                    {originSuggestions.map((parada) => (
                      <button
                        key={parada.id}
                        onClick={() => selectOrigin(parada)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-100 rounded-full p-1.5 mt-0.5 flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                            <MapPin className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{parada.descripcion}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Building className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{parada.empresaNombre}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botón intercambiar */}
            <div className="flex justify-center md:order-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={swapCities}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
                disabled={!origin && !destination}
              >
                <ArrowUpDown className="h-4 w-4 text-gray-500" />
              </Button>
            </div>

            {/* Lugar de llegada */}
            <div className="space-y-2 relative md:order-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Lugar de llegada</span>
              </div>
              <div className="relative" ref={destinationRef}>
                <div className="relative">
                  <Input
                    value={destination}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    onFocus={() => {
                      if (destinationSuggestions.length > 0) {
                        setShowDestinationSuggestions(true)
                      }
                    }}
                    placeholder="Elegir Localidad o Terminal"
                    className="h-12 text-base border-2 border-gray-200 hover:border-red-300 focus:border-red-500 focus:ring-red-500 rounded-lg pl-10 transition-all"
                    autoComplete="off"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                {/* Indicador de carga para destino */}
                {isLoadingDestination && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}

                {/* Sugerencias de destino */}
                {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                  <div className="fixed md:absolute top-auto md:top-full left-0 bg-white border-2 border-red-200 rounded-lg shadow-xl z-50 mt-1 max-h-[40vh] md:max-h-64 overflow-y-auto w-full md:w-auto">
                    <div className="sticky top-0 bg-red-50 px-4 py-2 border-b border-red-100">
                      <p className="text-xs font-semibold text-red-700">
                        {destinationSuggestions.length} resultados encontrados
                      </p>
                    </div>
                    {destinationSuggestions.map((parada) => (
                      <button
                        key={parada.id}
                        onClick={() => selectDestination(parada)}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors border-b border-gray-100 last:border-b-0 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-red-100 rounded-full p-1.5 mt-0.5 flex-shrink-0 group-hover:bg-red-200 transition-colors">
                            <MapPin className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{parada.descripcion}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Building className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{parada.empresaNombre}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ida */}
            <div className="space-y-2 md:order-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span>Ida</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start text-left font-normal border-gray-300 hover:border-blue-500 rounded-lg"
                  >
                    {departureDate ? format(departureDate, "dd/MM/yyyy", { locale: es }) : "dd/mm/aaaa"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={departureDate}
                    onSelect={setDepartureDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Vuelta (sugerido) */}
            <div className="space-y-2 md:order-5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span>Vuelta (sugerido)</span>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start text-left font-normal border-gray-300 hover:border-blue-500 rounded-lg"
                  >
                    {returnDate ? format(returnDate, "dd/MM/yyyy", { locale: es }) : "dd/mm/aaaa"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    disabled={(date) => date < (departureDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Botón BUSCAR */}
          <div className="mt-6">
            <Button
              onClick={handleSearch}
              disabled={!selectedOrigin || !selectedDestination || !departureDate}
              className="w-full h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg rounded-lg transition-all duration-200 ease-in-out transform hover:translate-y-[-2px] hover:shadow-lg disabled:opacity-70 disabled:transform-none disabled:shadow-none disabled:hover:from-red-600 disabled:hover:to-red-700"
            >
              BUSCAR
            </Button>
          </div>

          {/* Información adicional */}
          <div className="mt-4 text-center">
            <div className="flex flex-wrap justify-center gap-4">
              <span className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Sin comisiones ocultas
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Cancelación gratuita
              </span>
              <span className="flex items-center text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Soporte 24/7
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
