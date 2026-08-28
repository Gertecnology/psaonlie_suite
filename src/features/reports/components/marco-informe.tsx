import * as React from 'react'
import { AlertCircle, Download } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { HeaderNotifications } from '@/components/notifications/header-notifications'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { DefinicionInforme, FiltrosInforme, PeriodoInforme } from '../models/informe.model'
import { estaGenerado } from '../models/informe.model'
import { HojaInforme } from './hoja-informe'
import './informe-imprimible.css'

interface MarcoInformeProps {
  definicion: DefinicionInforme
  /** Los filtros con los que se emitió lo que se está viendo. */
  filtros: FiltrosInforme
  /** Los controles de la barra de arriba. */
  controles: React.ReactNode
  /** El cuerpo del informe. Sólo se dibuja cuando hay datos. */
  resultado?: React.ReactNode
  periodo?: PeriodoInforme
  /** Filtros extra en vigor, redactados para la ficha técnica de la hoja. */
  filtrosDescritos?: Array<{ etiqueta: string; valor: string }>
  isLoading?: boolean
  error?: Error | null
  onEmitir: () => void
  puedeEmitir: boolean
}

/**
 * Lo que todos los informes tienen en común.
 *
 * El reparto es lo que define esta pantalla, y viene de una corrección del
 * dueño: **los filtros van arriba, fuera del informe**, en la misma fila que el
 * botón de exportar. Dentro de la hoja va lo que se aplicó, en texto. Un
 * informe emitido es un documento, y un documento no se filtra.
 *
 * La otra regla que la forma: **nada se consulta hasta que se pide**. Cada
 * informe recorre la totalidad de las ventas del período, así que el estado
 * «sin emitir» de abajo no es un placeholder de datos que faltan — es el estado
 * normal de un informe que todavía no se pidió, y lo dice.
 */
export function MarcoInforme({
  definicion,
  filtros,
  controles,
  resultado,
  periodo,
  filtrosDescritos,
  isLoading = false,
  error = null,
  onEmitir,
  puedeEmitir,
}: MarcoInformeProps) {
  const emitido = estaGenerado(filtros)

  // Se congela cuando llegan los datos: reimprimir el mismo informe no puede
  // cambiarle la hora de emisión, o dejan de ser el mismo documento.
  const [emitidoEn, setEmitidoEn] = React.useState<Date | null>(null)
  React.useEffect(() => {
    if (resultado && !isLoading) setEmitidoEn(new Date())
  }, [resultado, isLoading])

  return (
    <>
      <Header fixed>
        <div className='ml-auto flex items-center space-x-4'>
          <HeaderNotifications />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        {/* La barra: título, código, filtros y exportar, todo al mismo nivel. */}
        <div className='no-imprimir mb-3.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3'>
          <div className='flex items-baseline gap-3'>
            <h1 className='text-xl font-bold tracking-tight'>
              {definicion.titulo}
            </h1>
            <span className='text-muted-foreground text-xs tabular-nums'>
              {definicion.codigo}
            </span>
          </div>

          <div className='flex flex-wrap items-center gap-2.5'>
            {controles}
            <Button
              size='sm'
              className='h-[30px] rounded-none bg-[#1e2a5a] px-4 text-xs font-semibold hover:bg-[#18224a]'
              onClick={onEmitir}
              disabled={!puedeEmitir || isLoading}
            >
              {isLoading ? 'Emitiendo…' : 'Emitir'}
            </Button>
            {emitido && resultado && (
              <>
                <span className='bg-border h-[22px] w-px' aria-hidden />
                <Button
                  variant='outline'
                  size='sm'
                  className='h-[30px] border-[#1e2a5a] text-xs font-semibold text-[#1e2a5a]'
                  onClick={() => window.print()}
                >
                  <Download className='mr-1.5 size-3.5' />
                  Exportar a PDF
                </Button>
              </>
            )}
          </div>
        </div>

        <div className='informe-imprimible'>
          <HojaInforme
            definicion={definicion}
            periodo={periodo}
            filtrosDescritos={filtrosDescritos}
            emitidoEn={emitidoEn ?? new Date()}
          >
            {!emitido ? (
              <SinEmitir />
            ) : isLoading ? (
              <Cargando />
            ) : error ? (
              <ErrorInforme error={error} onReintentar={onEmitir} />
            ) : (
              resultado
            )}
          </HojaInforme>
        </div>
      </Main>
    </>
  )
}

/**
 * El estado normal al entrar.
 *
 * Como ningún informe se consulta solo, esto es lo que se ve siempre al abrir
 * la pantalla. Por eso explica por qué no cargó en lugar de disculparse por no
 * tener datos.
 */
function SinEmitir() {
  return (
    <div className='flex flex-col items-center justify-center gap-1.5 px-7 py-16 text-center'>
      <p className='text-[13.5px] font-semibold'>El informe no se emitió</p>
      <p className='text-muted-foreground text-xs'>
        Elegí el período arriba y apretá <strong>Emitir</strong>. Ningún informe
        se ejecuta al abrir la pantalla.
      </p>
    </div>
  )
}

function Cargando() {
  return (
    <div className='space-y-2 px-7 py-6'>
      <Skeleton className='h-7 w-full' />
      <Skeleton className='h-52 w-full' />
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
      className='flex flex-col items-center gap-3 px-7 py-12 text-center'
    >
      <AlertCircle className='text-destructive size-7' />
      <div>
        <p className='font-medium'>No se pudo emitir el informe</p>
        <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
      </div>
      <Button variant='outline' size='sm' onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  )
}
