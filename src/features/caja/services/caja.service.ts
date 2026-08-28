import { apiDownload, apiFetch, descargarBlob } from '@/utils/api-client'
import type {
  BoletoDeLaVenta,
  FacturaDeLaVenta,
  FiltrosDeCaja,
  ListadoDeCaja,
  OpcionesDeCaja,
} from '../models/caja.model'

/**
 * Client for the cash-desk endpoints.
 *
 * The listing has two faces and **the backend picks which one**: a seller gets
 * their own sales and their commission, an administrator gets every sale with
 * the service charge and each company's commission. Nothing here decides that —
 * asking for someone else's sales is not possible, because the filter does not
 * exist in the API.
 */

const VENTAS = '/api/admin/ventas'

/**
 * The API rejects undeclared parameters, so an empty one is a 400 rather than
 * being ignored.
 */
function construirQuery(filtros: FiltrosDeCaja): URLSearchParams {
  const query = new URLSearchParams()

  const mapa: Array<[string, unknown]> = [
    ['fechaDesde', filtros.desde],
    ['fechaHasta', filtros.hasta],
    ['busqueda', filtros.busqueda],
    ['estadoPago', filtros.estadoPago],
    ['estadoVenta', filtros.estadoVenta],
    ['emisorId', filtros.emisorId],
    ['vendedorId', filtros.vendedorId],
    ['montoMin', filtros.montoMin],
    ['montoMax', filtros.montoMax],
    ['origen', filtros.origen],
    ['page', filtros.pagina],
    ['limit', filtros.tamano],
  ]

  for (const [clave, valor] of mapa) {
    // Se comparan los tres casos vacíos uno por uno y no por verdad: un
    // `montoMin` de 0 es un filtro elegido, y descartarlo lo convertiría en
    // «sin mínimo».
    if (valor === undefined || valor === null || valor === '') continue
    query.append(clave, String(valor))
  }

  return query
}

export function obtenerListadoDeCaja(
  filtros: FiltrosDeCaja,
): Promise<ListadoDeCaja> {
  return apiFetch<ListadoDeCaja>(
    `${VENTAS}/caja?${construirQuery(filtros).toString()}`,
    { fallbackMessage: 'No se pudo cargar el listado de ventas.' },
  )
}

/**
 * Lo que se ofrece en los desplegables: empresas y vendedores con ventas.
 *
 * Va aparte del listado y no se vuelve a pedir con cada filtro: las opciones
 * no dependen del período elegido, así que pedirlas de nuevo en cada cambio
 * sería una consulta por tecla sin ninguna diferencia en la respuesta.
 */
export function obtenerOpcionesDeCaja(): Promise<OpcionesDeCaja> {
  return apiFetch<OpcionesDeCaja>(`${VENTAS}/caja/opciones`, {
    fallbackMessage: 'No se pudieron cargar las opciones de filtro.',
  })
}

export function obtenerBoletosDeLaVenta(
  numeroTransaccion: string,
): Promise<BoletoDeLaVenta[]> {
  return apiFetch<BoletoDeLaVenta[]>(
    `${VENTAS}/caja/${encodeURIComponent(numeroTransaccion)}/boletos`,
    { fallbackMessage: 'No se pudieron cargar los boletos.' },
  )
}

export function obtenerFacturasDeLaVenta(
  numeroTransaccion: string,
): Promise<FacturaDeLaVenta[]> {
  return apiFetch<FacturaDeLaVenta[]>(
    `${VENTAS}/caja/${encodeURIComponent(numeroTransaccion)}/facturas`,
    { fallbackMessage: 'No se pudieron cargar las facturas.' },
  )
}

/**
 * Sends the sale's documents by email.
 *
 * Without `correoDestino` each document goes where it belongs: whoever bought
 * gets everything, each passenger gets their own ticket. With it, everything
 * goes to that one address — which is what a resend is for.
 *
 * Cash sales do not send anything on their own: the customer is standing at the
 * counter, so the email is asked for rather than assumed.
 */
