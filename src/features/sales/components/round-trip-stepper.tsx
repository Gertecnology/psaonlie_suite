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
        <div className="space-y-3">
          {/* Stepper horizontal con scroll en móviles */}
          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max px-2 sm:justify-center">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep
                const isCompleted = index < currentStepIndex

                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full transition-colors ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        <step.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <span className={`mt-1 text-xs sm:text-sm text-center transition-colors max-w-16 sm:max-w-20 ${
                        isActive 
                          ? 'font-semibold text-primary' 
                          : isCompleted 
                            ? 'font-medium text-green-600' 
                            : 'text-muted-foreground'
                      }`}>
                        <span className="hidden sm:inline">{step.label}</span>
                        <span className="sm:hidden">
                          {step.id === 'search' ? 'Buscar' :
                           step.id === 'ida-seats' ? 'Ida' :
                           step.id === 'servicios-vuelta' ? 'Servicio' :
                           step.id === 'vuelta-seats' ? 'Vuelta' :
                           step.id === 'checkout' ? 'Datos' :
                           step.id === 'payment' ? 'Pago' : step.label}
                        </span>
                      </span>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <div className={`w-8 sm:w-16 h-px mx-2 sm:mx-4 transition-colors ${
                        isCompleted ? 'bg-green-500' : 'bg-border'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Progress bar móvil */}
          <div className="sm:hidden">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>Paso {currentStepIndex + 1} de {steps.length}</span>
              <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
