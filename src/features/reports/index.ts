/**
 * Public surface of the reports section.
 *
 * The screens themselves are not re-exported here: every report is its own
 * route, and each route file imports the one component it renders. Listing them
 * in a barrel would put all eleven back into a single module and undo the split
 * — the reason the section stopped being one page was that opening any report
 * loaded the code for every other.
 */
export { IndiceInformes } from './components/indice-informes'
export {
  INFORMES,
  esquemaFiltrosInforme,
  estaGenerado,
  informePorRuta,
  rutaApi,
  type DefinicionInforme,
  type FiltrosInforme,
  type IdInforme,
  type PeriodoInforme,
} from './models/informe.model'
/**
 * Client-side spreadsheet export.
 *
 * No screen calls it any more: the reports export through
 * `/api/admin/informes/exportar`, which writes one sheet per report with the
 * amounts as numbers instead of text. It stays exported because it is a
 * general-purpose helper and nothing here decides its fate.
 */
export { exportarAExcel, type ColumnaExcel } from './utils/exportar-excel'
