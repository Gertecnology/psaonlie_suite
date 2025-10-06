import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, Download, RefreshCw, Trash2 } from 'lucide-react'

export function DataManagementSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Gestión de Datos
        </CardTitle>
        <CardDescription>
          Administra y mantén los datos importados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estado de los datos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Horarios</p>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <Badge variant="secondary">Activos</Badge>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rutas</p>
                <p className="text-2xl font-bold">456</p>
              </div>
              <Badge variant="secondary">Configuradas</Badge>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
                <p className="text-sm font-medium">Hace 2 horas</p>
              </div>
              <Badge variant="outline">Reciente</Badge>
            </div>
          </div>
        </div>

        {/* Acciones de gestión */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Datos
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Sincronizar
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 text-red-600 hover:text-red-700">
            <Trash2 className="h-4 w-4" />
            Limpiar Datos
          </Button>
        </div>

        {/* Información adicional */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Información sobre la importación</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Los archivos CSV deben tener el formato correcto con las columnas requeridas</li>
            <li>• La importación reemplaza los datos existentes si se selecciona "Limpiar antes de importar"</li>
            <li>• Se recomienda hacer una copia de seguridad antes de importar grandes volúmenes de datos</li>
            <li>• El proceso de importación puede tomar varios minutos dependiendo del tamaño del archivo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
