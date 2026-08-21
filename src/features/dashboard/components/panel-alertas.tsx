import { useState, type ReactNode } from 'react'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import type { Periodo } from '@/lib/periodo'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  useConectividadEmpresas,
  usePagosPorVencer,
  useVentasSinBoleto,
} from '../hooks/use-alertas'
import { HORAS_ALERTA_VENCIMIENTO } from '../models/alertas.model'
import { TablaConectividad } from './detalle/tabla-conectividad'
import { TablaPagosPorVencer } from './detalle/tabla-pagos-por-vencer'
import { TablaVentasSinBoleto } from './detalle/tabla-ventas-sin-boleto'
import { TarjetaAlerta, TarjetaAlertaSkeleton } from './tarjeta-alerta'

type HojaAbierta = 'sin-boleto' | 'por-vencer' | 'conectividad' | null

interface Props {
  periodo: Periodo
}

/**
 * Alertas operativas: lo primero que se ve al entrar.
 *
 * Están arriba de todo porque son lo único de esta pantalla que exige una
 * acción hoy. El resto del panel informa; esto interrumpe. Las 33 ventas
 * cobradas sin boleto que hay en producción existían desde hace meses y el
 * panel anterior no las mostraba en ningún lado.
 *
 * Cada alerta es su propia consulta: si el listado de empresas devuelve un 500,
 * las ventas sin boleto tienen que seguir viéndose igual.
 */
