import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  anularVenta,
  descargarFactura,
  enviarDocumentos,
  obtenerBoletosDeLaVenta,
  obtenerFacturasDeLaVenta,
  obtenerListadoDeCaja,
  type TipoImpresion,
} from '../services/caja.service'
import type { FiltrosDeCaja } from '../models/caja.model'

const CLAVE = 'caja'

/**
 * El listado de ventas con sus totales.
 *
 * Una sola llamada trae las tarjetas, la tabla y la paginación: si fueran dos,
 * un filtro aplicado a destiempo dejaría las tarjetas contando una cosa y la
 * tabla mostrando otra.
 *
 * `placeholderData` mantiene la página anterior mientras llega la nueva, para
 * que la tabla no parpadee al cambiar de página.
 */
export function useListadoDeCaja(filtros: FiltrosDeCaja) {
  return useQuery({
    queryKey: [CLAVE, 'listado', filtros],
    queryFn: () => obtenerListadoDeCaja(filtros),
    placeholderData: (anterior) => anterior,
  })
}

/**
 * Los boletos de una venta.
 *
 * `enabled` sólo cuando el modal está abierto: sin eso se consultarían los
 * boletos de las veinticinco filas al pintar la tabla.
 */
export function useBoletosDeLaVenta(numeroTransaccion: string | null) {
  return useQuery({
    queryKey: [CLAVE, 'boletos', numeroTransaccion],
    queryFn: () => obtenerBoletosDeLaVenta(numeroTransaccion as string),
    enabled: !!numeroTransaccion,
  })
}

export function useFacturasDeLaVenta(numeroTransaccion: string | null) {
  return useQuery({
    queryKey: [CLAVE, 'facturas', numeroTransaccion],
    queryFn: () => obtenerFacturasDeLaVenta(numeroTransaccion as string),
    enabled: !!numeroTransaccion,
  })
}

/**
 * Manda los documentos por correo.
 *
 * Sirve para el envío de la caja —donde nada sale solo porque el cliente está
 * en el mostrador— y para el reenvío cuando el correo estaba mal o se perdió.
 */
export function useEnviarDocumentos() {
  return useMutation({
    mutationFn: ({
      numeroTransaccion,
      correoDestino,
    }: {
      numeroTransaccion: string
      correoDestino?: string
    }) => enviarDocumentos(numeroTransaccion, correoDestino),
    onSuccess: (respuesta) => {
      toast.success(respuesta.mensaje)
    },
    onError: (error: Error) => {
      // Se muestra el error de verdad y no un "algo salió mal": quien está en
      // el mostrador necesita saber si el correo salió o no antes de que el
      // cliente se vaya.
      toast.error('No se pudieron enviar los documentos', {
        description: error.message,
      })
    },
  })
}

/** Descarga la factura, normal o en ticket de 80mm. */
export function useDescargarFactura() {
  return useMutation({
    mutationFn: ({
      numeroTransaccion,
      tipoImpresion,
    }: {
      numeroTransaccion: string
      tipoImpresion: TipoImpresion
    }) => descargarFactura(numeroTransaccion, tipoImpresion),
    onError: (error: Error) => {
      toast.error('No se pudo generar la factura', {
        description: error.message,
      })
    },
  })
}

/**
 * Anula una venta.
 *
 * Quién puede lo decide el backend: el vendedor sólo lo suyo, quien administra
 * cualquiera. El 403 que devuelve dice a quién pedirle que lo haga, así que se
 * muestra tal cual en vez de un "no tenés permiso" genérico.
 *
 * Al terminar refresca el listado: la venta cambia de estado y el total de las
 * tarjetas ya no es el mismo.
 */
export function useAnularVenta() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ ventaId, motivo }: { ventaId: string; motivo: string }) =>
      anularVenta(ventaId, motivo),
    onSuccess: (respuesta) => {
      toast.success(respuesta.message)
      void cliente.invalidateQueries({ queryKey: [CLAVE] })
    },
    onError: (error: Error) => {
      toast.error('No se pudo anular la venta', {
        description: error.message,
      })
    },
  })
}

/** Vuelve a pedir el listado: después de anular, de cobrar o de vender. */
export function useRefrescarCaja() {
  const cliente = useQueryClient()

  return () => cliente.invalidateQueries({ queryKey: [CLAVE] })
}
