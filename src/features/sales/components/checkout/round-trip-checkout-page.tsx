import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, MapPin, Calendar, Clock, CreditCard, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCreateClient } from '@/features/clients/hooks/use-client-mutations'
import { PlanillaDePasajeros } from './planilla-de-pasajeros'
import { FacturacionCard, type DatosDeFacturacion } from './facturacion-card'
import {
  cuantasCompletas,
  estaCompleta,
  type DatosDelPasajero,
} from '../../utils/los-datos-del-pasajero'
import { ResumenPago, type TramoResumen } from '../pago/resumen-pago'
import { TiempoBloqueo } from '../asientos/tiempo-bloqueo'
import { useRoundTrip } from '../../context/round-trip-context'
import { useConfirmarVenta } from '../../hooks/use-confirmar-venta'
import { useLiberarBloqueo } from '../../hooks/use-liberar-bloqueo'
import {
  mensajeParaOperador,
  VentaConfirmacionError,
  type VentaConfirmar,
} from '../../services/confirmar-venta'
import { sumarPreciosAsientos } from '../../utils/money'
import type { PasajeroRegistrado } from '../../models/sales.model'
import { toast } from 'sonner'

interface RoundTripCheckoutPageProps {
  onComplete?: () => void
}

export function RoundTripCheckoutPage({ onComplete: _onComplete }: RoundTripCheckoutPageProps) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const [pasajeros, setPasajeros] = useState<PasajeroRegistrado[]>([])

  /** Lo cargado en la planilla, tal como está. */
  const [filasDePasajeros, setFilasDePasajeros] = useState<DatosDelPasajero[]>(
    [],
  )
  const [errorVenta, setErrorVenta] = useState<string | null>(null)

  // A nombre de quién sale la factura. También faltaba: toda venta de ida y
  // vuelta salía a consumidor final, y quien pedía factura con su RUC se iba
  // sin ella.
  const [facturacion, setFacturacion] = useState<DatosDeFacturacion>({
    documento: '',
    razonSocial: '',
  })

  const faltaFacturacion =
    !facturacion.documento.trim() || !facturacion.razonSocial.trim()

  /**
   * Lo que se manda igual en los dos tramos.
   *
   * Es una compra sola partida en dos ventas —así lo exige la transportista—,
   * pero el cliente factura una vez.
   *
   * **Sin método de pago**: en el mostrador se confirma la venta antes de que
   * el cliente diga cómo paga, y eso se elige en el paso siguiente. Mandar uno
   * acá obligaba a inventarlo, y lo que se inventaba era `'EFECTIVO'`: la caja
   * terminaba diciendo que había entrado efectivo por ventas pagadas con
   * tarjeta.
   */
  const comoSeCobra = () => ({
    // Se congela en la venta: lo que se facturó no cambia si el cliente
    // después edita sus datos.
    facturacion: {
      documento: facturacion.documento.trim(),
      razonSocial: facturacion.razonSocial.trim(),
      email: facturacion.email?.trim() || undefined,
      direccion: facturacion.direccion?.trim() || undefined,
    },
  })

  const crearCliente = useCreateClient()
  const confirmarVentaMutation = useConfirmarVenta()
  const liberarBloqueoMutation = useLiberarBloqueo()

  /**
   * Guarda contra doble envío. Este es el paso que crea la venta contra la
   * empresa: mandarlo dos veces emite dos boletos y cobra dos veces.
   *
   * Es un `ref` y no un estado porque tiene que cerrarse de forma síncrona:
   * dos clicks seguidos se despachan antes de que React vuelva a renderizar,
   * así que un `disabled` calculado no llega a tiempo. Y sólo se reabre si la
   * confirmación falló: una venta confirmada no se confirma de nuevo.
   */
  const confirmacionCerrada = useRef(false)
  const ventaYaConfirmada = !!roundTripData.ida.ventaConfirmada

  // Un formulario por pasajero: si hay ida y vuelta, el mismo pasajero viaja
  // en los dos tramos.
  const maxAsientos = Math.max(
    roundTripData.ida.asientos?.length || 0,
    roundTripData.vuelta?.asientos?.length || 0
  )

  const passengerForms = Array.from({ length: maxAsientos }, (_, index) => ({
    passengerNumber: index + 1,
    asientoIda: roundTripData.ida.asientos?.[index],
    asientoVuelta: roundTripData.vuelta?.asientos?.[index],
    agenciaIdIda: roundTripData.ida.agenciaId,
    empresaNombreIda: roundTripData.ida.servicio?.Emp,
  }))

  const tramos = useMemo<TramoResumen[]>(() => {
    const lista: TramoResumen[] = []

    if (roundTripData.ida.asientos?.length) {
      lista.push({
        etiqueta: 'Ida',
        asientos: roundTripData.ida.asientos,
        serviceCharge: roundTripData.ida.serviceCharge,
      })
    }

    if (roundTripData.vuelta?.asientos?.length) {
      lista.push({
        etiqueta: 'Vuelta',
        asientos: roundTripData.vuelta.asientos,
        serviceCharge: roundTripData.vuelta.serviceCharge,
      })
    }

    return lista
  }, [roundTripData])

  /** Libera los bloqueos de los tramos cuya venta no llegó a confirmarse. */
  const liberarBloqueosSinVenta = async (indicesFallidos: number[]) => {
    const codigos: Array<string | undefined> = [
      roundTripData.ida.codigoReferencia,
      roundTripData.vuelta?.codigoReferencia,
    ]

    for (const indice of indicesFallidos) {
      const codigo = codigos[indice]
      if (!codigo) continue
      await liberarBloqueoMutation.mutateAsync(codigo).catch(() => undefined)
    }
  }

  const handleProceedToPayment = async () => {
    if (confirmacionCerrada.current || ventaYaConfirmada) return

    if (!roundTripData.ida.servicio || !roundTripData.ida.codigoReferencia) {
      toast.error('Faltan datos del viaje de ida')
      return
    }

    if (roundTripData.vuelta && (!roundTripData.vuelta.servicio || !roundTripData.vuelta.codigoReferencia)) {
      toast.error('Faltan datos del viaje de vuelta')
      return
    }

    if (cuantasCompletas(filasDePasajeros) !== passengerForms.length) {
      toast.error('Completá los datos de todos los pasajeros antes de continuar')
      return
    }

    confirmacionCerrada.current = true
    setErrorVenta(null)

    try {
      // La planilla no tiene un botón de guardar por fila, así que los
      // pasajeros se dan de alta acá, todos juntos. Los que ya se registraron
      // en un intento anterior no se vuelven a crear: repetir el alta duplica
      // el cliente y su sincronización con la empresa.
      const clientePorPasajero = new Map(
        pasajeros.map(pasajero => [pasajero.passengerNumber, pasajero.clienteId]),
      )

      for (const [indice, form] of passengerForms.entries()) {
        if (clientePorPasajero.has(form.passengerNumber)) continue

        const fila = filasDePasajeros[indice]
        if (!fila || !estaCompleta(fila)) continue

        const respuesta = await crearCliente.mutateAsync({
          ...fila,
          agenciaId: form.agenciaIdIda || roundTripData.ida.agenciaId || '',
        })

        const clienteId = respuesta?.cliente?.id

        // Sin id no hay forma de asociar el pasajero a su butaca: seguir
        // armaría una venta a nombre de nadie.
        if (!clienteId) {
          throw new Error(
            `No se pudo registrar al pasajero de la butaca ${form.asientoIda?.numero ?? form.passengerNumber}.`,
          )
        }

        clientePorPasajero.set(form.passengerNumber, clienteId)
        setPasajeros(antes => [
          ...antes,
          {
            clienteId,
            passengerNumber: form.passengerNumber,
            seatNumber: form.asientoIda ? Number(form.asientoIda.numero) : undefined,
            nombre: fila.nombre,
            apellido: fila.apellido,
            email: fila.email,
            numeroDocumento: fila.numeroDocumento,
          },
        ])
      }

      const ventas: VentaConfirmar[] = []

      const asientosIda = roundTripData.ida.asientos ?? []
      ventas.push({
        bloqueoCodigoReferencia: roundTripData.ida.codigoReferencia,
        servicioId: roundTripData.ida.servicio.Id,
        agenciaId: roundTripData.ida.agenciaId!,
        EmpresaBoleto: roundTripData.ida.servicio.Emp,
        calidad: roundTripData.ida.servicio.Calidad,
        origenId: roundTripData.ida.origen!.id,
        destinoId: roundTripData.ida.destino!.id,
        ...comoSeCobra(),
        // Sólo el importe de los pasajes: el cargo por servicio y la comisión
        // los calcula el backend a partir de este valor.
        importeTotal: sumarPreciosAsientos(asientosIda),
        asiento: asientosIda.map((asiento, index) => ({
          Nroasiento: asiento.numero,
          Precio: asiento.precio,
          clienteId: clientePorPasajero.get(index + 1)!,
        })),
      })

      if (roundTripData.vuelta?.servicio && roundTripData.vuelta?.codigoReferencia) {
        const asientosVuelta = roundTripData.vuelta.asientos ?? []
        ventas.push({
          bloqueoCodigoReferencia: roundTripData.vuelta.codigoReferencia,
          servicioId: roundTripData.vuelta.servicio.Id,
          agenciaId: roundTripData.vuelta.agenciaId!,
          EmpresaBoleto: roundTripData.vuelta.servicio.Emp,
          calidad: roundTripData.vuelta.servicio.Calidad,
          origenId: roundTripData.vuelta.origen!.id,
          destinoId: roundTripData.vuelta.destino!.id,
          ...comoSeCobra(),
          importeTotal: sumarPreciosAsientos(asientosVuelta),
          asiento: asientosVuelta.map((asiento, index) => ({
            Nroasiento: asiento.numero,
            Precio: asiento.precio,
            clienteId: clientePorPasajero.get(index + 1)!,
          })),
        })
      }

      const ventaResponse = await confirmarVentaMutation.mutateAsync({ ventas })

      const ventasExitosas = ventaResponse.resultados
        .filter(resultado => resultado.exitoso && resultado.venta)
        .map(resultado => resultado.venta!)

      // Sin venta confirmada no hay nada que cobrar: no avanzamos. Antes se
      // mostraba "Ventas confirmadas exitosamente" y se pasaba a la pantalla
      // de pago aunque `resultados` viniera vacío.
      if (ventasExitosas.length !== ventas.length) {
        throw new Error(
          'El servidor no devolvió todas las ventas confirmadas. Verificá en el listado de ventas antes de reintentar.',
        )
      }

      setRoundTripData({
        ida: {
          ...roundTripData.ida,
          ventaConfirmada: ventasExitosas[0],
        },
        vuelta: roundTripData.vuelta ? {
          ...roundTripData.vuelta,
          ventaConfirmada: ventasExitosas[1],
        } : undefined,
      })

      toast.success('Venta confirmada', {
        description: `Transacción ${ventasExitosas[0].numeroTransaccion}. Falta registrar el cobro.`,
        duration: 6000,
      })

      setCurrentStep('payment')
    } catch (error) {
      let mensaje = mensajeParaOperador(error)

      // Fallo parcial: hay tramos con venta y tramos sin ella. Liberamos los
      // bloqueos que quedaron sin venta para no retener asientos ajenos, y
      // avisamos cuáles ventas SÍ quedaron creadas: el operador tiene que
      // saberlo para anularlas o completarlas a mano.
      if (error instanceof VentaConfirmacionError) {
        await liberarBloqueosSinVenta(error.indicesFallidos)

        const confirmadas = error.ventasExitosas
        if (confirmadas.length > 0) {
          const transacciones = confirmadas
            .map((venta) => venta.numeroTransaccion)
            .join(', ')
          mensaje += ` Atención: ya quedaron creadas estas ventas: ${transacciones}. Revisalas en el listado antes de reintentar.`
        }
      }

      setErrorVenta(mensaje)
      toast.error('No se pudo confirmar la venta', {
        description: mensaje,
        duration: 10000,
      })

      // Falló: se puede corregir y reintentar sin perder lo cargado.
      confirmacionCerrada.current = false
    }
  }

  const handleGoBack = () => {
    if (roundTripData.vuelta?.asientos) {
      setCurrentStep('vuelta-seats')
    } else {
      setCurrentStep('ida-seats')
    }
  }

  if (!roundTripData.ida.servicio) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            No se encontró información del servicio. Por favor, selecciona un servicio desde la página anterior.
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Selección de Asientos
        </Button>
      </div>
    )
  }

  const confirmando = confirmarVentaMutation.isPending
  const completas = cuantasCompletas(filasDePasajeros)
  const faltanPasajeros = completas !== passengerForms.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack} disabled={confirmando}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold">Checkout - Viaje Completo</h1>
            <p className="text-sm text-muted-foreground">
              Completa la información de los pasajeros para ambos viajes
            </p>
          </div>
        </div>
        <TiempoBloqueo expiraEn={roundTripData.ida.bloqueoExpiraEn} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Column - Trip Info & Payment Summary */}
        <div className="space-y-4">
          {/* Trip Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Detalles del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Viaje de Ida */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-blue-600">Viaje de Ida</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.origen?.nombre}</p>
                        <p className="text-xs text-muted-foreground">Origen</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.destino?.nombre}</p>
                        <p className="text-xs text-muted-foreground">Destino</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.fecha?.toISOString().split('T')[0]}</p>
                        <p className="text-xs text-muted-foreground">Fecha</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.servicio.Embarque}</p>
                        <p className="text-xs text-muted-foreground">Hora</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viaje de Vuelta */}
                {roundTripData.vuelta && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-purple-600">Viaje de Vuelta</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.origen?.nombre}</p>
                            <p className="text-xs text-muted-foreground">Origen</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.destino?.nombre}</p>
                            <p className="text-xs text-muted-foreground">Destino</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.fecha?.toISOString().split('T')[0]}</p>
                            <p className="text-xs text-muted-foreground">Fecha</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.servicio?.Embarque}</p>
                            <p className="text-xs text-muted-foreground">Hora</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Desglose de lo que paga el cliente */}
          <ResumenPago tramos={tramos} />
        </div>

        {/* La planilla: una fila por butaca en vez de un formulario por
            pasajero. Con dieciocho, las tarjetas eran dieciocho despliegues y
            dieciocho botones de guardar. */}
        <div className="space-y-4">
          <PlanillaDePasajeros
            butacas={passengerForms.map((form) =>
              form.asientoIda?.numero ?? String(form.passengerNumber)
            )}
            agenciaId={roundTripData.ida.agenciaId ?? ''}
            onCambio={setFilasDePasajeros}
          />

          {/* La venta falló: el operador puede corregir y reintentar sin
              perder los pasajeros ya cargados. */}
          {errorVenta && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorVenta}</AlertDescription>
            </Alert>
          )}

          <FacturacionCard
            valor={facturacion}
            onChange={setFacturacion}
            deshabilitado={confirmando || ventaYaConfirmada}
          />

          <p className="text-muted-foreground text-xs">
            Ida y vuelta se cobran juntas: es una sola compra partida en dos
            ventas porque así lo exige la empresa. Cómo paga el cliente se elige
            en el paso siguiente.
          </p>

          {/* Action Button */}
          <Button
            onClick={handleProceedToPayment}
            className="w-full"
            size="lg"
            disabled={
              faltanPasajeros ||
              confirmando ||
              ventaYaConfirmada ||
              faltaFacturacion
            }
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {confirmando
              ? 'Confirmando venta con la empresa...'
              : ventaYaConfirmada
                ? 'Venta ya confirmada'
                : faltanPasajeros
                  ? `Faltan ${passengerForms.length - completas} ${passengerForms.length - completas === 1 ? 'pasajero' : 'pasajeros'}`
                  : faltaFacturacion
                    ? 'Faltan los datos de facturación'
                    : 'Confirmar venta y continuar al cobro'
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