export function PanelAlertas({ periodo }: Props) {
  const [hoja, setHoja] = useState<HojaAbierta>(null)

  const sinBoleto = useVentasSinBoleto(periodo)
  const porVencer = usePagosPorVencer()
  const conectividad = useConectividadEmpresas()

  const cargando =
    sinBoleto.isPending || porVencer.isPending || conectividad.isPending

  return (
    <section
      aria-label='Alertas operativas'
      className='mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
    >
      {cargando ? (
        <>
          <TarjetaAlertaSkeleton />
          <TarjetaAlertaSkeleton />
          <TarjetaAlertaSkeleton />
        </>
      ) : (
        <>
          <AlertaVentasSinBoleto
            datos={sinBoleto.data}
            error={sinBoleto.error}
            onVerDetalle={() => setHoja('sin-boleto')}
          />
          <AlertaPagosPorVencer
            datos={porVencer.data}
            error={porVencer.error}
            onVerDetalle={() => setHoja('por-vencer')}
          />
          <AlertaConectividad
            datos={conectividad.data}
            error={conectividad.error}
            onVerDetalle={() => setHoja('conectividad')}
          />
        </>
      )}

      <Sheet open={hoja !== null} onOpenChange={(v) => !v && setHoja(null)}>
        <SheetContent className='w-full overflow-y-auto sm:max-w-3xl'>
          {hoja === 'sin-boleto' && (
            <>
              <SheetHeader>
                <SheetTitle>Ventas cobradas sin boleto</SheetTitle>
                <SheetDescription>
                  El cliente pagó y el sistema nunca emitió el pasaje. Cada fila
                  es una persona que puede presentarse a viajar sin nada.
                </SheetDescription>
              </SheetHeader>
              <div className='px-4 pb-6'>
                <TablaVentasSinBoleto datos={sinBoleto.data} />
              </div>
            </>
          )}

          {hoja === 'por-vencer' && (
            <>
              <SheetHeader>
                <SheetTitle>Pagos pendientes</SheetTitle>
                <SheetDescription>
                  Reservas esperando confirmación de pago. Sólo incluye WhatsApp
                  y transferencia: el backend acota la consulta a esos dos
                  métodos, así que las reservas por Bancard no aparecen acá.
                </SheetDescription>
              </SheetHeader>
              <div className='px-4 pb-6'>
                <TablaPagosPorVencer datos={porVencer.data} />
              </div>
            </>
          )}

          {hoja === 'conectividad' && (
            <>
              <SheetHeader>
                <SheetTitle>Conexión con las empresas</SheetTitle>
                <SheetDescription>
                  Sin URL de web server no se pueden emitir boletos contra esa
                  empresa. La última sincronización es la señal más confiable
                  que guarda el backend.
                </SheetDescription>
              </SheetHeader>
              <div className='px-4 pb-6'>
                <TablaConectividad datos={conectividad.data} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

// ─── Alertas individuales ───────────────────────────────────────────────────

function BotonDetalle({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button variant='outline' size='sm' onClick={onClick}>
      {children}
    </Button>
  )
}

function AlertaError({ titulo, error }: { titulo: string; error: Error }) {
  return (
    <TarjetaAlerta
      severidad='seria'
      titulo={titulo}
      cifra='—'
      detalle={`No se pudo consultar: ${error.message}`}
      nota='La alerta se reintenta sola en unos minutos.'
    />
  )
}

function AlertaVentasSinBoleto({
  datos,
  error,
  onVerDetalle,
}: {
  datos: ReturnType<typeof useVentasSinBoleto>['data']
  error: Error | null
  onVerDetalle: () => void
}) {
  if (error) {
    return <AlertaError titulo='Ventas cobradas sin boleto' error={error} />
  }
  if (!datos) return <TarjetaAlertaSkeleton />

  const hay = datos.cantidad > 0

  return (
    <TarjetaAlerta
      severidad={hay ? 'critica' : 'ok'}
      titulo='Ventas cobradas sin boleto'
      cifra={formatearEntero(datos.cantidad)}
      detalle={
        hay
          ? `Se cobró ${formatearGuaranies(datos.montoAfectado)} y el pasaje nunca se emitió. Hay que reconciliar cada una con la empresa.`
          : 'Todas las ventas pagadas tienen su boleto emitido.'
      }
      nota={
        datos.parcial
          ? `Revisadas las ${formatearEntero(datos.analizadas)} ventas pagadas más recientes de ${formatearEntero(datos.totalPagadas)}.`
          : `Revisadas las ${formatearEntero(datos.analizadas)} ventas pagadas del sistema.`
      }
      accion={
        hay ? (
          <BotonDetalle onClick={onVerDetalle}>
            Ver las {formatearEntero(datos.cantidad)} ventas
          </BotonDetalle>
        ) : undefined
      }
    />
  )
}

function AlertaPagosPorVencer({
  datos,
  error,
  onVerDetalle,
}: {
  datos: ReturnType<typeof usePagosPorVencer>['data']
  error: Error | null
  onVerDetalle: () => void
}) {
  if (error) {
    return <AlertaError titulo='Pagos por vencer' error={error} />
  }
  if (!datos) return <TarjetaAlertaSkeleton />

  const vencidos = datos.vencidos.length
  const porVencer = datos.porVencer.length
  const severidad = vencidos > 0 ? 'seria' : porVencer > 0 ? 'atencion' : 'ok'

  return (
    <TarjetaAlerta
      severidad={severidad}
      titulo='Pagos por vencer'
      cifra={formatearEntero(porVencer)}
      detalle={
        porVencer > 0
          ? `${formatearGuaranies(datos.montoPorVencer)} en reservas que vencen dentro de ${HORAS_ALERTA_VENCIMIENTO} horas. Si vencen, los asientos se liberan.`
          : 'Ninguna reserva vence en las próximas horas.'
      }
      nota={
        vencidos > 0
          ? `Además hay ${formatearEntero(vencidos)} ya vencidas que siguen pendientes.`
          : `${formatearEntero(datos.totalPendientes)} pagos pendientes en total.`
      }
      accion={
        porVencer + vencidos > 0 ? (
          <BotonDetalle onClick={onVerDetalle}>Ver pendientes</BotonDetalle>
        ) : undefined
      }
    />
  )
}

function AlertaConectividad({
  datos,
  error,
  onVerDetalle,
}: {
  datos: ReturnType<typeof useConectividadEmpresas>['data']
  error: Error | null
  onVerDetalle: () => void
}) {
  if (error) {
    return <AlertaError titulo='Conexión con las empresas' error={error} />
  }
  if (!datos) return <TarjetaAlertaSkeleton />

  const problemas = datos.sinUrl + datos.sinSincronizar + datos.desactualizadas
  const severidad =
    datos.sinUrl > 0 ? 'seria' : problemas > 0 ? 'atencion' : 'ok'

  return (
    <TarjetaAlerta
      severidad={severidad}
      titulo='Empresas sin conexión'
      cifra={`${formatearEntero(datos.sinUrl)} / ${formatearEntero(datos.total)}`}
      detalle={
        datos.sinUrl > 0
          ? 'Sin URL de web server cargada no se puede emitir un boleto contra esa empresa. El dato falta, no está caído.'
          : 'Todas las empresas tienen su web server configurado.'
      }
      nota={
        datos.sinSincronizar + datos.desactualizadas > 0
          ? `${formatearEntero(datos.sinSincronizar + datos.desactualizadas)} sin sincronizar en las últimas 24 horas.`
          : 'Todas sincronizaron en las últimas 24 horas.'
      }
      accion={
        <BotonDetalle onClick={onVerDetalle}>Ver empresas</BotonDetalle>
      }
    />
  )
}
