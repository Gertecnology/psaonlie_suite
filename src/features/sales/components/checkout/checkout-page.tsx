import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, MapPin, Calendar, Clock, Users, CreditCard, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ClientForm } from './client-form'
import { ResumenPago } from '../pago/resumen-pago'
import { TiempoBloqueo } from '../asientos/tiempo-bloqueo'
import type { Asiento, PasajeroRegistrado, ServiceCharge } from '../../models/sales.model'
import type { CreateClientFormValues } from '@/features/clients/models/clients.model'
import { useConfirmarVenta } from '../../hooks/use-confirmar-venta'
import { useLiberarBloqueosAlSalir } from '../../hooks/use-liberar-bloqueos-al-salir'
import { mensajeParaOperador } from '../../services/confirmar-venta'
import { sumarPreciosAsientos } from '../../utils/money'
import {
  deserializarServiceCharge,
  serializarServiceCharge,
} from '../../utils/service-charge-url'
import { toast } from 'sonner'

interface CheckoutSearch {
  servicioId: string
  origenId: string
  destinoId: string
  empresaId: string
  empresa?: string
  origen?: string
  destino?: string
  fecha?: string
  hora?: string
  asientosIds: string
  precios: string
  tipos: string
  pisos: string
  codigoReferencia: string
  bloqueoExpiraEn?: string
  empresaBoleto?: string // Emp del servicio
  calidad?: string // Calidad del servicio
}

