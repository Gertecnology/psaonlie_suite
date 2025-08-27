import { useState } from 'react'
import { createClient } from '../services/destination.service'
import { ClientFormValues } from '../models/destination.model'

type CreateClientResponse = {
  cliente: {
    id: string
    email: string
    apellido: string
    nombre: string
    nombreCompleto: string
    fechaNacimiento: string
    sexo: string
    nacionalidad: string
    paisResidencia: string
    telefono: string
    ocupacion?: string
    observaciones?: string
    createdAt: string
    updatedAt: string
  }
  clienteEmpresa: {
    id: string
    cliente: {
      id: string
      email: string
      apellido: string
      nombre: string
    }
    empresaId: string
    empresaNombre: string
    tipoDocumento: string
    numeroDocumento: string
    documentoCompleto: string
    idExterno: string
    sincronizado: boolean
    ultimaSincronizacion: string
    createdAt: string
  }
  sincronizado: boolean
}

export function useClientes() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CreateClientResponse | null>(null)

  const createNewClient = async (clientData: ClientFormValues) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await createClient(clientData)
      setData(result)
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al crear cliente'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const resetState = () => {
    setError(null)
    setData(null)
    setIsLoading(false)
  }

  return {
    createNewClient,
    isLoading,
    error,
    data,
    resetState,
  }
}
