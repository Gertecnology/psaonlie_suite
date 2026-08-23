import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { AlertCircle, ArrowLeft, Download, FileSearch, Printer } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { DefinicionInforme, FiltrosInforme, PeriodoInforme } from '../models/informe.model'
import { estaGenerado, rutaApi } from '../models/informe.model'
import { EncabezadoInforme } from './encabezado-informe'
import './informe-imprimible.css'

interface MarcoInformeProps {
  definicion: DefinicionInforme
  filtros: FiltrosInforme
  /** The filter controls for this report. */
  children: React.ReactNode
  /** The report itself. Only rendered once there is data. */
  resultado?: React.ReactNode
  periodo?: PeriodoInforme
  /** Filters in force, worded for the header. */
  filtrosDescritos?: Array<{ etiqueta: string; valor: string }>
  isLoading?: boolean
  error?: Error | null
  onGenerar: () => void
  onExportar?: () => void
  puedeGenerar: boolean
}

/**
 * Everything a report screen has in common: filters, the Generar button, the
 * traceability header and the print action.
 *
 * The shape follows the rule the owner set — **nothing is fetched until you
 * ask for it**. Which is why the empty state below is not a placeholder for
 * missing data: it is the normal state of a report you have not run yet, and it
 * says so.
 */
export function MarcoInforme({
  definicion,
  filtros,
  children,
  resultado,
  periodo,
  filtrosDescritos,
  isLoading = false,
  error = null,
  onGenerar,
  onExportar,
  puedeGenerar,
}: MarcoInformeProps) {
  const generado = estaGenerado(filtros)

  // Se congela cuando llegan los datos: reimprimir el mismo informe no puede
  // cambiarle la hora de emisión, o dejan de ser el mismo documento.
  const [emitidoEn, setEmitidoEn] = React.useState<Date | null>(null)
  React.useEffect(() => {
    if (resultado && !isLoading) setEmitidoEn(new Date())
  }, [resultado, isLoading])

  return (
    <PageLayout
      title={definicion.titulo}
      description={definicion.responde}
      showSearch={false}
      actions={
        <div className='no-imprimir flex items-center gap-2'>
          <Button variant='ghost' size='sm' asChild>
            <Link to='/reports'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Informes
            </Link>
          </Button>
          {generado && resultado && (
            <>
              <Button variant='outline' size='sm' onClick={() => window.print()}>
                <Printer className='mr-2 h-4 w-4' />
                Imprimir
              </Button>
              {onExportar && (
                <Button variant='outline' size='sm' onClick={onExportar}>
                  <Download className='mr-2 h-4 w-4' />
                  Excel
                </Button>
              )}
            </>
          )}
        </div>
      }
    >
      {/* Los filtros son una barra, no una tarjeta con un párrafo adentro: se
          usan una vez al abrir y después estorban. La descripción del informe
          ya está en el subtítulo de la página. */}
      <div className='no-imprimir mb-6 flex flex-wrap items-end gap-3 border-b pb-4'>
        {children}
        <Button onClick={onGenerar} disabled={!puedeGenerar || isLoading}>
          {isLoading ? 'Generando…' : 'Generar'}
        </Button>
      </div>

      <div className='informe-imprimible'>
        {!generado ? (
          <SinGenerar />
        ) : isLoading ? (
          <Cargando />
        ) : error ? (
          <ErrorInforme error={error} onReintentar={onGenerar} />
        ) : (
          <>
            <EncabezadoInforme
              titulo={definicion.titulo}
              periodo={periodo}
              // El endpoint, no el segmento del navegador: el encabezado existe
              // para que otro pueda reproducir estas cifras, y un informe
              // cuya ruta de API difiere de su URL imprimiría un path que no
              // responde.
              origen={`/api/admin/informes/${rutaApi(definicion)}`}
              emitidoEn={emitidoEn ?? new Date()}
              filtros={filtrosDescritos}
            />
            {resultado}
          </>
        )}
      </div>
    </PageLayout>
  )
}

function SinGenerar() {
  return (
    <div className='text-muted-foreground flex items-center gap-3 py-8 text-sm'>
      <FileSearch className='h-5 w-5 shrink-0' />
      <p>
        Elegí el período y apretá <strong>Generar</strong>.
      </p>
    </div>
  )
}

function Cargando() {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-28 w-full' />
      <Skeleton className='h-64 w-full' />
    </div>
  )
}

function ErrorInforme({
  error,
  onReintentar,
}: {
  error: Error
  onReintentar: () => void
}) {
  return (
    <div
      role='alert'
      className='border-destructive/50 text-destructive flex flex-col items-center gap-3 rounded-md border p-8 text-center'
    >
      <AlertCircle className='h-8 w-8' />
      <div>
        <p className='font-medium'>No se pudo generar el informe</p>
        <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
      </div>
      <Button variant='outline' size='sm' onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  )
}
