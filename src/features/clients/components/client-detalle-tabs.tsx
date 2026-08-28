import * as React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatearGuaranies } from '@/lib/formato'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useVentasList } from '@/features/dashboard/hooks/use-ventas-list'
import {
  downloadBlobAsFile,
  downloadInvoice,
} from '@/features/dashboard/services/invoice.service'
import {
  useLibretaFacturacion,
  useMarcarPredeterminado,
  useQuitarTitular,
} from '../hooks/use-libreta-facturacion'
import { type TitularDeFacturacion } from '../services/facturacion.service'
import { TitularFacturacionDialog } from './titular-facturacion-dialog'

interface ClientDetalleTabsProps {
  clienteId: string
}

const fecha = (valor: string | null | undefined): string => {
  if (!valor) return '—'
  try {
    return format(new Date(valor), 'dd/MM/yyyy', { locale: es })
  } catch {
    return '—'
  }
}

/**
 * Un titular "SUSPENDIDO" o "CANCELADO" conviene verlo antes de emitir, no
 * después: la factura sale igual, pero con un contribuyente que la DNIT tiene
 * marcado.
 */
const estadoDelPadron = (estado: string | null) => {
  if (!estado) return null
  const activo = estado.toUpperCase() === 'ACTIVO'
  return {
    texto: activo ? 'Activo' : `${estado} — revisar`,
    variante: activo ? ('default' as const) : ('destructive' as const),
  }
}

/**
 * Lo que rodea a un cliente y antes vivía en otras pantallas.
 *
 * Su libreta de facturación no se veía en ningún lado, y sus compras estaban en
 * una ventana aparte que tapaba justamente los datos con los que uno las está
 * mirando.
 */
