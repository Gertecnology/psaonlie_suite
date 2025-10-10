import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'
import type { PreviewData } from '../services/preview.service'

interface PreviewTableProps {
  data: PreviewData[]
  totalCount: number
  isLoading: boolean
  error: string | null
  onRefresh: () => void
}

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Función para obtener el color del badge según el estado
const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status.toLowerCase()) {
    case 'pagado':
    case 'confirmado':
    case 'pago_aprobado':
      return 'default'
    case 'pendiente':
    case 'reservado':
    case 'pendiente_pago':
      return 'secondary'
    case 'cancelado':
    case 'anulado':
    case 'expirado':
    case 'fallido':
      return 'destructive'
    default:
      return 'outline'
  }
}

export function PreviewTable({ data, totalCount, isLoading, error, onRefresh }: PreviewTableProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error en Previsualización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={onRefresh} variant="outline" className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Previsualización de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos que coincidan con los filtros seleccionados.</p>
            <p className="text-sm mt-2">Ajusta los filtros para ver los datos de previsualización.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Previsualización de Datos
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {totalCount.toLocaleString()} registro{totalCount !== 1 ? 's' : ''} total
            </Badge>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {isExpanded ? 'Ocultar' : 'Mostrar'} Previsualización
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </CardTitle>
      </CardHeader>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Cargando previsualización...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Información de resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totalCount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Registros Totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(data.reduce((sum, item) => sum + item.importeTotal, 0))}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Muestra</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.length}</div>
                    <div className="text-sm text-muted-foreground">Mostrando</div>
                  </div>
                </div>

                {/* Tabla de previsualización */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[120px]">Transacción</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Ruta</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead>Estado Pago</TableHead>
                        <TableHead>Estado Venta</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Fechas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">
                            {item.numeroTransaccion}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.cliente.nombre} {item.cliente.apellido}</div>
                              <div className="text-sm text-muted-foreground">{item.cliente.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{item.empresaNombre}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{item.origenNombre}</div>
                              <div className="text-muted-foreground">→ {item.destinoNombre}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.importeTotal)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.estadoPago)}>
                              {item.estadoPago}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(item.estadoVenta)}>
                              {item.estadoVenta}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.metodoPago}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Venta: {format(new Date(item.fechaVenta), 'dd/MM/yyyy', { locale: es })}</div>
                              <div className="text-muted-foreground">
                                Viaje: {format(new Date(item.fechaViaje), 'dd/MM/yyyy', { locale: es })}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Nota informativa */}
                {totalCount > data.length && (
                  <div className="text-center text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                    <p>
                      Mostrando los primeros {data.length} registros de {totalCount.toLocaleString()} totales.
                    </p>
                    <p className="mt-1">
                      El archivo exportado contendrá todos los {totalCount.toLocaleString()} registros que coincidan con los filtros.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
