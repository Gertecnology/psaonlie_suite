import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Settings, Upload, Table, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CsvImportSection } from './components/csv-import-section'
import { ExternalDataTable } from './components/external-data-table'

export function ExternalDataPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('import')

  const handleGoToDayConfiguration = () => {
    navigate({ to: '/settings/external-data/day-configuration' })
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Datos externos</h1>
          <p className='text-muted-foreground'>
            Los servicios y horarios que el sistema conoce de las empresas; acá
            se importan y se mantienen.
          </p>
        </div>
        <Button
          onClick={handleGoToDayConfiguration}
          className='flex items-center space-x-2'
        >
          <Settings className='h-4 w-4' />
          <span>Configurar filtros por día</span>
          <ArrowRight className='h-4 w-4' />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='import' className='flex items-center space-x-2'>
            <Upload className='h-4 w-4' />
            <span>Importación CSV</span>
          </TabsTrigger>
          <TabsTrigger value='data' className='flex items-center space-x-2'>
            <Table className='h-4 w-4' />
            <span>Datos Externos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value='import' className='space-y-6'>
          <div className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <Upload className='text-muted-foreground h-5 w-5' />
              <h2 className='text-xl font-semibold'>
                Importación de datos CSV
              </h2>
            </div>
            <p className='text-muted-foreground'>
              Importá servicios y horarios desde un CSV para actualizar la
              información del sistema.
            </p>
          </div>
          <CsvImportSection />
        </TabsContent>

        <TabsContent value='data' className='space-y-6'>
          <div className='space-y-4'>
            <div className='flex items-center space-x-2'>
              <Table className='text-muted-foreground h-5 w-5' />
              <h2 className='text-xl font-semibold'>Datos importados</h2>
            </div>
            <p className='text-muted-foreground'>
              Lo que quedó cargado en el sistema, listo para consultar.
            </p>
          </div>
          <ExternalDataTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
