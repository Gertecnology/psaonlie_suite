import { useRoundTrip } from '../context/round-trip-context'
import { RoundTripStepper } from './round-trip-stepper'
import { SalesPage } from './sales-page'
import { ServiciosVueltaPage } from './servicios-vuelta-page'
import { RoundTripSeatSelectionPage } from './asientos/round-trip-seat-selection-page'
import { RoundTripCheckoutPage } from './checkout/round-trip-checkout-page'
import { RoundTripPaymentPage } from './payment'

export function RoundTripFlow() {
  const { roundTripData, currentStep, setCurrentStep } = useRoundTrip()

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'search':
        return <SalesPage />

      case 'ida-seats':
        return (
          <RoundTripSeatSelectionPage 
            tripType="ida"
            onComplete={(_servicio, _asientos, _codigoReferencia) => {
              // Los datos se guardan automáticamente en el contexto desde RoundTripSeatSelectionPage
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
            onComplete={(_servicio, _asientos, _codigoReferencia) => {
              // Los datos se guardan automáticamente en el contexto desde RoundTripSeatSelectionPage
              setCurrentStep('checkout')
            }}
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

  const hasVuelta = !!roundTripData.vuelta?.fecha

  return (
    <div className="space-y-4">
      {/* Stepper para mostrar progreso */}
      <RoundTripStepper currentStep={currentStep} hasVuelta={hasVuelta} />
      
      {/* Contenido del paso actual */}
      {renderCurrentStep()}
    </div>
  )
}