export function ClientDetalleTabs({ clienteId }: ClientDetalleTabsProps) {
  const libreta = useLibretaFacturacion(clienteId)
  const marcar = useMarcarPredeterminado(clienteId)
  const quitar = useQuitarTitular(clienteId)

  // Quitar un titular no se puede deshacer, así que se pregunta antes.
  const [titularAQuitar, setTitularAQuitar] =
    React.useState<TitularDeFacturacion | null>(null)

  // `null` es agregar uno nuevo; un titular es corregir ése. `undefined` es que
  // el diálogo está cerrado.
  const [titularEnEdicion, setTitularEnEdicion] = React.useState<
    TitularDeFacturacion | null | undefined
  >(undefined)

  const [pagina, setPagina] = React.useState(1)
  const compras = useVentasList({ clienteId, page: pagina, limit: 10 })

  // Qué facturas se están bajando ahora. Es un conjunto y no un booleano
  // porque se puede pedir más de una sin esperar a que termine la anterior.
  const [descargando, setDescargando] = React.useState<ReadonlySet<string>>(
    new Set()
  )

  const descargarFactura = async (numeroTransaccion: string) => {
    setDescargando((actual) => new Set(actual).add(numeroTransaccion))

    try {
      const factura = await downloadInvoice(numeroTransaccion)
      downloadBlobAsFile(factura.data, factura.filename)
      toast.success(`Factura ${numeroTransaccion} descargada`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo descargar la factura.'
      )
    } finally {
      setDescargando((actual) => {
        const siguiente = new Set(actual)
        siguiente.delete(numeroTransaccion)
        return siguiente
      })
    }
  }

  const titulares = libreta.data ?? []
  const predeterminados = titulares.filter(
    (titular) => titular.esPredeterminado
  ).length
  const ventas = compras.data?.data ?? []
  const totalCompras = compras.data?.total ?? 0
  const totalPaginas = compras.data?.totalPages ?? 1

  return (
    <>
      <Tabs defaultValue='facturacion'>
        <div className='border-b px-4 md:px-6'>
          <TabsList className='h-auto bg-transparent p-0'>
            <TabsTrigger value='facturacion' className='gap-2'>
              Datos de facturación
              {titulares.length > 0 && (
                <Badge variant='secondary'>{titulares.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value='compras' className='gap-2'>
              Compras
              {totalCompras > 0 && (
                <Badge variant='secondary'>{totalCompras}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value='facturacion' className='mt-0'>
          <div className='flex flex-wrap items-start justify-between gap-3 px-4 py-4 md:px-6'>
            <div className='space-y-1'>
              <h3 className='font-semibold'>A nombre de quién factura</h3>
              <p className='text-muted-foreground max-w-2xl text-sm'>
                Su libreta. Al comprar se le ofrecen éstos, y el predeterminado
                viene elegido. Lo que guardó acá manda sobre lo que diga el
                padrón.
              </p>
            </div>
            <Button
              type='button'
              size='sm'
              onClick={() => setTitularEnEdicion(null)}
            >
              <Plus className='mr-1.5 h-4 w-4' />
              Agregar titular
            </Button>
          </div>

          <div className='overflow-x-auto border-t'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón social</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Estado en el padrón</TableHead>
                  <TableHead className='text-right'>&nbsp;</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {libreta.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-muted-foreground py-10 text-center'
                    >
                      Cargando la libreta…
                    </TableCell>
                  </TableRow>
                )}

                {!libreta.isLoading && libreta.error && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-destructive py-10 text-center'
                    >
                      No se pudo cargar la libreta. {libreta.error.message}
                    </TableCell>
                  </TableRow>
                )}

                {!libreta.isLoading &&
                  !libreta.error &&
                  titulares.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className='text-muted-foreground py-10 text-center'
                      >
                        Todavía no guardó ningún dato de facturación. Sus
                        compras salen a consumidor final.
                      </TableCell>
                    </TableRow>
                  )}

                {titulares.map((titular) => {
                  const padron = estadoDelPadron(titular.estadoPadron)
                  return (
                    <TableRow key={titular.id}>
                      <TableCell className='font-medium'>
                        {titular.razonSocial}
                        {titular.esPredeterminado && (
                          <Badge variant='outline' className='ml-2'>
                            Predeterminado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-muted-foreground font-mono text-xs'>
                        {titular.tipoDocumento} {titular.documento}
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {titular.email ?? '—'}
                      </TableCell>
                      <TableCell>
                        {padron ? (
                          <Badge variant={padron.variante}>
                            {padron.texto}
                          </Badge>
                        ) : (
                          <span className='text-muted-foreground text-sm'>
                            Sin consultar
                          </span>
                        )}
                      </TableCell>
                      <TableCell className='space-x-1 text-right whitespace-nowrap'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => setTitularEnEdicion(titular)}
                        >
                          <Pencil className='mr-1.5 h-3.5 w-3.5' />
                          Editar
                        </Button>
                        {/* Predeterminar y quitar van en el menú: son las
                            excepciones, y con tres botones por fila la tabla
                            deja de leerse. */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type='button'
                              variant='ghost'
                              className='h-8 w-8 p-0'
                            >
                              <span className='sr-only'>
                                Más acciones para {titular.razonSocial}
                              </span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            {!titular.esPredeterminado && (
                              <DropdownMenuItem
                                disabled={marcar.isPending}
                                onClick={() => marcar.mutate(titular.id)}
                              >
                                <Star className='mr-2 h-4 w-4' />
                                Predeterminar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              disabled={quitar.isPending}
                              onClick={() => setTitularAQuitar(titular)}
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Quitar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {titulares.length > 0 && (
            <div className='text-muted-foreground border-t px-4 py-3 text-sm md:px-6'>
              {titulares.length}{' '}
              {titulares.length === 1 ? 'titular' : 'titulares'}
              {predeterminados > 0 && ' · 1 predeterminado'}
            </div>
          )}
        </TabsContent>

        <TabsContent value='compras' className='mt-0'>
          <div className='overflow-x-auto border-t'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Viaje</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Importe</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className='text-right'>Factura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {compras.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-muted-foreground py-10 text-center'
                    >
                      Cargando las compras…
                    </TableCell>
                  </TableRow>
                )}

                {!compras.isLoading && compras.error && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-destructive py-10 text-center'
                    >
                      No se pudieron cargar las compras.
                    </TableCell>
                  </TableRow>
                )}

                {!compras.isLoading &&
                  !compras.error &&
                  ventas.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-muted-foreground py-10 text-center'
                      >
                        Este cliente todavía no compró ningún pasaje.
                      </TableCell>
                    </TableRow>
                  )}

                {ventas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className='tabular-nums'>
                      {fecha(venta.fechaViaje)}
                    </TableCell>
                    <TableCell>
                      {venta.origenNombre} → {venta.destinoNombre}
                    </TableCell>
                    <TableCell className='text-muted-foreground'>
                      {venta.empresaNombre}
                    </TableCell>
                    <TableCell className='tabular-nums'>
                      {formatearGuaranies(venta.importeTotal)}
                    </TableCell>
                    <TableCell>
                      <Badge variant='secondary'>{venta.estadoVenta}</Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      {/* Sin número de transacción no hay factura que pedir: el
                          endpoint la busca justamente por ese número. */}
                      {venta.numeroTransaccion ? (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          disabled={descargando.has(venta.numeroTransaccion)}
                          onClick={() =>
                            void descargarFactura(venta.numeroTransaccion)
                          }
                        >
                          {descargando.has(venta.numeroTransaccion) ? (
                            <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                          ) : (
                            <Download className='mr-1.5 h-3.5 w-3.5' />
                          )}
                          Descargar
                        </Button>
                      ) : (
                        <span className='text-muted-foreground text-sm'>—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 md:px-6'>
            <p className='text-muted-foreground text-sm'>
              {totalCompras === 0
                ? 'Sin compras'
                : `Mostrando ${ventas.length} de ${totalCompras} compra${totalCompras === 1 ? '' : 's'}`}
            </p>
            <div className='flex items-center gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={pagina <= 1 || compras.isFetching}
                onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
              >
                Anterior
              </Button>
              <span className='text-muted-foreground text-sm tabular-nums'>
                Página {pagina} de {totalPaginas}
              </span>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={pagina >= totalPaginas || compras.isFetching}
                onClick={() => setPagina((actual) => actual + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TitularFacturacionDialog
        clienteId={clienteId}
        titular={titularEnEdicion}
        open={titularEnEdicion !== undefined}
        onOpenChange={(abierto) => {
          if (!abierto) setTitularEnEdicion(undefined)
        }}
      />

      <ConfirmDialog
        open={titularAQuitar !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setTitularAQuitar(null)
        }}
        destructive
        isLoading={quitar.isPending}
        title={`¿Quitar a ${titularAQuitar?.razonSocial ?? ''} de la libreta?`}
        desc='Las facturas ya emitidas a su nombre no cambian. El cliente puede volver a cargarlo al comprar.'
        confirmText='Quitar'
        handleConfirm={() => {
          if (!titularAQuitar) return
          quitar.mutate(titularAQuitar.id, {
            onSuccess: () => setTitularAQuitar(null),
          })
        }}
      />
    </>
  )
}
