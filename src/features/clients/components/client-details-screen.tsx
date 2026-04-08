import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShoppingCart,
  TrendingUp,
  User,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useVentasList } from '../../dashboard/hooks/use-ventas-list'
import {
  downloadBlobAsFile,
  downloadInvoice,
} from '../../dashboard/services/invoice.service'
import { ClienteConEstadisticas } from '../models/clients.model'
import { ClientStats } from './client-stats'

interface ClientDetailsScreenProps {
  client: ClienteConEstadisticas
  onBack: () => void
}

export function ClientDetailsScreen({
  client,
  onBack,
}: ClientDetailsScreenProps) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(
    new Set()
  )

  const searchParams = {
    clienteId: client.cliente.id,
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

  const handleDownloadInvoice = async (numeroTransaccion: string) => {
    setDownloadingInvoices((prev) => new Set(prev).add(numeroTransaccion))

    try {
      const invoiceResponse = await downloadInvoice(numeroTransaccion)
      downloadBlobAsFile(invoiceResponse.data, invoiceResponse.filename)

      // Mostrar toast de éxito
      import('sonner').then(({ toast }) => {
        toast.success('Factura descargada', {
          description: `La factura ${numeroTransaccion} se ha descargado correctamente.`,
          duration: 3000,
        })
      })
    } catch (error) {
      // Mostrar toast de error
      import('sonner').then(({ toast }) => {
        toast.error('Error al descargar factura', {
          description:
            error instanceof Error
              ? error.message
              : 'No se pudo descargar la factura.',
          duration: 3000,
        })
      })
    } finally {
      setDownloadingInvoices((prev) => {
        const newSet = new Set(prev)
        newSet.delete(numeroTransaccion)
        return newSet
      })
    }
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
        return <CreditCard className='h-4 w-4' />
      case 'WHATSAPP':
        return <DollarSign className='h-4 w-4' />
      case 'TRANSFERENCIA':
        return <DollarSign className='h-4 w-4' />
      case 'EFECTIVO':
        return <DollarSign className='h-4 w-4' />
      default:
        return <DollarSign className='h-4 w-4' />
    }
  }

  return (
    <div className='space-y-6 px-4 py-2 sm:px-6'>
      {/* Header principal con SidebarTrigger */}
      <div className='bg-background flex h-16 items-center gap-3 border-b p-4 sm:gap-4'>
        <SidebarTrigger variant='outline' className='scale-125 sm:scale-100' />
        <Separator orientation='vertical' className='h-6' />
        <div className='flex-1' />
      </div>

      {/* Header con botón volver y acciones */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            onClick={onBack}
            variant='ghost'
            size='sm'
            className='hover:bg-muted h-10 w-10 p-0'
          >
            <ArrowLeft className='h-5 w-5' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {client.cliente.nombre} {client.cliente.apellido}
            </h1>
            <div className='mt-1 flex items-center gap-2'>
              <Badge variant='default'>Cliente Activo</Badge>
              <Badge variant='outline' className='text-xs'>
                {client.estadisticasVentas.totalVentas} compras
              </Badge>
              {client.cliente.nacionalidad && (
                <Badge variant='outline' className='text-xs'>
                  {client.cliente.nacionalidad}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Avatar y datos principales */}
          <div className='flex items-start gap-6'>
            <div className='flex-shrink-0'>
              <div className='border-accent bg-muted flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border-2'>
                <User className='text-muted-foreground h-12 w-12' />
              </div>
            </div>

            <div className='grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6'>
              {/* Columna izquierda */}
              <div className='space-y-4'>
                <div>
                  <label className='text-muted-foreground mb-1 block text-sm font-medium'>
                    <Mail className='mr-2 inline h-4 w-4' />
                    Email
                  </label>
                  <div className='text-sm font-medium'>
                    {client.cliente.email}
                  </div>
                </div>

                <div>
                  <label className='text-muted-foreground mb-1 block text-sm font-medium'>
                    <Phone className='mr-2 inline h-4 w-4' />
                    Teléfono
                  </label>
                  <div className='text-sm font-medium'>
                    {client.cliente.telefono || (
                      <span className='text-muted-foreground'>
                        No especificado
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className='text-muted-foreground mb-1 block text-sm font-medium'>
                    <TrendingUp className='mr-2 inline h-4 w-4' />
                    Total de Compras
                  </label>
                  <div className='text-sm font-medium'>
                    {client.estadisticasVentas.totalVentas} compras realizadas
                  </div>
                </div>
              </div>

              {/* Columna derecha */}
              <div className='space-y-4'>
                <div>
                  <label className='text-muted-foreground mb-1 block text-sm font-medium'>
                    <Globe className='mr-2 inline h-4 w-4' />
                    Nacionalidad
                  </label>
                  <div className='text-sm font-medium'>
                    {client.cliente.nacionalidad || (
                      <span className='text-muted-foreground'>
                        No especificada
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className='text-muted-foreground mb-1 block text-sm font-medium'>
                    <FileText className='mr-2 inline h-4 w-4' />
                    Documento
                  </label>
                  <div className='text-sm font-medium'>
                    Documento no especificado
                  </div>
                </div>

                <div>
                  <label className='text-muted-foreground mb-1 block text-sm font-medium'>
                    <Clock className='mr-2 inline h-4 w-4' />
                    Cliente desde
                  </label>
                  <div className='text-sm font-medium'>
                    {format(new Date(client.cliente.createdAt), 'dd/MM/yyyy', {
                      locale: es,
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          {(client.cliente.fechaNacimiento ||
            client.cliente.sexo ||
            client.cliente.ocupacion ||
            client.cliente.paisResidencia) && (
            <div className='border-t pt-4'>
              <label className='text-muted-foreground mb-2 block text-sm font-medium'>
                <User className='mr-2 inline h-4 w-4' />
                Información Adicional
              </label>
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                {client.cliente.fechaNacimiento && (
                  <div>
                    <span className='text-muted-foreground text-sm'>
                      Fecha de Nacimiento:
                    </span>
                    <div className='text-sm font-medium'>
                      {format(
                        new Date(client.cliente.fechaNacimiento),
                        'dd/MM/yyyy',
                        { locale: es }
                      )}
                    </div>
                  </div>
                )}
                {client.cliente.sexo && (
                  <div>
                    <span className='text-muted-foreground text-sm'>Sexo:</span>
                    <div className='text-sm font-medium'>
                      {client.cliente.sexo === 'M' ? 'Masculino' : 'Femenino'}
                    </div>
                  </div>
                )}
                {client.cliente.ocupacion && (
                  <div>
                    <span className='text-muted-foreground text-sm'>
                      Ocupación:
                    </span>
                    <div className='text-sm font-medium'>
                      {client.cliente.ocupacion}
                    </div>
                  </div>
                )}
                {client.cliente.paisResidencia && (
                  <div>
                    <span className='text-muted-foreground text-sm'>
                      País de Residencia:
                    </span>
                    <div className='text-sm font-medium'>
                      {client.cliente.paisResidencia}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {client.cliente.observaciones && (
            <div className='border-t pt-4'>
              <label className='text-muted-foreground mb-2 block text-sm font-medium'>
                <FileText className='mr-2 inline h-4 w-4' />
                Observaciones
              </label>
              <div className='text-muted-foreground bg-muted/50 rounded-lg p-4 text-sm leading-relaxed'>
                {client.cliente.observaciones}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas del cliente */}
      <ClientStats client={client} />

      {/* Historial de Compras */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ShoppingCart className='h-5 w-5' />
            Historial de Compras
            {ventasData && (
              <Badge variant='outline' className='ml-2'>
                {ventasData.total} compras
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='space-y-4'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
            </div>
          ) : error ? (
            <div className='py-8 text-center'>
              <p className='text-destructive'>Error al cargar las compras</p>
            </div>
          ) : ventas.length === 0 ? (
            <div className='py-8 text-center'>
              <ShoppingCart className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
              <p className='text-muted-foreground'>
                No se encontraron compras para este cliente
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='-mx-4 overflow-x-auto sm:mx-0'>
                <div className='min-w-[800px] px-4 sm:px-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='min-w-[120px]'>
                          Transacción
                        </TableHead>
                        <TableHead className='min-w-[100px]'>Empresa</TableHead>
                        <TableHead className='min-w-[150px]'>Ruta</TableHead>
                        <TableHead className='min-w-[120px]'>
                          Fecha Viaje
                        </TableHead>
                        <TableHead className='min-w-[100px]'>
                          Asientos
                        </TableHead>
                        <TableHead className='min-w-[100px]'>Importe</TableHead>
                        <TableHead className='min-w-[120px]'>
                          Método Pago
                        </TableHead>
                        <TableHead className='min-w-[100px]'>
                          Estado Pago
                        </TableHead>
                        <TableHead className='min-w-[100px]'>
                          Estado Venta
                        </TableHead>
                        <TableHead className='min-w-[100px]'>
                          Acciones
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventas.map((venta) => (
                        <TableRow key={venta.id}>
                          <TableCell className='font-mono text-sm'>
                            {venta.numeroTransaccion}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>
                                {venta.empresaNombre}
                              </span>
                              <Badge variant='outline' className='text-xs'>
                                {venta.empresaBoleto}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1 text-sm'>
                              <MapPin className='text-muted-foreground h-3 w-3' />
                              <span>{venta.origenNombre}</span>
                              <span className='text-muted-foreground'>→</span>
                              <span>{venta.destinoNombre}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1 text-sm'>
                              <Calendar className='text-muted-foreground h-3 w-3' />
                              <span>{formatDate(venta.fechaViaje)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex flex-wrap gap-1'>
                              {venta.asientosOriginales.map(
                                (asiento, index) => (
                                  <Badge
                                    key={index}
                                    variant='secondary'
                                    className='text-xs'
                                  >
                                    {asiento}
                                  </Badge>
                                )
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='font-medium'>
                            {formatCurrency(venta.importeTotal)}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1'>
                              {getMetodoPagoIcon(venta.metodoPago)}
                              <span className='text-sm'>
                                {venta.metodoPago}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getEstadoPagoBadge(venta.estadoPago)}
                          </TableCell>
                          <TableCell>
                            {getEstadoVentaBadge(venta.estadoVenta)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                handleDownloadInvoice(venta.numeroTransaccion)
                              }
                              disabled={downloadingInvoices.has(
                                venta.numeroTransaccion
                              )}
                            >
                              <Download className='mr-1 h-4 w-4' />
                              {downloadingInvoices.has(venta.numeroTransaccion)
                                ? 'Descargando...'
                                : 'Factura'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='text-muted-foreground text-sm'>
                      Página {pagination.pageIndex + 1} de {totalPages}
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            pageIndex: Math.max(0, prev.pageIndex - 1),
                          }))
                        }
                        disabled={pagination.pageIndex === 0}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            pageIndex: Math.min(
                              totalPages - 1,
                              prev.pageIndex + 1
                            ),
                          }))
                        }
                        disabled={pagination.pageIndex >= totalPages - 1}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
