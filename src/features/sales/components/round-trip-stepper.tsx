import { Search, Users, User, CreditCard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { RoundTripStep } from '../models/sales.model'

interface RoundTripStepperProps {
  currentStep: RoundTripStep
  hasVuelta?: boolean
}

export function RoundTripStepper({ currentStep, hasVuelta = false }: RoundTripStepperProps) {
  const steps = [
    { id: 'search', label: 'Búsqueda', icon: Search },
    { id: 'ida-seats', label: 'Asientos Ida', icon: Users },
    ...(hasVuelta ? [
      { id: 'servicios-vuelta', label: 'Servicio Vuelta', icon: Search },
      { id: 'vuelta-seats', label: 'Asientos Vuelta', icon: Users }
    ] : []),
    { id: 'checkout', label: 'Datos Pasajeros', icon: User },
    { id: 'payment', label: 'Pago', icon: CreditCard }
  ]

  const getStepIndex = (stepId: string) => {
    return steps.findIndex(step => step.id === stepId)
  }

  const currentStepIndex = getStepIndex(currentStep)

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = step.id === currentStep
            const isCompleted = index < currentStepIndex

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`ml-2 text-sm transition-colors ${
                  isActive 
                    ? 'font-semibold text-primary' 
                    : isCompleted 
                      ? 'font-medium text-green-600' 
                      : 'text-muted-foreground'
                }`}>
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-px mx-4 transition-colors ${
                    isCompleted ? 'bg-green-500' : 'bg-border'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
