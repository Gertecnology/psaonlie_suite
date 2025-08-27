import { Calendar as CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

interface DateFiltersProps {
  fechaIda: Date | null
  fechaVuelta: Date | null
  onFechaIdaChange: (date: Date | null) => void
  onFechaVueltaChange: (date: Date | null) => void
  onVueltaToggle: (checked: boolean) => void
  showVuelta: boolean
  className?: string
}

export function DateFilters({
  fechaIda,
  fechaVuelta,
  onFechaIdaChange,
  onFechaVueltaChange,
  onVueltaToggle,
  showVuelta,
  className
}: DateFiltersProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Fecha de ida
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !fechaIda && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaIda ? format(fechaIda, "PPP", { locale: es }) : "Seleccionar fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fechaIda || undefined}
              onSelect={(date) => onFechaIdaChange(date || null)}
              disabled={(date) => date < today}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {fechaIda && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFechaIdaChange(null)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Limpiar fecha
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="vuelta"
            checked={showVuelta}
            onCheckedChange={onVueltaToggle}
          />
          <label
            htmlFor="vuelta"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Incluir vuelta
          </label>
        </div>
        
        {showVuelta && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !fechaVuelta && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {fechaVuelta ? format(fechaVuelta, "PPP", { locale: es }) : "Seleccionar fecha de vuelta"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={fechaVuelta || undefined}
                onSelect={(date) => onFechaVueltaChange(date || null)}
                disabled={(date) => {
                  const minDate = fechaIda || today
                  return date < minDate
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}
        
        {showVuelta && fechaVuelta && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFechaVueltaChange(null)}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Limpiar fecha de vuelta
          </Button>
        )}
      </div>
    </div>
  )
}
