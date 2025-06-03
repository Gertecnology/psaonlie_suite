import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, Users, ArrowRight } from "lucide-react"
import type { Pasaje } from "@/lib/api"

interface SearchResultsProps {
  pasajes: Pasaje[]
  isLoading: boolean
  error?: string | null
}

export function SearchResults({ pasajes, isLoading, error }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Buscando los mejores pasajes...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="text-red-600">
              <h3 className="text-lg font-semibold mb-2">Error en la búsqueda</h3>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (pasajes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto mt-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-600">
              <h3 className="text-lg font-semibold mb-2">No se encontraron pasajes</h3>
              <p>Intenta con otras fechas o destinos diferentes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatPrice = (price: number, currency: string) => {
    if (currency === "PYG") {
      return new Intl.NumberFormat("es-PY", {
        style: "currency",
        currency: "PYG",
        minimumFractionDigits: 0,
      }).format(price)
    }
    return `${currency} ${price.toLocaleString()}`
  }

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{pasajes.length} pasajes encontrados</h2>
        <p className="text-gray-600">Selecciona el pasaje que mejor se adapte a tus necesidades</p>
      </div>

      <div className="space-y-4">
        {pasajes.map((pasaje) => (
          <Card key={pasaje.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                {/* Información de la empresa y servicio */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-gray-900">{pasaje.empresa}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {pasaje.tipoServicio}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{pasaje.duracion}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{pasaje.asientosDisponibles} asientos disponibles</span>
                  </div>
                </div>

                {/* Ruta y horarios */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="font-bold text-xl text-gray-900">{pasaje.horaSalida}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {pasaje.origen}
                      </div>
                      <div className="text-xs text-gray-500">{pasaje.fechaSalida}</div>
                    </div>

                    <div className="flex-1 flex items-center justify-center px-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <ArrowRight className="w-4 h-4" />
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="font-bold text-xl text-gray-900">{pasaje.horaLlegada}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {pasaje.destino}
                      </div>
                      <div className="text-xs text-gray-500">{pasaje.fechaLlegada}</div>
                    </div>
                  </div>
                </div>

                {/* Precio y botón de reserva */}
                <div className="text-center lg:text-right space-y-3">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{formatPrice(pasaje.precio, pasaje.moneda)}</div>
                    <div className="text-sm text-gray-500">por persona</div>
                  </div>
                  <Button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white">Seleccionar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
