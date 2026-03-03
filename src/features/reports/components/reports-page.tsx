import { useMemo, useState } from 'react'
import { IconDownload } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useGetDestinations } from '../../destinations/hooks/use-get-destinations'
import { useExportReports } from '../hooks/use-export-reports'
import {
  ESTADO_PAGO_OPTIONS,
  METODO_PAGO_OPTIONS,
} from '../models/reports.model'
import type { ExportFilters } from '../models/reports.model'
import { FiltersModal } from './filters-modal'
import { ReportsInlineFilters } from './reports-inline-filters'
import { VentasPreviewTable } from './ventas-preview-table'

const DEFAULT_FILTERS: ExportFilters = {
  formato: 'xlsx',
  sortBy: 'fechaVenta',
  sortOrder: 'DESC',
}

const DEFAULT_KEYS: (keyof ExportFilters)[] = ['formato', 'sortBy', 'sortOrder']
const PRIMARY_INLINE_KEYS: (keyof ExportFilters)[] = [
  'fechaVentaDesde',
  'fechaVentaHasta',
  'estadoVenta',
  'empresaId',
]

const isFilledValue = (value: unknown) => value !== undefined && value !== null && value !== ''

const countActiveFilters = (
  filters: ExportFilters,
  excludeKeys: (keyof ExportFilters)[]
) => {
  const excluded = new Set<keyof ExportFilters>(excludeKeys)
  return Object.entries(filters).filter(([key, value]) => {
    if (excluded.has(key as keyof ExportFilters)) {
      return false
    }
    return isFilledValue(value)
  }).length
}

const areFiltersEqualByKeys = (
  current: ExportFilters,
  previous: ExportFilters,
  keys: (keyof ExportFilters)[]
) => keys.every((key) => current[key] === previous[key])

const getOptionLabel = (
  options: ReadonlyArray<{ value: string; label: string }>,
  value?: string
) => {
  if (!value) return undefined
  return options.find((option) => option.value === value)?.label ?? value
}

const getAdvancedFilterChips = (
  filters: ExportFilters,
  destinationsById: Record<string, string>
) => {
  const chips: string[] = []

  if (filters.origenId) {
    chips.push(`ORIGEN: ${destinationsById[filters.origenId] ?? filters.origenId}`)
  }
  if (filters.destinoId) {
    chips.push(`DESTINO: ${destinationsById[filters.destinoId] ?? filters.destinoId}`)
  }
  if (filters.clienteId) {
    chips.push(`CLIENTE: ${filters.clienteId}`)
  }
  if (filters.usuarioId) {
    chips.push(`USUARIO: ${filters.usuarioId}`)
  }
  if (filters.estadoPago) {
    chips.push(`ESTADO PAGO: ${getOptionLabel(ESTADO_PAGO_OPTIONS, filters.estadoPago)}`)
  }
  if (filters.metodoPago) {
    chips.push(`MÉTODO PAGO: ${getOptionLabel(METODO_PAGO_OPTIONS, filters.metodoPago)}`)
  }
  if (filters.importeMinimo || filters.importeMaximo) {
    const min = filters.importeMinimo ?? 0
    const max = filters.importeMaximo ?? '∞'
    chips.push(`IMPORTE: ${min} - ${max}`)
  }

  return chips
}

export function ReportsPage() {
  const [appliedFilters, setAppliedFilters] = useState<ExportFilters>(DEFAULT_FILTERS)
  const [draftFilters, setDraftFilters] = useState<ExportFilters>(DEFAULT_FILTERS)

  const [showFiltersModal, setShowFiltersModal] = useState(false)

  const { exportReports, isExporting } = useExportReports()
  const { data: destinationsData } = useGetDestinations()

  const destinationsById = useMemo(() => {
    const entries = destinationsData?.items?.map((destination) => [destination.id, destination.nombre]) ?? []
    return Object.fromEntries(entries) as Record<string, string>
  }, [destinationsData?.items])

  const handleExport = () => {
    exportReports(appliedFilters)
  }

  const handleApplyInlineFilters = () => {
    setAppliedFilters(draftFilters)
  }

  const handleApplyModalFilters = (nextFilters: ExportFilters) => {
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
  }

  const handleClearAll = () => {
    setDraftFilters(DEFAULT_FILTERS)
    setAppliedFilters(DEFAULT_FILTERS)
  }

  const activeFiltersCount = useMemo(
    () => countActiveFilters(appliedFilters, DEFAULT_KEYS),
    [appliedFilters]
  )

  const advancedFiltersCount = useMemo(
    () => countActiveFilters(appliedFilters, [...DEFAULT_KEYS, ...PRIMARY_INLINE_KEYS]),
    [appliedFilters]
  )

  const hasPendingInlineChanges = useMemo(
    () => !areFiltersEqualByKeys(draftFilters, appliedFilters, PRIMARY_INLINE_KEYS),
    [draftFilters, appliedFilters]
  )

  const hasInlineSelection = useMemo(
    () => PRIMARY_INLINE_KEYS.some((key) => isFilledValue(draftFilters[key])),
    [draftFilters]
  )

  const canApplyInline = hasPendingInlineChanges && hasInlineSelection

  const advancedFilterChips = useMemo(
    () => getAdvancedFilterChips(appliedFilters, destinationsById).slice(0, 3),
    [appliedFilters, destinationsById]
  )

  const hasActiveFilters = activeFiltersCount > 0

  return (
    <div className='space-y-6'>
      <ReportsInlineFilters
        filters={draftFilters}
        onFiltersChange={setDraftFilters}
        onApply={handleApplyInlineFilters}
        onClear={handleClearAll}
        onOpenAdvanced={() => setShowFiltersModal(true)}
        canApply={canApplyInline}
        advancedFiltersCount={advancedFiltersCount}
        advancedFilterChips={advancedFilterChips}
      />

      <div className='flex justify-end'>
        <Button
          onClick={handleExport}
          disabled={isExporting || !hasActiveFilters}
          className='flex items-center gap-2'
        >
          <IconDownload className='h-4 w-4' />
          {isExporting ? 'Exportando...' : 'Exportar Reporte'}
        </Button>
      </div>

      <VentasPreviewTable filters={appliedFilters} isVisible={true} />

      <FiltersModal
        filters={draftFilters}
        onFiltersChange={setDraftFilters}
        onApply={handleApplyModalFilters}
        isOpen={showFiltersModal}
        onOpenChange={setShowFiltersModal}
        hidePrimaryFilters={true}
      />
    </div>
  )
}
