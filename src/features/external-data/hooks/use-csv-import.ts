import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CsvImportService, CsvImportRequest, CsvImportResponse } from '../services/csv-import.service'

/**
 * Hook para manejar la importación de archivos CSV
 */
export function useCsvImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clearBeforeImport, setClearBeforeImport] = useState(false)

  const importMutation = useMutation<CsvImportResponse, Error, CsvImportRequest>({
    mutationFn: CsvImportService.importarHorariosCsv,
    onSuccess: (data) => {
      if (data.exito) {
        toast.success("Importación exitosa", {
          description: `Se procesaron ${data.totalProcesados} registros. ${data.totalInsertados} insertados correctamente.`,
        })
      } else {
        toast.error("Error en la importación", {
          description: data.mensaje,
        })
      }
    },
    onError: (error) => {
      toast.error("Error en la importación", {
        description: error.message || "Ocurrió un error al importar el archivo",
      })
    },
  })

  const handleFileSelect = (file: File) => {
    const validation = CsvImportService.validateCsvFile(file)
    
    if (!validation.isValid) {
      toast.error("Archivo inválido", {
        description: validation.error,
      })
      return
    }

    setSelectedFile(file)
  }

  const handleImport = () => {
    if (!selectedFile) {
      toast.error("No hay archivo seleccionado", {
        description: "Por favor selecciona un archivo CSV para importar",
      })
      return
    }

    importMutation.mutate({
      archivo: selectedFile,
      limpiarAntes: clearBeforeImport,
    })
  }

  const resetForm = () => {
    setSelectedFile(null)
    setClearBeforeImport(false)
  }

  return {
    selectedFile,
    clearBeforeImport,
    setClearBeforeImport,
    handleFileSelect,
    handleImport,
    resetForm,
    isLoading: importMutation.isPending,
    isSuccess: importMutation.isSuccess,
    isError: importMutation.isError,
    data: importMutation.data,
    error: importMutation.error,
  }
}