export function enviarDocumentos(
  numeroTransaccion: string,
  correoDestino?: string,
): Promise<{ enviado: boolean; mensaje: string }> {
  return apiFetch<{ enviado: boolean; mensaje: string }>(
    `/api/ventas/${encodeURIComponent(numeroTransaccion)}/enviar-documentos`,
    {
      method: 'POST',
      body: JSON.stringify(correoDestino ? { correoDestino } : {}),
      fallbackMessage: 'No se pudieron enviar los documentos.',
    },
  )
}

/**
 * Brings one document down so the screen can show it.
 *
 * It cannot be an `<a href>` nor an `<iframe src>` pointing at the endpoint:
 * neither sends the token, so both come back 401. The file is fetched with the
 * credentials and handed to the browser as an object URL.
 *
 * Whoever calls this owns the URL and must revoke it — an object URL is held by
 * the document until it is released, and a seller who opens twenty sales in a
 * shift would keep twenty PDFs in memory.
 */
export async function verDocumento(
  documentoId: string,
): Promise<{ url: string; nombreArchivo?: string }> {
  const { blob, nombreArchivo } = await apiDownload(
    `${VENTAS}/documentos/${encodeURIComponent(documentoId)}`,
    { fallbackMessage: 'No se pudo abrir el documento.' },
  )

  return { url: URL.createObjectURL(blob), nombreArchivo }
}

/**
 * Same document, saved to disk instead of shown.
 *
 * It downloads again rather than reusing the preview's URL, because a document
 * can be saved without ever having been opened.
 */
export async function descargarDocumento(
  documentoId: string,
  nombreSugerido: string,
): Promise<void> {
  const { blob, nombreArchivo } = await apiDownload(
    `${VENTAS}/documentos/${encodeURIComponent(documentoId)}`,
    { fallbackMessage: 'No se pudo descargar el documento.' },
  )

  descargarBlob(blob, nombreArchivo ?? nombreSugerido)
}

/** Cómo se imprime la factura. */
export type TipoImpresion = 'NORMAL' | 'TERMICA'

/**
 * Downloads the invoice and hands it to the browser.
 *
 * `TERMICA` renders the 80mm ticket, which has existed on the backend since the
 * printing module was written and no screen had ever asked for.
 *
 * It goes through `apiDownload` and not through a plain link because the
 * endpoint needs the token: an `<a href>` would send no credentials and come
 * back 401.
 */
export async function descargarFactura(
  numeroTransaccion: string,
  tipoImpresion: TipoImpresion,
): Promise<void> {
  const query = new URLSearchParams({ tipoImpresion })

  const { blob, nombreArchivo } = await apiDownload(
    `/api/ventas/${encodeURIComponent(numeroTransaccion)}/factura?${query.toString()}`,
    { fallbackMessage: 'No se pudo generar la factura.' },
  )

  const sufijo = tipoImpresion === 'TERMICA' ? '-ticket' : ''

  descargarBlob(
    blob,
    nombreArchivo ?? `factura-${numeroTransaccion}${sufijo}.pdf`,
  )
}

/**
 * Cancels a sale.
 *
 * Who may do it is decided by the backend: a seller can only cancel what they
 * sold, an administrator can cancel anyone's. A sale made on the web was not
 * made by anybody at the counter, so only an administrator can touch it.
 *
 * Cancelling moves money — it refunds the customer, reverses what was owed to
 * the carrier and takes the seller's commission back — so a 403 here is not a
 * formality. Its message says whom to ask, because whoever reads it is standing
 * at a counter with a customer in front of them.
 */
export function anularVenta(
  ventaId: string,
  motivo: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    `/api/ventas/${encodeURIComponent(ventaId)}/cancelar`,
    {
      method: 'POST',
      body: JSON.stringify({ motivo }),
      fallbackMessage: 'No se pudo anular la venta.',
    },
  )
}
