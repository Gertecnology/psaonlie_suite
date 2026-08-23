import * as React from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DataTableFacetedFilter,
  DataTableViewOptions,
} from '@/components/data-table'
import { type ServiceCharge } from '../models/service-charge.model'

/** Faceted-filter value meaning "no filter". */
const SIN_FILTRO = 'none'

interface ServiceChargesToolbarProps {
  table: Table<ServiceCharge>
  busqueda: string
  onBusquedaChange: (valor: string) => void
  tipoAplicacion?: 'PORCENTUAL' | 'FIJO'
  onTipoAplicacionChange: (valor: 'PORCENTUAL' | 'FIJO' | undefined) => void
  esGlobal?: string
  onEsGlobalChange: (valor: string | undefined) => void
  activo?: string
  onActivoChange: (valor: string | undefined) => void
  hayFiltros: boolean
  onLimpiar: () => void
  /** Primary buttons for the page, e.g. "Nuevo cargo". */
  actions?: React.ReactNode
}

/**
 * Filters for the service charge list.
 *
 * The facets run in external mode: they read and write the page's state, which
 * puts them in the URL and sends them to the API. Wired to TanStack columns
 * instead —as they were— they filtered the ten rows the server had already
 * chosen, so the list hid rows the pager still counted.
 */
export function ServiceChargesToolbar({
  table,
  busqueda,
  onBusquedaChange,
  tipoAplicacion,
  onTipoAplicacionChange,
  esGlobal,
  onEsGlobalChange,
  activo,
  onActivoChange,
  hayFiltros,
  onLimpiar,
  actions,
}: ServiceChargesToolbarProps) {
  return (
    <div className='flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0'>
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        <Input
          placeholder='Buscar por nombre...'
          aria-label='Buscar cargos por servicio por nombre'
          value={busqueda}
          onChange={(evento) => onBusquedaChange(evento.target.value)}
          className='h-8 w-full sm:w-[200px] lg:w-[250px]'
        />

        <DataTableFacetedFilter
          title='Tipo'
          isExternal
          externalFilter={{
            value: tipoAplicacion ?? SIN_FILTRO,
            onChange: (valor) =>
              onTipoAplicacionChange(
                valor === SIN_FILTRO
                  ? undefined
                  : (valor as 'PORCENTUAL' | 'FIJO'),
              ),
          }}
          options={[
            { label: 'Porcentual', value: 'PORCENTUAL' },
            { label: 'Fijo', value: 'FIJO' },
          ]}
        />

        <DataTableFacetedFilter
          title='Global'
          isExternal
          externalFilter={{
            value: esGlobal ?? SIN_FILTRO,
            onChange: (valor) =>
              onEsGlobalChange(valor === SIN_FILTRO ? undefined : valor),
          }}
          options={[
            { label: 'Sí', value: 'true' },
            { label: 'No', value: 'false' },
          ]}
        />

        <DataTableFacetedFilter
          title='Estado'
          isExternal
          externalFilter={{
            value: activo ?? SIN_FILTRO,
            onChange: (valor) =>
              onActivoChange(valor === SIN_FILTRO ? undefined : valor),
          }}
          options={[
            { label: 'Activo', value: 'true' },
            { label: 'Inactivo', value: 'false' },
          ]}
        />

        {hayFiltros && (
          <Button
            variant='ghost'
            onClick={onLimpiar}
            className='h-8 px-2 lg:px-3'
          >
            Limpiar
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      <div className='flex items-center space-x-2'>
        <DataTableViewOptions table={table} />
        {actions}
      </div>
    </div>
  )
}
