import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { DayConfigurationSection } from '../components/day-configuration-section'

export function DayConfigurationPage() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate({ to: '/settings/external-data' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGoBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuración de Filtros por Día</h1>
            <p className="text-muted-foreground">
              Gestiona las configuraciones de filtros por día para los datos externos
            </p>
          </div>
        </div>
      </div>
      
      <DayConfigurationSection />
    </div>
  )
}
