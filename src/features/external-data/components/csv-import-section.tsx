import { useState } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useCsvImport } from '../hooks/use-csv-import'

export function CsvImportSection() {
  const [dragActive, setDragActive] = useState(false)
  const {
    selectedFile,
    clearBeforeImport,
    setClearBeforeImport,
    handleFileSelect,
    handleImport,
    resetForm,
    isLoading,
    isSuccess,
    isError,
    data,
  } = useCsvImport()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Horarios desde CSV
        </CardTitle>
        <CardDescription>
          Sube un archivo CSV con datos de horarios y rutas para importarlos al sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de subida de archivos */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isLoading}
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <p className="font-medium text-green-700">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  resetForm()
                }}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Remover archivo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-medium">
                  Arrastra tu archivo CSV aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Solo archivos .csv hasta 10MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Opciones de importación */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="clear-before"
            checked={clearBeforeImport}
            onCheckedChange={(checked) => setClearBeforeImport(checked === 'indeterminate' ? false : checked)}
            disabled={isLoading}
          />
          <Label htmlFor="clear-before" className="text-sm">
            Limpiar datos existentes antes de importar
          </Label>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar Datos
              </>
            )}
          </Button>
          
          {selectedFile && (
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
        </div>

        {/* Resultado de la importación */}
        {isSuccess && data && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Importación completada exitosamente</p>
                <div className="text-sm space-y-1">
                  <p>• Total procesados: {data.totalProcesados}</p>
                  <p>• Total insertados: {data.totalInsertados}</p>
                  {data.totalErrores > 0 && (
                    <p className="text-red-600">• Total errores: {data.totalErrores}</p>
                  )}
                  <p>• Tiempo de procesamiento: {data.tiempoProcesamiento}ms</p>
                </div>
                {data.errores.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-600">Errores encontrados:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {data.errores.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ocurrió un error al importar el archivo. Por favor, verifica que el archivo sea válido e inténtalo de nuevo.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
