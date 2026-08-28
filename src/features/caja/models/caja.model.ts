/**
 * El listado de la caja.
 *
 * La pantalla tiene dos caras y **la elige el backend**: un vendedor recibe sus
 * ventas y su comisión, y quien administra recibe todas con el cargo por
 * servicio y la comisión de cada empresa.
 *
 * Por eso los campos del negocio son opcionales acá. No llegan vacíos ni en
 * cero: directamente no vienen, porque mandarlos "para que la pantalla no los
 * pinte" los dejaría visibles en la pestaña de red. `soloMisVentas` dice cuál
 * de las dos caras llegó.
 */

/** De dónde salió la venta. */
export type OrigenDeVenta = 'TODAS' | 'CAJA' | 'WEB'

export interface FiltrosDeCaja {
  desde?: string
  hasta?: string
  busqueda?: string
  estadoPago?: string
  emisorId?: string
  origen?: OrigenDeVenta
  pagina?: number
  tamano?: number
}

/** Una fila de la tabla. */
export interface FilaDeCaja {
  ventaId: string
  numeroTransaccion: string
  fechaVenta: string

  documentoCliente?: string
  nombreCliente?: string
  empresa?: string

  estadoPago: string
  estadoVenta: string

  /** Lo que pagó el cliente: pasajes más cargo por servicio. */
  monto: number
  boletos: number

  /** Quién la vendió. Vacío en las ventas de la web. */
  vendedor?: string
  /** Lo que se le reconoce al vendedor por esta venta. */
  miComision?: number

  /** Sólo para quien administra. */
  cargoServicio?: number
  comisionEmpresa?: number
  porcentajeComision?: number
}

/** Las tarjetas de arriba. */
export interface ResumenDeCaja {
  cantidadVentas: number
  montoVendido: number

  /** Lo que le corresponde a quien mira, si es vendedor. */
  miComision?: number

  /** Sólo para quien administra. */
  cargoServicio?: number
  comisionEmpresa?: number
  comisionVendedores?: number
}

export interface ListadoDeCaja {
  resumen: ResumenDeCaja
  items: FilaDeCaja[]
  page: number
  limit: number
  total: number
  /** Si quien mira ve sólo sus ventas. */
  soloMisVentas: boolean
}

/** Un boleto, para el modal. */
export interface BoletoDeLaVenta {
  id: string
  numeroBoleto: string
  asiento: string

  pasajero?: string
  documento?: string

  origen?: string
  destino?: string
  fechaViaje?: string
  horaSalida?: string

  tarifa: number
  estado: string

  /**
   * Lo que la transportista devolvería si se anula hoy, y hasta cuándo lo
   * acepta. Los decide ella: mostrar un número propio le prometería al cliente
   * algo que puede no reconocer.
   */
  importeADevolver?: number
  plazoAnulacionHoras?: number

  tienePdf: boolean
}

/** Un documento fiscal, para el otro modal. */
export interface FacturaDeLaVenta {
  id: string
  tipo: 'FACTURA_PASAJE' | 'CARGO_SERVICIO' | string
  archivo: string
  /** El boleto que factura. Vacío en el cargo por servicio, que es uno por compra. */
  numeroBoleto?: string
  tamano: number
  emitidaEn: string

  razonSocial?: string
  documento?: string

  /**
   * Si la transportista informó timbrado, CDC y QR.
   *
   * En `false` el documento reproduce la venta pero **no es una factura ante la
   * SET**, y la pantalla tiene que poder decirlo en vez de dejar que alguien lo
   * archive creyendo que sí.
   */
  esFiscal: boolean
}
