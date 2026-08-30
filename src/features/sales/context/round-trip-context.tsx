import { createContext, useContext, useState, ReactNode } from 'react'
import type { 
  RoundTripSearchData, 
  RoundTripStep, 
  RoundTripContextType
} from '../models/sales.model'

const RoundTripContext = createContext<RoundTripContextType | undefined>(undefined)

const DATOS_VACIOS: RoundTripSearchData = {
  ida: {
    origen: null,
    destino: null,
    fecha: null
  }
}

interface RoundTripProviderProps {
  children: ReactNode
  /** Estado inicial del flujo. Sirve para retomar una venta en curso. */
  datosIniciales?: RoundTripSearchData
  /** Paso inicial del flujo. */
  pasoInicial?: RoundTripStep
}

export function RoundTripProvider({
  children,
  datosIniciales,
  pasoInicial = 'search',
}: RoundTripProviderProps) {
  const [roundTripData, setRoundTripDataState] = useState<RoundTripSearchData>(
    datosIniciales ?? DATOS_VACIOS,
  )

  const [currentStep, setCurrentStep] = useState<RoundTripStep>(pasoInicial)

  const setRoundTripData = (data: Partial<RoundTripSearchData>) => {
    setRoundTripDataState(prev => ({
      ...prev,
      ...data,
      // Merge nested objects properly
      ida: data.ida ? { ...prev.ida, ...data.ida } : prev.ida,
      // `'vuelta' in data` distingue no tocarla de borrarla. Con un ternario
      // sobre el valor, mandar `vuelta: undefined` caía en `prev.vuelta` y la
      // vuelta anterior quedaba pegada: quien buscaba ida y vuelta, la sacaba
      // y volvía a buscar, seguía teniendo vuelta —y como la pantalla arranca
      // con `showVuelta` en `!!roundTripData.vuelta?.fecha`, al volver del
      // paso de butacas reaparecía sola.
      vuelta:
        'vuelta' in data
          ? data.vuelta
            ? { ...prev.vuelta, ...data.vuelta }
            : undefined
          : prev.vuelta
    }))
  }

  const resetRoundTrip = () => {
    setRoundTripDataState(DATOS_VACIOS)
    setCurrentStep('search')
  }

  const value: RoundTripContextType = {
    roundTripData,
    currentStep,
    setRoundTripData,
    setCurrentStep,
    resetRoundTrip
  }

  return (
    <RoundTripContext.Provider value={value}>
      {children}
    </RoundTripContext.Provider>
  )
}

export function useRoundTrip() {
  const context = useContext(RoundTripContext)
  if (context === undefined) {
    throw new Error('useRoundTrip must be used within a RoundTripProvider')
  }
  return context
}
