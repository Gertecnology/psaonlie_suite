import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, CreditCard, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { OPCIONES_METODO_PAGO, type MetodoPago } from '@/lib/metodo-pago'
import { useCreateClient } from '@/features/clients/hooks/use-client-mutations'
import { LoQueSeLleva } from './lo-que-se-lleva'
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
import { useAvisarQueSigoTrabajando } from '../../hooks/use-avisar-que-sigo-trabajando'
import { useLaReservaSigueViva } from '../../hooks/use-la-reserva-sigue-viva'
import { descargarLaLista } from '../../utils/la-lista-de-pasajeros-en-csv'
import { SeSoltaronLasButacas } from '../asientos/se-soltaron-las-butacas'
import { useLiberarBloqueo } from '../../hooks/use-liberar-bloqueo'
import {
  mensajeParaOperador,
  VentaConfirmacionError,
  type VentaConfirmar,
} from '../../services/confirmar-venta'
import {
  calcularCargoServicio,
  formatearGuaranies,
  sumarPreciosAsientos,
} from '../../utils/money'
import type { PasajeroRegistrado } from '../../models/sales.model'
import { toast } from 'sonner'

interface RoundTripCheckoutPageProps {
  onComplete?: () => void
}

export function RoundTripCheckoutPage({ onComplete: _onComplete }: RoundTripCheckoutPageProps) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const [pasajeros, setPasajeros] = useState<PasajeroRegistrado[]>([])

  /**
   * Lo cargado en la planilla del paso anterior.
   *
   * Vive en el contexto y no acá: volver a corregir un apellido no puede
   * costar dieciocho filas de tipeo.
   */
  const filasDePasajeros: DatosDelPasajero[] = roundTripData.pasajeros ?? []

  /**
   * Con qué paga el cliente. Obligatorio antes de confirmar.
   *
   * El checkout mandaba `EFECTIVO` fijo y el paso siguiente lo corregía: una
   * venta que expiraba sin cobrarse quedaba registrada como efectivo para
   * siempre, y el informe por método contaba como efectivo algo que nadie
   * pagó nunca.
   */
  const [metodoPago, setMetodoPago] = useState<MetodoPago | ''>('')

  /** Se soltaron las butacas mientras se revisaba. */
  const [seSoltaron, setSeSoltaron] = useState(false)
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
   * pero el cliente factura una vez y paga una vez.
   *
   * El método de pago va acá y no en el paso de cobro. Antes se mandaba
   * `'EFECTIVO'` fijo y el paso siguiente lo corregía: una venta que expiraba
   * sin cobrarse quedaba registrada como efectivo para siempre, y la caja
   * decía que había entrado efectivo por ventas pagadas con tarjeta. La
   * respuesta no es dejarlo vacío —una venta sin método es una venta que no se
   * sabe cómo se cobró— sino que lo elija el vendedor antes de confirmar, que
   * es cuando todavía puede volver atrás.
   */
  const comoSeCobra = () => ({
    metodoPago,
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

  const { verificarAhora } = useLaReservaSigueViva({
    codigoReferencia: roundTripData.ida.codigoReferencia,
    expiraEn: roundTripData.ida.bloqueoExpiraEn,
    activa: !ventaYaConfirmada,
    onSeSoltaron: () => setSeSoltaron(true),
  })

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

    if (!metodoPago) {
      toast.error('Elegí cómo paga el cliente antes de confirmar')
      return
    }

    // La última verificación antes de emitir. El contador de la pantalla es
    // sólo visual: sin esto se emite un boleto contra butacas que la
    // transportista ya soltó, y la venta nace rota.
    if (!(await verificarAhora())) return

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
    // Vuelve a la planilla, que es el paso anterior. Lo cargado sigue en el
    // contexto: corregir un apellido no cuesta dieciocho filas de tipeo.
    setCurrentStep('checkout')
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
  // Mientras el vendedor trabaje, la reserva se renueva sola. Sin señales,
  // el backend deja de pedir prórrogas.
  useAvisarQueSigoTrabajando({
    codigoReferencia: roundTripData.ida.codigoReferencia,
    activa: !roundTripData.ida.ventaConfirmada,
  })

  const completas = cuantasCompletas(filasDePasajeros)

  // Lo que el cliente paga: los pasajes de todos los tramos más su cargo por
  // servicio. La comisión no entra: es un acuerdo con la empresa, no algo que
  // pague el cliente.
  const totalACobrar = tramos.reduce((total, tramo) => {
    const pasajes = sumarPreciosAsientos(tramo.asientos)
    return total + pasajes + calcularCargoServicio(pasajes, tramo.serviceCharge)
  }, 0)
  const faltanPasajeros = completas !== passengerForms.length

  return (
    <div className="flex flex-col gap-3.5">
      <SeSoltaronLasButacas
        abierto={seSoltaron}
        asientos={roundTripData.ida.asientos ?? []}
        pasajeros={filasDePasajeros}
        onElegirDeNuevo={() => {
          setRoundTripData({
            ida: {
              ...roundTripData.ida,
              asientos: undefined,
              codigoReferencia: undefined,
              bloqueoExpiraEn: undefined,
            },
          })
          setCurrentStep('ida-seats')
        }}
        onBuscarOtro={() => setCurrentStep('search')}
        onDescargar={() => descargarLaLista(filasDePasajeros, 'pasajeros')}
      />

      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 text-xs"
          onClick={handleGoBack}
          disabled={confirmando}
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Volver
        </Button>

        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight">Resumen y cobro</h1>
          <p className="text-muted-foreground mt-0.5 truncate text-[12.5px]">
            {[
              roundTripData.ida.servicio?.Emp,
              `${roundTripData.ida.origen?.nombre} → ${roundTripData.ida.destino?.nombre}`,
              roundTripData.vuelta?.fecha && 'ida y vuelta',
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="ml-auto flex flex-none items-center gap-3">
          <TiempoBloqueo expiraEn={roundTripData.ida.bloqueoExpiraEn} />
        </div>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <LoQueSeLleva
          asientos={roundTripData.ida.asientos ?? []}
          filas={roundTripData.pasajeros ?? []}
        />

        <div className="flex flex-col gap-2.5">
          <ResumenPago tramos={tramos} />

          {/* Cómo paga se elige ACÁ, antes de confirmar. El checkout mandaba
              EFECTIVO fijo y el paso siguiente lo corregía: una venta que
              expiraba sin cobrarse quedaba registrada como efectivo para
              siempre, y el informe por método contaba como efectivo algo que
              nadie pagó nunca. */}
          <div className="border-border rounded-xl border p-4">
            <h2 className="text-[13px] font-semibold">Cómo paga</h2>
            <p className="text-muted-foreground mt-0.5 mb-3 text-[11.5px]">
              Se elige antes de confirmar, no después.
            </p>

            <div
              role="radiogroup"
              aria-label="Cómo paga"
              className="grid gap-1.5"
            >
              {OPCIONES_METODO_PAGO.map((opcion) => (
                <button
                  key={opcion.value}
                  role="radio"
                  aria-checked={metodoPago === opcion.value}
                  onClick={() => setMetodoPago(opcion.value)}
                  disabled={confirmando || ventaYaConfirmada}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13px] transition-colors disabled:opacity-60',
                    metodoPago === opcion.value
                      ? 'border-foreground font-semibold'
                      : 'border-border text-muted-foreground hover:bg-accent/60'
                  )}
                >
                  <i
                    className={cn(
                      'block h-3 w-3 flex-none rounded-full border-[1.5px]',
                      metodoPago === opcion.value
                        ? 'border-foreground bg-foreground ring-background ring-2 ring-inset'
                        : 'border-muted-foreground'
                    )}
                    aria-hidden="true"
                  />
                  {opcion.label}
                </button>
              ))}
            </div>

            <p className="text-muted-foreground mt-2.5 text-[11px] leading-relaxed">
              Con efectivo la venta nace cobrada y pasás directo a entregar los
              documentos.
            </p>
          </div>

          <FacturacionCard
            valor={facturacion}
            onChange={setFacturacion}
            deshabilitado={confirmando || ventaYaConfirmada}
          />

          {/* La venta falló: el operador puede corregir y reintentar sin
              perder los pasajeros ya cargados. */}
          {errorVenta && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorVenta}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleProceedToPayment}
            className="h-11 w-full text-sm"
            disabled={
              faltanPasajeros ||
              confirmando ||
              ventaYaConfirmada ||
              faltaFacturacion ||
              !metodoPago
            }
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {confirmando
              ? 'Confirmando venta con la empresa…'
              : ventaYaConfirmada
                ? 'Venta ya confirmada'
                : faltanPasajeros
                  ? `Faltan ${passengerForms.length - completas} ${passengerForms.length - completas === 1 ? 'pasajero' : 'pasajeros'}`
                  : !metodoPago
                    ? 'Elegí cómo paga'
                    : faltaFacturacion
                      ? 'Faltan los datos de facturación'
                      : `Cobrar ${formatearGuaranies(totalACobrar)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
