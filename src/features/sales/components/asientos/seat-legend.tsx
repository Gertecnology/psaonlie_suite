import { cn } from '@/lib/utils'

export function SeatLegend() {
  const legendItems = [
    {
      color: 'bg-green-500 border-green-600',
      label: 'Seleccionado',
      description: 'Asiento seleccionado'
    },
    {
      color: 'bg-blue-100 border-blue-300',
      label: 'Ventana',
      description: 'Asiento junto a la ventana'
    },
    {
      color: 'bg-orange-100 border-orange-300',
      label: 'Pasillo',
      description: 'Asiento junto al pasillo'
    },
    {
      color: 'bg-purple-100 border-purple-300',
      label: 'Centro',
      description: 'Asiento en el centro'
    },
    {
      color: 'bg-gray-300 border-gray-400',
      label: 'Ocupado',
      description: 'Asiento no disponible'
    }
  ]

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-center">Leyenda de Asientos</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded border-2 flex-shrink-0", item.color)}></div>
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
