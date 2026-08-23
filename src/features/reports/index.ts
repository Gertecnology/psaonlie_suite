/**
 * Public surface of the reports section.
 *
 * The screens are not re-exported: every report is its own route, and each
 * route file imports the one component it renders. A barrel would put all
 * eleven back into a single module and undo the split — the whole reason the
 * section stopped being one page is that opening any report loaded the code
 * for every other.
 */
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
