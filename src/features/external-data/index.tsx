import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Settings, Upload, Table, ArrowRight } from 'lucide-react'
import { CsvImportSection } from './components/csv-import-section'
import { ExternalDataTable } from './components/external-data-table'
import { useNavigate } from '@tanstack/react-router'

export function ExternalDataPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('import')

  const handleGoToDayConfiguration = () => {
    navigate({ to: '/settings/external-data/day-configuration' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Datos Externos</h1>
          <p className="text-muted-foreground">
            Gestiona la importación y configuración de datos externos
          </p>
        </div>
        <Button onClick={handleGoToDayConfiguration} className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Configurar Filtros por Día</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Importación CSV</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center space-x-2">
            <Table className="h-4 w-4" />
            <span>Datos Externos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-semibold">Importación de Datos CSV</h2>
            </div>
            <p className="text-muted-foreground">
              Importa datos externos desde archivos CSV para actualizar la información del sistema.
            </p>
          </div>
          <CsvImportSection />
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Table className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-semibold">Datos Externos</h2>
            </div>
            <p className="text-muted-foreground">
              Visualiza y gestiona los datos externos importados en el sistema.
            </p>
          </div>
          <ExternalDataTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