export function CheckoutPage() {
  const [search, setSearch] = useState<CheckoutSearch | null>(null)
  const [serviceCharge, setServiceCharge] = useState<ServiceCharge | undefined>()
  const [asientos, setAsientos] = useState<Asiento[]>([])
  const [pasajeros, setPasajeros] = useState<PasajeroRegistrado[]>([])
  const [errorVenta, setErrorVenta] = useState<string | null>(null)
  const [ventaYaConfirmada, setVentaYaConfirmada] = useState(false)

  const confirmarVentaMutation = useConfirmarVenta()

  /**
   * Guarda contra doble envío. Confirmar dos veces emite dos boletos y cobra
   * dos veces.
   *
   * Es un `ref` y no un estado porque tiene que cerrarse de forma síncrona:
   * dos clicks seguidos se despachan antes de que React vuelva a renderizar.
   * Sólo se reabre si la confirmación falló.
   */
  const confirmacionCerrada = useRef(false)
  // El bloqueo sigue siendo necesario mientras navegamos al pago.
  const navegandoAlPago = useRef(false)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchData: CheckoutSearch = {
      servicioId: urlParams.get('servicioId') || '',
      origenId: urlParams.get('origenId') || '',
      destinoId: urlParams.get('destinoId') || '',
      empresaId: urlParams.get('empresaId') || '',
      empresa: urlParams.get('empresa') || undefined,
      origen: urlParams.get('origen') || undefined,
      destino: urlParams.get('destino') || undefined,
      fecha: urlParams.get('fecha') || undefined,
      hora: urlParams.get('hora') || undefined,
      asientosIds: urlParams.get('asientosIds') || '',
      precios: urlParams.get('precios') || '',
      tipos: urlParams.get('tipos') || '',
      pisos: urlParams.get('pisos') || '',
      codigoReferencia: urlParams.get('codigoReferencia') || '',
      bloqueoExpiraEn: urlParams.get('bloqueoExpiraEn') || undefined,
      empresaBoleto: urlParams.get('empresaBoleto') || undefined,
      calidad: urlParams.get('calidad') || undefined,
    }
    setSearch(searchData)
    setServiceCharge(deserializarServiceCharge(urlParams))

    if (searchData.asientosIds && searchData.precios && searchData.tipos && searchData.pisos) {
      const asientosIds = searchData.asientosIds.split(',')
      const precios = searchData.precios.split(',').map(Number)
      const tipos = searchData.tipos.split(',') as ('VENTANA' | 'PASILLO' | 'CENTRO')[]
      const pisos = searchData.pisos.split(',').map(Number)

      const asientosData: Asiento[] = asientosIds.map((id, index) => ({
        numero: id,
        disponible: true,
        precio: precios[index],
        tipo: tipos[index],
        piso: pisos[index],
        calidad: 'Estándar',
      }))

      setAsientos(asientosData)
    }
  }, [])

  useLiberarBloqueosAlSalir(() => [
    {
      codigoReferencia: search?.codigoReferencia,
      activo: !!search?.codigoReferencia && !navegandoAlPago.current,
    },
  ])

  const handleGoBack = () => {
    if (!search) {
      window.location.href = '/sales/seats'
      return
    }

    const seatsParams = new URLSearchParams({
      servicioId: search.servicioId,
      origenId: search.origenId,
      destinoId: search.destinoId,
      empresaId: search.empresaId,
      empresa: search.empresa || '',
      origen: search.origen || '',
      destino: search.destino || '',
      fecha: search.fecha || '',
      hora: search.hora || '',
      codigoReferencia: search.codigoReferencia,
      bloqueoExpiraEn: search.bloqueoExpiraEn || '',
      asientosBloqueados: search.asientosIds,
      preciosBloqueados: search.precios,
      tiposBloqueados: search.tipos,
      pisosBloqueados: search.pisos,
      empresaBoleto: search.empresaBoleto || '',
      calidad: search.calidad || '',
    })
    serializarServiceCharge(seatsParams, serviceCharge)

    // Volvemos al mismo bloqueo, así que no hay que liberarlo.
    navegandoAlPago.current = true
    window.location.href = `/sales/seats?${seatsParams.toString()}`
  }

  const handleClientCreated = (
    clienteId: string,
    client: CreateClientFormValues,
    seatNumber: number,
    passengerNumber: number,
  ) => {
    setErrorVenta(null)
    setPasajeros(prev => {
      const registrado: PasajeroRegistrado = {
        clienteId,
        passengerNumber,
        seatNumber,
        nombre: client.nombre,
        apellido: client.apellido,
        email: client.email,
        numeroDocumento: client.numeroDocumento,
      }

      const existente = prev.findIndex(p => p.passengerNumber === passengerNumber)
      if (existente >= 0) {
        const actualizado = [...prev]
        actualizado[existente] = registrado
        return actualizado
      }

      return [...prev, registrado]
    })
  }

  const handleProceedToPayment = async () => {
    if (confirmacionCerrada.current || ventaYaConfirmada) return
    if (!search || pasajeros.length !== asientos.length) {
      toast.error('Registrá los datos de todos los pasajeros antes de continuar')
      return
    }

    confirmacionCerrada.current = true
    setErrorVenta(null)

    try {
      // Los pasajeros ya fueron creados por el formulario, que nos devolvió su
      // id. Antes se los volvía a crear en este punto.
      const clientePorPosicion = new Map(
        pasajeros.map(pasajero => [pasajero.passengerNumber, pasajero.clienteId]),
      )

      const ventaData = {
        ventas: [{
          bloqueoCodigoReferencia: search.codigoReferencia,
          servicioId: search.servicioId,
          empresaId: search.empresaId,
          EmpresaBoleto: search.empresaBoleto || '',
          calidad: search.calidad || '',
          origenId: search.origenId,
          destinoId: search.destinoId,
          metodoPago: 'EFECTIVO',
          estadoPago: 'PENDIENTE',
          // Sólo pasajes: el cargo por servicio lo calcula el backend.
          importeTotal: sumarPreciosAsientos(asientos),
          asiento: asientos.map((asiento, index) => ({
            Nroasiento: asiento.numero,
            Precio: asiento.precio,
            clienteId: clientePorPosicion.get(index + 1)!,
          })),
        }],
      }

      const ventaResponse = await confirmarVentaMutation.mutateAsync(ventaData)

      const ventaExitosa = ventaResponse.resultados.find(r => r.exitoso)?.venta

      // Sin datos de la venta no hay a qué cobrarle. Antes se mostraba el
      // toast verde y, si `resultados[0]` venía vacío, la pantalla se quedaba
      // clavada sin decir nada.
      if (!ventaExitosa) {
        throw new Error(
          'El servidor no devolvió los datos de la venta. Verificá en el listado de ventas antes de reintentar.',
        )
      }

      setVentaYaConfirmada(true)

      const paymentParams = new URLSearchParams({
        servicioId: search.servicioId,
        origenId: search.origenId,
        destinoId: search.destinoId,
        empresaId: search.empresaId,
        empresa: search.empresa || '',
        origen: search.origen || '',
        destino: search.destino || '',
        fecha: search.fecha || '',
        hora: search.hora || '',
        asientosIds: asientos.map(asiento => asiento.numero).join(','),
        precios: asientos.map(asiento => asiento.precio.toString()).join(','),
        tipos: asientos.map(asiento => asiento.tipo).join(','),
        pisos: asientos.map(asiento => asiento.piso.toString()).join(','),
        codigoReferencia: search.codigoReferencia || '',
        empresaBoleto: search.empresaBoleto || '',
        calidad: search.calidad || '',
        ventaId: ventaExitosa.ventaId,
        numeroTransaccion: ventaExitosa.numeroTransaccion,
        estado: ventaExitosa.estado,
        mensaje: ventaExitosa.mensaje,
      })
      serializarServiceCharge(paymentParams, serviceCharge)

      toast.success('Venta confirmada', {
        description: `Transacción ${ventaExitosa.numeroTransaccion}. Falta registrar el cobro.`,
        duration: 6000,
      })

      // La venta ya consumió el bloqueo: liberarlo ahora sería un error.
      navegandoAlPago.current = true
      window.location.href = `/sales/payment?${paymentParams.toString()}`
    } catch (error) {
      const mensaje = mensajeParaOperador(error)
      setErrorVenta(mensaje)
      toast.error('No se pudo confirmar la venta', {
        description: mensaje,
        duration: 10000,
      })

      // Falló: se puede corregir y reintentar sin perder lo cargado.
      confirmacionCerrada.current = false
    }
  }

  if (!search || !search.servicioId) {
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
  const faltanPasajeros = pasajeros.length !== asientos.length

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
            <h1 className="text-xl font-bold">Checkout</h1>
            <p className="text-sm text-muted-foreground">
              Completa la información del cliente para proceder al pago
            </p>
          </div>
        </div>
        <TiempoBloqueo expiraEn={search.bloqueoExpiraEn} />
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{search.origen}</p>
                      <p className="text-xs text-muted-foreground">Origen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{search.destino}</p>
                      <p className="text-xs text-muted-foreground">Destino</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{search.fecha?.split('T')[0]}</p>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{search.hora}</p>
                      <p className="text-xs text-muted-foreground">Hora</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{search.empresa}</p>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Desglose de lo que paga el cliente */}
          <ResumenPago
            tramos={[{ etiqueta: 'Viaje', asientos, serviceCharge }]}
          />
        </div>

        {/* Right Column - Client Forms */}
        <div className="space-y-4">
          {asientos.map((asiento, index) => {
            const passengerNumber = index + 1
            const registrado = pasajeros.find(p => p.passengerNumber === passengerNumber)
            return (
              <ClientForm
                key={asiento.numero}
                empresaId={search.empresaId}
                empresaNombre={search.empresa}
                onClientCreated={(clienteId, client) =>
                  handleClientCreated(
                    clienteId,
                    client,
                    Number(asiento.numero),
                    passengerNumber,
                  )
                }
                isClientCreated={!!registrado}
                seatNumber={Number(asiento.numero)}
                passengerNumber={passengerNumber}
              />
            )
          })}

          {errorVenta && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{errorVenta}</AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          <Button
            onClick={handleProceedToPayment}
            className="w-full"
            size="lg"
            disabled={faltanPasajeros || confirmando || ventaYaConfirmada}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {confirmando
              ? 'Confirmando venta con la empresa...'
              : ventaYaConfirmada
                ? 'Venta ya confirmada'
                : faltanPasajeros
                  ? `Faltan los datos de ${asientos.length - pasajeros.length} pasajero(s)`
                  : 'Confirmar venta y continuar al cobro'
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
