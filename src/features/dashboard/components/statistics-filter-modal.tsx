import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { StatisticsSearchParams } from '../models/statistics.model'
import { useEmpresasList } from '../hooks/use-empresas-list'

interface StatisticsFilterModalProps {
  onApplyFilters: (filters: StatisticsSearchParams) => void
  currentFilters: StatisticsSearchParams
  isLoading?: boolean
}

export function StatisticsFilterModal({ 
  onApplyFilters, 
  currentFilters, 
  isLoading 
}: StatisticsFilterModalProps) {
  const [open, setOpen] = useState(false)
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(
    currentFilters.fechaDesde ? new Date(currentFilters.fechaDesde) : undefined
  )
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(
    currentFilters.fechaHasta ? new Date(currentFilters.fechaHasta) : undefined
  )
  const [empresaId, setEmpresaId] = useState<string | undefined>(currentFilters.empresaId)
  const [agruparPor, setAgruparPor] = useState<string | undefined>(currentFilters.agruparPor)

  const { data: empresas } = useEmpresasList()

  const handleApplyFilters = () => {
    const filters: StatisticsSearchParams = {
      ...(fechaDesde && { fechaDesde: fechaDesde.toISOString() }),
      ...(fechaHasta && { fechaHasta: fechaHasta.toISOString() }),
      ...(empresaId && empresaId !== 'all' && { empresaId }),
      ...(agruparPor && agruparPor !== 'none' && { agruparPor }),
    }
    
    onApplyFilters(filters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setFechaDesde(undefined)
    setFechaHasta(undefined)
    setEmpresaId(undefined)
    setAgruparPor(undefined)
    
    onApplyFilters({})
    setOpen(false)
  }

  const hasActiveFilters = fechaDesde || fechaHasta || (empresaId && empresaId !== 'all') || (agruparPor && agruparPor !== 'none')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2",
            hasActiveFilters && "bg-blue-600 hover:bg-blue-700"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 ml-1">
              {[fechaDesde, fechaHasta, empresaId, agruparPor].filter(Boolean).length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtrar Estadísticas
          </DialogTitle>
          <DialogDescription>
            Selecciona los filtros para personalizar las estadísticas mostradas en el dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Fechas */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Período</label>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Desde
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaDesde && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaDesde ? (
                        format(fechaDesde, "dd/MM/yyyy", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaDesde}
                      onSelect={setFechaDesde}
                      initialFocus
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Hasta
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaHasta && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaHasta ? (
                        format(fechaHasta, "dd/MM/yyyy", { locale: es })
                      ) : (
                        <span>Seleccionar fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaHasta}
                      onSelect={setFechaHasta}
                      initialFocus
                      locale={es}
                      disabled={(date) => fechaDesde ? date < fechaDesde : false}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todas las empresas
                </SelectItem>
                {empresas?.data?.map((empresa) => (
                  <SelectItem key={empresa.id} value={empresa.id}>
                    {empresa.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agrupar por */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Agrupar por período</label>
            <Select value={agruparPor} onValueChange={setAgruparPor}>
              <SelectTrigger>
                <SelectValue placeholder="Sin agrupación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  Sin agrupación
                </SelectItem>
                <SelectItem value="dia">Por día</SelectItem>
                <SelectItem value="semana">Por semana</SelectItem>
                <SelectItem value="mes">Por mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Acciones */}
          <div className="flex justify-between gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="flex-1"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
            <Button 
              onClick={handleApplyFilters}
              className="flex-1"
              disabled={isLoading}
            >
              <Filter className="h-4 w-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
