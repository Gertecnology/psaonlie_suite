import { createContext, useContext, useState, ReactNode } from 'react'
import type { 
  RoundTripSearchData, 
  RoundTripStep, 
  RoundTripContextType
} from '../models/sales.model'

const RoundTripContext = createContext<RoundTripContextType | undefined>(undefined)

interface RoundTripProviderProps {
  children: ReactNode
}

export function RoundTripProvider({ children }: RoundTripProviderProps) {
  const [roundTripData, setRoundTripDataState] = useState<RoundTripSearchData>({
    ida: {
      origen: null,
      destino: null,
      fecha: null
    }
  })
  
  const [currentStep, setCurrentStep] = useState<RoundTripStep>('search')

  const setRoundTripData = (data: Partial<RoundTripSearchData>) => {
    setRoundTripDataState(prev => ({
      ...prev,
      ...data,
      // Merge nested objects properly
      ida: data.ida ? { ...prev.ida, ...data.ida } : prev.ida,
      vuelta: data.vuelta ? { ...prev.vuelta, ...data.vuelta } : prev.vuelta
    }))
  }

  const resetRoundTrip = () => {
    setRoundTripDataState({
      ida: {
        origen: null,
        destino: null,
        fecha: null
      }
    })
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
