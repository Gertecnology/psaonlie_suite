/**
 * Clases compartidas de los estados de un asiento.
 *
 * Las usan la grilla y la leyenda para que ambas muestren siempre lo mismo:
 * si un estado cambia de estilo, cambia en los dos lados a la vez. El estado
 * nunca se comunica solo con color — cada asiento lleva su número y la leyenda
 * lleva ícono y texto.
 */
export const SEAT_STATE_CLASSES = {
  /** Disponible para elegir. */
  libre: 'border-input bg-card text-foreground hover:bg-accent',
  /** Ocupado: inerte, no se puede elegir. */
  ocupado: 'border-border bg-muted text-muted-foreground cursor-not-allowed',
  /** Elegido por el operador en este momento. */
  seleccionado: 'border-primary bg-primary text-primary-foreground',
  /** Reservado/confirmado: retenido para esta venta. */
  bloqueado: 'border-primary bg-primary/15 text-foreground',
} as const

export type SeatState = keyof typeof SEAT_STATE_CLASSES
