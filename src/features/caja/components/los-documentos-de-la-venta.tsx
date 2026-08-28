import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Loader2,
  Receipt,
  Ticket,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatearFechaHora } from '@/lib/formato'
import { useFacturasDeLaVenta } from '../hooks/use-caja'
import type { FacturaDeLaVenta } from '../models/caja.model'
import { descargarDocumento, verDocumento } from '../services/caja.service'

/**
 * Todo lo que la venta produjo, para verlo antes de entregarlo.
 *
 * Antes esta lista sólo traía las facturas, así que el boleto —lo único que la
 * persona necesita para subir al bus— no figuraba. Y ninguno se podía abrir: la
 * única opción era descargar la factura entera de la venta y confiar.
 *
 * El vendedor tiene al cliente enfrente y necesita **mirar** lo que va a
 * imprimir o mandar. Por eso el visor está acá adentro y no en otra pestaña.
 */

/** Cómo se llama cada documento en la pantalla, y con qué ícono. */
const COMO_SE_LLAMA: Record<
  string,
  { titulo: (documento: FacturaDeLaVenta) => string; Icono: typeof FileText }
> = {
  BOLETO: {
    titulo: (documento) =>
      documento.numeroBoleto ? `Boleto ${documento.numeroBoleto}` : 'Boleto',
    Icono: Ticket,
  },
  FACTURA_PASAJE: {
    titulo: (documento) =>
      documento.numeroBoleto
        ? `Factura del pasaje ${documento.numeroBoleto}`
        : 'Factura del pasaje',
    Icono: FileText,
  },
  CARGO_SERVICIO: {
    titulo: () => 'Cargo por servicio',
    Icono: Receipt,
  },
}

function describir(documento: FacturaDeLaVenta) {
  const conocido = COMO_SE_LLAMA[documento.tipo]

  if (conocido) {
    return { titulo: conocido.titulo(documento), Icono: conocido.Icono }
  }

  // Un tipo que la pantalla todavía no conoce se muestra igual: es preferible
  // un nombre feo a un documento que no aparece.
  return { titulo: documento.archivo, Icono: FileText }
}

