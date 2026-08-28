/**
 * Quién emite los informes.
 *
 * Va en el membrete de toda hoja que se imprime o se archiva. Está acá y no en
 * cada informe porque es un dato de la empresa, no del documento: cambia una
 * vez y cambia en los trece.
 *
 * Los valores salen del entorno para que stage y producción no impriman el
 * mismo RUC. Si falta el dato, el membrete muestra el marcador entre corchetes
 * en lugar de inventarlo: una hoja que dice `[RUC DE LA EMPRESA]` se corrige;
 * una que dice un RUC equivocado se archiva.
 */
export const EMISOR = {
  razonSocial: import.meta.env.VITE_EMISOR_RAZON_SOCIAL ?? 'PASAJE ONLINE S.A.',
  ruc: import.meta.env.VITE_EMISOR_RUC ?? '[RUC DE LA EMPRESA]',
  direccion:
    import.meta.env.VITE_EMISOR_DIRECCION ?? '[DIRECCIÓN FISCAL]',
  ciudad: import.meta.env.VITE_EMISOR_CIUDAD ?? 'Asunción, Paraguay',
} as const

/** La moneda es una sola y no se configura: el sistema opera en guaraníes. */
export const MONEDA_INFORMES = 'PYG — Guaraníes, sin decimales' as const

/**
 * Sobre qué fecha se imputa cada cifra.
 *
 * Hoy los endpoints resuelven siempre por fecha de cobro. Se declara igual
 * porque el documento tiene que decirlo: dos informes del mismo período con
 * criterios distintos no son comparables, y quien archiva la hoja no puede
 * saber cuál se usó si no está escrito.
 */
export const CRITERIO_IMPUTACION = 'Fecha de cobro' as const
