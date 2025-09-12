import { useState, useCallback } from 'react'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateRangeFilterProps {
  onDateRangeChange: (fechaDesde: Date | null, fechaHasta: Date | null) => void
  fechaDesde?: Date | null
  fechaHasta?: Date | null
  className?: string
}

export function DateRangeFilter({ 
  onDateRangeChange, 
  fechaDesde, 
  fechaHasta, 
  className 
}: DateRangeFilterProps) {
  const [openDesde, setOpenDesde] = useState(false)
  const [openHasta, setOpenHasta] = useState(false)

  const handleDesdeChange = useCallback((date: Date | undefined) => {
    onDateRangeChange(date ?? null, fechaHasta ?? null)
    setOpenDesde(false)
  }, [onDateRangeChange, fechaHasta])

  const handleHastaChange = useCallback((date: Date | undefined) => {
    onDateRangeChange(fechaDesde ?? null, date ?? null)
    setOpenHasta(false)
  }, [onDateRangeChange, fechaDesde])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Filtro Fecha Desde */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-muted-foreground">Fecha venta desde:</span>
        <Popover open={openDesde} onOpenChange={setOpenDesde}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-8 w-[140px] justify-start text-left font-normal",
                !fechaDesde && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaDesde ? format(fechaDesde, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fechaDesde || undefined}
              onSelect={handleDesdeChange}
              initialFocus
              disabled={(date) => fechaHasta ? date > fechaHasta : false}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Filtro Fecha Hasta */}
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-muted-foreground">Fecha venta hasta:</span>
        <Popover open={openHasta} onOpenChange={setOpenHasta}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-8 w-[140px] justify-start text-left font-normal",
                !fechaHasta && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fechaHasta ? format(fechaHasta, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={fechaHasta || undefined}
              onSelect={handleHastaChange}
              initialFocus
              disabled={(date) => fechaDesde ? date < fechaDesde : false}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
