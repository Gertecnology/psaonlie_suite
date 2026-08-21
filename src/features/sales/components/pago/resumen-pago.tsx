import { CreditCard, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  calcularDesglose,
  describirCargoServicio,
  formatearGuaranies,
  sumarDesgloses,
  type DesglosePago,
} from '../../utils/money'
import type { Asiento, ServiceCharge } from '../../models/sales.model'

/** Un tramo del viaje con sus asientos y el cargo por servicio de su empresa. */
export interface TramoResumen {
  etiqueta: string
  asientos: Asiento[]
  serviceCharge?: ServiceCharge
}

interface ResumenPagoProps {
  tramos: TramoResumen[]
  titulo?: string
}

/**
 * Desglose de lo que paga el cliente, antes de cobrarle.
 *
 * Muestra pasaje, cargo por servicio y total. La comisión NO se muestra: es un
 * acuerdo entre nosotros y la empresa, no forma parte de lo que paga el
 * cliente.
 *
 * El total que sale acá es el mismo que cobra el backend
 * (`importeTotal + serviceChargeMontoTotal`), calculado con la misma fórmula:
 * PORCENTUAL o FIJO según `tipoAplicacion`, en enteros de guaraníes.
 */
export function ResumenPago({
  tramos,
  titulo = 'Resumen de pago',
}: ResumenPagoProps) {
  const desglosesPorTramo = tramos.map((tramo) => ({
    tramo,
    desglose: calcularDesglose(tramo.asientos, tramo.serviceCharge),
  }))

  const total: DesglosePago = sumarDesgloses(
    ...desglosesPorTramo.map((item) => item.desglose),
  )

  const hayVariosTramos = tramos.length > 1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {desglosesPorTramo.map(({ tramo, desglose }) => (
            <div key={tramo.etiqueta} className="space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">
                  {tramo.etiqueta} ({tramo.asientos.length}{' '}
                  {tramo.asientos.length === 1 ? 'asiento' : 'asientos'})
                </span>
              </div>

              {tramo.asientos.map((asiento) => (
                <div
                  key={`${tramo.etiqueta}-${asiento.numero}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    Asiento {asiento.numero}
                  </span>
                  <span className="font-medium">
                    {formatearGuaranies(asiento.precio)}
                  </span>
                </div>
              ))}

              {desglose.cargoServicio > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {describirCargoServicio(tramo.serviceCharge)}
                  </span>
                  <span className="font-medium">
                    {formatearGuaranies(desglose.cargoServicio)}
                  </span>
                </div>
              )}

              {hayVariosTramos && (
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Subtotal {tramo.etiqueta}</span>
                  <span>{formatearGuaranies(desglose.total)}</span>
                </div>
              )}
            </div>
          ))}

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pasajes</span>
            <span className="text-sm font-medium">
              {formatearGuaranies(total.importePasajes)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Cargo por servicio
            </span>
            <span className="text-sm font-medium">
              {formatearGuaranies(total.cargoServicio)}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="font-semibold">Total a cobrar</span>
            <span
              className="text-lg font-bold text-primary"
              data-testid="total-a-cobrar"
            >
              {formatearGuaranies(total.total)}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            El cliente paga pasajes más cargo por servicio. No hay cargos
            adicionales al confirmar.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
