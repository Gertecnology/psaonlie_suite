import * as React from 'react'
import { formatearFecha } from '@/lib/formato'
import { useAuth } from '@/context/auth-context'
import {
  CRITERIO_IMPUTACION,
  EMISOR,
  MONEDA_INFORMES,
} from '@/config/emisor'
import type { DefinicionInforme, PeriodoInforme } from '../models/informe.model'
import { rutaApi } from '../models/informe.model'

interface HojaInformeProps {
  definicion: DefinicionInforme
  /** El período que devolvió la API, no el que se pidió. */
  periodo?: PeriodoInforme
  /** Los demás filtros en vigor, ya redactados para leer. */
  filtrosDescritos?: Array<{ etiqueta: string; valor: string }>
  /** Instante en que llegaron los datos: reimprimir no cambia la hora. */
  emitidoEn: Date
  children: React.ReactNode
}

/**
 * La hoja: lo que se imprime, se archiva y se manda.
 *
 * Abre con el membrete —quién emite y qué documento es— y sigue con los filtros
 * **aplicados**, en texto. Ahí está la diferencia con la barra de arriba: los
 * controles quedan fuera del documento. Un informe emitido no se filtra; se
 * lee. Y lo que hace falta para reproducirlo —período, empresa, moneda,
 * criterio de imputación, quién lo emitió y cuándo— tiene que estar escrito en
 * la hoja, porque el papel se archiva sin la pantalla al lado.
 */
export function HojaInforme({
  definicion,
  periodo,
  filtrosDescritos = [],
  emitidoEn,
  children,
}: HojaInformeProps) {
  const { user } = useAuth()
  const emisor = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : '—'
  const usuario = user?.email?.split('@')[0] ?? '—'

  return (
    <div className='informe-hoja bg-background border-border border shadow-sm'>
      <header className='flex items-start justify-between gap-8 px-7 pt-5 pb-3.5'>
        <div className='flex items-start gap-3.5'>
          {/* El logo del panel, el mismo del sidebar y el mismo que ve el
              pasajero. Un membrete con otra marca no es el membrete de la
              empresa. Sin recuadro: la marca ya tiene su forma. */}
          <img
            src='/images/pasajeonline.svg'
            alt=''
            className='mt-0.5 h-8 w-auto shrink-0'
          />
          <div className='flex flex-col gap-px'>
            <span className='text-sm font-bold tracking-wide text-[#1e2a5a]'>
              {EMISOR.razonSocial}
            </span>
            <span className='text-muted-foreground text-[11px] tabular-nums'>
              RUC {EMISOR.ruc}
            </span>
            <span className='text-muted-foreground text-[11px]'>
              {EMISOR.direccion} — {EMISOR.ciudad}
            </span>
          </div>
        </div>
        <div className='text-right'>
          <h2 className='text-sm font-bold tracking-wide text-[#1e2a5a]'>
            {definicion.documento}
          </h2>
          <span className='text-muted-foreground mt-0.5 block text-[11px] tabular-nums'>
            Informe {definicion.codigo}
          </span>
        </div>
      </header>

      <div className='mx-7 h-0.5 bg-[#1e2a5a]' />

      {/* Los filtros aplicados. No son controles: es la ficha técnica que
          permite reproducir el informe y auditarlo. */}
      <dl className='border-border flex flex-wrap items-center gap-x-[18px] gap-y-1 border-b px-7 pt-2.5 pb-3'>
        <Dato etiqueta='Período'>
          {periodo ? (
            <>
              {formatearFecha(periodo.desde)} al{' '}
              {formatearFecha(periodo.hasta)} ({periodo.dias}{' '}
              {periodo.dias === 1 ? 'día' : 'días'})
            </>
          ) : (
            '—'
          )}
        </Dato>
        {filtrosDescritos.map((filtro) => (
          <Dato key={filtro.etiqueta} etiqueta={filtro.etiqueta}>
            {filtro.valor}
          </Dato>
        ))}
        <Dato etiqueta='Moneda'>{MONEDA_INFORMES}</Dato>
        <Dato etiqueta='Criterio'>{CRITERIO_IMPUTACION}</Dato>
        <Dato etiqueta='Emisión'>
          {emitidoEn.toLocaleString('es-PY', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })}
        </Dato>
        <Dato etiqueta='Usuario'>
          {usuario} — {emisor}
        </Dato>
        <Dato etiqueta='Condición'>DEFINITIVO</Dato>
      </dl>

      {children}

      <footer className='bg-muted/60 border-border flex flex-wrap items-center justify-between gap-4 border-t px-7 py-2.5'>
        <span className='text-muted-foreground text-[10.5px] tabular-nums'>
          {EMISOR.razonSocial} — {definicion.codigo} —{' '}
          {periodo
            ? `${formatearFecha(periodo.desde)} al ${formatearFecha(periodo.hasta)}`
            : 'sin período'}{' '}
          — Emitido por {usuario}
        </span>
        <span className='text-muted-foreground/70 text-[10.5px]'>
          Documento generado por sistema. Importes en guaraníes. Origen:{' '}
          {definicion.origen ?? `/api/admin/informes/${rutaApi(definicion)}`}
        </span>
      </footer>
    </div>
  )
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className='flex items-baseline gap-1.5'>
      <dt className='text-muted-foreground text-[11px]'>{etiqueta}</dt>
      <dd className='text-foreground text-[11.5px] font-semibold tabular-nums'>
        {children}
      </dd>
    </div>
  )
}
