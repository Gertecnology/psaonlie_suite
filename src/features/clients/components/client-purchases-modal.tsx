import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Calendar, MapPin, CreditCard, DollarSign } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useVentasList } from '../../dashboard/hooks/use-ventas-list'
import { ClienteConEstadisticas } from '../models/clients.model'

interface ClientPurchasesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: ClienteConEstadisticas
}

export function ClientPurchasesModal({ open, onOpenChange, client }: ClientPurchasesModalProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const searchParams = {
    clienteId: client?.cliente.id,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: 'fechaVenta' as const,
    sortOrder: 'DESC' as const,
  }

  const { data: ventasData, isLoading, error } = useVentasList(searchParams)

  const ventas = ventasData?.data || []
  const totalPages = ventasData?.totalPages || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
  }

  const getEstadoPagoBadge = (estado: string) => {
    const variants = {
      PAGADO: 'default',
      PENDIENTE: 'secondary',
      EXPIRADO: 'destructive',
      CANCELADO: 'outline',
      FALLIDO: 'destructive',
      REEMBOLSADO: 'secondary',
    } as const

    return (
      <Badge variant={variants[estado as keyof typeof variants] || 'outline'}>
        {estado}
      </Badge>
    )
  }

  const getEstadoVentaBadge = (estado: string) => {
    const variants = {
      CONFIRMADO: 'default',
      RESERVADO: 'secondary',
      EXPIRADO: 'destructive',
      CANCELADO: 'outline',
      ANULADO: 'destructive',
      PENDIENTE_PAGO: 'secondary',
      PAGO_APROBADO: 'default',
    } as const

    return (
      <Badge variant={variants[estado as keyof typeof variants] || 'outline'}>
        {estado}
      </Badge>
    )
  }

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'BANCARD':
        return <CreditCard className="h-4 w-4" />
      case 'WHATSAPP':
        return <DollarSign className="h-4 w-4" />
      case 'TRANSFERENCIA':
        return <DollarSign className="h-4 w-4" />
      case 'EFECTIVO':
        return <DollarSign className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Error al cargar las compras</DialogTitle>
            <DialogDescription>
              No se pudieron cargar las compras del cliente.
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">Error al cargar los datos</p>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Compras del Cliente
          </DialogTitle>
          <DialogDescription>
            {client ? (
              <>
                Compras realizadas por <strong>{client.cliente.nombre} {client.cliente.apellido}</strong>
                {ventasData && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({ventasData.total} compras encontradas)
                  </span>
                )}
              </>
            ) : (
              'Selecciona un cliente para ver sus compras'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : ventas.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No se encontraron compras para este cliente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transacción</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Fecha Viaje</TableHead>
                  <TableHead>Asientos</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Método Pago</TableHead>
                  <TableHead>Estado Pago</TableHead>
                  <TableHead>Estado Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-mono text-sm">
                      {venta.numeroTransaccion}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{venta.empresaNombre}</span>
                        <Badge variant="outline" className="text-xs">
                          {venta.empresaBoleto}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{venta.origenNombre}</span>
                        <span className="text-muted-foreground">→</span>
                        <span>{venta.destinoNombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{formatDate(venta.fechaViaje)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {venta.asientosOriginales.map((asiento, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {asiento}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(venta.importeTotal)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getMetodoPagoIcon(venta.metodoPago)}
                        <span className="text-sm">{venta.metodoPago}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEstadoPagoBadge(venta.estadoPago)}
                    </TableCell>
                    <TableCell>
                      {getEstadoVentaBadge(venta.estadoVenta)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {pagination.pageIndex + 1} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
                    disabled={pagination.pageIndex === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.min(totalPages - 1, prev.pageIndex + 1) }))}
                    disabled={pagination.pageIndex >= totalPages - 1}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