function formatearTamano(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function LosDocumentosDeLaVenta({
  numeroTransaccion,
}: {
  numeroTransaccion: string | null
}) {
  const { data: documentos, isLoading, error } = useFacturasDeLaVenta(numeroTransaccion)

  const [abierto, setAbierto] = useState<FacturaDeLaVenta | null>(null)
  const [urlAbierta, setUrlAbierta] = useState<string | null>(null)
  const [trayendo, setTrayendo] = useState<string | null>(null)
  const [bajando, setBajando] = useState<string | null>(null)

  // Un object URL vive hasta que se lo libera. Sin esto, un vendedor que abre
  // veinte ventas en un turno se queda con veinte PDF en memoria.
  const urls = useRef(new Map<string, string>())

  useEffect(() => {
    const guardadas = urls.current

    return () => {
      guardadas.forEach((url) => URL.revokeObjectURL(url))
      guardadas.clear()
    }
  }, [])

  const abrir = async (documento: FacturaDeLaVenta) => {
    if (abierto?.id === documento.id) {
      setAbierto(null)
      setUrlAbierta(null)

      return
    }

    const yaTraida = urls.current.get(documento.id)

    if (yaTraida) {
      setAbierto(documento)
      setUrlAbierta(yaTraida)

      return
    }

    setTrayendo(documento.id)

    try {
      const { url } = await verDocumento(documento.id)

      urls.current.set(documento.id, url)
      setAbierto(documento)
      setUrlAbierta(url)
    } catch (problema) {
      toast.error('No se pudo abrir el documento', {
        description:
          problema instanceof Error ? problema.message : 'Probá de nuevo.',
      })
    } finally {
      setTrayendo(null)
    }
  }

  const bajar = async (documento: FacturaDeLaVenta) => {
    setBajando(documento.id)

    try {
      await descargarDocumento(documento.id, documento.archivo)
    } catch (problema) {
      toast.error('No se pudo descargar', {
        description:
          problema instanceof Error ? problema.message : 'Probá de nuevo.',
      })
    } finally {
      setBajando(null)
    }
  }

  if (isLoading) {
    return <Skeleton className='h-32 w-full' />
  }

  if (error) {
    return <p className='text-destructive text-sm'>{(error as Error).message}</p>
  }

  if (!documentos?.length) {
    return (
      <p className='text-muted-foreground py-6 text-center text-sm'>
        Esta venta todavía no tiene documentos generados.
      </p>
    )
  }

  // El aviso mira sólo las facturas: un boleto no es un documento fiscal, así
  // que contarlo como "no fiscal" haría saltar la advertencia siempre.
  const facturas = documentos.filter((documento) => documento.tipo !== 'BOLETO')
  const ningunaEsFiscal =
    facturas.length > 0 && facturas.every((factura) => !factura.esFiscal)

  return (
    <div className='space-y-3'>
      {ningunaEsFiscal && (
        <div className='flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs'>
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
          <p>
            La transportista todavía no informa timbrado, CDC ni código QR. Estos
            documentos reproducen la venta, pero{' '}
            <strong>no son facturas ante la SET</strong>.
          </p>
        </div>
      )}

      <div className='grid gap-2'>
        {documentos.map((documento) => {
          const { titulo, Icono } = describir(documento)
          const tamano = formatearTamano(documento.tamano)
          const esElAbierto = abierto?.id === documento.id

          return (
            <div
              key={documento.id}
              data-abierto={esElAbierto}
              className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 data-[abierto=true]:border-primary'
            >
              <div className='flex min-w-0 items-center gap-3'>
                <Icono className='text-muted-foreground h-5 w-5 shrink-0' />
                <div className='min-w-0'>
                  <p className='truncate text-sm font-medium'>{titulo}</p>
                  <p className='text-muted-foreground text-xs'>
                    {documento.razonSocial ?? 'Sin razón social'}
                    {documento.documento && ` · ${documento.documento}`}
                    {` · ${formatearFechaHora(documento.emitidaEn)}`}
                    {tamano && ` · ${tamano}`}
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2'>
                {documento.tipo !== 'BOLETO' && (
                  <Badge variant={documento.esFiscal ? 'default' : 'outline'}>
                    {documento.esFiscal ? 'Fiscal' : 'No fiscal'}
                  </Badge>
                )}

                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => abrir(documento)}
                  disabled={trayendo !== null}
                  aria-expanded={esElAbierto}
                  // Seis botones que dicen «Ver» son seis botones idénticos
                  // para quien navega por lector de pantalla.
                  aria-label={`${esElAbierto ? 'Cerrar' : 'Ver'} ${titulo}`}
                >
                  {trayendo === documento.id ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : esElAbierto ? (
                    <X className='mr-2 h-4 w-4' />
                  ) : (
                    <Eye className='mr-2 h-4 w-4' />
                  )}
                  {esElAbierto ? 'Cerrar' : 'Ver'}
                </Button>

                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => bajar(documento)}
                  disabled={bajando !== null}
                  aria-label={`Descargar ${titulo}`}
                >
                  {bajando === documento.id ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Download className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {abierto && urlAbierta && (
        <div className='overflow-hidden rounded-md border'>
          <div className='bg-muted/40 flex items-center justify-between gap-2 border-b px-3 py-2'>
            <span className='truncate text-sm font-medium'>
              {describir(abierto).titulo}
            </span>
            <Button
              variant='ghost'
              size='sm'
              aria-label='Cerrar la vista previa'
              onClick={() => {
                setAbierto(null)
                setUrlAbierta(null)
              }}
            >
              <X className='mr-2 h-4 w-4' />
              Cerrar
            </Button>
          </div>

          <iframe
            src={urlAbierta}
            title={`Vista previa de ${describir(abierto).titulo}`}
            className='h-[60vh] w-full bg-white'
          />
        </div>
      )}
    </div>
  )
}
