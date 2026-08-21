import { useRoundTrip } from '../context/round-trip-context'
import { useLiberarBloqueosAlSalir } from '../hooks/use-liberar-bloqueos-al-salir'
import { SalesPage } from './sales-page'
import { ServiciosVueltaPage } from './servicios-vuelta-page'
import { RoundTripSeatSelectionPage } from './asientos/round-trip-seat-selection-page'
import { RoundTripCheckoutPage } from './checkout/round-trip-checkout-page'
import { RoundTripPaymentPage } from './payment'

export function RoundTripFlow() {
  const { roundTripData, currentStep, setCurrentStep } = useRoundTrip()

  /**
   * Si el operador abandona la venta (cierra la pestaña o se va a otra
   * sección), los asientos bloqueados se liberan. Un bloqueo con venta
   * confirmada ya no es nuestro: ese no se toca.
   */
  useLiberarBloqueosAlSalir(() => [
    {
      codigoReferencia: roundTripData.ida.codigoReferencia,
      activo:
        !!roundTripData.ida.codigoReferencia &&
        !roundTripData.ida.ventaConfirmada,
    },
    {
      codigoReferencia: roundTripData.vuelta?.codigoReferencia,
      activo:
        !!roundTripData.vuelta?.codigoReferencia &&
        !roundTripData.vuelta?.ventaConfirmada,
    },
  ])

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'search':
        return <SalesPage />

      case 'ida-seats':
        return (
          <RoundTripSeatSelectionPage
            tripType="ida"
            onComplete={() => {
              // Los datos se guardan en el contexto desde la propia pantalla.
              if (roundTripData.vuelta?.fecha) {
                setCurrentStep('servicios-vuelta')
              } else {
                setCurrentStep('checkout')
              }
            }}
          />
        )

      case 'servicios-vuelta':
        return <ServiciosVueltaPage />

      case 'vuelta-seats':
        return (
          <RoundTripSeatSelectionPage
            tripType="vuelta"
            onComplete={() => setCurrentStep('checkout')}
          />
        )

      case 'checkout':
        return (
          <RoundTripCheckoutPage
            onComplete={() => setCurrentStep('payment')}
          />
        )

      case 'payment':
        return <RoundTripPaymentPage />

      default:
        return <SalesPage />
    }
  }

  return (
    <div className="space-y-4">
      {/* Contenido del paso actual */}
      {renderCurrentStep()}
    </div>
  )
}
