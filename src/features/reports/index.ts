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
