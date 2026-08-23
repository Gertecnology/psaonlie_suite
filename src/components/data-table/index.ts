/**
 * The shared data table.
 *
 * Import from here, never from a feature folder. The whole point of this
 * directory is that there is one implementation: seven copies had drifted into
 * seven behaviours, and three of them carried real defects.
 */
export { DataTable, type DataTableProps } from './data-table'
export { DataTablePagination } from './data-table-pagination'
export { DataTableColumnHeader } from './data-table-column-header'
export { DataTableViewOptions } from './data-table-view-options'
export { DataTableFacetedFilter } from './data-table-faceted-filter'
export {
  useTablaServidor,
  esquemaTablaUrl,
  type EstadoTablaServidor,
  type FiltrosTablaUrl,
} from './use-tabla-servidor'
import './types'
