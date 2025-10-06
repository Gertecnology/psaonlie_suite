import { CsvImportSection } from './components/csv-import-section'
//import { DataManagementSection } from './components/data-management-section'
import { ExternalDataTable } from './components/external-data-table'

export function ExternalDataPage() {
  return (
      <div className="space-y-8">
        {/* Sección de Importación CSV */}
        <CsvImportSection />
        
        {/* Tabla de Datos Externos */}
        <ExternalDataTable />
        
        {/* Sección de Gestión de Datos */}
       {/* <DataManagementSection /> */}
      </div>
  )
}
